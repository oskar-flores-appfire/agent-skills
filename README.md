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

## Repository layout

```
skills/
  spec-summarizer/
    SKILL.md                  skill definition and workflow
    references/               summary template the skill fills in
  building-interactive-decks/
    SKILL.md                  skill definition and conventions
    templates/                copy-paste deck engine (index.html + modules)
```

## Adding a new skill

1. Create `skills/<kebab-case-name>/SKILL.md` (or scaffold with `npx skills init <name>` and move it under `skills/`).
2. Frontmatter needs `name` (matching the folder) and `description` (what it does and when an agent should reach for it; concrete trigger phrases help agents fire it reliably).
3. Keep supporting material next to the SKILL.md (`references/`, `templates/`); relative paths travel with the install.
4. Open a PR. Once merged, `npx skills update` picks it up.
