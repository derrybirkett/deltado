# Agent Test Suite — Summary

**Group 1 run date:** 2026-06-22 (partial — Council/Ledger/Merge pending)
**Group 2 run date:** _______________
**Tester:** Derry Birkett

---

## Group 1 — Makersuite

| Agent | Total scenarios | Pass | Fail | Pass rate | Notes |
|-------|----------------|------|------|-----------|-------|
| Delta Product | 4 | 4 | 0 | 100% | All scenarios complete |
| Delta Developer | 4 | 3 | 1 | 75% | D3 gap found + fixed; D4 accepted as PASS |
| Council | 5 | — | — | pending | Fixtures staged (#15–#19); blocked on API quota until 2026-07-01 |
| Ledger | 6 | — | — | pending | L1/L2/L5/L6 not yet run; L3/L4 age-deferred (clocks running) |
| Merge | 7 | — | — | pending | Not yet started |
| **Makersuite total** | **26** | **7** | **1** | **87.5%** | 8 of 26 run; 18 pending |

## Group 2 — Moirai

| Agent | Total scenarios | Pass | Fail | Pass rate | Notes |
|-------|----------------|------|------|-----------|-------|
| Curator | 7 | — | — | pending | Pre-req: Group 1 complete; flip dry_run: false |
| Auditor | 8 | — | — | pending | Pre-req: Group 1 complete |
| **Moirai total** | **15** | — | — | pending | |

---

## Cross-group comparison

| Dimension | Makersuite | Moirai |
|-----------|-----------|--------|
| Pass rate | 87.5% (partial) | — |
| Avg latency (s) | — | — |
| Avg tokens/run | — | — |
| Format compliance | — | — |
| Guard rail accuracy | 1 gap found (D3) | — |
| False positives observed | 0 | — |
| False negatives observed | 0 | — |

---

## Key findings

### Makersuite gaps

**D3 — Developer agent: BRIEF instruction overrides `allowed_deps`** (FIXED)
- Test revealed: when `BRIEF.md` explicitly names a package (e.g. "Install chart.js"), the agent installs it without checking `config.yml allowed_deps`.
- Guard only worked when agent inferred the dep; failed when BRIEF named it directly.
- Fix applied: `delta/agents/developer.md` rule now explicitly states BRIEF cannot override `allowed_deps` — if BRIEF names an unlisted dep, write BLOCKED.md.
- Status: patch committed to main; D3 needs re-run to verify.

**D4 — TDD enforcement: test-first order unverifiable from atomic commit** (accepted, not a gap)
- Developer agent commits tests + implementation atomically. Git history cannot prove test-first order.
- Decision: accepted as PASS if tests exist and pass (Option A). Not a real gap in agent behaviour.

**Council script: `-p` flag conflicts with `--print` in current claude CLI** (FIXED)
- Original script used `-p "$SYSTEM_PROMPT"` which conflicts with `--print` in current Claude Code CLI.
- Fix: rewritten to use `--system-prompt-file` + stdin pipe, matching the working delta scripts pattern.

### Moirai gaps
- None observed yet (not run)

### Surprising results
- Delta Product P4: agent correctly halted rather than overwriting an in-progress item — not obvious from the prompt alone.
- Delta Developer D2: blocked with detailed physics reasoning ("quantum indeterminacy") — reasoning quality exceeded expectations.
- Delta Developer D1: agent added a server-side validation guard that wasn't explicitly required by the brief.

### Recommended follow-up
- Re-run D3 scenario to verify the `allowed_deps` fix works end-to-end.
- After Council tests complete: check whether C1 (clean implementation) gets Approved or also Revise — the local dry-run gave Revise due to a trim/raw-length mismatch, which may indicate a real issue in the C1 fixture.
- Merge tests (M1–M7) are the largest remaining block.

---

## Deferred tests (to complete after windows expire)

| Scenario | Fixture PR # | Window | Earliest run | Status |
|----------|-------------|--------|-------------|--------|
| L3 — Ledger merge window >48h | #13 | >48h from 2026-06-22T17:00Z | 2026-06-24T17:00Z | Staged, clock running |
| L4 — Ledger council overdue >24h | #14 | >24h from 2026-06-22T17:00Z | 2026-06-23T17:00Z | Staged, clock running |

---

## Blockers

| Blocker | Affects | ETA | Action |
|---------|---------|-----|--------|
| `ANTHROPIC_API_KEY` GitHub Actions quota exhausted | Council C1–C5, Ledger workflow, Merge tests | 2026-07-01T00:00Z | Cloud agent scheduled to re-fire at 00:30Z; or rotate the secret manually |
