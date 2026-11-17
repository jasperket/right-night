# 05 — Voting

**Depends on:** 04

## Goal
Members rank the Proposals and the app picks a winner. See [ADR 0004](../adr/0004-ranked-borda-voting.md).

## Scope
- When Proposals are stored, the app calls the n8n `night-voting-open` webhook.
- n8n `send-ballots`: loop members → SES email with a signed per-member ballot link.
- Ballot page: drag or tap to rank all Proposals; can change until voting closes.
- `ballots` table; `tally(proposals, ballots)` pure function: Borda, then most first-place rankings.
- Auto-close when the last member submits: clear winner → `decided`; tie → `tie_pending`.

## Acceptance criteria
- Each member gets exactly one ballot email per Night.
- Ballot links stop working once the Night leaves `voting`.
- The last Ballot triggers the decision immediately.

## Tests
- Unit (heavy): `tally` with 2 and 3 Proposals, 1–8 voters, clear wins, Borda ties broken by first places, unbreakable ties, partial ballots rejected.
- Integration: ballot submit/update routes, link scope and expiry, auto-close.
- E2E: two members vote → decided screen.
