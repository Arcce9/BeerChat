# ADR-0001: Supabase (BaaS) instead of a custom backend for the MVP

**Status:** accepted (Milestone 1) · **Date:** 2026-08-25

## Context
The MVP needs auth, a relational database, per-row authorization, and realtime push to two devices — with a $0 budget, a one-semester timeline, and a team whose backend depth is concentrated in one member. A custom Node/Postgres backend would cost weeks before the first end-to-end flow works.

## Decision
Use Supabase (hosted Postgres + Auth + Row Level Security + Realtime) as the entire Milestone 1 backend. The mobile app talks to the database directly with a publishable key; **RLS policies are the API contract** and privacy mechanism. Server-side logic that must see more than any one user (profile bootstrap, match creation/dissolution) lives in Postgres triggers.

## Consequences
- **(+)** End-to-end MVP in days; auth, realtime, and migrations came for free; the free tier costs $0.
- **(+)** Privacy guarantees are structural: a client cannot read a one-sided meet request even if the app code is buggy or malicious.
- **(−)** Free tier pauses after ~1 week idle (documented in README; mitigated by pre-grading checks).
- **(−)** Vendor coupling: the schema is portable Postgres, but Realtime/Auth would need replacement to self-host.
- **(→)** The planned Socket.io presence server (Milestone 2) reintroduces a custom service where BaaS realtime is weakest (ephemeral presence), without rewriting what works.
