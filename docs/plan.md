# Right Night — v1 plan

## Context
Portfolio project: a hangout planner for couples and friend groups. It should show real product code (multi-user state, auth, domain logic, tests) **plus** n8n-based AI orchestration (LLM agent with tools + structured output, third-party APIs, email, calendar, event-driven workflows, error handling). Prefer depth over breadth. Status: planning, no code yet.

Taglines: "Find the right night, together." / "Date night or squad night, decided."

## Decisions
| Area | Decision |
|---|---|
| Stack | Next.js (App Router) + TypeScript strict + Postgres (Drizzle ORM), pnpm |
| Auth / joining | Organizer signs in by email magic link (Better Auth magic-link plugin); shares an invite URL; members join with name + email (verified by magic link). No passwords |
| Notifications | Email only, vote links open the app. Sent by n8n through **Amazon SES** (the app also uses SES for magic links) |
| Voting | Ranked ballots, Borda count. Closes when all members have voted or the deadline passes. Tie → most first-place votes → organizer picks |
| LLM | **Claude Haiku 5.5 via OpenRouter**, using n8n's OpenRouter Chat Model node. The provider sits behind the agent node, so switching to the Anthropic API or Bedrock later means changing one node and its credential (record this in an ADR). Look up the exact OpenRouter model slug when building ticket 4 |
| Calendar | One "Right Night" bot Google Calendar held by n8n; creates the event and invites members by email. No per-user OAuth |
| Data APIs | Open-Meteo (forecast + geocoding) and OpenStreetMap Overpass (venues). Free, no key, worldwide. No live events feed in v1 |
| Hosting | **AWS, one EC2 + Docker Compose + Terraform** (see Hosting). Paid from one account's new-account credits, then ~$17–19/mo |

## Architecture
App owns **state and domain rules**; n8n owns **orchestration and integrations**.

```
Browser ──► Next.js app (UI + route handlers + domain) ──► Postgres
                │  ▲
   signed webhook│  │signed callbacks (/api/internal/*)
                ▼  │
               n8n ──► Claude Haiku via OpenRouter (agent) ──tools──► Open-Meteo, Overpass
                 ├──► Amazon SES (ballots, result)
                 └──► Google Calendar (bot calendar)
```

- **Boundary security:** every app⇄n8n call carries `X-RN-Timestamp` + `X-RN-Signature` (HMAC-SHA256 of timestamp + raw body, shared secret, 5-min window). Each request has an idempotency key; handlers are idempotent.
- **Contracts:** Zod schemas in `web/src/contracts/` are the single source of truth. A script exports the proposal schema to JSON Schema, which is pasted into n8n's Structured Output Parser. The app re-validates every callback.
- **Auth/invite emails** are sent by the app directly (auth must not depend on n8n). Everything else goes through n8n.

### Domain glossary (→ `CONTEXT.md`)
- **Group** — people who hang out (a couple or friends). **Member** — a person in a group; role `organizer | member`.
- **Night** — one planning round for a date window. **Night input** — one member's availability, budget cap, vibe tags, notes for a night.
- **Proposal** — one of 2–3 AI-generated candidate plans. **Ballot** — a member's ranking of proposals. **Decision** — the winning proposal.

### Night state machine (pure TS module, TDD'd first)
`collecting → generating → voting → decided → scheduled`
- `generating → generation_failed → generating` (organizer retry)
- `voting → tie_pending → decided` (organizer breaks tie)

### Data model (Drizzle)
`users`, `groups`, `group_members`, `invites(token, expires_at)`, `nights(status, window_start, window_end, area_name, lat, lng, vote_deadline, decided_proposal_id, calendar_event_id)`, `night_inputs`, `proposals(title, summary, start_at, end_at, est_cost_pp, venues jsonb, weather_note, rationale, source ai|fallback)`, `ballots(rankings jsonb)`, `workflow_runs(kind, status, attempts, last_error, idempotency_key)`.

### Internal API
- app → n8n webhooks: `night-generate`, `night-voting-open`, `night-decided`
- n8n → app: `GET /api/internal/nights/:id/context`, `POST …/proposals`, `POST …/generation-failed`, `POST /api/internal/nights/close-due`, `POST …/scheduled`

### n8n workflows (exported to `n8n/workflows/*.json`)
1. **generate-proposals** — Webhook (verify HMAC) → fetch context → AI Agent (Claude; tools: `get_forecast` Open-Meteo, `find_venues` Overpass) → Structured Output Parser → Code node sanity checks (2–3 plans, inside window, under budget) → POST proposals. Retry ×2 with backoff on bad output; on final failure, a deterministic fallback plan from the venue list (`source=fallback`), or `generation-failed` if no venues.
2. **send-ballots** — on `night-voting-open`: loop members → email with signed per-member vote link.
3. **close-due-votes** — Schedule (every 5 min) → `POST close-due` (the app tallies and decides).
4. **finalize-night** — on `night-decided`: create bot-calendar event with attendees → `POST scheduled` → "Tonight's the Right Night" email.
5. **error-handler** — Error Trigger → email the admin + mark `workflow_runs` failed.

## Repo layout
```
web/            Next.js app (src/domain, src/contracts, src/app, src/db)
n8n/workflows/  exported workflow JSON + README (import/export steps)
infra/          docker-compose.yml (dev), compose.prod.yml, Caddyfile, terraform/
docs/adr/       ADRs  ·  CONTEXT.md  ·  README.md (Mermaid architecture diagram)
```

## Tickets (tracer bullets, in order; each built test-first; details in `docs/tickets/`)
0. **Setup** — git init, pnpm, Next.js, TS strict, Vitest, Playwright, Drizzle, `infra/docker-compose.yml` (Postgres + n8n), GitHub Actions CI (lint, typecheck, unit, integration). Check name collisions / domain.
1. **Walking skeleton** — create a Night (no auth yet) → "Generate" calls n8n → stub workflow returns 2 hard-coded proposals via signed callback → app shows them. Proves the boundary end to end.
2. **Auth & groups** — magic-link sign-in, create group, invite link, member join.
3. **Night inputs** — organizer sets window + area (geocoded); members submit availability/budget/vibes; "everyone's in" indicator.
4. **Real generation** — Claude agent + tools + structured output; validation, retries, fallback, `generation_failed` + retry button.
5. **Voting** — ballot emails, ranked ballot page, Borda tally + tie-breaks (heavy unit tests), auto-close when all voted.
6. **Deadline & ties** — close-due cron, `tie_pending` organizer UI.
7. **Finalize** — bot-calendar invite, result screen "Tonight's the Right Night", result email.
8. **Hardening** — error-handler workflow, idempotency tests, `workflow_runs` status shown to the organizer.
9. **Deploy to AWS** — Terraform (EC2, SG, Elastic IP, IAM role, ECR, S3 backup bucket, SSM params, SES domain identity + DKIM, AWS Budgets alarm), compose.prod + Caddy TLS, GitHub Actions deploy, nightly backups, seeded demo group. Request SES production access early: approval can take a day or more.
10. **Portfolio polish** — README + diagram, ADRs, workflow-export script, landing page, screen recording.

## Out of scope for v1
Telegram/Discord, per-user Google OAuth, live events feed, booking/payments, recurring nights, native mobile, multi-city groups, in-app chat, regenerating after voting starts, i18n.

## Hosting
AWS, single account, `infra/terraform/`:
- **Compute:** one Graviton EC2 (t4g.small, 2 GB) + 20 GB gp3 + Elastic IP, running the Compose stack (web, n8n, Postgres, Caddy). Security group allows only 80/443.
- **Access:** SSM Session Manager instead of SSH (no port 22). The instance's IAM role gets least-privilege access to ECR pull, S3 backups, SSM params and SES send.
- **Secrets:** SSM Parameter Store (SecureString) → rendered into `.env` at deploy.
- **Deploy:** GitHub Actions (OIDC role, no long-lived keys) builds ARM images → ECR → SSM Run Command `docker compose pull && up -d`.
- **Backups:** nightly `pg_dump` (app + n8n DBs) to S3, with a lifecycle rule.
- **DNS/TLS:** domain → Elastic IP; Caddy auto-TLS for `rightnight.<tld>` and `n8n.rightnight.<tld>`.
- **Cost guard:** AWS Budgets alert at $10 and $20.
- **Portability:** nothing AWS-specific inside the containers except the SES SMTP credentials, so moving to Hetzner or Oracle later is an ADR plus a DNS change.

## Verification
- Unit: state machine, Borda tally/tie-breaks, HMAC sign/verify, contract schemas (Vitest).
- Integration: route handlers against a real Postgres (compose test DB), including signed-callback rejection cases.
- E2E (Playwright): organizer creates group → member joins → inputs → generate (n8n stubbed via a fake-LLM toggle) → vote → decided screen.
- Smoke: `pnpm smoke` runs the full local compose stack with real n8n and checks a Night reaches `scheduled`.
- Manual: deployed demo walkthrough, recorded.
