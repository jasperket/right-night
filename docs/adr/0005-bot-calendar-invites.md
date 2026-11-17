# 0005 — Bot Google Calendar sends invites

- Status: Accepted
- Date: 2026-11-17

## Context
The winning plan should land on everyone's calendar. Writing to each member's own Google Calendar would need per-user OAuth, and Google's app verification for sensitive scopes makes that hard for a public demo.

## Decision
n8n holds one Google credential for a dedicated "Right Night" calendar. When a Night is decided, n8n creates the event there with every member as an attendee, so each member gets a standard calendar invite by email. The app stores the returned `calendar_event_id`.

## Alternatives considered
- **Organizer connects their own Google Calendar (OAuth):** more realistic, but needs verification and token storage and refresh.
- **.ics attachment only:** no Google at all, but drops the calendar integration and gives no way to update the event later.

## Consequences
- No user OAuth tokens to store or refresh.
- Invites come from the bot calendar's address, not the organizer's.
- Works with any calendar app that accepts email invites.
- The single credential lives only in n8n.
