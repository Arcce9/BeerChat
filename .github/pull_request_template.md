## What & why
<!-- Backlog id (BC-xx / SEC-x) and the user-visible change -->

## How it was tested
<!-- unit / component / integration / E2E / manual on which simulator -->

## QA checklist (docs/QA-PLAN.md)
- [ ] CI green (typecheck, lint, unit tests, coverage thresholds)
- [ ] New logic/UI behaviour has tests
- [ ] Privacy/permission changes enforced in the database (RLS/constraint) + integration test
- [ ] `npm run test:integration` passes for migration or data-access changes
- [ ] Migrations are new files, never edits of applied ones
- [ ] Checked on an iPhone simulator (16e + 17 Pro Max for layout changes)
- [ ] Bugs found are logged in docs/BUGLOG.md
