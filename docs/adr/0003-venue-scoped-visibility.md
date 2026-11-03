# ADR-0003: Venue-scoped visibility with aggregate counts

**Status:** accepted (Milestone 2) · **Date:** 2026-11-01 · **Amends:** the M1 API contract in [DESIGN-M1.md](../DESIGN-M1.md) §4

## Context
In Milestone 1 the RLS rule for presence was "others' pins and profiles are readable when `discoverable = true`". The UI only showed the people list to someone checked in at the venue, but the API enforced no such condition: any signed-in user could list visible people — with names and interests — at every venue at once. That is real-time whereabouts, the most sensitive data the app holds (threat T1 in [SECURITY.md](../SECURITY.md)). The venue sheet's "heading there / here now" counts were computed by the client from those same rows, so simply tightening the rule would have zeroed the counts for anyone deciding where to go.

## Decision
- Others' pins and profiles are readable only by a viewer **pinned at the same venue** (`viewer_venue()` helper, `SECURITY DEFINER` to avoid RLS recursion on `pins`).
- Counts move to `venue_counts(target_venue)`, a `SECURITY DEFINER` function that returns two integers and no identities, executable by signed-in users only.
- Meet requests require both parties to be at the venue and the target to be visible (SEC-2), so the matching rules match the visibility rules.

## Consequences
- **(+)** The privacy promise in the UI copy ("Let people **here** see me") is now enforced by the database.
- **(+)** Counts still help people choose a venue without exposing anyone.
- **(−)** Realtime UPDATE events for pins now reach fewer subscribers; the existing data-free broadcast (M1, BUGLOG) already covers refetching, so no client change was needed beyond calling the RPC.
- **(−)** Two `SECURITY DEFINER` functions to keep minimal; both pin `search_path = ''` and are covered by integration tests.
