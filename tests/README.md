# Agent Test Suite

Two groups of tests covering all 7 agents in Deltado.

- **Group 1 — Makersuite:** Delta Product, Delta Developer, Council, Ledger, Merge
- **Group 2 — Moirai:** Curator, Auditor

Record results in `docs/test-results/<agent>-results.md`. Fill in `docs/test-results/summary.md` when done.

---

## Pre-flight (both groups)

```bash
# Confirm clean state
git status                          # must be clean
gh pr list --label delta            # note any open delta PRs
gh issue list --label ledger/gap    # baseline count
```

Back up delta state before Group 1:
```bash
cp .delta/BACKLOG.md .delta/BACKLOG.md.bak
cp .delta/BRIEF.md   .delta/BRIEF.md.bak   2>/dev/null || true
```

---

## Group 1 — Makersuite

### Delta Product (P1–P4)

Uses `tests/run-delta-test.sh`. Run from repo root. Each run backs up `.delta/` and restores on exit.

```bash
# Run each scenario — record results in docs/test-results/delta-product-results.md
tests/run-delta-test.sh product p1   # happy path: 3+ Ready items
tests/run-delta-test.sh product p2   # edge: 1 Ready item → should generate ideas
tests/run-delta-test.sh product p3   # guard: avoid-list item at top of Ready
tests/run-delta-test.sh product p4   # edge: In Progress item already present
```

### Delta Developer (D1–D4)

Uses `tests/run-delta-test.sh`. **Each scenario makes a real git commit on the current branch — run on a throwaway test branch.**

```bash
git checkout -b test/developer-scenarios main

tests/run-delta-test.sh developer d1   # happy path: character counter
tests/run-delta-test.sh developer d2   # failure: impossible spec → BLOCKED.md
tests/run-delta-test.sh developer d3   # guard: unauthorized dep (chart.js)
tests/run-delta-test.sh developer d4   # guard: TDD enforcement (empty-state feature)

# Clean up test branch when done
git checkout main
git branch -D test/developer-scenarios
```

Record results in `docs/test-results/delta-developer-results.md`.

### Council (C1–C5)

Each scenario requires a test PR. Use `workflow_dispatch` on [council-review.yml](../.github/workflows/council-review.yml).

```bash
# Create test branch for each scenario, make the seeded change, push, open PR
# See docs/test-results/council-results.md for setup details per scenario

# After PR is open, trigger Council:
gh workflow run council-review.yml -f pr_number=<PR#>
```

Scenarios and seeded changes:
- **C1** — Clean code + tests + matches BRIEF → Approved
- **C2** — Implementation only, no test files → Revise
- **C3** — Direct `prisma.todo.findMany()` inside a React component (bypasses `src/actions/`) → Revise
- **C4** — String with `process.env.SECRET` concatenated into a query → Revise/Reject
- **C5** — Implements BRIEF feature PLUS refactors unrelated utility functions → Revise

Record results in `docs/test-results/council-results.md`.

### Ledger (L1–L6)

Trigger via `workflow_dispatch` on [ledger.yml](../.github/workflows/ledger.yml). L3 and L4 are age-deferred.

```bash
gh workflow run ledger.yml    # triggers gap detection run
gh issue list --label "ledger/gap" --state open   # assert after run
```

| Scenario | State to set up before triggering | Age-deferred? |
|----------|----------------------------------|--------------|
| L1 | No open delta PRs; clean labels | No |
| L2 | PR with `council/approved` but NO `merge/ready` or `merge/blocked` | No |
| L3 | PR with `merge/ready` applied >48h ago | **Yes — run after 48h** |
| L4 | delta-labeled PR open >24h with no council review labels | **Yes — run after 24h** |
| L5 | Combine L2 + L3 conditions simultaneously | Depends on L3 |
| L6 | PR with both `merge/ready` AND `merge/blocked` | No |

Record results in `docs/test-results/ledger-results.md`.

### Merge (M1–M7)

Trigger via `workflow_dispatch` on [merge.yml](../.github/workflows/merge.yml).

`MERGE_TEST_MODE=true` is required for M1, M4, M5 to bypass the 24h review window. Pass it as an env var override when triggering locally, or add it to the workflow inputs temporarily.

For **local script testing** (faster iteration):
```bash
MERGE_TEST_MODE=true bash merge/scripts/run-merge-check.sh
```

For **M2** (window enforcement test), do NOT set `MERGE_TEST_MODE` — create a fresh PR with `merge/ready` just applied and trigger immediately.

**Cleanup after M1** (merged PR): revert the change on main.
```bash
git revert HEAD --no-edit
git push
```

Record results in `docs/test-results/merge-results.md`.

---

## Group 2 — Moirai

Run after Group 2 pre-flight:
```bash
# Confirm .auditor-pause does NOT exist
ls .auditor-pause 2>/dev/null && echo "REMOVE .auditor-pause FIRST" || echo "OK"

# Note baseline issue count
gh issue list --label "curator" --state open | wc -l
gh issue list --label "auditor" --state open | wc -l
```

### Curator (CR1–CR7)

Trigger via `workflow_dispatch` on [curator.yml](../.github/workflows/curator.yml).

**Important:** Flip `dry_run: false` in [.github/agents/curator/config.yml](../.github/agents/curator/config.yml) before running CR1–CR3, CR5, CR6. Restore `dry_run: true` after all Curator tests.

Fixtures are already in `src/__test_fixtures__/`:
- `dead-export.ts` → CR1
- `oversized-file.ts` → CR2
- `stale-placeholder.ts` → CR3

```bash
# Flip dry_run: false, then:
gh workflow run curator.yml

# Assert:
gh issue list --label "curator:dead-exports"
gh issue list --label "curator:oversized-files"
gh issue list --label "curator:stale-placeholders"
```

See `docs/test-results/curator-results.md` for per-scenario setup.

### Auditor (A1–A8)

Trigger via `workflow_dispatch` on [auditor.yml](../.github/workflows/auditor.yml).

Each scenario requires a test PR with seeded content. See `docs/test-results/auditor-results.md` for PR creation commands per scenario.

```bash
gh workflow run auditor.yml

# Assert:
gh issue list --label "auditor" --state open
```

---

## Cleanup

After all tests:

**Makersuite**
```bash
# Close Council test PRs
gh pr close test/council-c1 test/council-c2 ...
# Close Ledger fixture PRs
gh pr close test/ledger-l2 test/ledger-l3 test/ledger-l4 test/ledger-l5 test/ledger-l6
# Close Merge fixture PRs (that weren't merged)
gh pr close test/merge-m2 test/merge-m3 test/merge-m4 test/merge-m5 test/merge-m6 test/merge-m7
# Restore delta state
cp .delta/BACKLOG.md.bak .delta/BACKLOG.md
```

**Moirai**
```bash
# Delete src fixture files
rm -rf src/__test_fixtures__/
# Restore curator dry_run
# Edit .github/agents/curator/config.yml: dry_run: true
# Remove auditor test PR fixture files from docs/test-fixtures/
rm -rf docs/test-fixtures/
# Close test PRs
gh pr close test/auditor-a2 test/auditor-a3 test/auditor-a4 test/auditor-a8
# Restore .auditor-pause state if it was there before tests
```

---

## File index

| What | Where |
|------|-------|
| Backlog fixtures (P1–P4) | `tests/fixtures/backlog-fixtures/` |
| Brief fixtures (D1–D4) | `tests/fixtures/brief-fixtures/` |
| Curator src fixtures (CR1–CR3) | `src/__test_fixtures__/` |
| Delta test runner | `tests/run-delta-test.sh` |
| Results: Delta Product | `docs/test-results/delta-product-results.md` |
| Results: Delta Developer | `docs/test-results/delta-developer-results.md` |
| Results: Council | `docs/test-results/council-results.md` |
| Results: Ledger | `docs/test-results/ledger-results.md` |
| Results: Merge | `docs/test-results/merge-results.md` |
| Results: Curator | `docs/test-results/curator-results.md` |
| Results: Auditor | `docs/test-results/auditor-results.md` |
| Summary | `docs/test-results/summary.md` |
