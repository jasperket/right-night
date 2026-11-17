# 0004 — Ranked ballots with Borda count

- Status: Accepted
- Date: 2026-11-17

## Context
Each Night has 2–3 Proposals. Groups are often just two people, where a single-choice vote ties 1–1 most of the time. Voting must also end, even if someone never votes.

## Decision
- Each member ranks **all** Proposals.
- Borda count: with *n* Proposals, 1st place gets *n−1* points, last place gets 0.
- Voting closes when every member has a Ballot, or when the Night's `vote_deadline` passes (checked by n8n every 5 minutes).
- Tie-breaks, in order:
  1. most first-place rankings
  2. the organizer picks (the Night goes to `tie_pending`)
- No Ballots at the deadline → `tie_pending`.
- Members can change their Ballot until voting closes.

## Alternatives considered
- **Single choice, majority:** simplest, but couples tie constantly.
- **Approval voting:** easy to use, but ties are more common and it doesn't show strength of preference.
- **Instant-runoff:** with 2–3 options it gives about the same result as Borda, and it's harder to explain on a results screen.

## Consequences
- Tallying is a pure function `tally(proposals, ballots) → { winner } | { tie: proposalIds }`, built test-first with heavy unit tests.
- The results screen can show points per Proposal, which is easy to understand.
