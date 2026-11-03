# Bug & Fix Log

Every bug/error we hit goes here, newest on top. One entry per bug.
Format:

```
## [YYYY-MM-DD] Short title (Step N)
- **Symptom:** what we saw (error message, wrong behavior)
- **Cause:** what was actually wrong
- **Fix:** what we changed
- **Lesson:** (optional) how to avoid it next time
```

---

## [2026-11-02] Integration test run did not exit (M2 review)
- **Symptom:** Both recorded runs in `docs/evidence/` end with Jest's "did not exit" warning; the CI job had no timeout.
- **Cause:** An open handle after the tests finish. Not identified yet.
- **Fix:** `--forceExit` on the integration scripts and a 10 minute CI timeout. This is a workaround, not a root-cause fix.
- **Lesson:** A warning at the end of a passing log is still worth reading.

## [2026-11-02] SEC-1 could be bypassed with a hidden pin (M2 review)
- **Symptom:** A client could move a hidden pin from venue to venue and list who is visible at each one, found by reading the policies.
- **Cause:** `viewer_venue()` accepted any pin, and users write their own pins.
- **Fix:** Viewing now requires being checked in and visible (migration 20261102000010). A script can still cycle a visible pin until check-in is verified; recorded as a residual risk in `docs/SECURITY.md`.
- **Lesson:** A rule based on data the client controls only limits what that client must reveal. Test the bypass, not just the outsider.

## [2026-11-01] Keyboard covers the password field on iPhone 16e (M2 E2E) — open
- **Symptom:** On the small iPhone 16e the keyboard hides the password field during sign-in.
- **Cause:** Not investigated yet.
- **Fix:** Not fixed. `returnKeyType="next"` is planned.

## [2026-11-01] "List" and "Sign out" hidden under the iOS status bar (M2 E2E)
- **Symptom:** The buttons rendered under the clock and battery and did not respond to taps.
- **Cause:** Absolutely positioned children ignore the `SafeAreaView` inset.
- **Fix:** Moved both buttons into a normal-flow top bar inside the safe area.
- **Lesson:** Children of an absolutely positioned `SafeAreaView` must stay in normal flow to get the inset.

## [2026-11-01] Three security vulnerabilities: SEC-1, SEC-2, SEC-3 (M2 integration suite)
- **Symptom:** Security tests failed: any signed-in user could list visible people at every venue, send meet requests to anyone including hidden people, and store oversized names and interest lists.
- **Cause:** The limits and the "people here" rule existed only in the UI, and the publishable key lets anyone call the API directly.
- **Fix:** RLS policies, `venue_counts()` and check constraints (migration 20261101000009). Evidence in `docs/evidence/security-BEFORE.txt` and `security-AFTER.txt`.
- **Lesson:** Any rule that exists only in the UI is not a control.

## [2026-11-01] Previous account's profile could carry over after switching accounts (M2 lint)
- **Symptom:** Flagged by ESLint `react-hooks/set-state-in-effect`: profile state was not tied to the signed-in user.
- **Cause:** One profile state value survived a change of session.
- **Fix:** Profile state is now keyed by user id.

## [2026-11-01] Profile setup accepted 1 interest (M2 requirements review)
- **Symptom:** The form allowed a single interest although BC-02 specifies 3–5.
- **Cause:** The check only required at least 1.
- **Fix:** `validateProfile` now enforces 3–5 interests and a 30 character name. The minimum is enforced in the app only, because new profiles start with no interests.

## [2026-09-30] Matched person's name vanished after they left the venue (M1 packaging)
- **Symptom:** Map pill showed "Chat with " (empty name) for an active match.
- **Cause:** Profile visibility rode only on "owner has a discoverable pin" — once a matched person left/went hidden, their profile became unreadable to their own match.
- **Fix:** New RLS policy: match participants can read each other's profile while the match lasts (migration 20260930000007).
- **Lesson:** Every screen that shows another user needs an RLS path that covers it; visibility rules compose per-feature.

## [2026-08-25] Turning visibility OFF didn't update the other phone's list live (Step 3)
- **Symptom:** Flipping "Let people here see me" ON appeared on the other device instantly; flipping it OFF only disappeared after closing and reopening the people list.
- **Cause:** Supabase Realtime applies RLS per subscriber to `postgres_changes` UPDATE events. When discoverable flips OFF, the updated row is no longer visible to other users, so — correctly, by privacy rules — no event is delivered to them, and their list goes stale.
- **Fix:** Every pin mutation now also sends a data-free `broadcast` message ("refetch") on the same channel; broadcasts aren't row-filtered, so all clients refetch and RLS decides what they can see at query time.
- **Lesson:** RLS filters realtime *events*, not just queries — asymmetric delivery (appear-fast, disappear-never) is the signature of this class of bug.

## [2026-08-25] 🍺 emoji rendered as boxed "?" in simulator (Step 0)
- **Symptom:** The beer emoji in the title showed as a missing-glyph box on iPhone 17 / iOS 26.3 simulator.
- **Cause:** File encoding verified correct (UTF-8 `f0 9f 8d ba`) — a fresh-simulator font/rendering quirk, not our code.
- **Fix:** Removed the emoji from the title; real branding comes from the design pass anyway.
- **Lesson:** Verify encoding at the byte level before blaming code; don't fight simulator quirks on cosmetic details.

## [2026-08-25] Expo Go failed to install in simulator — disk full (Step 0)
- **Symptom:** `npx expo start --ios` crashed with `Error: ENOSPC: no space left on device` while "Fetching Expo Go".
- **Cause:** Disk had only 244 MB free after installing Xcode (~10 GB) + iOS simulator runtime (~8 GB).
- **Fix:** `npm cache clean --force` freed 4.2 GB (npm re-downloads packages on demand); retried and it worked.
- **Lesson:** Keep an eye on free disk space — Mac still at ~77% capacity; free up more before Step 1 if possible.

## [2026-08-25] First `expo start --ios` opened before simulator finished booting (Step 0)
- **Symptom:** Expo printed "Opening … on iPhone 17" but nothing appeared; Expo Go was never installed.
- **Cause:** The simulator was still on its first-boot Apple-logo screen when Expo tried to open the app.
- **Fix:** Waited for `xcrun simctl bootstatus -b` to finish, then restarted `npx expo start --ios`.
- **Lesson:** Boot the simulator fully (first boot is slow) before pointing Expo at it.
