---
name: autoresearch
description: Use when empirical questions about a prompt, threshold, or config should be answered with evidence before implementing changes, or when prompt variants must be evaluated against real data. Triggers on "set up an autoresearch loop", "answer these questions with evidence", "A/B test this prompt", "research this before we implement", "is this hypothesis actually true in our data".
---

# autoresearch

## Overview

Scaffold and instantiate an autonomous research loop that grinds through a
backlog of falsifiable questions, one pre-registered experiment per iteration,
and leaves an evidence trail a reviewer can trust a week later. Modeled on
[superpowers-autoresearch](https://github.com/prime-radiant-inc/superpowers-autoresearch),
generalized from the SignalIQ LLM-judge research loop (ITRE-480).

Core principle: the loop does not "improve" anything directly. It resolves
QUESTIONS with evidence; implementation happens afterwards, elsewhere, guided
by `reports/recommendations.md`. The loop never edits production code.

The single most valuable habit it enforces: measure what actually fails
(free, from existing data) before testing any fix. Plans routinely encode a
premise that real traffic refutes.

## When to use

- A prompt, threshold, or config change is planned and the justification is a
  hypothesis, not evidence.
- There are 5+ interlocking open questions worth answering unattended.
- You want pre-registration discipline: predictions written before results,
  negative results recorded, controls always run.

When NOT to use: a single quick "does wording B beat A" check. Just copy
`templates/harnesses/` and run one battery manually; the loop's overhead pays
off only on a backlog.

## Prerequisites (check during the interview, refuse politely if absent)

1. **Scoreable output.** The subject produces a verdict that can be scored
   mechanically (a class, an index, a number, structured JSON). Free-text
   output needs a grading scheme first; flag that as extra work.
2. **Ground truth.** Labeled cases, or real traffic whose correct outcomes
   can be established. No labels, no loop.

## Instantiation procedure

### 1. Interview the operator

Collect, with concrete suggestions from the codebase where possible:

| Placeholder | Meaning |
|---|---|
| SUBJECT | One line: what is being investigated |
| RESEARCH_DIR | Target directory, e.g. `research/<slug>-autoresearch/` |
| BRANCH | Dedicated branch (a worktree keeps the loop isolated) |
| PROTECTED_PATHS | Production paths the loop must never modify |
| DECISION_TARGET | The plan doc / ticket the findings inform |
| MINE sources | Where existing artifacts live (trace tables, logs, past runs) |
| FULL tier | The expensive tier (test suite, pipeline replay) and its prereqs |
| MICRO_API_KEY_ENV, model, temperature | Match production exactly |
| MAX_API_CALLS | Per-iteration budget (default 60) |
| COMMIT_PREFIX, COMMIT_FLAGS | Commit convention; `--no-verify` if hooks block |

### 2. Scaffold

Copy everything under `templates/` into RESEARCH_DIR (preserve the directory
structure: `harnesses/`, `fixtures/`, `logs/`), then `chmod +x loop.sh` and
`mkdir -p campaigns mining reports`. Fill every `{{PLACEHOLDER}}` in
`LOOP_PROMPT.md`, `README.md`, and `QUESTIONS.md` from the interview. Grep for
`{{` afterwards; none may remain.

### 3. Write QUESTIONS.md with the operator

Convert the goal into falsifiable questions. Rules:

- Q0 (fixture realism) is always first and gates all MICRO conclusions.
- Prefer "what actually fails today" (MINE, free) before "does my fix work"
  (MICRO, cents) before anything FULL (minutes + build).
- One hypothesis per question, each with a named metric, case filter, and a
  number that counts as success.

### 4. Port production prompts

Fill `harnesses/prompts.py` following the rules in its docstring: SYSTEM_V1
and `build_user_v1` byte-faithful to production, source files named in
comments. Record invisible production prompt-assembly steps
(framework-appended format instructions, middleware) in the README
"Faithfulness caveats" section as they are discovered.

### 5. Adapt the harness seams

`harnesses/micro_runner.py` documents its two EDIT SEAMs (`parse_verdict`,
`summarize`) and the transport seam inline. Touch only those; leave the
budget guard, majority voting, and TLS fallback alone.

### 6. Build fixtures

`fixtures/cases.jsonl`; the schema and tag conventions are in its comment
header. Labels are the bottleneck; mined real cases with known outcomes beat
synthetic ones.

### 7. Verify before handoff

- `bash -n loop.sh` and `python3 harnesses/micro_runner.py --dry-run` both
  succeed; the dry run prints prompts that look byte-identical to production.
- No `{{` placeholders remain anywhere.
- QUESTIONS.md has Q0 plus at least one MINE and one MICRO question.

### 8. Hand off

Tell the operator: how to launch (`./loop.sh`, `MAX_ITER`, permission posture
via `AUTORESEARCH_CLAUDE_FLAGS`), how to stop (`touch STOP`), where results
land (NOTEBOOK.md, `reports/`), and how to inspect campaigns: `viewer.html`
in a browser (file picker or drag and drop), or serve the research directory
with `python3 -m http.server` and open
`viewer.html?files=<control>.json,<variant>.json` for a preloaded one-link
view (the first file listed is the comparison baseline).
Launching the loop is the operator's consent for per-iteration commits;
nothing is ever pushed.

## Binding method rules

The six quality gates in the scaffolded `README.md` bind every iteration;
`LOOP_PROMPT.md` enforces them. Do not weaken them while filling placeholders.

## Self-containment rule

The scaffolded directory must run headless with NO dependency on this skill
being installed. `loop.sh` inlines `LOOP_PROMPT.md`; the harness is stdlib
Python; the viewer is one static HTML file. Each instantiation may freely
edit its own copies (harness fixes are legitimate per-iteration artifacts)
without touching the skill.
