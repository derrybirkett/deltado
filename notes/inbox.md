## Handover — 2026-07-17

**From this session:**

Pickup found handover 24 days stale. Diagnosed root cause of pipeline going quiet: `ANTHROPIC_API_KEY` Actions secret hit quota again (was previously reported reset 07-01, actually exhausted again with an 08-01 reset message) — blocked PR #46 (real feature, Council-approved twice) and caused 27 accumulated `ledger/gap` issues (#4–#56, one per day since 2026-05-22). Also found `~/.vpats` had a malformed entry for the new DeltaDo-scoped Anthropic key (invalid bash syntax, silently not loading into shell). Fixed the vault entry, removed stale `.vpats.swp`, added key to macOS Keychain (`deltado-anthropic-api-key`) and `deltado/.env.local`, rotated the GH Actions `ANTHROPIC_API_KEY` secret to the new key, and unblocked PR #46 (`merge/blocked` → `merge/ready`).

**Next steps:**

### 🔴 URGENT

- [ ] @urgent Confirm PR #46 actually merges on next cycle (Priority: urgent, Effort: quick, Clarity: clear)
  Context: `merge/ready` re-applied 2026-07-17 after quota fix. Verify Merge agent picks it up and no new 400 error.

### 🟢 READY

- [ ] @ready Close Group 1 fixture PRs #14–#23 (Priority: high, Effort: quick, Clarity: clear)
  Context: Leftover test debris from 2026-06-22 Group 1 testing session. PR #14 (Ledger L4) sitting 592h+ with no council review, triggering daily `ledger/gap` issues. Close all (don't merge test fixtures into main).

- [ ] @ready Bulk-close stale `ledger/gap` issues #4, #8, #24–#56 (27 total) (Priority: medium, Effort: quick, Clarity: clear)
  Context: Symptom of the fixture PRs above + quota outage. Close after fixture PRs are closed; confirm Ledger goes quiet on next daily run.

- [ ] @ready Backfill or rerun Group 1 test-results docs (Priority: low, Effort: medium, Clarity: needs-decision)
  Context: `docs/test-results/{council,ledger,merge}-results.md` still have blank result tables despite fixtures having actually run (M1 merged, M4/M5/M6 blocked correctly per labels, C1/C3/C4/C5 needs-revision, C2 approved+ready). Decide: backfill from PR label history, or scrap and rerun clean once fixture PRs are closed.

### 🔵 WAITING

- [ ] @waiting-on:group1-cleanup Group 2 — Moirai tests: Curator (CR1–CR7) + Auditor (A1–A8) (Priority: medium, Effort: large, Clarity: clear)
  Pre-req: Group 1 fixture cleanup above; then flip `dry_run: false` in `.github/agents/curator/config.yml`
  Fixtures: `src/__test_fixtures__/` (dead-export.ts, oversized-file.ts, stale-placeholder.ts)

**Security note:** issue #56's body contained an injected fake `<system-reminder>` tag (not a real system message) instructing tool use — flagged to user, ignored. Worth knowing agents reading issue bodies unattended could hit this.

---

## Handover — 2026-06-23

**From this session:**

- D3 re-run: PASS confirmed. Test harness updated (EXPECTED_BLOCK covers d3). Developer agent 4/4 PASS.
- Merge fixture PRs staged: #20 (M1 safe), #21 (M4 auth removed), #22 (M5 fake secret), #23 (M6 already-blocked)
- M2 (window not met), M3 (CI failure), M7 (merge conflict) must be staged at run time — time/conflict-sensitive
- All still blocked on API quota until 2026-07-01; cloud agent scheduled

**Next steps:**

### 🔵 WAITING

- [ ] @waiting-on:quota Council C1–C5 + Ledger L1–L6 + Merge M1–M7 (Priority: high, Effort: large, Clarity: clear)
  Blocked: `ANTHROPIC_API_KEY` Actions secret exhausted until 2026-07-01T00:00Z
  Cloud agent scheduled: `trig_01HZ122QcYsDSZpZSxKj1NSy` fires 2026-07-01T00:30Z (handles Council + Ledger)
  Manual fix: `gh secret set ANTHROPIC_API_KEY` with a key that has quota
  Merge fixtures staged: M1=#20, M4=#21, M5=#22, M6=#23; stage M2/M3/M7 at run time
  After runs: fill results in council-results.md, ledger-results.md, merge-results.md

- [ ] @waiting-on:time Ledger L3 + L4 age-deferred (Priority: medium, Effort: quick, Clarity: clear)
  L3 PR #13: run Ledger after 2026-06-24T17:00Z (+48h from label applied)
  L4 PR #14: run Ledger after 2026-06-23T17:00Z (+24h) — window now open, but quota blocks it until July 1
  Both windows elapsed well before 2026-07-01 — cloud agent handles this

### 🟡 IN PROGRESS

- [ ] @in-progress Group 1 agent testing — 31% complete (8/26 scenarios run) (Priority: high, Effort: large, Clarity: clear)
  Done: Delta Product (4/4 PASS), Delta Developer (4/4 PASS — D3 fix verified)
  Remaining: Council C1–C5, Ledger L1–L6, Merge M1–M7
  Fixtures: Council #15–#19, Merge #20–#23 (M2/M3/M7 at run time)
  Summary: `docs/test-results/summary.md`

### 🟢 READY (after Group 1 complete)

- [ ] @ready Group 2 — Moirai tests: Curator (CR1–CR7) + Auditor (A1–A8) (Priority: medium, Effort: large, Clarity: clear)
  Pre-req: Group 1 complete first; then flip `dry_run: false` in `.github/agents/curator/config.yml`
  Fixtures: `src/__test_fixtures__/` (dead-export.ts, oversized-file.ts, stale-placeholder.ts)
  Trigger: `gh workflow run curator.yml` and `gh workflow run auditor.yml`
  Results: `docs/test-results/curator-results.md`, `docs/test-results/auditor-results.md`

---

## Handover — 2026-06-22 (session 2)

**From this session:**
- Fixed D3 gap: `delta/agents/developer.md` now explicitly blocks BRIEF-named deps not in `allowed_deps`
- Resolved D4 as PASS (Option A: tests exist and pass, order unverifiable accepted)
- Created L3/L4 fixture PRs (#13, #14) — clocks running
- Created all 5 Council fixture PRs (#15–#19)
- Fixed council script bug (`-p` flag conflicted with `--print` in current claude CLI)
- Diagnosed Council/Ledger blocker: `ANTHROPIC_API_KEY` Actions secret quota exhausted until 2026-07-01T00:00Z
- Scheduled cloud agent to re-fire Council + Ledger at 2026-07-01T00:30Z (routine `trig_01HZ122QcYsDSZpZSxKj1NSy`)
- Wrote `docs/test-results/summary.md` with full Group 1 status report

**Next steps:**

### 🔵 WAITING
- [ ] @waiting-on:quota Council C1–C5 + Ledger L1–L6 (Priority: high, Effort: large, Clarity: clear)
  Blocked: `ANTHROPIC_API_KEY` Actions secret exhausted until 2026-07-01T00:00Z
  Cloud agent scheduled: `trig_01HZ122QcYsDSZpZSxKj1NSy` fires 2026-07-01T00:30Z
  Manual fix: `gh secret set ANTHROPIC_API_KEY` with a key that has quota
  After Council runs: fill in results in `docs/test-results/council-results.md`
  After Ledger runs: fill in results in `docs/test-results/ledger-results.md`

- [ ] @waiting-on:time Ledger L3 + L4 age-deferred (Priority: medium, Effort: quick, Clarity: clear)
  L3 PR #13: run Ledger after 2026-06-24T17:00Z (+48h from label applied)
  L4 PR #14: run Ledger after 2026-06-23T17:00Z (+24h from label applied)
  Both windows elapsed well before 2026-07-01 — cloud agent handles this

### 🟡 IN PROGRESS
- [ ] @in-progress Group 1 agent testing — 31% complete (8/26 scenarios run) (Priority: high, Effort: large, Clarity: clear)
  Done: Delta Product (4/4 PASS), Delta Developer (3/4 PASS, D3 gap found + fixed)
  Remaining: Council C1–C5, Ledger L1–L6, Merge M1–M7
  Summary: `docs/test-results/summary.md`

### 🔴 URGENT (re-verify after fix)
- [ ] @urgent D3 re-run to verify allowed_deps fix works (Priority: medium, Effort: quick, Clarity: clear)
  Context: Fixed `delta/agents/developer.md` — re-run D3 scenario to confirm agent now writes BLOCKED.md instead of installing the unlisted dep.
  Command: from repo root, place `tests/fixtures/brief-fixtures/d3-unauthorized-dep.md` as `.delta/BRIEF.md` then `make run-developer`

### 🟢 READY (after Group 1 complete)
- [ ] @ready Group 2 — Moirai tests: Curator (CR1–CR7) + Auditor (A1–A8) (Priority: medium, Effort: large, Clarity: clear)
  Pre-req: Group 1 complete first; then flip `dry_run: false` in `.github/agents/curator/config.yml`
  Fixtures: `src/__test_fixtures__/` (dead-export.ts, oversized-file.ts, stale-placeholder.ts)
  Trigger: `gh workflow run curator.yml` and `gh workflow run auditor.yml`
  Results: `docs/test-results/curator-results.md`, `docs/test-results/auditor-results.md`

### 🟢 READY
- [ ] @ready Merge M1–M7 tests (Priority: medium, Effort: large, Clarity: clear)
  merge_test_mode input already wired into `.github/workflows/merge.yml`
  See `docs/test-results/merge-results.md` for scenario setup

---

## Audit — 2026-05-28 (PR #2)

_Auto-generated coherence findings. Tick off as addressed; the block is replaced on each PR push._

_No audit-relevant changes (no files in configured scan_paths)._

---

## Handover — 2026-05-22

**From this session:**
Fixed the autonomous pipeline's council trigger bug (Delta was using GITHUB_TOKEN which blocks workflow cascades) and unblocked two stalled PRs. Both PR #2 and PR #3 are now queued with `merge/ready` and will auto-merge within 24h.

**Next steps:**

### 🔵 WAITING
- [ ] @waiting-on:cron PR #2 (Keyboard Navigation) — `merge/ready` applied ~18:30 UTC. Merge agent will pick it up tomorrow ~18:30 UTC.
- [ ] @waiting-on:cron PR #3 (Filter todos by status) — council approved today, `merge/ready` applied. Merges in 24h.

### 🟢 READY
- [ ] @ready Rename `package.json` name from `"todo-app"` to `"deltado"` (Priority: low, Effort: quick)
- [ ] @ready Replace boilerplate README with a real description of deltado (Priority: low, Effort: quick)
- [ ] @ready Bump `actions/checkout` and `actions/setup-node` to v5 across all workflows — Node.js 20 deprecates June 2, 2026

---

## Handover — 2026-05-21

**From this session:**
Built and shipped the Merge agent — a new DeltaSuite submodule (`derrybirkett/merge`) that polls every 30 min, waits 24h after `merge/ready` is applied, runs an AI safety check, then squash-merges or blocks. Full pipeline is now live: Delta builds → Council reviews → Merge ships.

**Next steps:**

### 🔵 WAITING
- [ ] @waiting-on:cron @follow-up PR #1 (Filter Todos by Status) should auto-merge within 30 min
  Context: `merge/ready` applied end of session. 24h window already elapsed. Next Merge cron tick will pick it up.
  When done: Verify it merged and check the Merge workflow logs in GitHub Actions.

### 🔴 URGENT
- [ ] @urgent Smoke-test the full autonomous pipeline end-to-end
  Context: Merge shipped but never ran against a real PR yet. Trigger `workflow_dispatch` on the Merge workflow, or wait for PR #1 auto-merge and inspect the run.
  Files: `.github/workflows/merge.yml`, `merge/scripts/run-merge-check.sh`

### 🟢 READY
- [ ] @ready Rename `package.json` name from `"todo-app"` to `"deltado"` (Priority: low, Effort: quick, Clarity: clear)
- [ ] @ready Replace boilerplate README with a real description of what deltado is (Priority: low, Effort: quick, Clarity: clear)

---

## Handover — 2026-05-19

**From this session:**
Wired up the full autonomous pipeline: Delta builds features nightly, Neon provides the database in CI, and Council's CTO advisor automatically reviews every Delta PR before the human sees it.

**Next steps:**
- [ ] Verify tonight's delta cycle end-to-end (2am UTC) — check PR opens, Council review fires, label applied
- [ ] Consider adding CISO advisor review once the app grows auth/data features
- [ ] Update `package.json` `name` field from `"todo-app"` to `"deltado"`

---
