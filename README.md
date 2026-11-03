# BeerChat (Meetup-at-Venue)

> Real-time, location-aware social presence app for spontaneous in-person meetups at local venues.

**Milestone 2 status: tested, hardened, expanded.** The core loop (sign up → profile → pin a venue → check in → discover people → mutual "open to meet" → 1-on-1 chat) now also ranks people by shared interests (BC-08) and expires chats after 6 hours (BC-10). It ships with 54 unit/component tests, 23 integration tests against the live backend, 2 end-to-end UI flows, CI on every pull request, and three security fixes (see [docs/SECURITY.md](docs/SECURITY.md)). Changes: [CHANGELOG.md](CHANGELOG.md).

---

## Executive Summary
Going out to local bars and social spots often leaves people feeling disconnected despite being surrounded by crowds. Existing social platforms focus on pre-planned events or long-distance matching rather than spontaneous, real-time local connections. **BeerChat** solves this by providing a privacy-focused, venue-level presence and double opt-in matching platform. Users select a venue they plan to visit, see who else is present and open to chatting, and mutually connect via short-lived, ephemeral text chats to find each other in person safely.

---

## Tech Stack & Architecture

- **Frontend:** React Native, Expo SDK 57, TypeScript, expo-router, `react-native-maps` (Apple Maps)
- **Backend & Database:** Supabase (PostgreSQL, Auth, Row Level Security, Realtime WebSocket engine)
- **Testing:** Jest + React Native Testing Library (unit/component), Jest against live Supabase (integration), Maestro (end-to-end UI), GitHub Actions (CI)
- **Planned for Milestone 3 (deployment):** Node.js + Socket.io presence server; OpenAI embeddings + `pgvector` ranking (BC-08 currently ranks by exact shared interests)

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) (system context) and [docs/DESIGN-M1.md](docs/DESIGN-M1.md) (Milestone 1 design: analysis model, module boundaries, API contract, design patterns).

## Project Documents

- [Project proposal (PDF)](docs/proposal.pdf) — Milestone 0
- [Milestone 2 report (PDF)](docs/Milestone-2-Report.pdf) — **this milestone's submission document** · [Milestone 1 report](docs/Milestone-1-Report.pdf)
- [QA plan & coverage target](docs/QA-PLAN.md) · [Security: threat model, OWASP review, evidence](docs/SECURITY.md) · [Contributing: branching, commits, review](docs/CONTRIBUTING.md) · [Changelog](CHANGELOG.md)
- [Backlog](docs/BACKLOG.md) · [Use cases](docs/USE-CASES.md) · [Requirements](docs/REQUIREMENTS.md)
- [Architecture](docs/ARCHITECTURE.md) · [Milestone 1 design](docs/DESIGN-M1.md) · [ADRs](docs/adr/)
- [UX design canvas](docs/DESIGN.md) · [Development plan](docs/PLAN.md) · [Bug log](docs/BUGLOG.md)
- [TA verification guide](docs/VERIFICATION.md)

---

## Setup & Run (TA guide)

### Required software
| Software | Version | Notes |
|---|---|---|
| macOS + Xcode | Xcode 16+ with an iOS Simulator runtime installed | open Xcode once so it installs the iOS platform |
| Node.js | v20 or newer | `node --version` |
| npm | comes with Node | — |

No Apple developer account is needed; the app runs in the free **Expo Go** client inside the iOS Simulator (or on a physical iPhone with the Expo Go app, on the same Wi-Fi).

### 1. Install dependencies
```bash
git clone git@github.com:Arcce9/BeerChat.git
cd BeerChat/app
npm install
```

### 2. Environment variables
The app needs two variables (see `app/.env.example`):

| Variable | Meaning |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | URL of the Supabase project |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase *publishable* key |

**`app/.env` is committed on purpose** and points at the team's hosted demo database, so there is nothing to configure — clone and run. The publishable key is safe to ship by design (it is what a released mobile app embeds); every table is protected by Postgres Row Level Security, and no privileged key exists anywhere in this repository.

### 3. Database migrations and seed data
Already applied to the hosted demo database — **no action needed**. For reference or for standing up a fresh instance: the complete schema lives in [`supabase/migrations/`](supabase/migrations/) (ten ordered SQL files: profiles → venues/pins + seed venues → presence/RLS → matching → unmatch → chat → matched-profile visibility → **M2:** chat expiry → security hardening → viewer visibility). Against a new Supabase project they are applied with `supabase link && supabase db push`. Seed data (six Tuscaloosa venues) is inserted by migration `…000002_venues_pins.sql`.

> ⚠️ **Free-tier note:** Supabase pauses free projects after ~1 week of inactivity. If the app shows network errors on first run, the database may be waking (allow 2–3 minutes) — or contact the team and we will resume it (one click). We check it daily during grading periods.

### 4. Run
```bash
cd app
npx expo start
```
Press **`i`** to open the iOS Simulator (Expo installs the Expo Go client into the simulator automatically on first run). To test the two-user flow, boot a second simulator (Simulator menu → File → Open Simulator → any other iPhone) and press `shift+i` in the Expo terminal to pick it, or open the printed `exp://…` URL in it.

### Demo accounts and sample data
| Purpose | Email | Password |
|---|---|---|
| Demo user 1 (Alex) — **sign in as this one** | `ta.demo1@beerchat.dev` | `BeerChat-M1-demo1` |
| Demo user 2 (Sam) | `ta.demo2@beerchat.dev` | `BeerChat-M1-demo2` |
| Demo user 3 (Priya) | `ta.demo3@beerchat.dev` | `BeerChat-M1-demo3` |
| Demo user 4 (Tom) | `ta.demo4@beerchat.dev` | `BeerChat-M1-demo4` |

**One-device demo:** `npm run seed:demo` (in `app/`) checks Sam, Priya and Tom in, visible, at **Houndstooth Sports Bar**, so a single simulator signed in as Alex sees a populated venue. `node scripts/seed-demo.mjs sam-says-yes` makes Sam (privately) say yes to Alex; `node scripts/seed-demo.mjs clear` resets. Creating a brand-new account also works (email confirmation is disabled for the demo). Integration tests use their own accounts `int.user{1,2,3}@beerchat.dev` (password in `app/.env.test`).

### 5. Automated tests
```bash
cd app
npm run typecheck          # TypeScript strict
npx expo lint              # ESLint
npm test                   # 54 unit + component tests
npm run test:coverage      # same, with coverage report (app/coverage/index.html) and enforced thresholds
npm run test:integration   # 23 tests against the live Supabase project (needs network)
npm run e2e                # Maestro UI flows (needs `brew install maestro`, Expo running, `npm run seed:demo`)
```
CI runs typecheck, lint and unit tests with coverage on every pull request ([.github/workflows/ci.yml](.github/workflows/ci.yml)).

### Verification (what to run and check)
Short version — the full script with expected results is in [docs/VERIFICATION.md](docs/VERIFICATION.md):

1. **Auth + persistence:** sign in as demo user 1; relaunch the app; you stay signed in (BC-01/02).
2. **Venues:** tap a venue pin on the map (or the **List** button fallback, BC-11) → "I'm heading there"; relaunch; the pin survives (BC-03).
3. **Presence:** on two simulators with the two demo accounts, both "I'm here" at the same venue and toggle **Let people here see me** on → each sees the other appear in "See who's open to hello" *live*; toggling visibility off removes you from the other device without a refresh (BC-04/05).
4. **Double opt-in:** user 1 taps "Open to meet?" → user 2 sees **nothing**; user 2 taps back → both instantly get "YOU BOTH SAID YES" (BC-06).
5. **Chat:** "Say hi" → messages appear on the other device in real time; withdrawing ("Waiting on…") dissolves the match and deletes the conversation on both devices (BC-07).
6. **M2 — ranking (BC-08):** after `npm run seed:demo`, Alex checks in visible at Houndstooth → people list shows Priya and Sam ("2 in common") above Tom, shared tags highlighted.
7. **M2 — expiry (BC-10):** the match and chat screens show "disappears at …" six hours after the match.
8. **M2 — security control (SEC-1):** as Alex *before* checking in, open Houndstooth: counts are shown but nobody's identity; `npm run test:integration` shows the SEC-1…3 tests passing.

## Core Features & Development Roadmap
- [x] Step 0: Environment Setup: Expo scaffold, iOS simulator execution, clean boilerplate.
- [x] Step 1: Accounts & Profiles: Supabase Auth integration, initial profile setup (first name + interest tags).
- [x] Step 2: Venues & Pins: Interactive Apple Maps, seed venue pins, venue intent status. *(+ BC-11 plain-list fallback)*
- [x] Step 3: Presence: Venue check-in ("I'm here"), per-venue discoverability toggle, live presence lists.
- [x] Step 4: Matching Engine: Mutual double opt-in ("Open to meet?"), hidden interest until mutual match, withdrawal dissolves the match live.
- [x] Step 5: Ephemeral Chat: Live 1-on-1 messaging inside confirmed matches via Supabase Realtime; messages are deleted when the match is withdrawn.
- [x] **M2:** BC-08 shared-interest ranking · BC-10 6-hour chat expiry · security hardening (SEC-1…3) · unit/integration/E2E tests · CI
- [ ] Step 6: Live Presence Service: Node.js + Socket.io server integration. *(moved to Milestone 3 — it is a deployed service)*
- [ ] Step 7: Smart Suggestions: OpenAI vector embedding search (pgvector) upgrading BC-08's ranking. *(Milestone 3)*

## Privacy & Safety Principles
- **Venue-Level Resolution Only:** exact GPS coordinates are never stored or transmitted.
- **Explicit Opt-in Visibility:** users remain hidden at a venue until they explicitly check in and turn visibility on (enforced by Row Level Security, not just UI).
- **Double Opt-In Required:** a one-sided "open to meet" is readable *only* by its sender; the match is created by a database trigger that alone can see both sides.
- **Consent is ongoing:** withdrawing interest dissolves the match and its messages for both people, live.
- **Ephemeral messaging:** chats die with the match, and every match expires 6 hours after it is made.
- **Presence is venue-scoped:** only people checked in and visible at the same venue can see who is there; everyone else sees anonymous counts (SEC-1).

## Team & Milestone 1 Contributions
- **Karthik Gaur** (kgaur@crimson.ua.edu): Built Steps 0–2 — the Expo/TypeScript scaffold and simulator setup, the Supabase client, sign-in/sign-up and profile-setup screens with the profiles migration, and the map home with seeded venues and "heading there" pins; maintains the prioritized backlog and use cases.
- **Arda Alici** (aalici@crimson.ua.edu): Built Steps 3–4 — venue check-in, per-venue visibility toggle, the live "who's here" list over Realtime, and the trigger-based double opt-in matching engine with live unmatch; designed the seven-screen dark-theme UI and applied it as the design restyle.
- **Margulan Baizhakyp** (mbaizhakyp@crimson.ua.edu): Built Step 5 (realtime ephemeral chat), the BC-11 venue-list fallback, and the matched-profiles RLS fix; packaged the repository for Milestone 1 (migrations, demo accounts, restructure) and wrote the Milestone 1 report, design document, ADRs, bug log, and TA verification guide.

## Team & Milestone 2 Contributions
- **Margulan Baizhakyp** (mbaizhakyp@crimson.ua.edu): Built the Milestone 2 work using a disclosed AI-assisted workflow (Claude Code; commits carry a `Co-Authored-By` trailer): BC-08 ranking, BC-10 chat expiry, the unit/component/integration/E2E test suites and CI, the SEC-1…3 security fixes with before/after evidence, the QA plan, security, contributing and changelog documents, and the Milestone 2 report.
- **Arda Alici** (aalici@crimson.ua.edu): _To be written by Arda — one or two sentences on his own Milestone 2 contribution (e.g. code review of the M2 pull requests)._
- **Karthik Gaur** (kgaur@crimson.ua.edu): _To be written by Karthik — one or two sentences on his own Milestone 2 contribution._

Per-milestone contributions are tracked with git tags (`git shortlog -sn milestone-1..milestone-2`).

## License & Course Information
This repository is developed for CS 415/515: Software Engineering.

Git Tag Submissions: `milestone-0`, `milestone-1`, `milestone-2` · Releases: `v0.1.0` (M1), `v0.2.0` (M2)
