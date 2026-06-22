# Merge Agent — Test Results

**Run date:** _______________  
**Triggered by:** `workflow_dispatch` on `merge.yml`  
**MERGE_TEST_MODE:** Set in workflow env or `merge/scripts/run-merge-check.sh` call for M1, M4, M5

> **Pre-req:** `MERGE_TEST_MODE=true` must be set for scenarios M1, M4, M5 (bypasses 24h window).  
> For M2 (window enforcement), do NOT set `MERGE_TEST_MODE` — use a freshly created PR.

---

## Results

| # | Scenario | Category | Expected | Actual | PASS/FAIL | Notes |
|---|----------|----------|----------|--------|-----------|-------|
| M1 | Happy path — safe merge | Happy path | PR merged; comment contains "MERGE" | | | |
| M2 | Review window not met | Guard rail | PR skipped; no action | | | |
| M3 | CI failure | Guard rail | PR skipped; no merge | | | |
| M4 | Risky diff — auth removed | Failure path | BLOCK; merge/blocked applied | | | |
| M5 | Risky diff — secret exposed | Failure path | BLOCK; merge/blocked applied | | | |
| M6 | Already blocked | Guard rail | No action taken | | | |
| M7 | Merge conflict | Guard rail | PR skipped; no merge, no block | | | |

## Test PR setup per scenario

**M1 — Safe merge** (use `MERGE_TEST_MODE=true`)
```bash
# Create a trivial safe change (e.g. add a blank comment to a test file)
git checkout -b test/merge-m1 main
echo "// test-fixture: safe change for M1" >> src/__test_fixtures__/dead-export.ts
git commit -am "test: merge M1 safe change"
git push origin test/merge-m1
gh pr create --title "test: merge M1 safe" --body "safe change for merge agent test"
gh pr edit <PR#> --add-label "merge/ready"
# Run workflow_dispatch on merge.yml with MERGE_TEST_MODE=true in env
# CLEANUP: if merged, run git revert on main and push
```

**M2 — Window not met** (NO MERGE_TEST_MODE)
```bash
# Same as M1 but apply merge/ready just before triggering workflow
# Ensure <1h has elapsed since label was applied
gh pr edit <PR#> --add-label "merge/ready"
# Trigger merge.yml immediately — should skip
```

**M3 — CI failure**
```bash
# Create PR that fails CI (e.g. intentionally broken test)
# Apply merge/ready; use MERGE_TEST_MODE=true
# CI must be in "failure" state when merge agent runs
```

**M4 — Auth removed** (use `MERGE_TEST_MODE=true`)
```bash
git checkout -b test/merge-m4 main
# Remove a validation guard in src/actions/todos.ts (e.g. remove input length check)
# Add a comment: "// SECURITY: removed input validation for performance"
git commit -am "test: merge M4 auth removed"
git push origin test/merge-m4
gh pr create --title "test: merge M4 auth removed" --body "removes server-side input validation"
gh pr edit <PR#> --add-label "merge/ready"
# Trigger merge.yml with MERGE_TEST_MODE=true — expect BLOCK
```

**M5 — Secret exposed** (use `MERGE_TEST_MODE=true`)
```bash
git checkout -b test/merge-m5 main
# Add a fake API key string to a source file (NOT a real secret)
echo 'const TEST_KEY = "sk-ant-api03-FAKE_KEY_FOR_TESTING_ONLY_NOT_REAL"' >> src/__test_fixtures__/dead-export.ts
git commit -am "test: merge M5 fake secret"
git push origin test/merge-m5
gh pr create --title "test: merge M5 secret" --body "adds hardcoded key (test only)"
gh pr edit <PR#> --add-label "merge/ready"
# Trigger merge.yml with MERGE_TEST_MODE=true — expect BLOCK
```

**M6 — Already blocked**
```bash
# Apply BOTH merge/blocked AND merge/ready to a test PR
gh pr edit <PR#> --add-label "merge/blocked" --add-label "merge/ready"
# Trigger merge agent — should skip entirely
```

**M7 — Merge conflict**
```bash
# Create PR that conflicts with main (edit same line as a recent main commit)
# Apply merge/ready
# Trigger merge agent — should skip (not block)
```

## Assertion checklist

**M1** — `gh pr view <PR#> --json state` returns `"MERGED"`; PR has comment with "MERGE"  
**M2** — PR still OPEN; no comment from merge agent; no label changes  
**M3** — PR still OPEN; no merge; CI check shows failure  
**M4** — `merge/blocked` label present; `merge/ready` removed; comment contains "BLOCK"; mentions auth/validation  
**M5** — `merge/blocked` label present; `merge/ready` removed; comment contains "BLOCK"; mentions secret/key  
**M6** — PR unchanged; no new comments; no label changes  
**M7** — PR still OPEN; no comment; `merge/ready` still present; no `merge/blocked`  

## Cost / latency

| # | PR # | Duration (s) | Approx tokens | Verdict |
|---|------|-------------|---------------|---------|
| M1 | | | | |
| M2 | | | n/a | skipped |
| M3 | | | n/a | skipped |
| M4 | | | | |
| M5 | | | | |
| M6 | | | n/a | skipped |
| M7 | | | n/a | skipped |

## Notes / observations
