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

Use it when a spec is too long to share and nobody will read it. It produces either a companion `<spec>.summary.md` linked to the source, or a summary prepended to the spec between mechanical split markers. The output leads with a takeaway callout and a decisions table, includes exactly one Mermaid diagram, and ends with a collapsible drill-down. A bounded Reader Test (a fresh agent answering reviewer questions from the summary alone) catches gaps before you ship it.

### building-interactive-decks

Use it when building an interactive presentation, explainer, or architecture walkthrough. Copy the bundled `templates/` folder, write one module per slide, and serve it statically. The engine handles navigation dots, an overview grid, hash routing, and instant replay on back-navigation. House conventions: light theme, Inter + JetBrains Mono, no em dashes, no emojis. The engine is self-contained and works in any repo; the only external dependency is the Motion CDN.

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
