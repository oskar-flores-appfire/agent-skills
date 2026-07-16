#!/usr/bin/env bash
# Autoresearch driver: runs headless agent iterations until MAX_ITER or STOP.
# Usage: ./loop.sh                 (from the research directory; Claude Code)
#        ENGINE=codex ./loop.sh    (OpenAI Codex CLI)
#        MAX_ITER=10 ./loop.sh
#
# Engine selection:
#   ENGINE                     claude (default) | codex
#   AUTORESEARCH_ENGINE_BIN    binary override (defaults to the engine name)
#   AUTORESEARCH_AGENT_FLAGS   extra flags for the engine invocation
#   AUTORESEARCH_AGENT_CMD     escape hatch for any other CLI: a full command
#                              line, eval'd with LOOP_PROMPT.md on stdin.
#                              Arg-only CLIs can substitute the prompt inline:
#                              AUTORESEARCH_AGENT_CMD='opencode run "$(cat LOOP_PROMPT.md)"'
#
# Permission posture is YOURS to choose, deliberately not defaulted here.
# Headless iterations will fail on any tool call your engine's settings do
# not allow. Review LOOP_PROMPT.md, then pass the flags you are comfortable
# with, e.g.:
#   AUTORESEARCH_AGENT_FLAGS="--permission-mode acceptEdits" ./loop.sh
#   ENGINE=codex AUTORESEARCH_AGENT_FLAGS="--sandbox workspace-write" ./loop.sh
# Codex: exec defaults to a read-only sandbox, so pass at least
# --sandbox workspace-write; see the README "Launch" section for the
# network-access config MICRO needs.
#
# THIS DRIVER commits the research artifacts after each iteration; the agent
# never runs git itself (some engine sandboxes keep .git read-only).
# Launching this script is the operator's consent for those commits on this
# branch. Nothing is pushed.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

MAX_ITER="${MAX_ITER:-5}"
ENGINE="${ENGINE:-claude}"
ENGINE_BIN="${AUTORESEARCH_ENGINE_BIN:-$ENGINE}"
AGENT_FLAGS="${AUTORESEARCH_AGENT_FLAGS:-${AUTORESEARCH_CLAUDE_FLAGS:-}}"
AGENT_CMD="${AUTORESEARCH_AGENT_CMD:-}"
ENGINE_LABEL="${AGENT_CMD:+custom}"
ENGINE_LABEL="${ENGINE_LABEL:-$ENGINE}"
RUN_LOG_DIR="logs/loop-runs"

# Commit convention. Set these two defaults at instantiation; env overrides.
COMMIT_PREFIX="${AUTORESEARCH_COMMIT_PREFIX:-autoresearch}"
COMMIT_FLAGS="${AUTORESEARCH_COMMIT_FLAGS:-}"   # e.g. --no-verify if hooks block

if [[ -z "$AGENT_CMD" ]]; then
  case "$ENGINE" in
    claude|codex) ;;
    *) echo "unknown ENGINE '$ENGINE'; use claude, codex, or set AUTORESEARCH_AGENT_CMD" >&2; exit 64 ;;
  esac
  command -v "$ENGINE_BIN" >/dev/null || { echo "$ENGINE_BIN CLI not found (ENGINE=$ENGINE)" >&2; exit 1; }
fi
mkdir -p "$RUN_LOG_DIR" campaigns reports mining fixtures

if grep -q '{{' LOOP_PROMPT.md README.md QUESTIONS.md 2>/dev/null; then
  echo "unfilled {{placeholders}} remain in LOOP_PROMPT.md/README.md/QUESTIONS.md; finish instantiation first" >&2
  exit 1
fi

# Edit if your MICRO tier uses a different provider than OpenAI.
if [[ -z "${OPENAI_API_KEY:-}" ]]; then
  echo "WARN: OPENAI_API_KEY not set. MICRO-tier questions will be marked BLOCKED." >&2
fi

run_agent() {
  if [[ -n "$AGENT_CMD" ]]; then
    eval "$AGENT_CMD" < LOOP_PROMPT.md
    return
  fi
  # shellcheck disable=SC2086  # AGENT_FLAGS is intentionally word-split
  case "$ENGINE" in
    claude) "$ENGINE_BIN" -p $AGENT_FLAGS < LOOP_PROMPT.md ;;
    codex)  "$ENGINE_BIN" exec $AGENT_FLAGS - < LOOP_PROMPT.md ;;
  esac
}

# Commit everything under the research dir except the STOP control file.
commit_artifacts() {
  local iter="$1" newest slug
  if [[ -z "$(git status --porcelain -- . ':!STOP')" ]]; then
    return 0
  fi
  newest="$(ls -t logs/*.md 2>/dev/null | head -n 1 || true)"
  slug="${newest:+$(basename "$newest" .md)}"
  git add -A -- . ':!STOP'
  # shellcheck disable=SC2086  # COMMIT_FLAGS is intentionally word-split
  if ! git commit $COMMIT_FLAGS -m "$COMMIT_PREFIX iter $iter: ${slug:-artifacts}" -- . ':!STOP'; then
    echo "commit failed for iteration $iter; artifacts left uncommitted" >&2
  fi
}

for ((i = 1; i <= MAX_ITER; i++)); do
  if [[ -f STOP ]]; then
    echo "STOP file present, exiting before iteration $i."
    break
  fi
  stamp="$(date +%Y%m%d-%H%M%S)"
  run_log="$RUN_LOG_DIR/iter-${i}-${stamp}.log"
  echo "=== iteration $i/$MAX_ITER ($stamp, engine: $ENGINE_LABEL) -> $run_log ==="

  if ! run_agent 2>&1 | tee "$run_log"; then
    echo "Iteration $i failed (see $run_log). Continuing after pause." >&2
  fi

  commit_artifacts "$i"

  if [[ -f STOP ]]; then
    echo "STOP created during iteration $i, exiting."
    break
  fi
  sleep 5
done

echo "Loop finished. Notebook tail:"
tail -n 30 NOTEBOOK.md || true
