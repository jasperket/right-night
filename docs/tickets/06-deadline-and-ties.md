# 06 — Deadline and ties

**Depends on:** 05

## Goal
Voting always ends, even when someone never votes or the result is a tie.

## Scope
- `POST /api/internal/nights/close-due` (signed): closes every `voting` Night past its deadline, tallies the Ballots received, returns the Nights it closed.
- n8n `close-due-votes`: Schedule trigger every 5 minutes → call close-due.
- `tie_pending` UI: the organizer sees the tied Proposals with points and picks one → `decided`.
- No Ballots at the deadline → `tie_pending`.

## Acceptance criteria
- A Night past its deadline is decided within about 5 minutes.
- Calling close-due twice never decides a Night twice.
- Only the organizer can break a tie.

## Tests
- Unit: deadline logic with an injected clock.
- Integration: close-due idempotency; tie-break route authorization.
- E2E: deadline passes with one Ballot (clock or time travel in the test) → decided; tie → organizer picks.
