# Development Plan

Each step ends with a **test you can see with your own eyes**. We don't move on until the test passes.
External services are wired at clearly marked moments. Budget: $0 except OpenAI API.

## Workflow rules (how we build)
- **Commit as we go:** a git commit at every passing step test, plus at meaningful sub-milestones inside a step. Commit messages reference the step ("Step 2: venue pins").
- **Agentic development:** Fable 5 acts as the **orchestrator only** — it plans, delegates, reviews, and verifies. Implementation work (writing components, boilerplate, config, tests) is delegated to subagents running on **cheaper models** (Sonnet for normal coding tasks, Haiku for mechanical ones). Fable 5 writes code directly only when a task is too subtle to delegate safely (tricky bugs, architecture decisions).
- **Ponytail mode:** all code is written under the ponytail skill — laziest solution that works, standard library before dependencies, no speculative abstractions. Every new dependency must justify itself.
- **Bug log:** every error we hit gets an entry in BUGLOG.md (symptom / cause / fix) before we move on.

## Step 0 — Environment setup (no external services)
Install Node.js, Xcode (for the iOS simulator), and scaffold the Expo app.
- **Test:** a "Hello" screen opens in the iPhone simulator on the Mac, and hot reload works (edit the text, see it change live without restarting).

### Step 0 detailed actions
| # | Action | Layman version | Verify with |
|---|---|---|---|
| 0.1 | Check/install **Node.js** (v20+, via Homebrew or nvm) | The engine that runs JavaScript tools on your Mac | `node --version` prints v20 or higher |
| 0.2 | Install **Xcode** from the Mac App Store, open it once, let it install the **iOS Simulator** runtime | Apple's developer toolbox — it contains the "fake iPhone" we test on. Big download (~10 GB, can take an hour); everything else waits on this | Simulator app opens and shows an iPhone |
| 0.3 | Scaffold the app: `npx create-expo-app` (TypeScript template) inside `proj1/` | Generates the folder full of starter files — the empty shell of our app | A new app folder exists and `npx expo start` runs without errors |
| 0.4 | Launch it: `npx expo start`, press `i` to open the iOS simulator | Start the app and watch it appear on the fake iPhone | Default Expo screen visible in the simulator |
| 0.5 | Strip the boilerplate to one minimal "Hello" screen (ponytail: delete everything we don't need) | Replace the demo content with our own blank starting point | Our hello screen shows; editing the text updates the simulator instantly |
| 0.6 | Git commit: "Step 0: Expo app runs in simulator" | Save this working state so we can always come back to it | `git log` shows the commit |

## Step 1 — Accounts & profiles 🔌 WIRE: Supabase (free tier)
Create a Supabase project (free). Add sign-up/sign-in and a profile screen (name + interests).
- Free tier: 500 MB database, auth for 50k monthly users, Realtime included. More than enough.
- Caveat: free projects pause after ~1 week of inactivity — one click in the dashboard wakes them.
- **Test:** create an account in the simulator, close and reopen the app, still signed in; profile shows saved interests.

## Step 2 — Venues & pins (no new services)
Map screen (Apple Maps — free, no API key) with seeded venues. Tap a venue → "I'm heading there".
- **Test:** pin a bar, kill the app, reopen — the pin is still active. The pin row is visible in the Supabase dashboard.

## Step 3 — Presence: who's here? (no new services)
Manual "I've arrived" check-in + discoverable toggle. Venue screen lists other discoverable people there (first names only).
- **Test:** run TWO simulators side by side with two accounts; both check into the same bar; each sees the other appear in the list live (Supabase Realtime).

## Step 4 — Matching: the double yes (no new services)
Suggestion card ("open to meet Alex?"). Both must tap yes → match created. One-sided yes reveals nothing.
- **Test:** on two simulators, A taps yes → B sees nothing revealed yet; B taps yes → both instantly get a "It's a match" screen.

## Step 5 — Chat (no new services)
1-on-1 chat inside a match, via Supabase Realtime.
- **Test:** type a message on simulator A, it appears on simulator B without refreshing (and vice versa).

✅ At the end of Step 5 the core loop works end to end. Everything after this is upgrade.

## Step 6 — Socket.io presence service 🔌 WIRE: Socket.io (free — it's a library)
Small Node.js + Socket.io server for live presence ("heading there" movement, online status). Runs on the laptop during development — costs nothing.
- If the demo needs it live on the internet: Render.com free tier (spins down when idle — fine for a demo). Otherwise we demo locally and record video.
- **Test:** same two-simulator presence test as Step 3, now driven by Socket.io; kill one app and the other sees them go offline within seconds.

## Step 7 — Smart suggestions 🔌 WIRE: OpenAI API (your existing key)
Embed user interests with text-embedding-3-small; rank same-venue suggestions by similarity (pgvector in Supabase).
- Cost: fractions of a cent for the whole prototype (~$0.02 per 1M tokens; our interests are tiny).
- **Test:** three accounts at one bar; the suggestion order matches shared interests (e.g. two hikers rank each other first).

## Step 8 — Demo polish (no new services, no money)
- Bot simulator: fake users heading to venues so the app looks alive with one real user.
- UI cleanup, app icon, empty states.
- Record a 60–90s demo video (two simulators, full loop).
- Share via Expo: NEX2 team scans a QR code in the free Expo Go app. (No $99 Apple developer account — that's only needed for TestFlight/App Store, which we skip.)
- **Test:** a friend follows the README + QR code and completes the full loop without help.

## Cost summary
| Service | When wired | Cost |
|---|---|---|
| Expo / React Native / iOS Simulator | Step 0 | $0 |
| Supabase (auth + DB + Realtime) | Step 1 | $0 (free tier) |
| Apple Maps via react-native-maps | Step 2 | $0 (no key needed; we avoid Google Maps, which requires a billing card) |
| Socket.io | Step 6 | $0 (local; Render free tier only if a hosted demo is needed) |
| OpenAI embeddings | Step 7 | pennies (your key) |
| Apple Developer account | never | $0 — skipped; Expo Go covers testing & sharing |
