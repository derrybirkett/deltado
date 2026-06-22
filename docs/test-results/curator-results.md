# Curator Agent — Test Results

**Run date:** _______________  
**Triggered by:** `workflow_dispatch` on `curator.yml`  
**Curator dry_run setting at test time:** _______________  
**Baseline issue count before Group 2:** _______________

> **Pre-req:** Set `dry_run: false` in `.github/agents/curator/config.yml` before running CR1–CR3, CR5, CR6.  
> For CR4, set `dry_run: true`. Restore original `dry_run: true` after all Curator tests complete.

---

## Results

| # | Scenario | Category | dry_run | Expected | Actual | PASS/FAIL | Notes |
|---|----------|----------|---------|----------|--------|-----------|-------|
| CR1 | Dead export detected | Happy path | false | Issue filed: `curator:dead-exports` | | | |
| CR2 | Oversized file detected | Happy path | false | Issue filed: `curator:oversized-files` | | | |
| CR3 | Stale placeholder detected | Happy path | false | Issue filed: `curator:stale-placeholders` | | | |
| CR4 | Dry-run mode | Guard rail | true | No issue filed; finding in workflow summary | | | |
| CR5 | Wontfix respected | Guard rail | false | No duplicate issue filed | | | |
| CR6 | Dedup — no duplicate | Guard rail | false | Second run files no duplicate | | | |
| CR7 | Kill switch | Guard rail | n/a | Exit immediately; zero new issues | | | |

## Fixture file locations

All fixture files are in `src/__test_fixtures__/`:
- **CR1:** `dead-export.ts` — has `unusedTestExport` and `unusedTestHelper`
- **CR2:** `oversized-file.ts` — 402 lines (threshold: 400)
- **CR3:** `stale-placeholder.ts` — contains TODO/FIXME/HACK/lorem ipsum

## Setup per scenario

**CR1 — Dead export** (dry_run: false)
```bash
# Fixture already exists: src/__test_fixtures__/dead-export.ts
# Trigger: workflow_dispatch on curator.yml
# Assert: gh issue list --label "curator:dead-exports" shows new issue
```

**CR2 — Oversized file** (dry_run: false)
```bash
# Fixture already exists: src/__test_fixtures__/oversized-file.ts (402 lines)
# Trigger: workflow_dispatch on curator.yml
# Assert: gh issue list --label "curator:oversized-files" shows new issue
```

**CR3 — Stale placeholder** (dry_run: false)
```bash
# Fixture already exists: src/__test_fixtures__/stale-placeholder.ts
# Trigger: workflow_dispatch on curator.yml
# Assert: gh issue list --label "curator:stale-placeholders" shows new issue
```

**CR4 — Dry run** (dry_run: true)
```bash
# Set dry_run: true in .github/agents/curator/config.yml
# Trigger: workflow_dispatch on curator.yml
# Assert: zero new issues; check Actions run summary for findings output
```

**CR5 — Wontfix**
```bash
# 1. Run CR1 to get the dead-export issue filed
# 2. Add label curator:wontfix to that issue
# 3. Trigger curator again (dry_run: false)
# Assert: no second issue for the same finding; total dead-export issues still = 1
```

**CR6 — Dedup**
```bash
# 1. Run CR1 to get the dead-export issue filed (no wontfix label)
# 2. Trigger curator again immediately (within dedup_window_days: 30)
# Assert: no second issue; total dead-export issues still = 1
```

**CR7 — Kill switch**
```bash
touch .curator-pause
# Trigger: workflow_dispatch on curator.yml
# Assert: no new issues; workflow log shows "paused" exit
rm .curator-pause
```

## Assertion checklist

**CR1** — Issue with labels `curator` + `cleanup` + `curator:dead-exports`; title contains `[curator]`; body has Evidence section citing `src/__test_fixtures__/dead-export.ts`  
**CR2** — Issue with `curator:oversized-files`; body cites `src/__test_fixtures__/oversized-file.ts`; mentions line count  
**CR3** — Issue with `curator:stale-placeholders`; body cites `src/__test_fixtures__/stale-placeholder.ts`  
**CR4** — `gh issue list --label curator` count unchanged; Actions run summary shows finding text  
**CR5** — `gh issue list --label "curator:dead-exports"` count unchanged (still 1); wontfix issue still has wontfix label  
**CR6** — `gh issue list --label "curator:dead-exports"` count unchanged (still 1)  
**CR7** — `gh issue list --label curator` count unchanged; workflow run log contains "paused" or equivalent  

## Cost / latency

| # | Duration (s) | Approx tokens | Issues filed |
|---|-------------|---------------|-------------|
| CR1 | | | 1 |
| CR2 | | | 1 |
| CR3 | | | 1 |
| CR4 | | | 0 |
| CR5 | | | 0 |
| CR6 | | | 0 |
| CR7 | | | 0 |

## Cleanup after Group 2

- [ ] Delete `src/__test_fixtures__/dead-export.ts`
- [ ] Delete `src/__test_fixtures__/oversized-file.ts`
- [ ] Delete `src/__test_fixtures__/stale-placeholder.ts`
- [ ] Close all Curator test issues (or leave open for reference — your call)
- [ ] Restore `dry_run: true` in `.github/agents/curator/config.yml`

## Notes / observations
