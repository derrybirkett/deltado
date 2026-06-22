# Council (CTO Advisor) — Test Results

**Run date:** _______________  
**Triggered by:** `workflow_dispatch` on `council-review.yml` with `pr_number` input  
**Reference BRIEF:** `tests/fixtures/brief-fixtures/d1-character-counter.md` (used in all PR bodies unless noted)

---

## Results

| # | Scenario | Category | Expected verdict | Actual verdict | PASS/FAIL | Notes |
|---|----------|----------|-----------------|----------------|-----------|-------|
| C1 | Clean implementation | Happy path | Approved | | | |
| C2 | Missing tests | Failure path | Revise | | | |
| C3 | Architecture violation — Prisma in component | Failure path | Revise | | | |
| C4 | Security concern — unsanitized input | Failure path | Revise or Reject | | | |
| C5 | Out-of-scope implementation | Failure path | Revise | | | |

## Test PR setup (repeat per scenario)

```bash
# Create test branch and PR
git checkout -b test/council-<scenario> main
# ... make the appropriate code changes ...
git commit -m "test: council scenario <X>"
git push origin test/council-<scenario>
gh pr create --title "test: council <scenario>" \
  --body "$(cat tests/fixtures/brief-fixtures/d1-character-counter.md)" \
  --label delta
# Note the PR number, then trigger workflow_dispatch with that number
```

## Assertion checklist (per scenario)

**C1 — Clean implementation**
- [ ] PR has a comment from the workflow containing "Approved"
- [ ] `council/approved` label applied
- [ ] `merge/ready` label applied
- [ ] `council/needs-revision` label NOT present

**C2 — Missing tests**
- [ ] PR comment contains "Revise"
- [ ] `council/needs-revision` label applied
- [ ] Comment body mentions tests or testing
- [ ] `council/approved` NOT applied

**C3 — Architecture violation**
- [ ] PR comment contains "Revise"
- [ ] `council/needs-revision` label applied
- [ ] Comment mentions architecture, layering, or actions pattern

**C4 — Security concern**
- [ ] PR comment contains "Revise" or "Reject"
- [ ] Comment mentions security, injection, or sanitization
- [ ] `council/needs-revision` applied (or PR closed if Reject)

**C5 — Out-of-scope**
- [ ] PR comment contains "Revise"
- [ ] Comment mentions scope, BRIEF, or over-engineering

## Cost / latency

| # | PR # | Duration (s) | Approx tokens |
|---|------|-------------|---------------|
| C1 | #15 | | |
| C2 | #16 | | |
| C3 | #17 | | |
| C4 | #18 | | |
| C5 | #19 | | |

## Notes / observations

**2026-06-22: BLOCKED — API quota exhausted**
`ANTHROPIC_API_KEY` GitHub Actions secret has hit its usage limit. Error: `400 You have reached your specified API usage limits. You will regain access on 2026-07-01 at 00:00 UTC.`
All 5 test PRs (#15–#19) are staged and ready. Infrastructure verified working locally (PR #15 reviewed and commented successfully). Re-run after quota resets or replace the secret with a key that has quota.
