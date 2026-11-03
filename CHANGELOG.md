# Changelog

All notable changes. Format: [Keep a Changelog](https://keepachangelog.com/); versions: [SemVer](https://semver.org/).

## [0.2.0] — Milestone 2 (2026-11-01)

### Added
- **BC-08 interest-ranked people list:** people at your venue are sorted by shared interests ("2 in common"), with shared tags highlighted.
- **BC-10 ephemeral chat:** matches (and their chats) expire 6 hours after matching; expiry time shown on the match and chat screens; expired data is hidden by RLS immediately and purged every 15 min by a pg_cron job.
- Anonymous per-venue counts via the `venue_counts()` database function.
- Test suites: 54 unit/component tests (Jest + React Native Testing Library), 23 integration tests against the live backend, 2 Maestro end-to-end UI flows; coverage thresholds.
- CI (GitHub Actions): typecheck, lint, unit tests + coverage on every PR; integration tests on `main`.
- `scripts/seed-demo.mjs` demo data; accessibility labels / test IDs on inputs.
- Docs: QA plan, security (threat model, OWASP review, evidence), contributing guide, this changelog.

### Security
- **SEC-1 (OWASP A01):** any signed-in user could list visible people at every venue → now only people checked in at the same venue.
- **SEC-2 (OWASP A01):** meet requests could target anyone from anywhere → requester must be present and visible, target visible.
- **SEC-3 (OWASP A04):** no server-side limits on names/interests → database constraints.

### Fixed
- "List" and "Sign out" sat under the iOS status bar and swallowed taps.
- A previous account's profile could briefly carry over after switching accounts.
- Profile setup now enforces the specified 3–5 interests (was 1–5) and a 30-character name.

### Changed
- Expo SDK patch updates (React Native 0.86.2 → 0.86.3).
- API contract: presence visibility is venue-scoped ([ADR-0003](docs/adr/0003-venue-scoped-visibility.md)).

### Deferred (planned for M2 in the proposal / M1 report)
- Socket.io presence service (BC-09) — presence still runs on Supabase Realtime.
- OpenAI-embedding similarity for BC-08 — ranking uses exact shared interests.
- Geofenced check-in — check-in remains a manual button.

## [0.1.0] — Milestone 1 (2026-09-30)

### Added
- Email/password accounts and first-name + interests profiles (BC-01, BC-02).
- Map of seeded Tuscaloosa venues, "heading there" pins, plain-list fallback (BC-03, BC-11).
- Venue check-in with per-venue visibility opt-in and live "who's here" list (BC-04, BC-05).
- Double opt-in matching via database trigger; withdrawing dissolves the match (BC-06).
- Realtime 1-on-1 chat inside a match (BC-07).
