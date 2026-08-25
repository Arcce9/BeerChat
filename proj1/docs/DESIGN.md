# Design Requirements — BeerChat (working name)

## FINAL DESIGN (Claude Design canvas, 2026-08-25) — treat as the source of truth for look & feel
Canvas: https://claude.ai/design/p/e3bf91f9-fe70-499f-b95e-f40d9f2e1463 (7 screens)

**Tokens:** bg #0B0B0D · surface #17181B · elevated #1F2126 · borders #26282D/#2A2C32 · accent #F2A93B (on-accent text #0B0B0D) · text #FFF, secondary rgba(255,255,255,.5), tertiary .35 · font Inter/system, headings bold with tight letter-spacing · buttons 56px, radius 16 · chips pill (999), 44px min height · cards radius 20 · bottom sheet radius 28 top, drag handle
**Key patterns:** map pins = labeled pills with people counts; bottom status card "Heading to X · Hidden until you check in · Change"; venue sheet = name + meta + two stat cards (heading there / here now) + discoverable toggle + CTA (heading → "I'm here"); people cards = first name + "here 20 min" + interest tags + "Open to meet?" → "Waiting on {name}…"; match screen = initials blocks + shared tags; chat = amber own-bubbles, ephemeral note in header, quick-reply chips.
**Adopted product decision:** discoverable is per check-in (on the pin), not a global profile flag.
**Deviations (deliberate):** password auth instead of email codes (no email infra in prototype); 4-tab bar deferred until Chats exists; map search omitted in v1.

Brief for designing the app screens in Claude Design. One artboard per screen, iPhone size (393 × 852).

## What the app is (one line for the designer)
A night-out app: pin the bar you're heading to, see who else is there and open to meeting, mutually confirm, get a short-lived chat to find each other in person.

## Visual direction
- **Dark theme only** (v1). This app is used at night, in bars — dark background, high contrast text.
- **Accent color:** warm amber/gold (beer tones, e.g. #F2A93B) for primary buttons and active states. One accent only.
- **Feel:** clean, modern, minimal — closer to a well-made utility than a flashy social app. Rounded cards, generous spacing, few words per screen.
- **Typography:** system-style sans (SF Pro / Inter). Big friendly headings, readable body.
- **Touch targets:** ≥ 44 pt. People use this holding a drink, one-handed.
- **Tone of copy:** casual and short ("I'm heading there", "Open to meet?"), never corporate.

## Design constraints (so mockups are buildable in React Native)
- Standard mobile components only: lists, cards, bottom sheets, chips, buttons, tab bar. No exotic interactions.
- The map screen uses Apple Maps — design the overlays/pins/sheet, not the map tiles themselves.
- No animations required in mockups; static screens are fine.

## Screens (7 artboards)

### 1. Welcome / Sign in
- App name + one-line pitch ("Meet the people already around you" style — write something better).
- Email sign-in (field + button). No social logins in v1.

### 2. Profile setup
- Display name field (explain: **first name only is shown to others**).
- Interest picker: tappable chips, choose 3–5 (e.g. live music, football, startups, hiking, board games…).
- Short privacy reassurance line: "You're invisible until you check in and choose to be seen."

### 3. Home — map
- Full-screen map with venue pins; tapping a pin opens the venue sheet (screen 4).
- A "my status" bar (top or bottom): shows current pin ("Heading to Joe's Bar") or empty state ("Pin a spot to get started").
- Simple search or nearby-venues list toggle is optional — keep minimal.

### 4. Venue sheet (bottom sheet over the map)
- Venue name + how many people are **heading there** / **here now** (counts only, no names yet).
- Primary CTA: **"I'm heading there"** → changes to **"I'm here"** check-in when arrived.
- **Discoverable toggle**: "Let people here see me" (off by default; this is the opt-in moment).

### 5. People here
- List/cards of discoverable people at this venue: **first name + shared interest tags only.** No photos required in v1, no last names, no distance.
- Each card has one action: **"Open to meet?"**
- Note for designer: tapping it reveals nothing to the other person unless they also tap — design should feel low-pressure.

### 6. It's a match
- Full-screen confirmation when both said yes: both first names, shared interests, and a single CTA into chat.
- Include a subtle line that the chat **expires tonight** (ephemeral).

### 7. Chat
- Standard 1-on-1 chat: bubbles, input bar.
- Header: person's name + venue name + expiry note ("disappears at 2:00 AM").
- First-message helper prompt optional ("Say where you're sitting").

## Flow (how screens connect)
Welcome → Profile setup → Home map → tap venue → Venue sheet → "I'm here" + discoverable ON → People here → "Open to meet?" → (both yes) → It's a match → Chat.

## Out of scope for design v1
Photos/avatars, group meetups, friend lists, notifications settings, Android-specific patterns, light theme.
