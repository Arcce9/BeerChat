# Milestone 1 — TA Verification Guide

Prerequisites, install, and demo-account credentials are in the root [README](../README.md). This is the click-by-click script with expected results. Total time ≈ 10 minutes.

**Setup:** run `npx expo start` in `app/`, open TWO iOS simulators (press `i`, then `shift+i` for the second), sign in as `ta.demo1@beerchat.dev` / `BeerChat-M1-demo1` on device A and `ta.demo2@beerchat.dev` / `BeerChat-M1-demo2` on device B.

| # | Do | Expect | Backlog |
|---|---|--------|---------|
| 1 | On A: sign in as demo user 1 | Dark map of Tuscaloosa with 6 amber venue pins | BC-01, BC-03 |
| 2 | Kill the app in the simulator and reopen it | Still signed in, no login screen | BC-01 |
| 3 | Tap the **List** button (top-left) | Plain venue list; tapping a row opens the same venue sheet as the map pin | BC-11 |
| 4 | Tap a venue (e.g. Houndstooth Sports Bar) → **I'm heading there** | Status card at the bottom: "Heading to … · Hidden until you check in" | BC-03 |
| 5 | Reopen the venue sheet → **I'm here**, toggle **Let people here see me** ON | Sheet shows "You're here"; "here now" count includes you; amber "See who's open to hello" button appears | BC-04 |
| 6 | Repeat 4–5 on device B at the **same venue**, then open **See who's open to hello** on both | Each device lists the other person (first name + interest tags only) — appearing **live**, no refresh | BC-05 |
| 7 | On A: toggle **Let people here see me** OFF | A disappears from B's list within ~1 s (turn it back on afterwards) | BC-04 |
| 8 | On A: tap **Open to meet?** on B's card | A shows "Waiting on …"; **B shows no indication whatsoever** (privacy check — the database refuses to serve one-sided interest) | BC-06 |
| 9 | On B: tap **Open to meet?** on A's card | BOTH devices simultaneously show the full-screen "YOU BOTH SAID YES" match screen with shared interests | BC-06 |
| 10 | On A: **Say hi**, then type a message. On B: tap the amber "Chat with …" pill and reply | Each message appears on the other device in real time | BC-07 |
| 11 | On either device: back out to the people list and tap **Waiting on …** to withdraw | The match screen/chat pill/conversation disappear on **both** devices — messages are deleted with the match | BC-06/07 |

## What is being demonstrated
- **Auth + session persistence** (Supabase Auth, AsyncStorage).
- **Row Level Security as the privacy mechanism**: steps 7 and 8 work because the database *cannot return* rows the viewer isn't entitled to — not because the UI hides them.
- **Realtime**: steps 6, 7, 9, 10, 11 are pushed over WebSockets (Postgres change events + a data-free broadcast channel), never polled.
- **Double opt-in via database trigger**: the match in step 9 is created server-side by a trigger that is the only party able to see both directions of interest.

## Known limitations (Milestone 1)
- iOS is the verified platform (Android planned; nothing used is iOS-only except the Apple Maps tiles — `react-native-maps` falls back to Google tiles on Android).
- Check-in is a manual button, not geofenced (planned M2).
- Time-based chat expiry (the "2 AM rule") is designed but not yet implemented; chat deletion currently happens on match withdrawal.
- If the hosted free-tier database was paused by inactivity, the first request may take 2–3 minutes while it wakes.
