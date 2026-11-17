// Night state machine. See the diagram in CONTEXT.md.

export const nightStates = [
  "collecting",
  "generating",
  "generation_failed",
  "voting",
  "tie_pending",
  "decided",
  "scheduled",
] as const;

export type NightState = (typeof nightStates)[number];

export type NightEvent =
  | "start_generation"
  | "proposals_stored"
  | "generation_exhausted"
  | "retry_generation"
  | "clear_winner"
  | "tie"
  | "organizer_picked"
  | "calendar_event_created";

const transitions: Record<NightState, Partial<Record<NightEvent, NightState>>> = {
  collecting: { start_generation: "generating" },
  generating: {
    proposals_stored: "voting",
    generation_exhausted: "generation_failed",
  },
  generation_failed: { retry_generation: "generating" },
  voting: { clear_winner: "decided", tie: "tie_pending" },
  tie_pending: { organizer_picked: "decided" },
  decided: { calendar_event_created: "scheduled" },
  scheduled: {},
};

export type TransitionResult =
  | { ok: true; state: NightState }
  | { ok: false; error: string };

export function transition(from: NightState, event: NightEvent): TransitionResult {
  const to = transitions[from][event];
  return to
    ? { ok: true, state: to }
    : { ok: false, error: `Cannot ${event} when the Night is ${from}` };
}
