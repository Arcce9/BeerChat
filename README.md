# BeerChat (Meetup-at-Venue)

> Real-time, location-aware social presence app for spontaneous in-person meetups at local venues.

**Milestone 1 status: working end-to-end MVP.** The full core loop works live between two devices: sign up → set profile → pin a venue → check in → discover people → mutual "open to meet" → ephemeral 1-on-1 chat.

---

## Executive Summary
Going out to local bars and social spots often leaves people feeling disconnected despite being surrounded by crowds. Existing social platforms focus on pre-planned events or long-distance matching rather than spontaneous, real-time local connections. **BeerChat** solves this by providing a privacy-focused, venue-level presence and double opt-in matching platform. Users select a venue they plan to visit, see who else is present and open to chatting, and mutually connect via short-lived, ephemeral text chats to find each other in person safely.

---

## Tech Stack & Architecture

- **Frontend:** React Native, Expo SDK 57, TypeScript, expo-router, `react-native-maps` (Apple Maps)
- **Backend & Database:** Supabase (PostgreSQL, Auth, Row Level Security, Realtime WebSocket engine)
- **Presence Engine (Milestone 2):** Node.js + Socket.io
- **Smart Matching / AI (Milestone 2):** OpenAI Embeddings (`text-embedding-3-small`) with `pgvector`
- **Testing Environment:** iOS Simulator (Xcode)

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) (system context) and [docs/DESIGN-M1.md](docs/DESIGN-M1.md) (Milestone 1 design: analysis model, module boundaries, API contract, design patterns).

## Project Documents

- [Project proposal (PDF)](docs/proposal.pdf) — Milestone 0
- [Milestone 1 report (PDF)](docs/Milestone-1-Report.pdf) — **this milestone's submission document**
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
Already applied to the hosted demo database — **no action needed**. For reference or for standing up a fresh instance: the complete schema lives in [`supabase/migrations/`](supabase/migrations/) (six ordered SQL files: profiles → venues/pins + seed venues → presence/RLS → matching → unmatch → chat). Against a new Supabase project they are applied with `supabase link && supabase db push`. Seed data (six Tuscaloosa venues) is inserted by migration `…000002_venues_pins.sql`.

> ⚠️ **Free-tier note:** Supabase pauses free projects after ~1 week of inactivity. If the app shows network errors on first run, the database may be waking (allow 2–3 minutes) — or contact the team and we will resume it (one click). We check it daily during grading periods.

### 4. Run
```bash
cd app
npx expo start
```
Press **`i`** to open the iOS Simulator (Expo installs the Expo Go client into the simulator automatically on first run). To test the two-user flow, boot a second simulator (Simulator menu → File → Open Simulator → any other iPhone) and press `shift+i` in the Expo terminal to pick it, or open the printed `exp://…` URL in it.

### Demo accounts
| Purpose | Email | Password |
|---|---|---|
| Demo user 1 (Alex) | `ta.demo1@beerchat.dev` | `BeerChat-M1-demo1` |
| Demo user 2 (Sam) | `ta.demo2@beerchat.dev` | `BeerChat-M1-demo2` |

Both have profiles and overlapping interests already set. Creating a brand-new account also works (any email-shaped string; email confirmation is disabled for the demo).

### Verification (what to run and check)
Short version — the full script with expected results is in [docs/VERIFICATION.md](docs/VERIFICATION.md):

1. **Auth + persistence:** sign in as demo user 1; relaunch the app; you stay signed in (BC-01/02).
2. **Venues:** tap a venue pin on the map (or the **List** button fallback, BC-11) → "I'm heading there"; relaunch; the pin survives (BC-03).
3. **Presence:** on two simulators with the two demo accounts, both "I'm here" at the same venue and toggle **Let people here see me** on → each sees the other appear in "See who's open to hello" *live*; toggling visibility off removes you from the other device without a refresh (BC-04/05).
4. **Double opt-in:** user 1 taps "Open to meet?" → user 2 sees **nothing**; user 2 taps back → both instantly get "YOU BOTH SAID YES" (BC-06).
5. **Chat:** "Say hi" → messages appear on the other device in real time; withdrawing ("Waiting on…") dissolves the match and deletes the conversation on both devices (BC-07).

## Core Features & Development Roadmap
- [x] Step 0: Environment Setup: Expo scaffold, iOS simulator execution, clean boilerplate.
- [x] Step 1: Accounts & Profiles: Supabase Auth integration, initial profile setup (first name + interest tags).
- [x] Step 2: Venues & Pins: Interactive Apple Maps, seed venue pins, venue intent status. *(+ BC-11 plain-list fallback)*
- [x] Step 3: Presence: Venue check-in ("I'm here"), per-venue discoverability toggle, live presence lists.
- [x] Step 4: Matching Engine: Mutual double opt-in ("Open to meet?"), hidden interest until mutual match, withdrawal dissolves the match live.
- [x] Step 5: Ephemeral Chat: Live 1-on-1 messaging inside confirmed matches via Supabase Realtime; messages are deleted when the match is withdrawn.
- [ ] Step 6: Live Presence Service: Node.js + Socket.io server integration. *(Milestone 2)*
- [ ] Step 7: Smart Suggestions: OpenAI vector embedding search (pgvector) based on user interest similarity. *(Milestone 2)*

## Privacy & Safety Principles
- **Venue-Level Resolution Only:** exact GPS coordinates are never stored or transmitted.
- **Explicit Opt-in Visibility:** users remain hidden at a venue until they explicitly check in and turn visibility on (enforced by Row Level Security, not just UI).
- **Double Opt-In Required:** a one-sided "open to meet" is readable *only* by its sender; the match is created by a database trigger that alone can see both sides.
- **Consent is ongoing:** withdrawing interest dissolves the match and its messages for both people, live.
- **Ephemeral messaging:** chats die with the match (time-based expiry planned for Milestone 2).

## Team & Milestone 1 Contributions
- **Margulan Baizhakyp** (mbaizhakyp@crimson.ua.edu): Implemented the end-to-end MVP — Supabase schema/migrations with RLS, auth and profile flows, map/pins, live presence, the trigger-based double opt-in matching engine, and realtime chat; maintained the bug log and development plan.
- **Arda Alici** (aalici@crimson.ua.edu): Designed the seven-screen UI (dark-theme design system the app implements), owned the Expo/simulator environment, and ran two-device testing of presence, matching, and chat.
- **Karthik Gaur** (kgaur@crimson.ua.edu): Authored and maintained the requirements artifacts — backlog, use cases, Definition of Done, verification guide — and reviewed the Milestone 1 report and API contract documentation.

## License & Course Information
This repository is developed for CS 415/515: Software Engineering.

Git Tag Submissions: `milestone-0`, `milestone-1`
