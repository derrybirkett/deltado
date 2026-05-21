# Merge Agent Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `merge` submodule repo and integrate it into deltado as the third piece of the MakerSuite autonomous pipeline.

**Architecture:** A new GitHub repo (`derrybirkett/merge`) holds a cron script and an AI prompt. A GitHub Actions workflow in deltado polls every 30 min for PRs labelled `merge/ready`, waits for a 24h review window, then runs an AI safety judgment before merging or blocking. Fully stateless — all state lives in GitHub labels.

**Tech Stack:** Bash, GitHub CLI (`gh`), Claude Code CLI (`claude`), GitHub Actions, shellcheck (lint)

---

## File Map

**New repo `derrybirkett/merge` (built in `/tmp/merge`):**
- Create: `scripts/run-merge-check.sh` — cron entry point; polls PRs, runs AI judgment, merges or blocks
- Create: `scripts/setup.sh` — one-time install: creates labels, optionally patches Council
- Create: `advisors/merge/prompt.md` — AI system prompt for merge judgment
- Create: `README.md` — usage docs

**Deltado repo (this worktree):**
- Add: `merge/` submodule → `https://github.com/derrybirkett/merge`
- Create: `.github/workflows/merge.yml` — 30min cron, calls `run-merge-check.sh`
- Modify: `.github/scripts/run-council-review.sh:49-53` — add `merge/ready` label after `council/approved`

---

## Task 1: Create merge GitHub repo and directory structure

**Files:** none yet — scaffolding only

- [ ] **Step 1: Create the GitHub repo and clone it**

```bash
cd /tmp
gh repo create derrybirkett/merge \
  --public \
  --description "Autonomous merge agent — AI-powered merge safety for GitHub repos" \
  --clone
cd merge
mkdir -p scripts advisors/merge
```

Expected: directory `/tmp/merge` exists with `.git/` inside.

- [ ] **Step 2: Verify**

```bash
ls /tmp/merge
# Expected: scripts/  advisors/  .git/
gh repo view derrybirkett/merge --json name --jq .name
# Expected: merge
```

---

## Task 2: Write the AI prompt

**Files:**
- Create: `advisors/merge/prompt.md`

- [ ] **Step 1: Write the prompt**

Create `/tmp/merge/advisors/merge/prompt.md`:

```markdown
You are a merge safety agent. Your job is to decide whether a pull request is safe to merge into main right now. You are the last automated gate before code ships.

Respond with exactly: `MERGE` or `BLOCK` as the first word of your response, followed by one short paragraph explaining your reasoning.

Block if you see:
- Breaking changes with no migration path
- Security regressions (new secrets in code, open injection vectors, removed auth checks)
- The PR diff conflicts semantically with what main currently does (even if git reports no conflicts)
- Anything that looks unfinished or accidentally included (debug code, commented-out blocks, TODO markers in new code)

Do not block for:
- Style issues or minor code quality concerns
- Anything already noted in the PR description as a known trade-off or out-of-scope item
- Missing tests if the PR description acknowledges them
```

- [ ] **Step 2: Commit**

```bash
cd /tmp/merge
git add advisors/merge/prompt.md
git commit -m "feat: add merge judgment prompt"
```

---

## Task 3: Write `run-merge-check.sh`

**Files:**
- Create: `scripts/run-merge-check.sh`

- [ ] **Step 1: Write the script**

Create `/tmp/merge/scripts/run-merge-check.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
MERGE_STRATEGY="${MERGE_STRATEGY:-squash}"
REVIEW_WINDOW_SECONDS=$((24 * 3600))

echo "=== Merge Agent Check — $(date -u '+%Y-%m-%dT%H:%M:%SZ') ==="

# Ensure labels exist
gh label create "merge/ready"   --color "0075ca" --description "Queued for autonomous merge"  2>/dev/null || true
gh label create "merge/blocked" --color "e11d48" --description "Merge blocked by Merge agent" 2>/dev/null || true

process_pr() {
  local pr="$1"
  echo ""
  echo "--- PR #${pr} ---"

  # Skip if already blocked
  local is_blocked
  is_blocked=$(gh pr view "$pr" --json labels \
    --jq '[.labels[].name] | contains(["merge/blocked"])' 2>/dev/null || echo "false")
  if [[ "$is_blocked" == "true" ]]; then
    echo "PR #${pr}: already blocked, skipping"
    return 0
  fi

  # Get timestamp when merge/ready was applied (last 100 events)
  local labeled_at
  labeled_at=$(gh api "repos/{owner}/{repo}/issues/${pr}/events?per_page=100" \
    --jq '[.[] | select(.event == "labeled" and .label.name == "merge/ready")] | last | .created_at // empty' \
    2>/dev/null || echo "")

  if [[ -z "$labeled_at" ]]; then
    echo "PR #${pr}: cannot determine merge/ready timestamp, skipping"
    return 0
  fi

  # Elapsed seconds since label applied (uses Linux date — available in GitHub Actions)
  local labeled_epoch now_epoch elapsed
  labeled_epoch=$(date -d "$labeled_at" +%s)
  now_epoch=$(date +%s)
  elapsed=$(( now_epoch - labeled_epoch ))

  if (( elapsed < REVIEW_WINDOW_SECONDS )); then
    local remaining_hours
    remaining_hours=$(( (REVIEW_WINDOW_SECONDS - elapsed) / 3600 ))
    echo "PR #${pr}: ${remaining_hours}h remaining in review window, skipping"
    return 0
  fi

  # Check CI status
  local ci_status
  ci_status=$(gh pr view "$pr" --json statusCheckRollup \
    --jq '.statusCheckRollup | if length == 0 then "none" elif any(.[]; .conclusion == "FAILURE" or .conclusion == "CANCELLED" or .conclusion == "TIMED_OUT") then "failure" elif all(.[]; .status == "COMPLETED") then "success" else "pending" end')

  if [[ "$ci_status" == "failure" ]]; then
    gh pr comment "$pr" --body "### Merge Agent

CI is failing — not merging until all checks are green.

*Fix CI, then remove and re-apply \`merge/ready\` to reset the 24h window.*"
    echo "PR #${pr}: CI failing, skipping"
    return 0
  fi

  if [[ "$ci_status" == "pending" ]]; then
    echo "PR #${pr}: CI still running, will retry next tick"
    return 0
  fi

  # Check mergeability
  local mergeable
  mergeable=$(gh pr view "$pr" --json mergeable --jq '.mergeable')

  if [[ "$mergeable" == "CONFLICTING" ]]; then
    gh pr comment "$pr" --body "### Merge Agent

Cannot merge — conflicts with \`main\`. Please rebase and resolve conflicts, then re-apply \`merge/ready\`."
    gh pr edit "$pr" --remove-label "merge/ready"
    echo "PR #${pr}: merge conflicts, skipping"
    return 0
  fi

  if [[ "$mergeable" == "UNKNOWN" ]]; then
    echo "PR #${pr}: mergeability unknown (GitHub computing), will retry next tick"
    return 0
  fi

  # Run AI judgment
  local prompt pr_title pr_body pr_diff readme_content pkg_content elapsed_hours
  prompt=$(cat "${REPO_ROOT}/merge/advisors/merge/prompt.md")
  pr_title=$(gh pr view "$pr" --json title --jq '.title')
  pr_body=$(gh pr view "$pr" --json body --jq '.body // ""')
  pr_diff=$(gh pr diff "$pr")
  readme_content=$(git show origin/main:README.md 2>/dev/null || echo "(no README)")
  pkg_content=$(git show origin/main:package.json 2>/dev/null || echo "(no package.json)")
  elapsed_hours=$(( elapsed / 3600 ))

  local verdict
  verdict=$(claude --print --model claude-sonnet-4-6 -p "$prompt" <<EOF
## PR #${pr}: ${pr_title}

### Description
${pr_body}

### Review window
${elapsed_hours} hours elapsed (minimum 24h window has been respected)

### Current main branch context

**README.md:**
${readme_content}

**package.json:**
${pkg_content}

### PR Diff
${pr_diff}
EOF
)

  echo "AI verdict for PR #${pr}:"
  echo "$verdict"

  # Parse first word: must be MERGE or BLOCK
  local first_word
  first_word=$(echo "$verdict" | head -1 | awk '{print toupper($1)}')

  if [[ "$first_word" == "MERGE" ]]; then
    local merge_flag
    case "$MERGE_STRATEGY" in
      squash) merge_flag="--squash" ;;
      rebase) merge_flag="--rebase" ;;
      merge)  merge_flag="--merge"  ;;
      *)
        echo "PR #${pr}: unknown MERGE_STRATEGY '${MERGE_STRATEGY}', defaulting to squash"
        merge_flag="--squash"
        ;;
    esac

    local merged=false
    if gh pr merge "$pr" "$merge_flag"; then
      merged=true
    fi

    if [[ "$merged" == "true" ]]; then
      gh pr comment "$pr" --body "### Merge Agent

Merged after ${elapsed_hours}h review window using \`${MERGE_STRATEGY}\` strategy.

**AI assessment:**
${verdict}"
      echo "PR #${pr}: merged"
    else
      gh pr comment "$pr" --body "### Merge Agent

Failed to execute merge. Check that GitHub Actions is permitted to create pull requests:
*Settings → Actions → General → Workflow permissions → Allow GitHub Actions to create and approve pull requests*"
      echo "PR #${pr}: merge execution failed"
    fi

  elif [[ "$first_word" == "BLOCK" ]]; then
    gh pr edit "$pr" --add-label "merge/blocked" --remove-label "merge/ready"
    gh pr comment "$pr" --body "### Merge Agent

Merge blocked. Remove \`merge/blocked\` and re-apply \`merge/ready\` to retry.

**AI assessment:**
${verdict}"
    echo "PR #${pr}: blocked"

  else
    # Ambiguous response — safe default is block
    gh pr edit "$pr" --add-label "merge/blocked" --remove-label "merge/ready"
    gh pr comment "$pr" --body "### Merge Agent

Merge blocked — AI response was ambiguous. Human review required.

Remove \`merge/blocked\` and re-apply \`merge/ready\` to retry.

**AI response:**
${verdict}"
    echo "PR #${pr}: ambiguous verdict, blocked for safety"
  fi
}

# Query open PRs with merge/ready label
prs=$(gh pr list \
  --label "merge/ready" \
  --state open \
  --json number \
  --jq '.[].number')

if [[ -z "$prs" ]]; then
  echo "No PRs queued for merge."
  exit 0
fi

for pr_number in $prs; do
  process_pr "$pr_number" || echo "PR #${pr_number}: unexpected error during processing, skipping"
done

echo ""
echo "=== Merge check complete ==="
```

- [ ] **Step 2: Make executable**

```bash
chmod +x /tmp/merge/scripts/run-merge-check.sh
```

---

## Task 4: Lint `run-merge-check.sh` with shellcheck

**Files:** none modified — lint only

- [ ] **Step 1: Install shellcheck if needed**

```bash
# macOS
brew install shellcheck 2>/dev/null || true
# Linux / GitHub Actions
which shellcheck || sudo apt-get install -y shellcheck
```

- [ ] **Step 2: Run shellcheck**

```bash
shellcheck /tmp/merge/scripts/run-merge-check.sh
```

Expected: no output (clean). If errors appear, fix them before continuing.

- [ ] **Step 3: Commit**

```bash
cd /tmp/merge
git add scripts/run-merge-check.sh
git commit -m "feat: add run-merge-check.sh"
```

---

## Task 5: Write `setup.sh`

**Files:**
- Create: `scripts/setup.sh`

- [ ] **Step 1: Write the script**

Create `/tmp/merge/scripts/setup.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

echo "=== Merge Agent Setup ==="
echo ""

# Create labels in the current repo
echo "Creating labels..."
gh label create "merge/ready"   --color "0075ca" --description "Queued for autonomous merge"  2>/dev/null \
  && echo "  Created: merge/ready" \
  || echo "  Already exists: merge/ready"
gh label create "merge/blocked" --color "e11d48" --description "Merge blocked by Merge agent" 2>/dev/null \
  && echo "  Created: merge/blocked" \
  || echo "  Already exists: merge/blocked"

# Optionally patch Council to apply merge/ready after council/approved
COUNCIL_SCRIPT=".github/scripts/run-council-review.sh"

if [[ -f "$COUNCIL_SCRIPT" ]]; then
  echo ""
  echo "Council detected at ${COUNCIL_SCRIPT}."
  read -rp "Apply merge/ready label automatically after council/approved? [y/N] " patch_council
  if [[ "$patch_council" =~ ^[Yy]$ ]]; then
    if grep -q "merge/ready" "$COUNCIL_SCRIPT"; then
      echo "Council script already patched — skipping."
    else
      # Insert merge/ready line after the council/approved label line using Python
      python3 - "$COUNCIL_SCRIPT" <<'PYEOF'
import sys
path = sys.argv[1]
content = open(path).read()
old = '  gh pr edit "$PR_NUMBER" --add-label "council/approved"'
new = old + '\n  gh pr edit "$PR_NUMBER" --add-label "merge/ready" 2>/dev/null || true'
if old not in content:
    print(f"ERROR: expected line not found in {path}", file=sys.stderr)
    sys.exit(1)
open(path, 'w').write(content.replace(old, new, 1))
print(f"Patched {path}")
PYEOF
    fi
  else
    echo "Skipped Council patch. Apply merge/ready manually or re-run setup to patch later."
  fi
fi

echo ""
echo "Setup complete."
echo ""
echo "Next: copy .github/workflows/merge.yml from the submodule into your repo's .github/workflows/"
```

- [ ] **Step 2: Make executable**

```bash
chmod +x /tmp/merge/scripts/setup.sh
```

---

## Task 6: Lint `setup.sh` with shellcheck

- [ ] **Step 1: Run shellcheck**

```bash
shellcheck /tmp/merge/scripts/setup.sh
```

Expected: no output. Fix any issues before continuing.

- [ ] **Step 2: Commit**

```bash
cd /tmp/merge
git add scripts/setup.sh
git commit -m "feat: add setup.sh"
```

---

## Task 7: Write `README.md`

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write README**

Create `/tmp/merge/README.md`:

```markdown
# Merge

Autonomous merge agent for GitHub repos. Part of [MakerSuite](https://github.com/derrybirkett/deltado).

Polls every 30 minutes for PRs labelled `merge/ready`. After a 24-hour review window, runs an AI safety check, then merges or blocks.

## How it works

1. Apply `merge/ready` to a PR (manually, or automatically via Council)
2. 24-hour review window begins — remove the label at any time to cancel
3. After 24h: CI must be green, no merge conflicts, AI must approve
4. On approval: PR is squash-merged and labelled accordingly
5. On block: `merge/blocked` is applied with an explanation — remove it and re-apply `merge/ready` to retry

## Installation

```bash
# 1. Add submodule
git submodule add https://github.com/derrybirkett/merge merge

# 2. Add workflow
cp merge/.github/workflows/merge.yml .github/workflows/merge.yml

# 3. One-time setup (creates labels, optionally patches Council)
bash merge/scripts/setup.sh
```

**Required secret:** `ANTHROPIC_API_KEY` (already set if using Delta or Council)

## Labels

| Label | Meaning |
|---|---|
| `merge/ready` | PR is queued — apply to start the 24h window |
| `merge/blocked` | AI blocked the merge — human review required |

## Configuration

Set `MERGE_STRATEGY` as a GitHub Actions repository variable to control merge method.
Options: `squash` (default), `rebase`, `merge`.

## MakerSuite

Merge is designed to work standalone, but pairs with:
- [Delta](https://github.com/derrybirkett/delta) — builds features autonomously
- [Council](https://github.com/derrybirkett/council) — AI CTO review gate

When all three are installed, `setup.sh` patches Council to apply `merge/ready` automatically after `council/approved`, completing the fully autonomous loop: **Delta builds → Council reviews → Merge ships**.
```

- [ ] **Step 2: Commit**

```bash
cd /tmp/merge
git add README.md
git commit -m "docs: add README"
```

---

## Task 8: Push merge repo to GitHub

- [ ] **Step 1: Push**

```bash
cd /tmp/merge
git push origin main
```

Expected output ends with: `Branch 'main' set up to track remote branch 'main' from 'origin'.`

- [ ] **Step 2: Verify repo is live**

```bash
gh repo view derrybirkett/merge --json name,description,url --jq '"Name: \(.name)\nURL: \(.url)\nDesc: \(.description)"'
```

Expected:
```
Name: merge
URL: https://github.com/derrybirkett/merge
Desc: Autonomous merge agent — AI-powered merge safety for GitHub repos
```

---

## Task 9: Add merge as submodule to deltado

**Files:**
- Modify: `.gitmodules` (auto-updated by git)
- Create: `merge/` submodule directory

Run these commands from the deltado worktree root.

- [ ] **Step 1: Add the submodule**

```bash
# Run from deltado worktree root
git submodule add https://github.com/derrybirkett/merge merge
```

Expected: `Cloning into '/path/to/deltado/merge'...`

- [ ] **Step 2: Verify submodule is initialised**

```bash
git submodule status
# Expected line: <commit-hash> merge (heads/main)
ls merge/scripts/
# Expected: run-merge-check.sh  setup.sh
```

- [ ] **Step 3: Commit**

```bash
git add .gitmodules merge
git commit -m "chore: add merge submodule"
```

---

## Task 10: Add `merge.yml` workflow to deltado

**Files:**
- Create: `.github/workflows/merge.yml`

- [ ] **Step 1: Write the workflow**

Create `.github/workflows/merge.yml`:

```yaml
name: Merge

on:
  schedule:
    - cron: '*/30 * * * *'  # every 30 minutes
  workflow_dispatch:          # manual trigger for testing

jobs:
  merge-check:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
      issues: write

    steps:
      - name: Checkout with submodules
        uses: actions/checkout@v4
        with:
          submodules: recursive
          token: ${{ secrets.GITHUB_TOKEN }}
          fetch-depth: 0

      - name: Setup Node.js 24
        uses: actions/setup-node@v4
        with:
          node-version: '24'

      - name: Install Claude Code CLI
        run: npm install -g @anthropic-ai/claude-code

      - name: Configure git identity
        run: |
          git config --global user.email "merge@autonomous.agent"
          git config --global user.name "Merge Agent"

      - name: Run merge check
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          MERGE_STRATEGY: ${{ vars.MERGE_STRATEGY }}
        run: bash merge/scripts/run-merge-check.sh
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/merge.yml
git commit -m "feat: add Merge cron workflow"
```

---

## Task 11: Patch Council script to apply `merge/ready`

**Files:**
- Modify: `.github/scripts/run-council-review.sh:50`

The current line 50 is:
```bash
  gh pr edit "$PR_NUMBER" --add-label "council/approved"
```

After the patch it should be:
```bash
  gh pr edit "$PR_NUMBER" --add-label "council/approved"
  gh pr edit "$PR_NUMBER" --add-label "merge/ready" 2>/dev/null || true
```

- [ ] **Step 1: Apply the patch**

```bash
python3 - .github/scripts/run-council-review.sh <<'PYEOF'
import sys
path = sys.argv[1]
content = open(path).read()
old = '  gh pr edit "$PR_NUMBER" --add-label "council/approved"'
new = old + '\n  gh pr edit "$PR_NUMBER" --add-label "merge/ready" 2>/dev/null || true'
if old not in content:
    print(f"ERROR: expected line not found in {path}", file=sys.stderr)
    sys.exit(1)
open(path, 'w').write(content.replace(old, new, 1))
print("Patched", path)
PYEOF
```

Expected: `Patched .github/scripts/run-council-review.sh`

- [ ] **Step 2: Verify the patch looks correct**

```bash
grep -A2 "council/approved" .github/scripts/run-council-review.sh
```

Expected output:
```bash
  gh pr edit "$PR_NUMBER" --add-label "council/approved"
  gh pr edit "$PR_NUMBER" --add-label "merge/ready" 2>/dev/null || true
```

- [ ] **Step 3: Commit**

```bash
git add .github/scripts/run-council-review.sh
git commit -m "feat: apply merge/ready after council/approved"
```

---

## Task 12: Push deltado changes and verify

- [ ] **Step 1: Push to remote**

```bash
git push origin claude/pedantic-newton-ec6baf
```

- [ ] **Step 2: Trigger a manual workflow_dispatch to smoke-test**

```bash
gh workflow run merge.yml
sleep 10
gh run list --workflow=merge.yml --limit=1
```

Expected: a run appears (may be `in_progress` or `completed`). Check it ran without setup errors:

```bash
gh run view --workflow=merge.yml $(gh run list --workflow=merge.yml --limit=1 --json databaseId --jq '.[0].databaseId') --log 2>/dev/null | tail -20
```

Expected last lines: `No PRs queued for merge.` and `=== Merge check complete ===`

- [ ] **Step 3: Confirm end-to-end by labelling a PR**

Apply `merge/ready` to an open PR to start the 24h window:

```bash
gh pr edit 2 --add-label "merge/ready"
```

Trigger the workflow manually again and verify it detects the PR but skips (review window not yet elapsed):

```bash
gh workflow run merge.yml
sleep 30
gh run view --workflow=merge.yml $(gh run list --workflow=merge.yml --limit=1 --json databaseId --jq '.[0].databaseId') --log 2>/dev/null | grep "PR #2"
```

Expected: `PR #2: 23h remaining in review window, skipping`
