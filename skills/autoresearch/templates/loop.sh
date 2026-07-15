#!/usr/bin/env bash
# Autoresearch driver: runs claude -p iterations until MAX_ITER or STOP.
# Usage: ./loop.sh            (from the research directory)
#        MAX_ITER=10 ./loop.sh
#
# Permission posture is YOURS to choose, deliberately not defaulted here.
# Headless iterations will fail on any tool call your Claude Code settings do
# not already allow. Review LOOP_PROMPT.md, then pass the flags you are
# comfortable with, e.g.:
#   AUTORESEARCH_CLAUDE_FLAGS="--permission-mode acceptEdits" ./loop.sh
#
# Launching this script is the operator's consent for each iteration to
# commit its research artifacts on this branch. Nothing is pushed.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

MAX_ITER="${MAX_ITER:-5}"
CLAUDE_BIN="${CLAUDE_BIN:-claude}"
CLAUDE_FLAGS="${AUTORESEARCH_CLAUDE_FLAGS:-}"
RUN_LOG_DIR="logs/loop-runs"

command -v "$CLAUDE_BIN" >/dev/null || { echo "claude CLI not found" >&2; exit 1; }
mkdir -p "$RUN_LOG_DIR" campaigns reports mining fixtures

if grep -q '{{' LOOP_PROMPT.md README.md QUESTIONS.md 2>/dev/null; then
  echo "unfilled {{placeholders}} remain in LOOP_PROMPT.md/README.md/QUESTIONS.md; finish instantiation first" >&2
  exit 1
fi

# Edit if your MICRO tier uses a different provider than OpenAI.
if [[ -z "${OPENAI_API_KEY:-}" ]]; then
  echo "WARN: OPENAI_API_KEY not set. MICRO-tier questions will be marked BLOCKED." >&2
fi

for ((i = 1; i <= MAX_ITER; i++)); do
  if [[ -f STOP ]]; then
    echo "STOP file present, exiting before iteration $i."
    break
  fi
  stamp="$(date +%Y%m%d-%H%M%S)"
  run_log="$RUN_LOG_DIR/iter-${i}-${stamp}.log"
  echo "=== iteration $i/$MAX_ITER ($stamp) -> $run_log ==="

  # shellcheck disable=SC2086  # CLAUDE_FLAGS is intentionally word-split
  if ! "$CLAUDE_BIN" -p "$(cat LOOP_PROMPT.md)" $CLAUDE_FLAGS 2>&1 | tee "$run_log"; then
    echo "Iteration $i failed (see $run_log). Continuing after pause." >&2
  fi

  if [[ -f STOP ]]; then
    echo "STOP created during iteration $i, exiting."
    break
  fi
  sleep 5
done

echo "Loop finished. Notebook tail:"
tail -n 30 NOTEBOOK.md || true
