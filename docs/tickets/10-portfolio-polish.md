# 10 — Portfolio polish

**Depends on:** 09

## Goal
A recruiter understands the project in 2 minutes and can try it in 5.

## Scope
- README: pitch, live demo link, screen recording or GIF, architecture diagram (Mermaid), the app/n8n boundary, how to run locally, tech decisions linking to the ADRs.
- `pnpm n8n:export` script that exports workflows from the local n8n to `n8n/workflows/` with credentials stripped.
- `n8n/README.md`: import steps and screenshots of each workflow.
- Landing page with the tagline and "Try the demo group".
- Short screen recording: create Night → inputs → AI Proposals → vote → calendar invite, plus a glimpse of the n8n executions, including a retry or fallback.
- Final pass over the ADRs and `CONTEXT.md` so they match what was built.

## Acceptance criteria
- A fresh clone + `docker compose up` + `pnpm dev` works by following the README alone.
- No secrets in the repo or in the exported workflows.
- Demo link and recording are in the README.
