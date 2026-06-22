# Ledger Agent — Test Results

**Run date:** _______________  
**Triggered by:** `workflow_dispatch` on `ledger.yml`  
**Baseline issue count before Group 1:** _______________

> **Note:** L3 and L4 are age-deferred. Create the fixture PRs during test setup, then run Ledger again after the window expires.
> - L3: needs PR with `merge/ready` applied >48h ago
> - L4: needs delta-labeled PR open >24h with no council review labels

---

## Results

| # | Scenario | Category | Age-deferred? | Expected | Actual | PASS/FAIL | Notes |
|---|----------|----------|--------------|----------|--------|-----------|-------|
| L1 | No gaps — clean state | Happy path | No | Silent exit; no issue filed | | | |
| L2 | Gap: council/approved missing merge/ready | Gap detection | No | Issue with `ledger/gap`; gap type 4 | | | |
| L3 | Gap: merge window expired >48h | Gap detection | **Yes** | Issue with `ledger/gap`; gap type 3 | | | |
| L4 | Gap: council review overdue >24h | Gap detection | **Yes** | Issue with `ledger/gap`; gap type 5 | | | |
| L5 | Multiple gaps simultaneously | Edge case | Depends | One issue covering both gaps | | | |
| L6 | False positive guard — blocked PR | Guard rail | No | No issue filed | | | |

## Fixture PR setup

**L1 — Clean state**
```bash
# Ensure no open delta PRs, no label mismatches
# Run: workflow_dispatch on ledger.yml
# Assert: no new issue with ledger/gap label
```

**L2 — council/approved without merge/ready**
```bash
gh pr create --title "test: ledger L2" --body "ledger gap test" --label delta
# Apply council/approved label, do NOT apply merge/ready or merge/blocked
gh pr edit <PR#> --add-label "council/approved"
# Run: workflow_dispatch on ledger.yml
```

**L3 — merge window expired (deferred)**
```bash
# Create PR and apply merge/ready NOW
gh pr create --title "test: ledger L3" --body "ledger gap test" --label delta
gh pr edit <PR#> --add-label "merge/ready"
# Record timestamp: _______________
# Run ledger AFTER 48h have passed
```

**L4 — council review overdue (deferred)**
```bash
# Create PR with delta label NOW, do not add any council labels
gh pr create --title "test: ledger L4" --body "ledger gap test" --label delta
# Record timestamp: _______________
# Run ledger AFTER 24h have passed
```

**L5 — Multiple gaps**
```bash
# Combine L2 and L3 conditions simultaneously, then run ledger
```

**L6 — False positive guard**
```bash
# PR with BOTH merge/ready and merge/blocked
gh pr create --title "test: ledger L6" --body "ledger gap test" --label delta
gh pr edit <PR#> --add-label "merge/ready"
gh pr edit <PR#> --add-label "merge/blocked"
# Run ledger — should NOT file a gap issue for this PR
```

## Assertion checklist

**L1** — `gh issue list --label "ledger/gap" --state open` returns empty  
**L2** — New issue with `ledger/gap` label; body references "council/approved" and missing "merge/ready"  
**L3** — New issue with `ledger/gap`; body mentions time elapsed or overdue merge  
**L4** — New issue with `ledger/gap`; body mentions council review overdue  
**L5** — Exactly one new `ledger/gap` issue; body covers multiple gaps  
**L6** — No new `ledger/gap` issue created for the double-labeled PR  

## Deferred tests log

| Scenario | Fixture PR # | merge/ready applied at | Run ledger at | PASS/FAIL |
|----------|-------------|----------------------|---------------|-----------|
| L3 | #13 | 2026-06-22T17:00:18Z | after 2026-06-24T17:00:18Z (+48h) | |
| L4 | #14 | n/a (delta label applied 2026-06-22T17:00:35Z) | after 2026-06-23T17:00:35Z (+24h) | |

## Cost / latency

| # | Duration (s) | Approx tokens | Issue URL (if filed) |
|---|-------------|---------------|---------------------|
| L1 | | | n/a |
| L2 | | | |
| L3 | | | |
| L4 | | | |
| L5 | | | |
| L6 | | | n/a |

## Notes / observations
