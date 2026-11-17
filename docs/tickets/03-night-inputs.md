# 03 — Night inputs

**Depends on:** 02

## Goal
Collect what the AI needs: when, where, how much, and what vibe.

## Scope
- The organizer starts a Night: date window, area name (geocoded through the Open-Meteo geocoding API → lat/lng), vote deadline.
- Each member submits a Night input: availability windows inside the date window, budget cap per person, vibe tags (e.g. chill, active, foodie, outdoors, bookish), notes.
- "Everyone's in" indicator; the organizer can start generation once at least one input exists (with a warning if some members haven't answered).
- `GET /api/internal/nights/:id/context` returns the aggregated context for n8n (signed).

## Acceptance criteria
- Inputs can only be edited while the Night is `collecting`.
- The context endpoint returns a valid `NightContext`: the overlap of availability windows, the group's lowest budget cap, vibe tag counts, area lat/lng.
- An unknown area name shows a "couldn't find that place" error.

## Tests
- Unit: availability overlap calculation (including no overlap), budget aggregation.
- Integration: input routes with state guards; context endpoint shape and signature.
- E2E: two members submit inputs → indicator shows "everyone's in".
