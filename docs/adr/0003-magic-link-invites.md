# 0003 — Magic-link sign-in and invite links

- Status: Accepted
- Date: 2026-11-17

## Context
Groups are small (2–8 people). Asking friends to make an account with a password is enough friction to kill the app. The project should still show real multi-user auth.

## Decision
- The organizer signs in with an email magic link (Better Auth with its magic-link plugin; emails sent through Amazon SES).
- The organizer creates a Group and shares an invite URL (random token, expires).
- An invitee enters name + email and confirms with a magic link, which creates their user and membership.
- Ballot emails carry a signed per-member link, scoped to one Night, that opens the ballot without a separate sign-in.

## Alternatives considered
- **Guests only (signed links, no accounts):** least friction, but weak on auth and doesn't support members across several groups.
- **Google sign-in for everyone:** familiar, but needs Google app verification for a public demo and makes testing harder.
- **Email + password:** more to build and secure, for no gain at this scale.

## Consequences
- No passwords stored.
- Email delivery is on the critical path for sign-in, so SES production access is needed before the public demo (ticket 09).
- Ballot links are bearer tokens: short-lived, single-Night scope, and revoked when the Night leaves `voting`.
