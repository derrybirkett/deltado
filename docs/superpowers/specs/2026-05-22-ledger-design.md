# Ledger Design

**Date:** 2026-05-22
**Status:** Approved

## Goal

Ledger is a fourth DeltaSuite submodule that monitors the autonomous pipeline for gaps between expected and actual behaviour. It runs once each morning, is silent on success, and opens a labelled GitHub issue when the pipeline diverged from what it should have done.

## Architecture

Ledger is a standalone submodule (`derrybirkett/ledger`) installed the same way as Merge. It has one script, one workflow, one AI prompt, and one setup script.

```
ledger/
  scripts/
    run-ledger.sh          ← main script: compute expected, compute actual, diff, report
    setup.sh               ← creates ledger/gap label
  advisors/ledger/
    prompt.md              ← AI narrative prompt
  .github/workflows/
    ledger.yml             ← 8am UTC daily cron
  README.md
```

The core script does four things in sequence:

1. **Compute expected state** — deterministic rules derived from pipeline contracts
2. **Compute actual state** — GitHub API (workflow runs, PR labels, timestamps)
3. **Diff** — identify gaps between the two
4. **If gaps exist** — call Claude to write a diagnosis, open a GitHub issue labelled `ledger/gap`

No persistent state. All inputs are live GitHub API calls at run time.

## The Rules

Ledger checks five conditions each morning, looking back over the last 24h:

### 1. Delta ran when it should have skipped
Delta workflow succeeded and opened a new PR, but open `delta/*` PRs already existed before the run. Indicates Delta didn't check for pending PRs before starting a new cycle.

### 2. Delta skipped or failed when it should have run
Delta failed or logged a skip, but no open `delta/*` PRs existed and the backlog has `## Ready` items. Indicates a missed build cycle.

### 3. Merge window expired but PR not merged
A PR has had `merge/ready` for more than 48h (24h window + 24h grace), is still open, has green CI, and has no conflicts. Indicates Merge failed to fire or was blocked silently.

### 4. Council approved but `merge/ready` never applied
A PR has `council/approved` but lacks both `merge/ready` and `merge/blocked`. Indicates the Council→Merge integration hook is missing or broken.

### 5. Delta PR awaiting Council review for more than 24h
A PR with the `delta` label has been open longer than 24h with no `council/approved` or `council/needs-revision`. Indicates Council didn't fire.

These five rules cover every handoff in the pipeline: Delta→PR, PR→Council, Council→Merge, Merge→merged.

## Issue Format

When gaps are found, Claude receives structured gap data (type, affected PRs, timestamps, workflow run IDs) and writes a concise diagnosis and suggested action for each gap. The script assembles the issue:

```
Title: Pipeline gap — YYYY-MM-DD

## Summary
N gaps detected in the last 24h pipeline cycle.

## Gaps

### <Gap type>
<AI diagnosis — 1-2 sentences explaining what happened and why>
<AI suggested action>

### <Gap type>
...

## Pipeline state
| PR | Labels | Age | Status |
|----|--------|-----|--------|
| #N | <labels> | <age> | <state> |
```

The issue is labelled `ledger/gap` and stays open until manually closed — Ledger never auto-closes issues.

## Setup and Integration

```bash
git submodule add https://github.com/derrybirkett/ledger ledger
cp ledger/.github/workflows/ledger.yml .github/workflows/ledger.yml
bash ledger/scripts/setup.sh
```

`setup.sh` creates the `ledger/gap` label. No patching of other agents required — Ledger is read-only and never modifies PRs or labels.

**Workflow schedule:** `0 8 * * *` (8am UTC daily).

**Required secrets:** `ANTHROPIC_API_KEY` and `GITHUB_TOKEN` — both already present if any other DeltaSuite component is installed.

## Error Handling

- **No gaps:** workflow exits 0 with `No gaps detected` log line. No issue opened.
- **Script failure** (API error, Claude unavailable): opens a minimal issue with raw gap data and no AI narrative — facts are always reported even if diagnosis is missing.
- **Label missing:** `setup.sh` is idempotent; re-running it recreates missing labels safely.

## DeltaSuite Integration

Ledger requires no changes to Delta, Council, or Merge. It reads their outputs (PR labels, workflow results) as a passive observer. When all four are installed the complete pipeline accountability loop is:

**Delta builds → Council reviews → Merge ships → Ledger audits**
