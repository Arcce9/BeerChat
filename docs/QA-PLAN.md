# Quality Assurance Plan — Milestone 2

## 1. Test levels

| Level | Tool | Where | What it covers | Runs |
|---|---|---|---|---|
| Static | TypeScript (`strict`), ESLint (`eslint-config-expo`) | `npm run typecheck`, `npx expo lint` | type errors, hooks misuse, dead code | every PR (CI) |
| Unit | Jest | `app/__tests__/unit/logic.test.ts` | pure logic: BC-08 ranking, BC-10 expiry, validation, pin state machine | every PR (CI) |
| Component | Jest + React Native Testing Library, Supabase mocked | `app/__tests__/unit/*.test.tsx` | each screen's rendering and interactions (MapHome, PeopleHere, MatchScreen, ChatScreen) | every PR (CI) |
| Integration | Jest (node) against the **live** Supabase project, 3 real accounts | `app/__tests__/integration/` | auth, RLS privacy rules, triggers (match/unmatch), realtime delivery, expiry, security regressions | push to `main`, manual dispatch, before every release |
| End-to-end UI | Maestro on the iOS Simulator | `app/e2e/*.yaml` | the full user journey through the real UI | before every release, on 3 screen sizes |
| Manual | two-simulator script | [`VERIFICATION.md`](VERIFICATION.md) | exploratory + TA verification | before every release |

## 2. Coverage target and justification

Enforced by Jest `coverageThreshold` (the build fails below these):

| Scope | Target | Current |
|---|---|---|
| `src/lib/logic.ts` (pure logic) | ≥ 95 % statements, ≥ 90 % branches, 100 % functions | **100 % / 94 % / 100 %** |
| All of `src/` (global) | ≥ 80 % statements & lines, ≥ 70 % branches, ≥ 75 % functions | **84 % / 78 % / 83 %** |

**Why these numbers.** Pure logic is cheap to test exhaustively and is where ranking/expiry/validation bugs would hide, so we demand near-total coverage. Screens are measured too, but the remaining uncovered lines are almost all Supabase realtime callbacks and network error branches — mocking those reproduces the mock, not the system. Those paths are covered where they actually matter, by the 30 integration tests against the real backend and the Maestro E2E flows, which coverage tools cannot count. A higher global number would mostly buy brittle mocks. `supabase.ts` (client config) and `theme.ts` (constants) are excluded as configuration.

## 3. QA checklist (applies to every pull request)

The PR template mirrors this list.

- [ ] CI green: typecheck, lint (0 errors), unit tests, coverage thresholds
- [ ] New logic has unit tests; new UI behaviour has a component test
- [ ] Any change to privacy/permissions is enforced by **RLS or a constraint**, not only the UI, and has an integration test
- [ ] Integration suite passes locally (`npm run test:integration`) for any migration or data-access change
- [ ] Migrations are new files (never edit an applied migration) and are named `YYYYMMDDHHMMSS_description.sql`
- [ ] Manually checked on at least one iPhone simulator; screen-size-sensitive UI checked on iPhone 16e (small) and 17 Pro Max (large)
- [ ] No secrets beyond the publishable key; no `console.log` left in app code
- [ ] Bugs found along the way have an entry in [`BUGLOG.md`](BUGLOG.md)
- [ ] At least one teammate review approves the PR before merge

## 4. Definition of Done (updated for M2)

A backlog item is done when: (1) the checklist above is satisfied; (2) its acceptance test passes on two simulators; (3) its privacy rules are enforced in the database; (4) it is merged to `main` through a reviewed PR and noted in [`CHANGELOG.md`](../CHANGELOG.md).

## 5. Cross-viewport / cross-platform testing

The Maestro E2E flow `01-signin-checkin-discover.yaml` was run on three iOS screen classes; the full journey (flows 01 + 02) on the iPhone 17. Screenshots: [`evidence/screens/`](evidence/screens/).

| Device | Screen (points) | Result | Issue found → fix |
|---|---|---|---|
| iPhone 16e | 390 × 844, smallest current | ✓ pass | keyboard covered the password field → flow closes the keyboard between fields (consider `returnKeyType="next"` in M3) |
| iPhone 17 | 402 × 874 | ✓ pass (flows 01 + 02) | "List"/"Sign out" rendered under the status bar and swallowed taps → fixed layout (commit `23eb020`) |
| iPhone 17 Pro Max | 440 × 956, largest | ✓ pass | — |
| Android | — | not run this milestone (team decision); the codebase uses only cross-platform RN components, platform-specific code is limited to `KeyboardAvoidingView` behaviour and map tiles | planned with deployment in M3 |

## 6. Results at the `milestone-2` tag

| Suite | Result |
|---|---|
| Unit + component (CI) | 54 / 54 pass, coverage 83.7 % statements |
| Integration (live backend) | 30 / 30 pass |
| E2E (Maestro) | 2 / 2 flows pass on iPhone 17; flow 01 passes on 16e and 17 Pro Max |
| Lint | 0 errors, 2 warnings (`react-hooks/exhaustive-deps` on `buildMatch`, reviewed: intentional — the effects must not resubscribe when the helper's identity changes) |
