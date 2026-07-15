# Oskar's Agent Skills

Personal collection of reusable [Agent Skills](https://github.com/vercel-labs/skills) by Oskar Flores, for AI coding agents (Claude Code, Codex, Cursor, OpenCode, and others). Each skill is a folder under `skills/` containing a `SKILL.md` with YAML frontmatter plus any supporting templates or references.

## Installation

Install with the [skills CLI](https://www.npmjs.com/package/skills). No setup needed beyond Node and git access to this repo:

```bash
# Interactive: pick which skills and which agents to install to
npx skills add oskar-flores-appfire/agent-skills

# Install one specific skill
npx skills add oskar-flores-appfire/agent-skills --skill spec-summarizer
npx skills add oskar-flores-appfire/agent-skills --skill building-interactive-decks
npx skills add oskar-flores-appfire/agent-skills --skill autoresearch

# Install everything, non-interactively, for Claude Code
npx skills add oskar-flores-appfire/agent-skills --skill '*' -a claude-code -y

# Install globally (user-level, available in every project)
npx skills add oskar-flores-appfire/agent-skills -g
```

Skills land in your agent's skills directory (for Claude Code: `.claude/skills/` in the project, or `~/.claude/skills/` with `-g`). Update later with `npx skills update`, remove with `npx skills remove`.

> [!NOTE]
> This is a private repository. The skills CLI resolves it through git, so installs work as long as your local git credentials (or the `gh` CLI) can clone it.

## Skills

| Skill | What it does |
|---|---|
| [`spec-summarizer`](skills/spec-summarizer/SKILL.md) | Turns a long technical spec, design doc, RFC, or PRD into a ~2-page GitHub-flavored summary that stakeholders actually read. Grounds every claim in the source, then validates the result with an automatic fresh-reader test before declaring done. |
| [`building-interactive-decks`](skills/building-interactive-decks/SKILL.md) | House style and a reusable slide-deck engine for interactive presentations: one JS module per slide, keyboard-driven build steps, Motion-based animations, and a verification checklist. Ships the full `templates/` engine so a new deck starts with one copy command. |
| [`autoresearch`](skills/autoresearch/SKILL.md) | Scaffolds a self-contained autonomous research loop that answers empirical questions about a prompt, threshold, or config with evidence before you implement changes: questions backlog, pre-registered experiments, tiered MINE/MICRO/FULL cost ladder, append-only lab notebook, headless `claude -p` driver, and an offline HTML results viewer. |

### spec-summarizer

Use it when a spec is too long to share and nobody will read it.

Two output modes:

- **Companion** (default): writes `<spec>.summary.md` next to the spec, linked both ways.
- **Prepend**: inserts the summary as the spec's first section, between markers that let you split it back out later with a one-line script.

The summary leads with the takeaway and a decisions table, includes exactly one Mermaid diagram, and tucks extra depth into a collapsible drill-down.

Before declaring done, the skill runs a Reader Test: a fresh agent, given only the summary, must answer the questions a reviewer would ask. Gaps get revised until they pass.

### building-interactive-decks

Use it to build an interactive slide deck for a demo or architecture walkthrough.

Three steps:

1. Copy the bundled `templates/` folder to your docs.
2. Write one JS module per slide.
3. Serve the folder statically.

The engine handles keyboard navigation, per-slide build steps, an overview grid, and instant replay when stepping back. It is fully self-contained; the only external dependency is the Motion animation CDN.

### autoresearch

Use it when a prompt, threshold, or config change is justified by a hypothesis instead of evidence, and there is a backlog of questions worth answering unattended. Do not reach for it for a one-off "does wording B beat A" check; copy the bundled harness and run one battery manually instead.

How to use it:

1. **Instantiate** (interactive, once). Invoke the skill in the target repo. It interviews you for the subject, the protected production paths, where existing artifacts live (MINE tier), the expensive tier (FULL), the model/config to mirror, and the per-iteration API budget. It then scaffolds a self-contained `research/<slug>-autoresearch/` directory from `templates/`.
2. **Turn the goal into questions.** "Improve the prompt" is a goal, not a question. The skill helps write `QUESTIONS.md`: Q0 (are the fixtures realistic?) always gates everything, "what actually fails today" (free, mined from real data) comes before "does my fix work" (paid micro-calls), and every question carries a falsifiable numeric prediction.
3. **Port and label.** Production prompts go byte-faithful into `harnesses/prompts.py` as v1; labeled cases go into `fixtures/cases.jsonl` (tag cases per source dataset to compare datasets via `--tags`). Two marked seams in `micro_runner.py` adapt scoring to your domain.
4. **Run the loop.** `./loop.sh` spawns one headless `claude -p` iteration at a time: pick one question, pre-register a prediction in a dated log, run the cheapest tier that answers it (always with a v1/v1 control battery), inspect raw outputs manually, append to the notebook, commit. `touch STOP` stops it gracefully; it stops itself when every question is RESOLVED or BLOCKED.
5. **Consume the results.** Findings land in `NOTEBOOK.md` and `reports/` (recommendations mapped to your plan doc or ticket). Open `viewer.html` in a browser to inspect campaign JSONs: click a case to fold open per-rep answers, rationales, latency, and raw output; load two batteries for a control-vs-variant comparison.

The scaffolded directory is fully self-contained: it runs headless with no dependency on this skill being installed, and each instantiation may freely edit its own harness copies.

## Repository layout

```
skills/
  spec-summarizer/
    SKILL.md                  skill definition and workflow
    references/               summary template the skill fills in
  building-interactive-decks/
    SKILL.md                  skill definition and conventions
    templates/                copy-paste deck engine (index.html + modules)
  autoresearch/
    SKILL.md                  skill definition and instantiation procedure
    templates/                copy-paste research-loop scaffold (driver,
                              protocol, harness, fixtures, viewer.html)
```

## Adding a new skill

1. Create `skills/<kebab-case-name>/SKILL.md` (or scaffold with `npx skills init <name>` and move it under `skills/`).
2. Frontmatter needs `name` (matching the folder) and `description` (what it does and when an agent should reach for it; concrete trigger phrases help agents fire it reliably).
3. Keep supporting material next to the SKILL.md (`references/`, `templates/`); relative paths travel with the install.
4. Open a PR. Once merged, `npx skills update` picks it up.
