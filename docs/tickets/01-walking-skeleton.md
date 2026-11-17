# 01 — Walking skeleton across the app ⇄ n8n boundary

**Depends on:** 00

## Goal
Prove the full round trip before building features: the app asks n8n for Proposals, and n8n answers through a signed callback.

## Scope
- Night state machine module (`web/src/domain/night.ts`): states and allowed transitions from `CONTEXT.md`.
- HMAC sign/verify helpers (`X-RN-Timestamp`, `X-RN-Signature`, 5-minute window).
- Zod contracts: `NightContext`, `ProposalSet`.
- Minimal tables: `nights`, `proposals`, `workflow_runs`.
- Page: create a Night (no auth yet) → "Generate" button → status → list of Proposals.
- `POST /api/internal/nights/:id/proposals` (signed, idempotent).
- n8n workflow `generate-proposals` (stub): Webhook → verify signature → return 2 hard-coded Proposals via callback. Export it to `n8n/workflows/`.

## Acceptance criteria
- Clicking Generate moves the Night `collecting → generating → voting` and shows 2 Proposals.
- A callback with a bad or stale signature is rejected with 401 and changes nothing.
- Sending the same callback twice stores the Proposals once.

## Tests
- Unit: every allowed and forbidden state transition; HMAC sign/verify, including clock skew.
- Integration: proposals route with valid, invalid, stale and duplicate requests.
- E2E: create Night → Generate → Proposals visible, with n8n replaced by a test double that calls the callback.
