# 0001 — Next.js + TypeScript + Postgres (Drizzle)

- Status: Accepted
- Date: 2026-11-17

## Context
Right Night needs a web UI, a few authenticated pages, internal API endpoints for n8n callbacks, and a relational model (groups, members, nights, ballots). It's a portfolio piece for junior full-stack roles, built by one person.

## Decision
One full-stack TypeScript app: Next.js (App Router) with route handlers for the API, TypeScript strict, Postgres, Drizzle ORM, pnpm. Vitest for unit and integration tests, Playwright for end-to-end.

## Alternatives considered
- **React (Vite) + Express:** a clearer frontend/backend split, but two things to build, wire and deploy.
- **Angular + ASP.NET Core:** strong for .NET shops, but heavier for a solo side project.
- **Prisma instead of Drizzle:** mature and popular. Drizzle is closer to SQL, lighter at runtime, and its migrations are plain SQL files that are easy to review.

## Consequences
- One repo, one language, one deploy unit for the app.
- Domain logic lives in plain TS modules (`web/src/domain`) with no framework imports, so it can be unit-tested in isolation.
- Postgres also hosts n8n's own database (a separate DB on the same server).
