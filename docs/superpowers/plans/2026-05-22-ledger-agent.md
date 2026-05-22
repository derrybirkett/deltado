# Ledger Agent Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and ship the Ledger agent — a standalone DeltaSuite submodule that runs at 8am UTC daily, checks five pipeline rules, and opens a `ledger/gap` GitHub issue with an AI-written diagnosis when the pipeline diverged from expected behaviour.

**Architecture:** A bash script runs five deterministic gap checks against the GitHub API, builds a gap report, calls Claude for a plain-English diagnosis, and opens a labelled issue — silent if no gaps. Lives in its own GitHub repo (`derrybirkett/ledger`) pulled into deltado as a submodule, following the same pattern as Merge.

**Tech Stack:** Bash, GitHub CLI (`gh`), `jq`, Claude Code CLI (`claude --print`), GitHub Actions (cron `0 8 * * *`)

---

## File Structure

**New repo: `derrybirkett/ledger`**

```
ledger/
  scripts/
    run-ledger.sh       ← main script: five rule checks + issue opening
    setup.sh            ← creates ledger/gap label
  advisors/ledger/
    prompt.md           ← AI narrative system prompt
  .github/workflows/
    ledger.yml          ← 8am UTC daily cron + workflow template
  README.md
```

**Modified in `derrybirkett/deltado`:**
- `.gitmodules` — add `ledger` submodule entry
- `.github/workflows/ledger.yml` — live copy of the workflow

Reference patterns to follow: `merge/scripts/run-merge-check.sh`, `merge/scripts/setup.sh`, `merge/.github/workflows/merge.yml`.

---

### Task 1: Create the ledger GitHub repo and directory structure

**Files:**
- Create: `/tmp/ledger/` (full directory tree)

- [ ] **Step 1: Create the GitHub repo and clone it**

```bash
gh repo create derrybirkett/ledger --public \
  --description "Autonomous pipeline audit agent for DeltaSuite" \
  --clone /tmp/ledger
```

Expected: repo created at https://github.com/derrybirkett/ledger, cloned to `/tmp/ledger`

- [ ] **Step 2: Create directory structure**

```bash
mkdir -p /tmp/ledger/scripts \
         /tmp/ledger/advisors/ledger \
         /tmp/ledger/.github/workflows
touch /tmp/ledger/scripts/run-ledger.sh \
      /tmp/ledger/scripts/setup.sh \
      /tmp/ledger/advisors/ledger/prompt.md \
      /tmp/ledger/.github/workflows/ledger.yml \
      /tmp/ledger/README.md
```

- [ ] **Step 3: Verify structure**

```bash
find /tmp/ledger -not -path '*/.git/*' | sort
```

Expected:
```
/tmp/ledger
/tmp/ledger/.github
/tmp/ledger/.github/workflows
/tmp/ledger/.github/workflows/ledger.yml
/tmp/ledger/README.md
/tmp/ledger/advisors
/tmp/ledger/advisors/ledger
/tmp/ledger/advisors/ledger/prompt.md
/tmp/ledger/scripts
/tmp/ledger/scripts/run-ledger.sh
/tmp/ledger/scripts/setup.sh
```

---

### Task 2: Write the AI prompt

**Files:**
- Create: `/tmp/ledger/advisors/ledger/prompt.md`

- [ ] **Step 1: Write the prompt**

Write `/tmp/ledger/advisors/ledger/prompt.md`:

```markdown
# Ledger Advisor

You are the Ledger agent for a DeltaSuite autonomous pipeline. Your job is to write a concise morning briefing that explains each detected pipeline gap and tells the human what to do about it.

## Input

You will receive:
- A list of gaps, each with a title and a technical description
- A table of current open PRs with their labels and age

## Your job

For each gap section provided, write:
1. **1-2 sentence diagnosis** — explain in plain English what went wrong and why it matters
2. **Suggested action** — one concrete thing the human should do

## Rules

- Keep each gap response to 3-4 lines maximum
- Be direct — no hedging, no "it appears that", no "you may want to consider"
- Reference PR numbers specifically when relevant
- Don't repeat information already in the gap title
- If the same root cause explains multiple gaps, say so once

## Output format

Reproduce each gap section heading exactly as given, then write your diagnosis and action beneath it:

### <Gap title from input>
<diagnosis sentence(s)>

**Action:** <one concrete step>

### <Next gap title>
...
```

- [ ] **Step 2: Commit**

```bash
cd /tmp/ledger && git add advisors/ledger/prompt.md && git commit -m "feat: add Ledger AI prompt"
```

---

### Task 3: Write run-ledger.sh

**Files:**
- Create: `/tmp/ledger/scripts/run-ledger.sh`

- [ ] **Step 1: Write the script**

Write `/tmp/ledger/scripts/run-ledger.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
REVIEW_SECONDS=$((24 * 3600))
GRACE_SECONDS=$((48 * 3600))
NOW_EPOCH=$(date +%s)
TODAY=$(date -u '+%Y-%m-%d')

echo "=== Ledger Check — $(date -u '+%Y-%m-%dT%H:%M:%SZ') ==="

gap_count=0
gap_text=""

add_gap() {
  local title="$1"
  local detail="$2"
  gap_count=$(( gap_count + 1 ))
  gap_text+="### ${title}"$'\n'"${detail}"$'\n\n'
}

# Rule 1: Delta ran when it should have skipped
check_delta_ran_when_should_skip() {
  local run_json
  run_json=$(gh run list --workflow=delta.yml --limit 1 \
    --json conclusion,createdAt \
    --jq '.[] | select(.conclusion == "success")' 2>/dev/null || echo "")
  [[ -z "$run_json" ]] && return 0

  local run_created_at
  run_created_at=$(echo "$run_json" | jq -r '.createdAt')
  local run_epoch; run_epoch=$(date -d "$run_created_at" +%s)
  local run_age; run_age=$(( NOW_EPOCH - run_epoch ))
  (( run_age >= REVIEW_SECONDS )) && return 0

  local pre_existing
  pre_existing=$(gh pr list --state open --json headRefName,createdAt \
    --jq "[.[] | select(.headRefName | startswith(\"delta/\")) | select(.createdAt < \"${run_created_at}\")] | length" \
    2>/dev/null || echo "0")

  local new_pr_nums
  new_pr_nums=$(gh pr list --state open --json number,headRefName,createdAt \
    --jq "[.[] | select(.headRefName | startswith(\"delta/\")) | select(.createdAt >= \"${run_created_at}\")] | map(\"#\" + (.number | tostring)) | join(\", \")" \
    2>/dev/null || echo "")

  if (( pre_existing > 0 )) && [[ -n "$new_pr_nums" ]]; then
    add_gap "Delta ran when it should have skipped" \
      "${pre_existing} open delta PR(s) existed before the run at ${run_created_at}. Delta opened new PR(s): ${new_pr_nums}."
  fi
}

# Rule 2: Delta failed when it should have run
check_delta_failed_when_should_run() {
  local run_json
  run_json=$(gh run list --workflow=delta.yml --limit 1 \
    --json conclusion,createdAt \
    --jq '.[]' 2>/dev/null || echo "")
  [[ -z "$run_json" ]] && return 0

  local run_created_at
  run_created_at=$(echo "$run_json" | jq -r '.createdAt')
  local run_epoch; run_epoch=$(date -d "$run_created_at" +%s)
  local run_age; run_age=$(( NOW_EPOCH - run_epoch ))
  local run_conclusion
  run_conclusion=$(echo "$run_json" | jq -r '.conclusion')

  (( run_age >= REVIEW_SECONDS )) && return 0
  [[ "$run_conclusion" != "failure" ]] && return 0

  local open_delta_prs
  open_delta_prs=$(gh pr list --state open --json headRefName \
    --jq '[.[] | select(.headRefName | startswith("delta/"))] | length' \
    2>/dev/null || echo "0")
  (( open_delta_prs > 0 )) && return 0

  local backlog_ready; backlog_ready=0
  if [[ -f "${REPO_ROOT}/.delta/BACKLOG.md" ]]; then
    backlog_ready=$(grep -c "^- \[ \]" "${REPO_ROOT}/.delta/BACKLOG.md" || true)
  fi
  (( backlog_ready == 0 )) && return 0

  add_gap "Delta failed when it should have run" \
    "Delta workflow failed at ${run_created_at} with no open delta PRs and ${backlog_ready} Ready backlog item(s). Check the workflow run logs for the root cause."
}

# Rule 3: Merge window expired but PR not merged
check_merge_window_expired() {
  local prs
  prs=$(gh pr list --state open --label "merge/ready" \
    --json number --jq '.[].number' 2>/dev/null || echo "")
  [[ -z "$prs" ]] && return 0

  while IFS= read -r pr; do
    [[ -z "$pr" ]] && continue

    local labeled_at
    labeled_at=$(gh api --paginate "repos/{owner}/{repo}/issues/${pr}/events" 2>/dev/null \
      | jq -rs '[.[][] | select(.event == "labeled" and .label.name == "merge/ready")] | max_by(.created_at) | .created_at // empty' \
      || echo "")
    [[ -z "$labeled_at" ]] && continue

    local labeled_epoch; labeled_epoch=$(date -d "$labeled_at" +%s)
    local elapsed; elapsed=$(( NOW_EPOCH - labeled_epoch ))
    local elapsed_hours; elapsed_hours=$(( elapsed / 3600 ))
    (( elapsed <= GRACE_SECONDS )) && continue

    local ci
    ci=$(gh pr view "$pr" --json statusCheckRollup \
      --jq '.statusCheckRollup // [] | if length == 0 then "none" elif any(.[]; .conclusion == "FAILURE" or .conclusion == "CANCELLED" or .conclusion == "TIMED_OUT") then "failure" else "ok" end')
    [[ "$ci" == "failure" ]] && continue

    local mergeable
    mergeable=$(gh pr view "$pr" --json mergeable --jq '.mergeable')
    [[ "$mergeable" == "CONFLICTING" ]] && continue

    add_gap "Merge window expired without merge — PR #${pr}" \
      "PR #${pr} has had \`merge/ready\` for ${elapsed_hours}h (48h grace exceeded). CI: ${ci}, mergeable: ${mergeable}. Merge agent may not be running or lacks required permissions."
  done <<< "$prs"
}

# Rule 4: Council approved but merge/ready not applied
check_council_approved_missing_merge_ready() {
  local prs
  prs=$(gh pr list --state open --label "council/approved" \
    --json number,labels \
    --jq '.[] | select(
      (.labels | map(.name) | contains(["merge/ready"]) | not) and
      (.labels | map(.name) | contains(["merge/blocked"]) | not)
    ) | .number' 2>/dev/null || echo "")
  [[ -z "$prs" ]] && return 0

  while IFS= read -r pr; do
    [[ -z "$pr" ]] && continue
    add_gap "Council approved but \`merge/ready\` not applied — PR #${pr}" \
      "PR #${pr} has \`council/approved\` but is missing both \`merge/ready\` and \`merge/blocked\`. The Council→Merge integration hook may not be installed. Run \`bash merge/scripts/setup.sh\` to patch."
  done <<< "$prs"
}

# Rule 5: Delta PR awaiting Council review for >24h
check_council_review_overdue() {
  local pr_data
  pr_data=$(gh pr list --state open --label "delta" \
    --json number,createdAt,labels \
    --jq '.[] | select(
      (.labels | map(.name) | (contains(["council/approved"]) or contains(["council/needs-revision"])) | not)
    ) | (.number | tostring) + " " + .createdAt' 2>/dev/null || echo "")
  [[ -z "$pr_data" ]] && return 0

  while IFS=' ' read -r pr created_at; do
    [[ -z "$pr" ]] && continue
    local created_epoch; created_epoch=$(date -d "$created_at" +%s)
    local age; age=$(( NOW_EPOCH - created_epoch ))
    local age_hours; age_hours=$(( age / 3600 ))
    (( age <= REVIEW_SECONDS )) && continue

    add_gap "Delta PR awaiting Council review — PR #${pr} (${age_hours}h)" \
      "PR #${pr} has the \`delta\` label but no Council review after ${age_hours}h. Council may not be installed or the council-review workflow is failing."
  done <<< "$pr_data"
}

# ─── Run all checks ───────────────────────────────────────────────────────────

check_delta_ran_when_should_skip
check_delta_failed_when_should_run
check_merge_window_expired
check_council_approved_missing_merge_ready
check_council_review_overdue

# ─── Report ───────────────────────────────────────────────────────────────────

if (( gap_count == 0 )); then
  echo "No gaps detected."
  exit 0
fi

echo "${gap_count} gap(s) detected — building report..."

# Build PR state table
pr_table=$(gh pr list --state open \
  --json number,title,labels,createdAt \
  --jq '.[] | "| #\(.number) | \(.title | .[0:50]) | \([.labels[].name] | join(", ")) | \(.createdAt[:10]) |"' \
  2>/dev/null || echo "| (error fetching PR list) | | | |")

# Call Claude for narrative — fall back to raw gaps if unavailable
local_prompt=$(cat "${REPO_ROOT}/ledger/advisors/ledger/prompt.md")
narrative=$(claude --print --model claude-sonnet-4-6 -p "$local_prompt" <<EOF
Today is ${TODAY}.

## Gaps detected

${gap_text}

## Open PRs
| PR | Title | Labels | Date |
|----|-------|--------|------|
${pr_table}
EOF
) || narrative="${gap_text}"

# Open GitHub issue
gh issue create \
  --title "Pipeline gap — ${TODAY}" \
  --label "ledger/gap" \
  --body "## Summary
${gap_count} gap(s) detected in the last 24h pipeline cycle.

## Gaps

${narrative}

## Pipeline state
| PR | Title | Labels | Date |
|----|-------|--------|------|
${pr_table}

---
*Reported by [Ledger](https://github.com/derrybirkett/ledger)*"

echo "Issue opened."
echo ""
echo "=== Ledger check complete ==="
```

- [ ] **Step 2: Make executable**

```bash
chmod +x /tmp/ledger/scripts/run-ledger.sh
```

- [ ] **Step 3: Commit**

```bash
cd /tmp/ledger && git add scripts/run-ledger.sh && git commit -m "feat: add run-ledger.sh"
```

---

### Task 4: Lint run-ledger.sh with shellcheck

**Files:**
- Modify: `/tmp/ledger/scripts/run-ledger.sh` (fix any issues found)

- [ ] **Step 1: Install shellcheck if needed**

```bash
which shellcheck || brew install shellcheck 2>/dev/null || sudo apt-get install -y shellcheck
```

- [ ] **Step 2: Run shellcheck**

```bash
shellcheck /tmp/ledger/scripts/run-ledger.sh
```

Expected: no output (zero warnings or errors)

Common issues to watch for and fix:
- **SC2155**: `local var=$(...)` → split into `local var` then `var=$(...)`
- **SC2086**: unquoted `$var` → `"$var"`
- **SC2166**: `[ a -o b ]` → `[[ a || b ]]`

- [ ] **Step 3: Commit any fixes**

```bash
cd /tmp/ledger && git diff --quiet || (git add scripts/run-ledger.sh && git commit -m "fix: shellcheck run-ledger.sh")
```

---

### Task 5: Write setup.sh

**Files:**
- Create: `/tmp/ledger/scripts/setup.sh`

- [ ] **Step 1: Write setup.sh**

Write `/tmp/ledger/scripts/setup.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

echo "=== Ledger Setup ==="
echo ""

echo "Creating labels..."
gh label create "ledger/gap" --color "8b5cf6" --description "Pipeline gap detected by Ledger" 2>/dev/null \
  && echo "  Created: ledger/gap" \
  || echo "  Already exists: ledger/gap"

echo ""
echo "Setup complete."
echo ""
echo "Next: copy .github/workflows/ledger.yml from the submodule into your repo's .github/workflows/"
```

- [ ] **Step 2: Make executable and lint**

```bash
chmod +x /tmp/ledger/scripts/setup.sh && shellcheck /tmp/ledger/scripts/setup.sh
```

Expected: no shellcheck output

- [ ] **Step 3: Commit**

```bash
cd /tmp/ledger && git add scripts/setup.sh && git commit -m "feat: add setup.sh"
```

---

### Task 6: Write ledger.yml workflow

**Files:**
- Create: `/tmp/ledger/.github/workflows/ledger.yml`

- [ ] **Step 1: Write the workflow**

Write `/tmp/ledger/.github/workflows/ledger.yml`:

```yaml
name: Ledger

on:
  schedule:
    - cron: '0 8 * * *'   # 8am UTC daily
  workflow_dispatch:        # manual trigger for testing

jobs:
  ledger-check:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: read
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

      - name: Run ledger check
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: bash ledger/scripts/run-ledger.sh
```

- [ ] **Step 2: Commit**

```bash
cd /tmp/ledger && git add .github/workflows/ledger.yml && git commit -m "feat: add ledger.yml workflow"
```

---

### Task 7: Write README.md

**Files:**
- Create: `/tmp/ledger/README.md`

- [ ] **Step 1: Write README.md**

Write `/tmp/ledger/README.md`:

```markdown
# Ledger

Autonomous pipeline audit agent for GitHub repos. Part of [DeltaSuite](https://github.com/derrybirkett/deltado).

Runs at 8am UTC daily. Checks whether the pipeline (Delta, Council, Merge) did what it was supposed to do overnight. Silent on success — opens a `ledger/gap` issue when something diverged.

## How it works

1. Five deterministic rules check every pipeline handoff point
2. If any gaps are found, Claude writes a plain-English diagnosis for each
3. A `ledger/gap` GitHub issue is opened with the full report
4. If no gaps: silent exit, no issue

## Gap types monitored

| Rule | Description |
|------|-------------|
| Delta ran when it should have skipped | Delta opened a PR despite existing open delta PRs |
| Delta failed when it should have run | Delta failed with no open PRs and a non-empty backlog |
| Merge window expired | PR had `merge/ready` for >48h but wasn't merged |
| Council approved, `merge/ready` missing | `council/approved` without `merge/ready` or `merge/blocked` |
| Council review overdue | Delta PR open >24h with no Council review |

## Installation

```bash
# 1. Add submodule
git submodule add https://github.com/derrybirkett/ledger ledger

# 2. Add workflow
cp ledger/.github/workflows/ledger.yml .github/workflows/ledger.yml

# 3. One-time setup (creates ledger/gap label)
bash ledger/scripts/setup.sh
```

**Required secret:** `ANTHROPIC_API_KEY` (already set if using any other DeltaSuite component)

## Labels

| Label | Meaning |
|-------|---------|
| `ledger/gap` | Pipeline gap detected — human review required |

## DeltaSuite

Ledger is designed to work standalone, but pairs with:
- [Delta](https://github.com/derrybirkett/delta) — builds features autonomously
- [Council](https://github.com/derrybirkett/council) — AI CTO review gate
- [Merge](https://github.com/derrybirkett/merge) — autonomous PR merging

When all four are installed, the complete accountability loop is:
**Delta builds → Council reviews → Merge ships → Ledger audits**
```

- [ ] **Step 2: Commit**

```bash
cd /tmp/ledger && git add README.md && git commit -m "docs: add README"
```

---

### Task 8: Push ledger repo to GitHub

- [ ] **Step 1: Push all commits**

```bash
cd /tmp/ledger && git push origin main
```

Expected: all commits pushed to https://github.com/derrybirkett/ledger

- [ ] **Step 2: Verify**

```bash
gh repo view derrybirkett/ledger --json name,description,url \
  --jq '"Repo: \(.url)\nDesc: \(.description)"'
```

Expected:
```
Repo: https://github.com/derrybirkett/ledger
Desc: Autonomous pipeline audit agent for DeltaSuite
```

---

### Task 9: Add ledger as submodule to deltado

**Files:**
- Modify: `/Users/derry/Projects/repos/Ideas/deltado/.gitmodules`

- [ ] **Step 1: Add the submodule**

```bash
cd /Users/derry/Projects/repos/Ideas/deltado && \
  git submodule add https://github.com/derrybirkett/ledger ledger
```

Expected: `ledger/` directory appears, `.gitmodules` updated

- [ ] **Step 2: Verify .gitmodules**

```bash
grep -A3 '"ledger"' /Users/derry/Projects/repos/Ideas/deltado/.gitmodules
```

Expected:
```
[submodule "ledger"]
	path = ledger
	url = https://github.com/derrybirkett/ledger
```

- [ ] **Step 3: Commit**

```bash
cd /Users/derry/Projects/repos/Ideas/deltado && \
  git add .gitmodules ledger && \
  git commit -m "chore: add ledger submodule"
```

---

### Task 10: Copy workflow to deltado and run setup

**Files:**
- Create: `/Users/derry/Projects/repos/Ideas/deltado/.github/workflows/ledger.yml`

- [ ] **Step 1: Copy the workflow**

```bash
cp /Users/derry/Projects/repos/Ideas/deltado/ledger/.github/workflows/ledger.yml \
   /Users/derry/Projects/repos/Ideas/deltado/.github/workflows/ledger.yml
```

- [ ] **Step 2: Run setup to create the label**

```bash
cd /Users/derry/Projects/repos/Ideas/deltado && bash ledger/scripts/setup.sh
```

Expected:
```
=== Ledger Setup ===

Creating labels...
  Created: ledger/gap

Setup complete.

Next: copy .github/workflows/ledger.yml from the submodule into your repo's .github/workflows/
```

- [ ] **Step 3: Commit**

```bash
cd /Users/derry/Projects/repos/Ideas/deltado && \
  git add .github/workflows/ledger.yml && \
  git commit -m "feat: add Ledger workflow"
```

---

### Task 11: Push deltado changes and verify

- [ ] **Step 1: Push to origin**

```bash
cd /Users/derry/Projects/repos/Ideas/deltado && git push origin main
```

- [ ] **Step 2: Verify Ledger workflow is registered**

```bash
gh workflow list | grep -i ledger
```

Expected:
```
Ledger    active    <id>
```

- [ ] **Step 3: Trigger a manual test run**

```bash
gh workflow run ledger.yml
```

- [ ] **Step 4: Wait and check run result**

```bash
sleep 15 && gh run list --workflow=ledger.yml --limit 1
```

Expected: a run appears with status `queued`, `in_progress`, or `completed`

- [ ] **Step 5: View run output**

```bash
gh run view \
  "$(gh run list --workflow=ledger.yml --limit 1 --json databaseId --jq '.[0].databaseId')" \
  --log 2>&1 | grep -E "=== Ledger|gap\(s\) detected|No gaps|Issue opened"
```

Expected: either `No gaps detected.` (clean pipeline) or `N gap(s) detected — building report...` followed by `Issue opened.`
