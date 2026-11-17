# 07 — Finalize: calendar invite and result

**Depends on:** 06

## Goal
The winning plan lands on everyone's calendar: "Tonight's the Right Night". See [ADR 0005](../adr/0005-bot-calendar-invites.md).

## Scope
- On `decided`, the app calls the n8n `night-decided` webhook.
- n8n `finalize-night`: create the event on the bot Google Calendar (title, time, venue location, summary) with members as attendees → `POST /api/internal/nights/:id/scheduled` with `calendar_event_id` → result email to everyone.
- Result screen: "Tonight's the Right Night", winning Proposal, points per Proposal, link to the calendar event.

## Acceptance criteria
- Every member receives a calendar invite and a result email.
- The Night ends in `scheduled` with `calendar_event_id` stored.
- A repeated `night-decided` call doesn't create a second event.

## Tests
- Integration: scheduled route (signed, idempotent).
- E2E: decided → result screen (n8n test double).
- Manual + recorded: a real invite arriving in a real inbox.
