# Merge Agent — Design Spec

**Date:** 2026-05-21  
**Status:** Approved  
**Suite:** DeltaSuite (Delta + Council + Merge)

---

## Overview

Merge is a standalone GitHub submodule that automatically merges PRs after a 24-hour human review window, using AI to make a final safety judgment before the merge executes. It is independent of Council and Delta but integrates with them cleanly when the full DeltaSuite is installed.

The key differentiator from rule-based tools like Mergify: Merge uses AI judgment, not just label/CI checks, as the final gate.

---

## Architecture

Merge is a submodule added to any GitHub repository. It provides a script and an AI prompt. The host repo adds one GitHub Actions workflow file.

**Submodule structure:**
```
merge/
  scripts/
    run-merge-check.sh     # main script invoked by the cron workflow
    setup.sh               # one-time setup: creates labels, optionally patches Council
  advisors/
    merge/
      prompt.md            # AI system prompt for merge judgment
  README.md
```

**Host repo additions:**
```
.github/workflows/merge.yml    # cron every 30min, calls run-merge-check.sh
```

**Labels:**
- `merge/ready` — applied by human or Council to queue a PR for merge
- `merge/blocked` — applied by Merge when AI flags a risk; requires human to re-evaluate

No external storage, no database, no webhook registration. Fully stateless — all state is in GitHub labels and PR metadata.

---

## Workflow

Each cron tick (every 30 min) runs `run-merge-check.sh`:

1. Query all open PRs with `merge/ready` label, excluding those with `merge/blocked`
2. For each PR, check when `merge/ready` was applied — skip if < 24h ago
3. If 24h elapsed: check CI status — skip if still running; block with comment if failed
4. Fetch PR diff + lightweight main snapshot (README + package.json)
5. Call AI with merge judgment prompt
6. **MERGE** → squash-merge, post brief comment
7. **BLOCK** → apply `merge/blocked`, remove `merge/ready`, post comment with AI's reason

Merge strategy defaults to squash, configurable via `MERGE_STRATEGY` env var in the workflow.

---

## AI Judgment

**Input to the model:**
- PR title, description, full diff
- Current main branch: README + package.json
- Time elapsed since `merge/ready` was applied

**Prompt** (`advisors/merge/prompt.md`):

> You are a merge safety agent. Your job is to decide whether a pull request is safe to merge into main right now. You are the last automated gate before code ships.
>
> Respond with exactly: `MERGE` or `BLOCK`, followed by one short paragraph explaining your reasoning.
>
> Block if you see: breaking changes with no migration path, security regressions, the PR diff conflicts semantically with what main currently does, or anything that looks unfinished or accidentally included.
>
> Do not block for style, minor concerns, or anything already noted in the PR description as a known trade-off.

**Ambiguous response handling:** if the AI response does not clearly contain `MERGE` or `BLOCK`, treat as BLOCK and post a comment requesting human review.

**v1 scope limits (intentional):**
- Does not inspect other open PRs for semantic conflicts
- Does not run or assess test results
- Does not check deployment health

---

## Council Integration Hook

Merge ships a `setup.sh` that optionally patches Council's `run-council-review.sh` to apply `merge/ready` after `council/approved`. The patch is applied only if:
1. Council is installed (`.github/scripts/run-council-review.sh` exists)
2. User confirms during setup

This keeps Merge fully independent — it works without Council, and Council works without Merge.

---

## Error Handling

| Scenario | Behaviour |
|---|---|
| PR has merge conflicts | Skip, post comment: "Cannot merge — conflicts with main. Please rebase." |
| CI still running | Skip this tick, check again next poll |
| CI failed | Block with comment. No AI call. |
| AI API error | Skip this tick silently. Never merge or block on an error. |
| `merge/ready` removed during window | Excluded from next poll — no action. |
| PR already closed/merged | Not returned by `gh pr list` — naturally skipped. |
| Ambiguous AI response | Treat as BLOCK, post comment requesting human review. |

**Guiding principle:** when in doubt, do nothing. The cron retries every 30 min; a skipped tick is low cost, a bad merge is not.

---

## Installation

1. `git submodule add https://github.com/derrybirkett/merge`
2. Copy `.github/workflows/merge.yml` from the submodule into the host repo
3. Ensure `ANTHROPIC_API_KEY` is set as a GitHub Actions secret
4. Run `merge/scripts/setup.sh` — creates labels, optionally patches Council

No new secrets required if Delta and Council are already installed.

---

## Future Iterations (out of scope for v1)

- Inspect other open PRs for semantic conflicts
- Assess test results and coverage delta
- Check deployment health post-merge
- Configurable review window (not hardcoded to 24h)
- Per-branch or per-label merge strategy overrides
