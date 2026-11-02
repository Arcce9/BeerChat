# Security — Milestone 2

Threat model, OWASP Top 10 review, implemented controls, and before/after evidence.

## 1. Assets and trust boundaries

| Asset | Why it matters |
|---|---|
| **Location-at-venue** (who is at which bar right now) | The most sensitive data in the app: real-world, real-time whereabouts. |
| **One-sided interest** ("Open to meet?") | Leaking it causes embarrassment/harassment; the product promise is that it stays secret. |
| Chat messages | Private conversation between two matched people. |
| Profiles (first name, interests) | Low sensitivity alone, sensitive when joined with location. |
| Accounts / sessions | Takeover gives all of the above. |

```
 [ iPhone app ]  ──(untrusted: anyone can call the API with the publishable key)──►  [ Supabase ]
   React Native                                                                       Auth · PostgREST · Realtime
   holds publishable key only                                                         └► Postgres: RLS policies + triggers  ◄── the trust boundary
```

**Key design fact:** the mobile app talks to the database directly, and the publishable key ships inside every copy of the app. Any check that lives only in the UI is *not* a security control — an attacker uses the API directly. Every control below is therefore enforced in Postgres (Row Level Security, constraints, `SECURITY DEFINER` functions).

## 2. Threat model (STRIDE over the main attack surfaces)

| # | Surface | Threat (STRIDE) | Before M2 | Control |
|---|---|---|---|---|
| T1 | `pins` / `profiles` reads | **Information disclosure** — enumerate who is visible at every venue, from anywhere | **Vulnerable** (SEC-1) | RLS: visible only to viewers pinned at the same venue; counts via aggregate-only RPC |
| T2 | `meet_requests` insert | **Elevation / abuse** — send requests to arbitrary user ids, from anywhere, to hidden people | **Vulnerable** (SEC-2) | RLS `WITH CHECK`: requester arrived+visible at the venue, target visible there |
| T3 | `profiles` update | **Tampering / DoS** — store megabyte names or huge interest lists shown to others | **Vulnerable** (SEC-3) | DB check constraints (name ≤ 30 chars, ≤ 5 interests, ≤ 200 chars total) |
| T4 | `meet_requests` reads | Information disclosure — learn who said yes to you | Mitigated (M1) | RLS: only the requester can read a request |
| T5 | `matches` insert/delete | Spoofing — fabricate a match | Mitigated (M1) | No client policy; only triggers create/delete matches |
| T6 | `messages` insert | Spoofing — send as the other person; post after unmatch/expiry | Mitigated (M1 + M2) | RLS: `sender_id = auth.uid()`, participant, match unexpired |
| T7 | `messages` reads | Disclosure — read other people's chats; old chats lingering | Mitigated (M1 + M2) | RLS participant-only; expiry hides after 6h, pg_cron purges |
| T8 | Realtime | Disclosure via change events | Mitigated | Realtime applies RLS per subscriber; broadcast channel carries no data |
| T9 | Auth | Credential stuffing / weak passwords | Partly | Supabase Auth rate limits + bcrypt; min length 6 (raise in M3) |
| T10 | Repository | Secret leakage | Mitigated | Only the publishable key is committed (designed to be public); no service-role key anywhere |

## 3. OWASP Top 10 (2021) review

| Category | Relevance to BeerChat | Status |
|---|---|---|
| **A01 Broken Access Control** | The central risk: the client is untrusted. | **Two real issues found and fixed (SEC-1, SEC-2).** All tables have RLS; integration tests assert each rule. |
| A02 Cryptographic Failures | Passwords, transport. | Supabase: bcrypt hashes, TLS everywhere, JWT sessions. No custom crypto. |
| A03 Injection | SQL via API parameters. | PostgREST parameterises all queries; no string-built SQL in the app. Trigger/RPC functions use `search_path = ''` to prevent search-path hijacking. |
| **A04 Insecure Design** | Limits enforced only in UI. | **SEC-3 fixed:** limits moved into DB constraints. Privacy promise ("only people here") now enforced by design, not UI. |
| A05 Security Misconfiguration | Default-open tables, exposed functions. | RLS on every table; `purge_expired_matches` execute revoked from clients; `venue_counts` granted to `authenticated` only. Email confirmation is disabled for the demo — documented, re-enable before a real launch. |
| A06 Vulnerable Components | npm dependencies. | `npm audit` reviewed; Expo SDK patches applied in M2 (`expo install --fix`); CI installs from the lockfile. |
| A07 Identification & Auth Failures | Session handling. | Supabase Auth; tokens refreshed only while foregrounded; sign-out clears session; profile state keyed by user id so a previous account's data can't leak after switching accounts (fixed in M2). |
| A08 Software & Data Integrity | Untrusted updates. | Lockfile + `npm ci` in CI; migrations are versioned and reviewed. |
| A09 Logging & Monitoring | Detecting abuse. | Supabase logs API/auth requests. Alerting is out of scope until deployment (M3). |
| A10 SSRF | Server fetching URLs. | Not applicable: no server-side URL fetching. |

## 4. Implemented security controls (M2)

All in [`supabase/migrations/20261101000009_security_hardening.sql`](../supabase/migrations/20261101000009_security_hardening.sql):

- **SEC-1 — same-venue visibility.** `pins`/`profiles` SELECT policies require the viewer to be pinned at the same venue (`viewer_venue()` is a `SECURITY DEFINER` helper so the `pins` policy doesn't recurse into itself). The venue sheet's counts move to `venue_counts()`, which returns numbers only.
- **SEC-2 — request authorization.** `meet_requests` INSERT requires the requester to be *arrived and visible* at the venue and the target to be visible there.
- **SEC-3 — server-side input validation.** Check constraints on name length, interest count and total interest size (`NOT VALID` so legacy rows don't block the migration; all new writes are checked).
- **BC-10 hardening** (migration `…000008`): expired matches and their messages become unreadable and unwritable immediately; a pg_cron job purges them every 15 minutes.

## 5. Before / after evidence

The security tests in [`app/__tests__/integration/security.test.ts`](../app/__tests__/integration/security.test.ts) assert the *secure* behaviour. They were committed and run **before** the fix (commit `9d34f1c`) and again after (commit `a46267d`):

| Test | Before | After |
|---|---|---|
| outsider cannot list who is checked in at a venue | ✕ (got Alice & Bob) | ✓ |
| outsider cannot read profiles of people at a venue | ✕ | ✓ |
| someone at a different venue cannot list this one | ✕ | ✓ |
| anyone signed in can still see anonymous counts | ✕ (no RPC) | ✓ |
| outsider cannot send a meet request | ✕ (accepted) | ✓ |
| a request cannot target someone hidden | ✕ (accepted) | ✓ |
| rejects an oversized display name | ✕ (5000 chars stored) | ✓ |
| rejects more than 5 interests | ✕ | ✓ |

Full runner output: [`evidence/security-BEFORE.txt`](evidence/security-BEFORE.txt) (8 failed, 15 passed) and [`evidence/security-AFTER.txt`](evidence/security-AFTER.txt) (23 passed).

## 6. How the TA can observe the control

1. **Automated:** `cd app && npm run test:integration` — the `SEC-1…3` tests pass.
2. **In the app:** sign in as demo user 1 *without* checking in, open Houndstooth Sports Bar: the sheet shows counts ("3 here now") but there is no way to see who; after **I'm here** + **Let people here see me**, the people list appears.
3. **Directly against the API** (what an attacker would do): with the publishable key, sign in and `GET /rest/v1/pins?select=user_id` → returns only your own pin unless you are checked in at that venue.

## 7. Known residual risks (tracked for M3)
- Check-in is self-declared (no geofence), so someone can claim to be at a venue. Mitigation candidates: geofence check at check-in, rate-limit pin changes.
- Email confirmation disabled for the demo; password minimum is Supabase's default.
- No abuse reporting/blocking yet.
