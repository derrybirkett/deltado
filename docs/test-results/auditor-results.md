# Auditor Agent — Test Results

**Run date:** _______________  
**Triggered by:** `workflow_dispatch` on `auditor.yml`  
**Baseline issue count before Group 2:** _______________

> **Pre-req:** Confirm `.auditor-pause` does NOT exist before starting.  
> Auditor runs in schedule mode (no `PR_NUMBER` override) — it enumerates all open PRs.  
> Keep only test PRs open during each test run for clean assertions.

---

## Results

| # | Scenario | Category | Expected | Actual | PASS/FAIL | Notes |
|---|----------|----------|----------|--------|-----------|-------|
| A1 | No open PRs | Edge case | Silent exit; no issues | | | |
| A2 | Broken internal link | Happy path | Issue: `auditor:link-integrity` | | | |
| A3 | Orphaned component | Happy path | Issue: `auditor:orphans` | | | |
| A4 | Copy drift | Happy path | Issue: `auditor:copy-drift` | | | |
| A5 | Wontfix respected | Guard rail | No duplicate for wontfix finding | | | |
| A6 | Dedup | Guard rail | Second run files no duplicate | | | |
| A7 | Kill switch | Guard rail | Exit immediately; zero new issues | | | |
| A8 | max_findings_per_pr cap | Guard rail | Issues ≤ 8 per PR | | | |

## Test PR setup per scenario

**A1 — No open PRs**
```bash
# Close all open PRs, then trigger auditor
# Assert: no new issues with auditor label
```

**A2 — Broken internal link**
```bash
git checkout -b test/auditor-a2 main
mkdir -p docs/test-fixtures
cat > docs/test-fixtures/a2-broken-link.md << 'EOF'
# Test Fixture A2

This document has [a broken link](./nonexistent-page.md) that points nowhere.
It also links to [another missing file](../missing-section/index.md).
EOF
git add docs/test-fixtures/a2-broken-link.md
git commit -m "test: auditor A2 broken links"
git push origin test/auditor-a2
gh pr create --title "test: auditor A2 broken links" --body "fixture for link_integrity test"
# Trigger auditor.yml workflow_dispatch
# Assert: issue with auditor:link-integrity label
```

**A3 — Orphaned component**
```bash
git checkout -b test/auditor-a3 main
cat > src/components/OrphanedTestWidget.tsx << 'EOF'
// TEST FIXTURE A3: This component is not imported anywhere
export function OrphanedTestWidget() {
  return <div>I am an orphan</div>
}
EOF
git add src/components/OrphanedTestWidget.tsx
git commit -m "test: auditor A3 orphaned component"
git push origin test/auditor-a3
gh pr create --title "test: auditor A3 orphaned component" --body "fixture for orphans test"
# Trigger auditor — Assert: issue with auditor:orphans
```

**A4 — Copy drift**
```bash
git checkout -b test/auditor-a4 main
cat > docs/test-fixtures/a4-copy-drift.md << 'EOF'
# Test Fixture A4

This page refers to our **Analytics Dashboard** feature, which provides real-time insights
into your team's productivity. Visit the dashboard at /dashboard to see your metrics.

It also mentions the **Team Sharing** panel where you can invite colleagues to collaborate
on todo lists and share filtered views with the rest of your organization.
EOF
# Note: deltado has no /dashboard, no team sharing, no analytics — all stale references
git add docs/test-fixtures/a4-copy-drift.md
git commit -m "test: auditor A4 copy drift"
git push origin test/auditor-a4
gh pr create --title "test: auditor A4 copy drift" --body "fixture for copy_drift test"
# Trigger auditor — Assert: issue with auditor:copy-drift
```

**A5 — Wontfix**
```bash
# 1. Run A2 to get a link_integrity issue filed
# 2. Add label auditor:wontfix to that issue
# 3. Keep the A2 PR open and trigger auditor again
# Assert: no second issue for same finding
```

**A6 — Dedup**
```bash
# 1. Run A2 (no wontfix label)
# 2. Trigger auditor again with the A2 PR still open
# Assert: no second issue within dedup_window_days: 30
```

**A7 — Kill switch**
```bash
touch .auditor-pause
# Trigger: workflow_dispatch on auditor.yml
# Assert: zero new issues; log shows "paused"
rm .auditor-pause
```

**A8 — max_findings_per_pr cap**
```bash
git checkout -b test/auditor-a8 main
# Create a markdown file with 10+ broken links
cat > docs/test-fixtures/a8-many-issues.md << 'EOF'
# Test Fixture A8

[Link 1](./missing-01.md) [Link 2](./missing-02.md) [Link 3](./missing-03.md)
[Link 4](./missing-04.md) [Link 5](./missing-05.md) [Link 6](./missing-06.md)
[Link 7](./missing-07.md) [Link 8](./missing-08.md) [Link 9](./missing-09.md)
[Link 10](./missing-10.md) [Link 11](./missing-11.md) [Link 12](./missing-12.md)
EOF
git add docs/test-fixtures/a8-many-issues.md
git commit -m "test: auditor A8 many issues"
git push origin test/auditor-a8
gh pr create --title "test: auditor A8 cap test" --body "fixture for max_findings_per_pr cap"
# Trigger auditor — Assert: issues filed for this PR ≤ 8
```

## Assertion checklist

**A1** — `gh issue list --label auditor` count unchanged; workflow exits cleanly  
**A2** — New issue with labels `auditor` + `cleanup` + `auditor:link-integrity`; title starts with `[auditor]`; body has Evidence citing file:line  
**A3** — New issue with `auditor:orphans`; body cites `OrphanedTestWidget.tsx`  
**A4** — New issue with `auditor:copy-drift`; body cites `a4-copy-drift.md` and the stale references  
**A5** — Issue count for link-integrity finding unchanged (still 1); wontfix issue unchanged  
**A6** — Issue count unchanged (still 1); no duplicate within dedup window  
**A7** — `gh issue list --label auditor` count unchanged; log shows "paused"  
**A8** — Count of issues referencing the A8 PR ≤ 8 (even though 12+ issues were seeded)  

## Cost / latency

| # | PR # | Duration (s) | Approx tokens | Issues filed |
|---|------|-------------|---------------|-------------|
| A1 | n/a | | | 0 |
| A2 | | | | 1 |
| A3 | | | | 1 |
| A4 | | | | 1 |
| A5 | | | | 0 |
| A6 | | | | 0 |
| A7 | n/a | | | 0 |
| A8 | | | | ≤8 |

## Cleanup after Group 2

- [ ] Close test PRs: A2, A3, A4, A8
- [ ] Delete test branches: test/auditor-a2, a3, a4, a8
- [ ] Delete docs/test-fixtures/ (created during tests)
- [ ] Delete src/components/OrphanedTestWidget.tsx
- [ ] Close all Auditor test issues (or leave for reference)
- [ ] Remove .auditor-pause if created

## Notes / observations
