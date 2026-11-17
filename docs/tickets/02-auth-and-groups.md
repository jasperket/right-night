# 02 — Auth, groups and invites

**Depends on:** 01

## Goal
Real users: an organizer signs in, creates a Group and invites members. Nights now belong to Groups. See [ADR 0003](../adr/0003-magic-link-invites.md).

## Scope
- Better Auth with the magic-link plugin. In dev, emails go to a local catcher (e.g. Mailpit in Compose); in prod, SES.
- Tables: `users` (Better Auth), `groups`, `group_members(role)`, `invites(token, expires_at)`.
- Create Group page; Group page listing members; "Copy invite link".
- Join page: name + email → magic link → membership created.
- Authorization: only members see a Group; only the organizer can start Nights.

## Acceptance criteria
- A new person can go from invite link to a Group member in under a minute, with no password.
- Expired or unknown invite tokens show a clear error.
- A non-member gets 404 for a Group's pages and APIs.

## Tests
- Unit: invite token expiry; role checks.
- Integration: join flow and authorization on group and night routes.
- E2E: organizer signs in → creates a Group → second browser context joins via the invite link (magic link read from Mailpit).
