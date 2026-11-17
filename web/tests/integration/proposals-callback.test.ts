import { sql } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { POST } from "@/app/api/internal/nights/[id]/proposals/route";
import type { NightContext } from "@/contracts/night-context";
import type { ProposalSet } from "@/contracts/proposal-set";
import { getDb } from "@/db";
import { signRequest } from "@/lib/signing";
import { createNight, getNight, startGeneration } from "@/nights/service";
import { testSigningSecret } from "./helpers/env";

const { db, close } = getDb();

const proposal = (title: string): ProposalSet["proposals"][number] => ({
  title,
  summary: `${title} summary`,
  startAt: "2026-11-20T19:00:00+08:00",
  endAt: "2026-11-20T22:00:00+08:00",
  estCostPerPerson: 25,
  venues: [{ name: `${title} venue` }],
  weatherNote: "Clear skies",
  rationale: "Fits everyone",
  source: "ai",
});

async function generatingNight() {
  const night = await createNight(db);
  let context: NightContext | undefined;
  await startGeneration(db, night.id, {
    appBaseUrl: "http://localhost:3000",
    notifyN8n: async (ctx) => {
      context = ctx;
    },
  });
  return { nightId: night.id, idempotencyKey: context!.idempotencyKey };
}

function callback(
  nightId: string,
  body: unknown,
  sign: { secret?: string; now?: Date } = {},
) {
  const raw = JSON.stringify(body);
  const headers = signRequest({
    secret: sign.secret ?? testSigningSecret,
    body: raw,
    now: sign.now,
  });
  return POST(
    new Request(`http://localhost/api/internal/nights/${nightId}/proposals`, {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body: raw,
    }),
    { params: Promise.resolve({ id: nightId }) },
  );
}

beforeEach(async () => {
  await db.execute(sql`truncate nights cascade`);
});

afterAll(async () => {
  await close();
});

describe("POST /api/internal/nights/:id/proposals", () => {
  it("stores the Proposals and moves the Night to voting", async () => {
    const { nightId, idempotencyKey } = await generatingNight();

    const response = await callback(nightId, {
      idempotencyKey,
      proposals: [proposal("Dinner"), proposal("Karaoke")],
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ stored: true });
    const night = await getNight(db, nightId);
    expect(night?.status).toBe("voting");
    expect(night?.proposals.map((p) => p.title)).toEqual(["Dinner", "Karaoke"]);
  });

  it("stores the Proposals once when the same callback arrives twice", async () => {
    const { nightId, idempotencyKey } = await generatingNight();
    const body = {
      idempotencyKey,
      proposals: [proposal("Dinner"), proposal("Karaoke")],
    };

    await callback(nightId, body);
    const second = await callback(nightId, body);

    expect(second.status).toBe(200);
    expect(await second.json()).toEqual({ stored: false, duplicate: true });
    const night = await getNight(db, nightId);
    expect(night?.status).toBe("voting");
    expect(night?.proposals).toHaveLength(2);
  });

  it("rejects a bad signature with 401 and changes nothing", async () => {
    const { nightId, idempotencyKey } = await generatingNight();

    const response = await callback(
      nightId,
      { idempotencyKey, proposals: [proposal("Dinner"), proposal("Karaoke")] },
      { secret: "someone-elses-secret-of-32-chars-long" },
    );

    expect(response.status).toBe(401);
    const night = await getNight(db, nightId);
    expect(night?.status).toBe("generating");
    expect(night?.proposals).toEqual([]);
  });

  it("rejects a stale signature with 401 and changes nothing", async () => {
    const { nightId, idempotencyKey } = await generatingNight();

    const response = await callback(
      nightId,
      { idempotencyKey, proposals: [proposal("Dinner"), proposal("Karaoke")] },
      { now: new Date(Date.now() - 6 * 60 * 1000) },
    );

    expect(response.status).toBe(401);
    const night = await getNight(db, nightId);
    expect(night?.status).toBe("generating");
    expect(night?.proposals).toEqual([]);
  });

  it("rejects a body that is not a valid ProposalSet with 400", async () => {
    const { nightId, idempotencyKey } = await generatingNight();

    const response = await callback(nightId, {
      idempotencyKey,
      proposals: [proposal("Only one")],
    });

    expect(response.status).toBe(400);
    expect((await getNight(db, nightId))?.status).toBe("generating");
  });

  it("rejects a Proposal that ends before it starts with 400", async () => {
    const { nightId, idempotencyKey } = await generatingNight();

    const response = await callback(nightId, {
      idempotencyKey,
      proposals: [
        proposal("Dinner"),
        { ...proposal("Backwards"), endAt: "2026-11-20T18:00:00+08:00" },
      ],
    });

    expect(response.status).toBe(400);
    expect((await getNight(db, nightId))?.status).toBe("generating");
  });

  it("rejects an unknown idempotency key with 404", async () => {
    const { nightId } = await generatingNight();

    const response = await callback(nightId, {
      idempotencyKey: "not-a-run",
      proposals: [proposal("Dinner"), proposal("Karaoke")],
    });

    expect(response.status).toBe(404);
    expect((await getNight(db, nightId))?.status).toBe("generating");
  });

  it("rejects a Night id that does not exist with 404", async () => {
    const response = await callback("not-a-night", {
      idempotencyKey: "any",
      proposals: [proposal("Dinner"), proposal("Karaoke")],
    });

    expect(response.status).toBe(404);
  });
});
