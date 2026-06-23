# Activity Log

## 2026-06-22 | Group 1 Test Harness + D3 Fix + Council Infrastructure

**Version:** v0.3.0

Built and ran the full Group 1 (Makersuite) agent test harness across two sessions. Delta Product scored 4/4 PASS. Delta Developer surfaced a real gap: D3 showed the agent installs deps explicitly named in BRIEF.md even when they're not in `allowed_deps` — the guard only caught inferred deps. Fixed by strengthening the rule in `delta/agents/developer.md` to state BRIEF cannot override `allowed_deps`. D4 (TDD enforcement) was accepted as PASS since tests exist and pass; order is unverifiable from an atomic commit.

Council fixture PRs (#15–#19) were created and the council review script was diagnosed and fixed — the original `-p` flag conflicted with `--print` in the current Claude Code CLI. Rewritten to use `--system-prompt-file` + stdin pipe, matching the working delta pattern. Infrastructure verified locally (PR #15 got a real review). All five PRs are staged and ready. Council and Ledger workflows are blocked until the `ANTHROPIC_API_KEY` Actions secret quota resets July 1; a cloud agent is scheduled to re-fire at 00:30 UTC. Ledger L3/L4 fixture PRs (#13, #14) were created with age clocks running. Group 1 summary written to `docs/test-results/summary.md`.

---

## 2026-05-22 | Session Wrap-Up

**Version:** v0.2.1
**Commits:**
- `fix: use PAT for Delta PR creation and add council workflow_dispatch`
- `chore: update delta submodule`

Smoke-tested the full autonomous pipeline and found two issues: PR #2 (Keyboard Navigation) had `council/approved` but was missing `merge/ready` because the auto-label logic was added to the council script after its council review already ran — fixed by manually applying the label. PR #3 (Filter todos) never got a council review because the Delta daily cycle uses `GITHUB_TOKEN` to create PRs, which GitHub blocks from cascading into new workflow triggers — fixed by switching the Delta workflow to `GH_PAT` and setting the secret via `gh auth token | gh secret set GH_PAT`. Also added `workflow_dispatch` to council-review.yml for manual retriggers, then fired it for PR #3 (council approved). Both PRs are now queued with `merge/ready` and will auto-merge within 24h.
