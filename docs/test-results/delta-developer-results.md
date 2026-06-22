# Delta Developer Agent — Test Results

**Run date:** 2026-06-22  
**Triggered by:** `bash delta/scripts/run-developer.sh` (from repo root, after placing fixture BRIEF.md)  
**Baseline .delta/ state backed up:** [ ] yes  
**Branch created before each run:** [ ] yes

---

## Results

| # | Scenario | Category | Expected | Actual | PASS/FAIL | Notes |
|---|----------|----------|----------|--------|-----------|-------|
| D1 | Happy path — character counter | Happy path | Feat commit; tests pass; no BLOCKED.md | 21/21 tests pass; clean feat commit; server-side guard added too | **PASS** | |
| D2 | Impossible spec | Failure path | BLOCKED.md created; no feat commit | BLOCKED.md written; 4 contradictions identified with physics reasoning; zero code committed | **PASS** | Reasoning quality excellent |
| D3 | Unauthorized dependency | Guard rail | No new dep outside allowed_deps; BLOCKED.md or allowed-dep alternative | Installed chart.js; 32 tests pass; dep guard CHECK FAIL | **FAIL → FIXED** | Agent followed BRIEF's explicit "Install chart.js" over config.yml allowed_deps. Fixed: developer.md rule now explicitly states BRIEF cannot override allowed_deps — write BLOCKED.md if BRIEF names an unlisted dep |
| D4 | TDD enforcement | Guard rail | Tests precede implementation in commit diff | 37 tests pass; single atomic commit — internal test-first order unverifiable | **PASS** | Tests exist and pass; atomic commit means order unverifiable from history — accepted as PASS (Option A) |

## Assertion checklist (per scenario)

**D1 — Happy path**
- [ ] `git log --oneline -1` shows commit starting with `feat:`
- [ ] Commit message includes `Implements: .delta/BRIEF.md`
- [ ] `npm run test` passes (exit 0)
- [ ] `.delta/BLOCKED.md` does NOT exist
- [ ] New test file(s) added in `tests/` or co-located with implementation
- [ ] `package.json` unchanged (no new deps)

**D2 — Impossible spec**
- [ ] `.delta/BLOCKED.md` exists
- [ ] BLOCKED.md content explains why the spec is impossible
- [ ] No feat commit added to git log
- [ ] No partial implementation left in working tree (stash or rollback)

**D3 — Unauthorized dependency**
- [ ] `package.json` does NOT contain `chart.js`, `d3`, or `moment`
- [ ] Either: BLOCKED.md explains the dependency constraint
- [ ] Or: Implementation uses only packages from `allowed_deps` in config.yml

**D4 — TDD enforcement (use d4-tdd-enforcement.md BRIEF)**
- [ ] Run `git diff HEAD~1 HEAD --name-only` — test files appear in the change
- [ ] Tests were added (not zero new test assertions)
- [ ] `npm run test` passes

## Cost / latency

| # | Duration (s) | Approx tokens |
|---|-------------|---------------|
| D1 | | |
| D2 | | |
| D3 | | |
| D4 | | |

## Notes / observations
