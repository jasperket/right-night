import { integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import type { NightState } from "@/domain/night";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

export const nights = pgTable("nights", {
  id: uuid("id").primaryKey().defaultRandom(),
  status: text("status").$type<NightState>().notNull().default("collecting"),
  ...timestamps,
});

export const proposals = pgTable("proposals", {
  id: uuid("id").primaryKey().defaultRandom(),
  nightId: uuid("night_id")
    .notNull()
    .references(() => nights.id, { onDelete: "cascade" }),
  position: integer("position").notNull(),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  startAt: timestamp("start_at", { withTimezone: true }).notNull(),
  endAt: timestamp("end_at", { withTimezone: true }).notNull(),
  estCostPp: integer("est_cost_pp").notNull(),
  venues: jsonb("venues").$type<{ name: string; address?: string }[]>().notNull(),
  weatherNote: text("weather_note").notNull(),
  rationale: text("rationale").notNull(),
  source: text("source").$type<"ai" | "fallback">().notNull(),
  createdAt: timestamps.createdAt,
});

export type WorkflowRunStatus = "pending" | "succeeded" | "failed";

export const workflowRuns = pgTable("workflow_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  nightId: uuid("night_id")
    .notNull()
    .references(() => nights.id, { onDelete: "cascade" }),
  kind: text("kind").$type<"generate">().notNull(),
  status: text("status").$type<WorkflowRunStatus>().notNull().default("pending"),
  attempts: integer("attempts").notNull().default(0),
  lastError: text("last_error"),
  idempotencyKey: text("idempotency_key").notNull().unique(),
  ...timestamps,
});
