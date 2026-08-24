# App Requirements & Rules

Working name: **Meetup-at-Venue app** (name TBD)
Goal: portfolio prototype + demo for NEX2 application. Zero budget except OpenAI API.

## The core loop (v1 scope — nothing outside this list)
1. A user creates an account and a small profile (name, photo optional, 3–5 interests).
2. A user pins a venue (bar/spot) and sets status "heading there".
3. When at the venue, the user is visible to others at the same venue — only if they opted in to be discoverable.
4. The app suggests people at the same venue (ranked by shared interests).
5. If BOTH users tap "open to meet", a match is created.
6. A match opens a 1-on-1 chat so they can find each other in person.

## Hard rules (product decisions already made)
- **Privacy:** venue-level presence only. Never share exact GPS coordinates with other users.
- **Opt-in visibility:** a user is invisible at a venue until they explicitly check in as discoverable.
- **Double opt-in:** no identity reveal and no chat until both users confirm.
- **Chat is ephemeral:** conversations expire a few hours after the meetup (exact TTL: TBD).
- **Minimal profile:** no bios/feeds/followers. This is not a social network, it's a meetup tool.

## Explicitly OUT of scope for v1
- Friend lists, groups, photos feeds, venue reviews/ratings
- Android polish (we develop/test on iOS simulator; Android later if time allows)
- Push notifications while app is closed (nice-to-have, revisit at the end)
- Automatic background geofencing (v1 = manual "I'm here" check-in button; auto-detect is a stretch goal)
- Moderation/reporting tools (mention in README as "what production would need")

## Tech stack (locked)
- **App:** React Native + Expo + TypeScript, tested on iOS Simulator
- **Backend:** Supabase (auth, Postgres database, Realtime for presence + chat)
- **Maps:** react-native-maps with Apple Maps (free, no API key)
- **AI:** OpenAI embeddings (text-embedding-3-small) for interest-based suggestion ranking
- **Socket.io:** small Node.js presence service, added in Step 6 (runs locally; free-tier host only if needed for live demo)

## Entities
| Entity | What it is | Key fields (draft) |
|---|---|---|
| Profile | a person | id, display_name, interests[], discoverable |
| Venue | a bar/spot | id, name, lat, lng |
| Pin | user ↔ venue intent | user_id, venue_id, status (heading / arrived / left), created_at |
| Match | two users who both said yes | user_a, user_b, venue_id, status (pending / confirmed / expired) |
| Message | chat line inside a match | match_id, sender_id, text, created_at |

## Open questions (decide as we go)
- Chat TTL: how long after meetup does chat expire?
- What happens if one user says yes and the other never responds? (timeout?)
- Seed venue list: which real bars/spots do we preload for the demo?
