# 04 — Real AI generation

**Depends on:** 03

## Goal
Replace the stub with a Claude agent that uses real weather and venue data and returns valid Proposals, or fails safely. See [ADR 0006](../adr/0006-openrouter-haiku-swappable-llm.md).

## Scope
- n8n `generate-proposals`: Webhook → verify → fetch context → AI Agent (OpenRouter Chat Model, Claude Haiku 5.5) with tools:
  - `get_forecast`: Open-Meteo hourly forecast for the area and window.
  - `find_venues`: Overpass query near lat/lng for amenities that match the vibes (restaurant, cafe, bar, cinema, park, library, gym, bowling, …).
- Structured Output Parser with the JSON Schema exported from the `ProposalSet` contract (`pnpm contracts:export`).
- Code node sanity checks: 2–3 Proposals, inside the window, under the budget cap, venues come from tool results.
- Retry twice with backoff; then a deterministic fallback (`source=fallback`); with no venues, `POST …/generation-failed`.
- App: `generation_failed` state with the error and a "Retry" button for the organizer; `workflow_runs` updated.
- Fake-LLM toggle (env flag) so E2E and smoke tests don't call the real model.

## Acceptance criteria
- With real APIs, a Night in a real city gets 2–3 sensible Proposals that name real venues and mention the weather.
- Malformed model output never reaches the database; the app rejects anything that fails the contract.
- Killing the model credential produces either a fallback Proposal or `generation_failed` with a visible retry, never a stuck `generating`.

## Tests
- Unit: contract schema edge cases; fallback builder.
- Integration: generation-failed route; retry transition.
- Manual + recorded: n8n executions showing the success, retry and fallback paths.
