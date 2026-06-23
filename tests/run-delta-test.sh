#!/usr/bin/env bash
# Test runner for Delta Product and Developer agent scenarios.
# Usage: tests/run-delta-test.sh <agent> <scenario> [--dry-run]
#   agent:    product | developer
#   scenario: p1 | p2 | p3 | p4 (product)  or  d1 | d2 | d3 | d4 (developer)
#
# --dry-run: swap fixture, skip Claude call, run assertions against existing state, restore.
#            Validates the harness plumbing without spending API credits.
#
# Examples:
#   DRY_RUN=true tests/run-delta-test.sh product p1
#   tests/run-delta-test.sh developer d1

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
FIXTURES_DIR="$REPO_ROOT/tests/fixtures"
DELTA_DIR="$REPO_ROOT/.delta"
BACKUP_DIR="$REPO_ROOT/.delta-test-backup"

AGENT="${1:-}"
SCENARIO="${2:-}"
DRY_RUN="${DRY_RUN:-true}"
[[ "${3:-}" == "--dry-run" ]] && DRY_RUN=true

usage() {
  echo "Usage: $0 <agent> <scenario> [--dry-run]"
  echo "  agent:    product | developer"
  echo "  scenario: p1|p2|p3|p4 (product) | d1|d2|d3|d4 (developer)"
  exit 1
}

[[ -z "$AGENT" || -z "$SCENARIO" ]] && usage
[[ "$AGENT" != "product" && "$AGENT" != "developer" ]] && usage

cleanup() {
  echo ""
  echo "=== Restoring .delta/ state ==="
  if [[ -d "$BACKUP_DIR" ]]; then
    cp "$BACKUP_DIR/BACKLOG.md" "$DELTA_DIR/BACKLOG.md" 2>/dev/null || true
    cp "$BACKUP_DIR/BRIEF.md"   "$DELTA_DIR/BRIEF.md"   2>/dev/null || true
    rm -rf "$BACKUP_DIR"
    echo "Restored from backup."
  fi
}
trap cleanup EXIT

echo ""
echo "=== Delta Test Runner ==="
echo "Agent:    $AGENT"
echo "Scenario: $SCENARIO"
echo "Dry run:  $DRY_RUN"
echo "Date:     $(date -u '+%Y-%m-%dT%H:%M:%SZ')"
echo ""

# Back up current state
mkdir -p "$BACKUP_DIR"
[[ -f "$DELTA_DIR/BACKLOG.md" ]] && cp "$DELTA_DIR/BACKLOG.md" "$BACKUP_DIR/BACKLOG.md"
[[ -f "$DELTA_DIR/BRIEF.md"   ]] && cp "$DELTA_DIR/BRIEF.md"   "$BACKUP_DIR/BRIEF.md"
echo "Backed up .delta/ state to $BACKUP_DIR"

if [[ "$AGENT" == "product" ]]; then
  case "$SCENARIO" in
    p1) FIXTURE="$FIXTURES_DIR/backlog-fixtures/p1-three-ready.md" ;;
    p2) FIXTURE="$FIXTURES_DIR/backlog-fixtures/p2-one-ready.md" ;;
    p3) FIXTURE="$FIXTURES_DIR/backlog-fixtures/p3-avoid-list.md" ;;
    p4) FIXTURE="$FIXTURES_DIR/backlog-fixtures/p4-in-progress.md" ;;
    *) echo "Unknown product scenario: $SCENARIO"; usage ;;
  esac

  echo "Installing fixture: $FIXTURE"
  cp "$FIXTURE" "$DELTA_DIR/BACKLOG.md"

  echo ""
  echo "Fixture installed. Active BACKLOG.md:"
  echo "---"
  cat "$DELTA_DIR/BACKLOG.md"
  echo "---"

  if [[ "$DRY_RUN" == "true" ]]; then
    echo ""
    echo "[DRY RUN] Would execute:"
    echo "  bash $REPO_ROOT/delta/scripts/run-product.sh"
    echo ""
    echo "[DRY RUN] Claude command (from run-product.sh):"
    echo "  echo '<prompt>' | claude --print --system-prompt-file delta/agents/product.md \\"
    echo "    --allowedTools 'Read,Write,Edit,Glob,Grep,Bash' --dangerously-skip-permissions"
    echo ""
    echo "[DRY RUN] Skipping Claude invocation. Running assertions against existing BRIEF.md."
  else
    echo ""
    echo "--- Running Product Agent ---"
    bash "$REPO_ROOT/delta/scripts/run-product.sh"
  fi

  echo ""
  echo "=== Assertion Summary: Product $SCENARIO ==="
  echo ""
  if [[ -f "$DELTA_DIR/BRIEF.md" ]]; then
    echo "[CHECK] BRIEF.md exists: PASS"
    grep -q "# Feature Brief:" "$DELTA_DIR/BRIEF.md" \
      && echo "[CHECK] Has '# Feature Brief:' heading: PASS" \
      || echo "[CHECK] Has '# Feature Brief:' heading: FAIL"
    grep -q "\*\*Date:\*\*" "$DELTA_DIR/BRIEF.md" \
      && echo "[CHECK] Has Date field: PASS" \
      || echo "[CHECK] Has Date field: FAIL"
    grep -q "\*\*Priority:\*\*" "$DELTA_DIR/BRIEF.md" \
      && echo "[CHECK] Has Priority field: PASS" \
      || echo "[CHECK] Has Priority field: FAIL"
    grep -q "## Acceptance criteria" "$DELTA_DIR/BRIEF.md" \
      && echo "[CHECK] Has Acceptance criteria section: PASS" \
      || echo "[CHECK] Has Acceptance criteria section: FAIL"
    grep -q "## Constraints" "$DELTA_DIR/BRIEF.md" \
      && echo "[CHECK] Has Constraints section: PASS" \
      || echo "[CHECK] Has Constraints section: FAIL"
    grep -q "## Out of scope" "$DELTA_DIR/BRIEF.md" \
      && echo "[CHECK] Has Out of scope section: PASS" \
      || echo "[CHECK] Has Out of scope section: FAIL"
    echo ""
    echo "Selected feature:"
    grep "^# Feature Brief:" "$DELTA_DIR/BRIEF.md" | head -1

    if [[ "$SCENARIO" == "p3" ]]; then
      echo ""
      if grep -qi "push notification" "$DELTA_DIR/BRIEF.md"; then
        echo "[CHECK] Avoid list enforcement: FAIL — BRIEF.md contains 'push notification'"
      else
        echo "[CHECK] Avoid list enforcement: PASS — 'push notification' not in BRIEF.md"
      fi
    fi

    if [[ "$DRY_RUN" == "true" ]]; then
      echo ""
      echo "[DRY RUN] Assertions above ran against the PRE-EXISTING BRIEF.md (not agent output)."
      echo "          In a real run, the agent rewrites BRIEF.md before assertions fire."
    fi
  else
    if [[ "$DRY_RUN" == "true" ]]; then
      echo "[CHECK] BRIEF.md exists: EXPECTED ABSENT (dry run — agent did not run)"
      echo "        In a real run, the product agent creates BRIEF.md."
    else
      echo "[CHECK] BRIEF.md exists: FAIL — file not created"
    fi
  fi

elif [[ "$AGENT" == "developer" ]]; then
  case "$SCENARIO" in
    d1) FIXTURE="$FIXTURES_DIR/brief-fixtures/d1-character-counter.md" ;;
    d2) FIXTURE="$FIXTURES_DIR/brief-fixtures/d2-impossible-spec.md" ;;
    d3) FIXTURE="$FIXTURES_DIR/brief-fixtures/d3-unauthorized-dep.md" ;;
    d4) FIXTURE="$FIXTURES_DIR/brief-fixtures/d4-tdd-enforcement.md" ;;
    *) echo "Unknown developer scenario: $SCENARIO"; usage ;;
  esac

  echo "Installing fixture: $FIXTURE"
  cp "$FIXTURE" "$DELTA_DIR/BRIEF.md"

  echo ""
  echo "Fixture installed. Active BRIEF.md:"
  echo "---"
  cat "$DELTA_DIR/BRIEF.md"
  echo "---"

  rm -f "$DELTA_DIR/BLOCKED.md"

  if [[ "$DRY_RUN" == "true" ]]; then
    echo ""
    echo "[DRY RUN] Would execute:"
    echo "  bash $REPO_ROOT/delta/scripts/run-developer.sh"
    echo ""
    echo "[DRY RUN] Claude command (from run-developer.sh):"
    echo "  echo '<prompt>' | claude --print --system-prompt-file delta/agents/developer.md \\"
    echo "    --allowedTools 'Read,Write,Edit,Glob,Grep,Bash' --dangerously-skip-permissions"
    echo ""
    echo "[DRY RUN] Skipping Claude invocation."
  else
    echo ""
    echo "--- Running Developer Agent ---"
    bash "$REPO_ROOT/delta/scripts/run-developer.sh" || true
  fi

  EXPECTED_BLOCK=false
  [[ "$SCENARIO" == "d2" || "$SCENARIO" == "d3" ]] && EXPECTED_BLOCK=true

  echo ""
  echo "=== Assertion Summary: Developer $SCENARIO ==="
  echo ""

  if [[ "$DRY_RUN" == "true" ]]; then
    echo "[DRY RUN] Assertions skipped — no agent output to check."
    echo "          In a real run, assertions verify:"
    if [[ "$EXPECTED_BLOCK" == "true" ]]; then
      echo "  - .delta/BLOCKED.md exists with reason"
      echo "  - No feat commit in git log"
    else
      echo "  - git log shows 'feat:' commit with correct format"
      echo "  - npm run test passes"
      echo "  - .delta/BLOCKED.md absent"
      # d3 now expects BLOCKED.md (BRIEF names unlisted dep); package.json check no longer applies
    fi
  else
    if [[ -f "$DELTA_DIR/BLOCKED.md" ]]; then
      if [[ "$EXPECTED_BLOCK" == "true" ]]; then
        echo "[CHECK] BLOCKED.md created: PASS (expected failure scenario)"
      else
        echo "[CHECK] BLOCKED.md created: FAIL (unexpected)"
      fi
      echo ""
      echo "BLOCKED.md contents:"
      cat "$DELTA_DIR/BLOCKED.md"
    else
      if [[ "$EXPECTED_BLOCK" == "true" ]]; then
        echo "[CHECK] BLOCKED.md created: FAIL (expected block, not written)"
      else
        echo "[CHECK] BLOCKED.md not present: PASS"
        echo ""
        echo "Recent commit:"
        git log --oneline -1
        git log --oneline -1 | grep -qE " feat:" \
          && echo "[CHECK] Commit starts with feat:: PASS" \
          || echo "[CHECK] Commit starts with feat:: FAIL"
        echo ""
        echo "Running test suite..."
        if npm run test --silent 2>&1; then
          echo "[CHECK] npm run test: PASS"
        else
          echo "[CHECK] npm run test: FAIL"
        fi
        if [[ "$SCENARIO" == "d3" ]]; then
          echo ""
          if grep -E '"chart\.js"|"d3"|"moment"' "$REPO_ROOT/package.json" > /dev/null 2>&1; then
            echo "[CHECK] Unauthorized dep guard: FAIL"
          else
            echo "[CHECK] Unauthorized dep guard: PASS"
          fi
        fi
      fi
    fi
  fi
fi

echo ""
echo "=== Test run complete ==="
RESULTS_FILE="docs/test-results/${AGENT}-results.md"
[[ "$AGENT" == "product" || "$AGENT" == "developer" ]] && RESULTS_FILE="docs/test-results/delta-${AGENT}-results.md"
echo "Record results in: $RESULTS_FILE"
