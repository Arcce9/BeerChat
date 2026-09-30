# ADR-0002: Double opt-in matching via database trigger, not client logic

**Status:** accepted (Milestone 1) · **Date:** 2026-08-25

## Context
BC-06 requires that expressing interest stays completely private until the second person also opts in. Any design where a client detects reciprocity requires that client to *read the other party's request* — which is precisely the data that must stay hidden. A dedicated matchmaking service could do it, but Milestone 1 has no custom server (ADR-0001).

## Decision
Interest is a `meet_requests` row readable **only by its sender** (RLS). An `AFTER INSERT` trigger — running as `SECURITY DEFINER`, so it alone sees both directions — creates the `matches` row when reciprocity appears; an `AFTER DELETE` trigger dissolves the match when either side withdraws ("consent is ongoing", a rule added after two-device testing). Both participants can read the match row, so Realtime delivers its INSERT/DELETE to exactly the two people involved.

## Consequences
- **(+)** The privacy property is *structural*: no sequence of client calls can reveal a one-sided request, because no policy exists that would return it.
- **(+)** Matching is atomic with the request write (same transaction); no race between two simultaneous "yes" taps — the unique ordered pair constraint absorbs the double-fire.
- **(+)** Withdrawal cascades (match → messages) express "messages cannot outlive consent" in the schema.
- **(−)** Matching logic lives in SQL, invisible to TypeScript tooling; mitigated by keeping it in reviewed, versioned migrations.
- **(−)** Realtime DELETE events carry only the row id (Postgres replica identity), so clients track the current match id to react to dissolution.
