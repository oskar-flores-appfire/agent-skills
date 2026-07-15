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

Useful when you want evidence before changing a prompt, threshold, or config, and there is a pile of "is this actually true?" questions worth answering unattended.

Say something like:

> "Our judge prompt seems to answer *none* too often. Before we rewrite it, I want the two wording variants tested against real cases. Set up an autoresearch loop."

The skill converts that into steps:

1. **Scaffold** — interviews you (subject, protected paths, data sources, model config, budget) and creates a self-contained `research/<slug>-autoresearch/` folder.
2. **Goal → questions** — turns "improve the prompt" into falsifiable questions in `QUESTIONS.md`, each with a numeric prediction; "what actually fails today" (free data mining) always comes before "does my fix work" (paid calls).
3. **Port + label** — production prompt goes byte-faithful into `harnesses/prompts.py` as v1; labeled cases into `fixtures/cases.jsonl`.
4. **Run** — `./loop.sh` grinds through the questions, one headless experiment per iteration, committing its evidence as it goes. `touch STOP` stops it.
5. **Read results** — findings in `NOTEBOOK.md` and `reports/`; open `viewer.html` to click through cases, model rationales, and control-vs-variant comparisons.

Not for a one-off "does wording B beat A" check — copy the bundled harness and run one battery manually instead. The scaffolded folder is fully self-contained; the loop runs without this skill installed.

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
