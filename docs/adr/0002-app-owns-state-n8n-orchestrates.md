# 0002 — The app owns state; n8n orchestrates

- Status: Accepted
- Date: 2026-11-17

## Context
The project should show both product code and n8n workflows. Without a clear boundary, business rules leak into n8n nodes, where they're hard to test, version and review.

## Decision
- **The app** is the source of truth: Postgres, the Night state machine, vote tallying, permissions.
- **n8n** runs integrations and long-running steps: the LLM agent, weather and venue lookups, email, calendar, the deadline schedule, error alerts.
- They talk only over HTTP:
  - app → n8n webhooks: `night-generate`, `night-voting-open`, `night-decided`
  - n8n → app callbacks under `/api/internal/*`
- Every call is signed: `X-RN-Timestamp` + `X-RN-Signature`, an HMAC-SHA256 of timestamp + raw body with a shared secret. Requests older than 5 minutes are rejected.
- Every call carries an idempotency key, and handlers are idempotent.
- Payload shapes are Zod schemas in `web/src/contracts/`. The proposal schema is exported to JSON Schema for n8n's Structured Output Parser, and the app re-validates every callback.
- Auth and invite emails are sent by the app, not n8n, so sign-in still works when n8n is down.

## Alternatives considered
- **Logic in n8n, app as a thin UI:** shows more n8n, but the core rules end up untested inside nodes.
- **No n8n, everything in the app:** simpler, but drops the orchestration skill the project exists to show.
- **Transactional outbox + dispatcher for app → n8n events:** more robust delivery, but more moving parts for v1. Instead, the app calls the webhook after commit, records a `workflow_runs` row, and the organizer can retry a stuck step.

## Consequences
- Tallying, tie-breaks and state transitions are unit-tested in TS.
- n8n workflows stay thin and are exported to `n8n/workflows/` as JSON.
- A lost webhook shows up as a stuck `workflow_runs` row with a retry button, not silent data loss.
