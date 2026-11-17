import { describe, expect, it } from "vitest";
import { transition, type NightEvent, type NightState } from "./night";

const allowed: [NightState, NightEvent, NightState][] = [
  ["collecting", "start_generation", "generating"],
  ["generating", "proposals_stored", "voting"],
  ["generating", "generation_exhausted", "generation_failed"],
  ["generation_failed", "retry_generation", "generating"],
  ["voting", "clear_winner", "decided"],
  ["voting", "tie", "tie_pending"],
  ["tie_pending", "organizer_picked", "decided"],
  ["decided", "calendar_event_created", "scheduled"],
];

const states: NightState[] = [
  "collecting",
  "generating",
  "generation_failed",
  "voting",
  "tie_pending",
  "decided",
  "scheduled",
];
const events: NightEvent[] = [
  "start_generation",
  "proposals_stored",
  "generation_exhausted",
  "retry_generation",
  "clear_winner",
  "tie",
  "organizer_picked",
  "calendar_event_created",
];

describe("Night state machine", () => {
  it.each(allowed)("%s --%s--> %s", (from, event, to) => {
    expect(transition(from, event)).toEqual({ ok: true, state: to });
  });

  const forbidden = states.flatMap((from) =>
    events
      .filter((event) => !allowed.some(([f, e]) => f === from && e === event))
      .map((event) => [from, event] as const),
  );

  it.each(forbidden)("rejects %s --%s-->", (from, event) => {
    expect(transition(from, event)).toEqual({
      ok: false,
      error: `Cannot ${event} when the Night is ${from}`,
    });
  });
});
