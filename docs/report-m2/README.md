# Finishing the Milestone 2 report

The submitted PDF is `docs/Milestone-2-Report.pdf`; its source is `docs/report-m2/report.html` in this folder.

## Before submission
1. **Review the pull requests** — [#1](https://github.com/Arcce9/BeerChat/pull/1) (features + unit tests), [#2](https://github.com/Arcce9/BeerChat/pull/2) (security + integration tests), [#3](https://github.com/Arcce9/BeerChat/pull/3) (E2E, CI, docs, this report). Leave comments and approve (or request changes) on GitHub; the reviews are the code-review evidence.
2. **Write your contribution statement** (1–2 sentences, your own Milestone 2 work) in two places:
   - `docs/report-m2/report.html` — search for `To be written by`
   - `README.md` — section "Team & Milestone 2 Contributions"
3. **Add anything missing** from the report; requirements are in `Project Milestones` → "Project Milestone 2".
4. **Re-render the PDF** (macOS, Chrome installed), from the repo root:
   ```bash
   "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --no-pdf-header-footer \
     --virtual-time-budget=10000 --print-to-pdf="$PWD/docs/Milestone-2-Report.pdf" \
     "file://$PWD/docs/report-m2/report.html"
   ```
5. **Merge and tag** once approved — merge #1, then #2 and #3 (retarget each to `main` with "Edit" on the PR if GitHub hasn't already), then:
   ```bash
   git checkout main && git pull
   git tag milestone-2 && git push origin milestone-2
   gh release create v0.2.0 --target main --title "v0.2.0 — Milestone 2" --notes "See CHANGELOG.md [0.2.0]."
   ```
6. Each team member uploads the PDF to Gradescope.
