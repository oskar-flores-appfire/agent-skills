# {{TITLE: <subject> autoresearch loop}}

Machinery for running automated research loops about
{{SUBJECT: what is being investigated}}, scaffolded from the `autoresearch`
skill.

The goal is to answer the open questions in {{DECISION_TARGET: plan doc /
ticket}} with EVIDENCE before implementing them.

This loop produces research artifacts only (logs, results, reports,
recommendations). It never edits production code under
{{PROTECTED_PATHS}}.

## The loop

```
           +--------------------------------------------------+
           |                    loop.sh                        |
           |  (spawns one headless engine iteration at a time: |
           |   claude -p | codex exec | custom command)        |
           +------------------------+-------------------------+
                                    |
                                    v
   read QUESTIONS.md + NOTEBOOK.md ---> pick ONE open question
                                    |
                                    v
        pre-register hypothesis in logs/YYYY-MM-DD-<slug>.md
                                    |
                                    v
              run the CHEAPEST tier that can answer it
                                    |
                                    v
     record result in NOTEBOOK.md, update QUESTIONS.md
                                    |
                                    v
   loop.sh commits the artifacts; all questions resolved? ---> touch STOP
```

## Tiers (ordered by cost, always try the cheaper tier first)

| Tier | What | Cost | How |
|---|---|---|---|
| MINE | Extract answers from existing artifacts: {{MINE_SOURCES: e.g. trace tables, logs, past run outputs}} | free | {{MINE_HOW: e.g. `mining/*.sql` against local DB}} |
| MICRO | Single LLM calls per fixture case with prompt variants | ~cents/case | `harnesses/micro_runner.py` |
| FULL | {{FULL_WHAT: e.g. real test suite or full pipeline replay}} | minutes + build | {{FULL_HOW}} |

## Quality gates (non-negotiable, enforced by LOOP_PROMPT.md)

1. Every experiment starts with a prediction in a dated log BEFORE execution.
   Negative results are recorded with the same care as positive ones.
2. Every MICRO battery includes the unmodified v1/v1 control.
3. Repetitions: minimum 3 reps per case. A single-run delta under ~20 percent
   is noise, do not conclude from it.
4. Manual inspection: read at least 3 raw rationales per battery and note
   anomalies in the log. Automated scoring alone is not evidence.
5. Fixture realism: fixtures must be validated against real inputs mined from
   {{REAL_INPUT_SOURCE}} (see Q0 in QUESTIONS.md) before their results are
   trusted.
6. The baseline must be capable of failure. If v1 scores 100 percent on the
   fixture set, the fixtures are too easy: harden them before testing variants.

## Layout

```
README.md          this file
QUESTIONS.md       open research questions backlog (the loop's work queue)
NOTEBOOK.md        append-only lab notebook, one entry per experiment
LOOP_PROMPT.md     per-iteration protocol fed to the engine
loop.sh            the driver (also commits each iteration's artifacts)
harnesses/
  prompts.py       production prompt v1 verbatim + variants + user builders
  micro_runner.py  stdlib-only micro-test runner
fixtures/
  cases.jsonl      labeled cases (inputs + expected answer)
mining/            MINE-tier queries and scripts
logs/              dated hypothesis pre-registrations + loop run logs
campaigns/         raw MICRO results (JSON), one folder per campaign
reports/           synthesized findings and recommendations
viewer.html        offline campaign-JSON inspector (open in a browser)
STOP               create this file to stop the loop
```

## Requirements

- {{MICRO_API_KEY_ENV}} in the environment for MICRO. The harness should match
  production model and temperature: {{MODEL_AND_CONFIG: e.g. gpt-5.4, temp 0.0}}.
- An agent CLI with a headless mode for `loop.sh`: `claude` (default) or
  `codex` (`ENGINE=codex`); any other CLI via `AUTORESEARCH_AGENT_CMD`.
- MINE: {{MINE_REQUIREMENTS: e.g. a running local DB, or a read-only cloud
  profile}}.
- FULL: {{FULL_REQUIREMENTS: e.g. toolchain and one-time build steps}}.

## Launch

```bash
cd {{RESEARCH_DIR}}
./loop.sh              # Claude Code, 5 iterations max by default
MAX_ITER=10 ./loop.sh  # more
ENGINE=codex ./loop.sh # OpenAI Codex CLI instead
touch STOP             # graceful stop after the current iteration
```

`loop.sh` passes NO permission flags to the engine by default; headless
iterations will fail on tool calls your engine's settings do not allow. Choose
your own posture explicitly:

```bash
# Claude Code
AUTORESEARCH_AGENT_FLAGS="--permission-mode acceptEdits" ./loop.sh

# Codex (exec defaults to a read-only sandbox; the loop needs workspace writes)
ENGINE=codex AUTORESEARCH_AGENT_FLAGS="--sandbox workspace-write" ./loop.sh

# Any other engine: full command line, LOOP_PROMPT.md arrives on stdin
AUTORESEARCH_AGENT_CMD='opencode run "$(cat LOOP_PROMPT.md)"' ./loop.sh
```

Codex-specific notes:

- MICRO needs network inside the sandbox: add `[sandbox_workspace_write]`
  `network_access = true` to `~/.codex/config.toml`, or every MICRO question
  comes back BLOCKED.
- The Codex sandbox keeps `.git` read-only; that is fine here because commits
  are made by `loop.sh` after each iteration, never by the agent.
- Headless `codex exec` fails in untrusted directories; run `codex` once
  interactively in this repo to trust it first.

Running `loop.sh` is your explicit consent for the DRIVER to commit each
iteration's research artifacts on this branch. Nothing is ever pushed.

## Inspecting results

Open `viewer.html` in a browser and load one or more
`campaigns/<slug>/<battery>.json` files (file picker or drag and drop). Cases
fold open to show per-rep answers, rationales, latency, and raw output; loading
two batteries side by side gives a control-vs-variant comparison.

For a one-link view, serve this directory and pass the files in the URL:

```bash
python3 -m http.server 8734
# then open:
# http://localhost:8734/viewer.html?files=campaigns/<a>/control.json,campaigns/<b>/variant.json
```

The first file listed is treated as the comparison baseline.

## Faithfulness caveats (MICRO vs production)

Record here every known divergence between the harness and production, with
evidence. Examples of what belongs here: model alias vs dated snapshot,
response-format handling, prompt-assembly steps invisible in traces, retrieval
config the fixtures assume. Every MICRO conclusion is read through this list.

- {{CAVEAT_1: none verified yet}}
