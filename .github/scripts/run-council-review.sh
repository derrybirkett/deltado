#!/usr/bin/env bash
set -euo pipefail

PR_NUMBER="${1:?Usage: run-council-review.sh <pr-number>}"
REPO_ROOT="$(git rev-parse --show-toplevel)"

# Ensure labels exist
gh label create "council/approved"    --color "0e8a16" --description "Council review passed" 2>/dev/null || true
gh label create "council/needs-revision" --color "e4a93c" --description "Council review requested changes" 2>/dev/null || true

# Pull what was planned (BRIEF.md is embedded in the PR body by open-pr.sh)
BRIEF=$(gh pr view "$PR_NUMBER" --json body -q .body)

# Pull what was built
DIFF=$(gh pr diff "$PR_NUMBER")

CTO_PROMPT=$(cat "$REPO_ROOT/council/advisors/cto/prompt.md")
PLAYBOOK=$(cat "$REPO_ROOT/council/advisors/cto/playbooks/architecture-review.md")

REVIEW=$(claude --print --model claude-sonnet-4-5 -p "$CTO_PROMPT" <<EOF
Use the following architecture review playbook to assess this Delta PR.

## Playbook
$PLAYBOOK

## What was planned (BRIEF.md)
$BRIEF

## What was built (diff)
$DIFF

Keep the review concise — this is a solo dev project. Output exactly:
- **Verdict**: Approved / Revise / Reject
- **Assessment**: 2-3 sentences
- **Tradeoffs**: bullet list
- **Conditions / Risks**: bullet list (omit section if none)
EOF
)

# Post comment
gh pr comment "$PR_NUMBER" --body "## CTO Review

$REVIEW

---
*Reviewed by [Council](https://github.com/derrybirkett/council) CTO advisor*"

# Apply label based on verdict
if echo "$REVIEW" | grep -qi "verdict.*approved\|approved"; then
  gh pr edit "$PR_NUMBER" --add-label "council/approved"
else
  gh pr edit "$PR_NUMBER" --add-label "council/needs-revision"
fi
