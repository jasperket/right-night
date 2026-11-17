import { randomUUID } from "node:crypto";
import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import type { NightContext } from "@/contracts/night-context";
import type { ProposalSet } from "@/contracts/proposal-set";
import type { Db } from "@/db/client";
import { nights, proposals, workflowRuns } from "@/db/schema";
import { transition, type NightEvent, type NightState } from "@/domain/night";

// Night ids are uuids; anything else is an unknown Night, not a database error.
const isNightId = (id: string) => z.uuid().safeParse(id).success;

export async function createNight(db: Db) {
  const [night] = await db.insert(nights).values({}).returning({ id: nights.id });
  return night;
}

export async function getNight(db: Db, id: string) {
  if (!isNightId(id)) return null;
  const [night] = await db
    .select({ id: nights.id, status: nights.status })
    .from(nights)
    .where(eq(nights.id, id));
  if (!night) return null;
  const rows = await db
    .select()
    .from(proposals)
    .where(eq(proposals.nightId, id))
    .orderBy(asc(proposals.position));
  return { ...night, proposals: rows };
}

type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

async function moveNight(tx: Tx, id: string, event: NightEvent) {
  const [night] = await tx
    .select({ status: nights.status })
    .from(nights)
    .where(eq(nights.id, id))
    .for("update");
  if (!night) return { ok: false as const, error: "Night not found" };
  const result = transition(night.status, event);
  if (result.ok) {
    await tx
      .update(nights)
      .set({ status: result.state, updatedAt: new Date() })
      .where(eq(nights.id, id));
  }
  return result;
}

export type StartGenerationResult =
  | { ok: true; state: NightState }
  | { ok: false; error: string };

// collecting → generating, records a workflow run, then calls n8n after commit (ADR 0002).
export async function startGeneration(
  db: Db,
  nightId: string,
  deps: { appBaseUrl: string; notifyN8n: (context: NightContext) => Promise<void> },
): Promise<StartGenerationResult> {
  if (!isNightId(nightId)) return { ok: false, error: "Night not found" };
  const idempotencyKey = randomUUID();
  const moved = await db.transaction(async (tx) => {
    const result = await moveNight(tx, nightId, "start_generation");
    if (result.ok) {
      await tx.insert(workflowRuns).values({ nightId, kind: "generate", idempotencyKey });
    }
    return result;
  });
  if (!moved.ok) return moved;

  try {
    await deps.notifyN8n({
      nightId,
      idempotencyKey,
      callbackUrl: new URL(`/api/internal/nights/${nightId}/proposals`, deps.appBaseUrl).href,
    });
    await db
      .update(workflowRuns)
      .set({ attempts: 1, updatedAt: new Date() })
      .where(eq(workflowRuns.idempotencyKey, idempotencyKey));
  } catch (error) {
    // The Night stays in generating; the stuck run is visible for a retry (ticket 04).
    await db
      .update(workflowRuns)
      .set({
        attempts: 1,
        lastError: error instanceof Error ? error.message : String(error),
        updatedAt: new Date(),
      })
      .where(eq(workflowRuns.idempotencyKey, idempotencyKey));
  }
  return moved;
}

export type StoreProposalsResult =
  | { status: "stored" }
  | { status: "duplicate" }
  | { status: "not_found" }
  | { status: "conflict"; error: string };

// Idempotent on the workflow run's key: a repeated callback stores nothing.
export async function storeProposals(
  db: Db,
  nightId: string,
  set: ProposalSet,
): Promise<StoreProposalsResult> {
  if (!isNightId(nightId)) return { status: "not_found" };
  return db.transaction(async (tx) => {
    const [run] = await tx
      .select({ id: workflowRuns.id, status: workflowRuns.status })
      .from(workflowRuns)
      .where(
        and(
          eq(workflowRuns.nightId, nightId),
          eq(workflowRuns.idempotencyKey, set.idempotencyKey),
          eq(workflowRuns.kind, "generate"),
        ),
      )
      .for("update");
    if (!run) return { status: "not_found" };
    if (run.status === "succeeded") return { status: "duplicate" };

    const moved = await moveNight(tx, nightId, "proposals_stored");
    if (!moved.ok) return { status: "conflict", error: moved.error };

    await tx.insert(proposals).values(
      set.proposals.map((p, position) => ({
        nightId,
        position,
        title: p.title,
        summary: p.summary,
        startAt: new Date(p.startAt),
        endAt: new Date(p.endAt),
        estCostPp: p.estCostPerPerson,
        venues: p.venues,
        weatherNote: p.weatherNote,
        rationale: p.rationale,
        source: p.source,
      })),
    );
    await tx
      .update(workflowRuns)
      .set({ status: "succeeded", lastError: null, updatedAt: new Date() })
      .where(eq(workflowRuns.id, run.id));
    return { status: "stored" };
  });
}
