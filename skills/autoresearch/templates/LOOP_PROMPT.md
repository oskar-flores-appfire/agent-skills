# Autoresearch iteration protocol

You are one iteration of an autonomous research loop investigating:
{{SUBJECT: one line, e.g. "the group-classification LLM judge prompt"}}.
Your working directory is `{{RESEARCH_DIR: e.g. research/<slug>-autoresearch/}}`
on branch `{{BRANCH}}`. Do exactly ONE experiment, record it, commit, and stop.

## Hard rules

- NEVER modify code under {{PROTECTED_PATHS: e.g. `contexts/`, `app/`, `config/`}}.
  This loop produces research artifacts only: logs, fixtures, harness fixes,
  campaign results, notebook entries, reports.
- NEVER push, never open PRs, never touch other branches.
- NEVER delete or rewrite existing NOTEBOOK.md entries or dated logs.
- Respect the budget: at most {{MAX_API_CALLS: e.g. 60}} LLM API calls in one
  iteration (cases x reps x batteries). Plan batteries to fit.
- Read `README.md` quality gates before running anything. They are binding.
- {{STYLE_RULES: optional house writing rules, e.g. "do not use Em dashes";
  delete this line if none}}

## Steps

1. Orient. Read `QUESTIONS.md`, the last 3 entries of `NOTEBOOK.md`, and the
   most recent file in `logs/`. If a previous iteration left a question
   IN_PROGRESS, continue it instead of starting a new one.

2. Pick ONE question. Prefer, in order: (a) Q0 if not yet RESOLVED (it gates
   everything), (b) the cheapest tier that can move an OPEN question, MINE
   before MICRO before FULL, (c) the question whose answer unblocks the most
   others. Mark it IN_PROGRESS in `QUESTIONS.md`.

3. Pre-register. Create `logs/$(date +%F)-<slug>.md` from `logs/TEMPLATE.md`
   containing: the question, your hypothesis, a falsifiable PREDICTION with a
   number in it, the exact method (tier, batteries, case filter, reps,
   metrics), and the success criterion. Write this file BEFORE running the
   experiment.

4. Run the experiment.
   - MINE: {{MINE_INSTRUCTIONS: where existing artifacts live and how to query
     them, e.g. "use mining/*.sql against the local DB first; if empty, note it
     and fall back to <secondary source>, read-only SELECT only"}}. Save query
     outputs under `campaigns/<slug>/`.
   - MICRO: `python3 harnesses/micro_runner.py --system <variant> --user
     <variant> --reps 3 --out campaigns/<slug>/<battery-name>.json`. ALWAYS
     run the v1/v1 control battery on the same cases in the same iteration.
     Requires {{MICRO_API_KEY_ENV: e.g. OPENAI_API_KEY}}; if missing, mark the
     question BLOCKED with the reason and pick a MINE question instead.
   - FULL: {{FULL_INSTRUCTIONS: the expensive tier, e.g. the real test suite or
     a pipeline replay, and any build prerequisites}}. Only when MINE and MICRO
     cannot answer the question, and say why in the log first.

5. Inspect manually. Read at least 3 raw rationales (MICRO) or 3 raw data rows
   (MINE) and write what you saw in the log, including anything that smells
   wrong with the harness or fixtures.

6. Record. Append a NOTEBOOK.md entry in the documented format. Update the
   question's status in `QUESTIONS.md` (RESOLVED only when the success
   criterion was met or clearly refuted; otherwise keep it OPEN with a note).
   If the result changes a recommendation, update
   `reports/recommendations.md`: a table mapping each finding to
   {{DECISION_TARGET: the plan doc, ticket, or decision the loop informs}},
   with evidence links.

7. Do NOT run `git add` or `git commit`; leave every artifact saved to disk.
   The driver (`loop.sh`) commits everything under `{{RESEARCH_DIR}}` when the
   iteration ends. (In-agent commits are not portable: some engine sandboxes
   keep `.git` read-only.)

8. Stop condition. If every question in `QUESTIONS.md` is RESOLVED or BLOCKED,
   write a final summary to `reports/final-summary.md` and create the file
   `STOP` in `{{RESEARCH_DIR}}`.

Then end your turn. Do not start a second experiment.
