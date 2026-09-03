# BeerChat (Meetup-at-Venue)

> Real-time, location-aware social presence app for spontaneous in-person meetups at local venues.

---

##  Executive Summary
Going out to local bars and social spots often leaves people feeling disconnected despite being surrounded by crowds. Existing social platforms focus on pre-planned events or long-distance matching rather than spontaneous, real-time local connections. **BeerChat** solves this by providing a privacy-focused, venue-level presence and double opt-in matching platform. Users select a venue they plan to visit, see who else is present and open to chatting, and mutually connect via short-lived, ephemeral text chats to find each other in person safely.

---

## Tech Stack & Architecture

- **Frontend:** React Native, Expo, TypeScript, `react-native-maps` (Apple Maps)
- **Backend & Database:** Supabase (PostgreSQL, Authentication, Realtime WebSocket Engine)
- **Presence Engine:** Node.js + Socket.io
- **Smart Matching / AI:** OpenAI Embeddings (`text-embedding-3-small`) with `pgvector`
- **Testing Environment:** iOS Simulator (Xcode)

---

## Project Documents

- [Project proposal (PDF)](docs/proposal.pdf)
- [Backlog](docs/BACKLOG.md)
- [Architecture](docs/ARCHITECTURE.md)

---

## Getting Started

### Prerequisites
- **Node.js:** `v20+`
- **Mac / macOS:** Xcode installed with iOS Simulator runtime
- **Expo Go App:** (Optional) for mobile testing

## Core Features & Development Roadmap
- [x] Step 0: Environment Setup: Expo scaffold, iOS simulator execution, clean boilerplate.

- [ ] Step 1: Accounts & Profiles: Supabase Auth integration, initial profile setup (first name + interest tags).

- [ ] Step 2: Venues & Pins: Interactive Apple Maps, seed venue pins, venue intent status.

- [ ] Step 3: Presence: Venue check-in ("I'm here"), per-venue discoverability toggle, live presence lists.

- [ ] Step 4: Matching Engine: Mutual double opt-in ("Open to meet?"), hidden interest until mutual match.

- [ ] Step 5 : Ephemeral Chat: Live 1-on-1 messaging inside confirmed matches via Supabase Realtime.

- [ ] Step 6: Live Presence Service: Node.js + Socket.io server integration.

- [ ] Step 7: Smart Suggestions: OpenAI vector embedding search (pgvector) based on user interest similarity.

## Privacy & Safety Principles
- Venue-Level Resolution Only: Exact GPS coordinates are never stored or transmitted.

- Explicit Opt-in Visibility: Users remain hidden at a venue until they explicitly tap "I'm here" and turn visibility on.

- Double Opt-In Required: No profile reveal or chat access is granted until both users independently express interest.

- Ephemeral Messaging: Chats expire shortly after the meetup to protect user privacy.

## Team & Milestone 0 Contributions
- Arda Alici (aalici@crimson.ua.edu): Set up Expo framework and iOS simulator environment; designed initial UI specifications and map integration components.

- Margulan Baizhakyp (mbaizhakyp@crimson.ua.edu): Configured Supabase backend schema and authentication flows; drafted system architecture documentation.

- Karthik Gaur (kgaur@crimson.ua.edu): Authored project requirements, defined backlog user stories, and established git branch policies and milestone roadmap.

## License & Course Information
This repository is developed for CS 415/515:Software Engineering.

Git Tag Submission: milestone-0
