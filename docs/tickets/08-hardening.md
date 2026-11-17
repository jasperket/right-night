# 08 — Hardening and observability

**Depends on:** 07

## Goal
Failures are visible and recoverable, not silent.

## Scope
- n8n `error-handler` workflow (Error Trigger): email the admin; call the app to mark the matching `workflow_runs` row failed.
- Organizer view: each Night's workflow runs (kind, status, attempts, last error) with retry for retryable steps.
- The app retries webhook calls to n8n with backoff and records each attempt.
- Rate limits on public endpoints (sign-in, join, ballot).
- Smoke test `pnpm smoke`: full local Compose stack with real n8n and the fake LLM; asserts a Night reaches `scheduled`.

## Acceptance criteria
- Stopping n8n mid-flow leaves a failed run with a working retry once n8n is back.
- Every webhook and callback is idempotent (covered by tests).
- `pnpm smoke` passes locally and in CI (nightly job).

## Tests
- Integration: idempotency suite across all internal routes; retry bookkeeping.
- Smoke: the end-to-end Compose run.
