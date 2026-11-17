# 00 — Project setup

**Depends on:** none

## Goal
An empty but fully wired repo: the app runs locally, tests run in CI, and Postgres + n8n start with one command.

## Scope
- `git init`, `.gitignore`, `.editorconfig`, MIT license.
- `web/`: Next.js (App Router), TypeScript strict, ESLint + Prettier, pnpm.
- Vitest (unit + integration projects) and Playwright set up with one passing example test each.
- Drizzle + drizzle-kit with an empty first migration.
- `infra/docker-compose.yml`: Postgres (app DB + n8n DB) and n8n, with persistent volumes and an `.env.example`.
- GitHub Actions CI: lint, typecheck, unit, integration (Postgres service container).
- Check for name collisions, plus domain and GitHub repo availability for "Right Night".

## Acceptance criteria
- `docker compose -f infra/docker-compose.yml up` starts Postgres and n8n; the n8n editor opens locally.
- `pnpm dev` serves the app; `pnpm test` and `pnpm test:e2e` pass.
- CI is green on the first push.

## Tests
- Example unit test, an integration test that connects to Postgres, and a Playwright test that loads the home page.
