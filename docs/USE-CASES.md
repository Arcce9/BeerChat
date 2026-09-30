# Use Cases — Milestone 1

Use cases for the P0 backlog items. Actor is always a signed-in user unless stated. The system is the app + Supabase (Postgres, RLS, Realtime).

## UC-1 Create account and profile (BC-01, BC-02)
**Precondition:** none. **Trigger:** first launch.
1. User enters email + password, taps *Create account*.
2. System creates the auth user; a database trigger creates an empty profile row.
3. App routes to profile setup; user enters first name and picks 1–5 interest chips.
4. System upserts the profile; app routes to the map.

**Alternate:** existing user signs in (2a: `signInWithPassword`; skips 3–4 if profile complete). **Postcondition:** session persisted on device; profile row owned by the user (RLS: self-only read/write).

## UC-2 Pin a venue (BC-03, BC-11)
**Precondition:** signed in, profile complete. **Trigger:** user taps a map pin — or a row in the plain **List** fallback if the map fails to load.
1. Venue sheet opens with live counts (heading there / here now).
2. User taps *I'm heading there*.
3. System upserts the user's single `pins` row (`status='heading'`, `discoverable=false`).
4. Status card shows the destination; the pin survives app restarts (it lives in the database).

**Alternate:** user already pinned elsewhere → the new upsert replaces it (one pin per user, enforced by primary key). **Postcondition:** user is *invisible* to others (discoverable defaults off).

## UC-3 Check in and discover people (BC-04, BC-05)
**Precondition:** UC-2 at venue V. **Trigger:** user arrives.
1. User taps *I'm here* (`status='arrived'`), then toggles *Let people here see me* on.
2. System updates the pin; a realtime event + broadcast notify every open client.
3. User taps *See who's open to hello*; system lists discoverable people at V (first name + interests only), excluding self.
4. List updates live as others check in/out or toggle visibility.

**Privacy rule (enforced by RLS):** others' pins are readable **only** while `discoverable = true`; profiles are readable only while their owner has a discoverable pin. **Postcondition:** user appears in others' lists at V.

## UC-4 Double opt-in match (BC-06)
**Precondition:** two discoverable users A and B at the same venue. **Trigger:** A taps *Open to meet?* on B.
1. System inserts a `meet_requests` row (A→B). RLS makes this row readable **only by A** — B can see nothing.
2. A's button becomes *Waiting on B…* (tapping again withdraws the request).
3. B independently taps *Open to meet?* on A → B→A row inserted.
4. A database trigger — the only party able to see both rows — creates the `matches` row.
5. Realtime delivers the match INSERT to both devices; both show "YOU BOTH SAID YES" with shared interests.

**Alternate — withdrawal (any time, even after matching):** deleting a request fires a trigger that deletes the match; both devices dismiss live, and messages cascade away. **Postcondition:** match exists only while both sides consent.

## UC-5 Ephemeral chat (BC-07)
**Precondition:** an active match. **Trigger:** *Say hi* on the match screen, or the *Chat with …* pill on the map.
1. Chat opens: header names the person and venue; history loads.
2. Messages insert into `messages` (RLS: participants only, sender must be self) and are pushed to the other device via Realtime.
3. Match withdrawal (UC-4 alt) deletes the conversation for both.

**Postcondition:** no orphaned messages exist without a consenting match.
