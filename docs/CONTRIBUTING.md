# Contributing — branching, commits, and code review

## Branching
- `main` is always runnable and is what milestones are tagged from. No direct pushes for feature work.
- Work happens on short-lived branches cut from `main`:

| Prefix | Use | Example |
|---|---|---|
| `feature/` | new backlog item or capability | `feature/test-infrastructure` |
| `fix/` | bug fix | `fix/status-bar-overlap` |
| `security/` | security hardening | `security/hardening` |
| `docs/` | documentation only | `docs/m2-report` |

- Every branch merges through a **pull request** with ≥ 1 teammate approval and green CI.
- Database changes are always a **new** migration file; applied migrations are never edited.

## Commit messages
[Conventional Commits](https://www.conventionalcommits.org/): `type(scope): summary` in the imperative, ≤ 72 chars, body explains *why*.

Types: `feat`, `fix`, `test`, `docs`, `build`, `ci`, `refactor`, `chore`. Security fixes use `fix(security): …`. Reference backlog ids (`BC-08`) or security ids (`SEC-1`) in the subject or body.

```
fix(security): SEC-1 presence enumeration, SEC-2 request authz, SEC-3 input limits

- SEC-1 (A01): visible pins/profiles readable only by people pinned at the same venue
...
```

AI assistance: commits produced with an AI pair-programmer carry a `Co-Authored-By:` trailer naming the model, so the history discloses it.

## Pull requests and code review
1. Open the PR early; fill in the template (what/why, how tested, checklist from [`QA-PLAN.md`](QA-PLAN.md)).
2. CI must be green (typecheck, lint, unit tests, coverage thresholds).
3. A teammate reviews: correctness, privacy (is the rule enforced in the DB?), tests, readability. Comments are resolved or answered before merge.
4. The author merges after approval (merge commit, so the review stays attached to the history).

## Releases and tags
- Semantic versions on `main`: `v0.1.0` = Milestone 1, `v0.2.0` = Milestone 2; milestones are additionally tagged `milestone-N`.
- Each release gets a [`CHANGELOG.md`](../CHANGELOG.md) section and a GitHub Release.
