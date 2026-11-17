# 0006 — Claude Haiku 5.5 via OpenRouter, provider swappable

- Status: Accepted
- Date: 2026-11-17

## Context
An n8n AI Agent proposes 2–3 Proposals. It calls tools (weather forecast, venue search) and must return structured JSON that matches the proposal schema. Cost matters for a portfolio project, and there are existing OpenRouter credits.

## Decision
- Use **Claude Haiku 5.5** through **OpenRouter**, via n8n's OpenRouter Chat Model node attached to the AI Agent node.
- Tools: `get_forecast` (Open-Meteo) and `find_venues` (OpenStreetMap Overpass), as HTTP Request tools.
- Output goes through n8n's Structured Output Parser (JSON Schema exported from the app's Zod contract), then a Code node sanity check. The app re-validates.
- Bad output: retry twice with backoff. After that, fall back to a deterministic Proposal built from the venue list (`source=fallback`), or mark the Night `generation_failed` if there are no venues.
- Look up the exact OpenRouter model slug when building ticket 04.

## Alternatives considered
- **Anthropic API directly:** newest features first, but no credits.
- **Amazon Bedrock:** keeps billing in AWS, but adds IAM and model-access setup for little benefit in v1.
- **Claude Opus 5.5:** better planning and tool use, at about 40× Haiku's per-token price.

## Consequences
- The provider sits behind a single chat-model node, so switching to the Anthropic API or Bedrock means changing one node and its credential. The prompt, tools and parser stay the same.
- Haiku may produce weaker plans with more retries. The validation, retry and fallback path covers that and is worth showing anyway.
- An eval set of sample Nights (later) would tell whether to move to a bigger model.
