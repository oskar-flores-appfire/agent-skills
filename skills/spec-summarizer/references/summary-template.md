# Summary template

Fill every slot. Omit a section only if the source spec genuinely has nothing for it (e.g. no phasing). Keep the whole body under ~500 words and use exactly one diagram.

This template uses GitHub-Flavored Markdown affordances that make the page friendlier for human readers: alert callouts, a rendered Mermaid diagram, and a collapsible drill-down. See "Human-readability affordances" below for the rules.

````markdown
# <Spec title> (shareable summary)

> Status: <status> · <epic / ticket refs> · Full spec: [<filename>](<relative-link-to-source>) · Reflects the spec as of <source revision / latest changelog date>

<One sentence: the single most important thing to understand, in plain language. The "share it in Slack" hook.>

> [!IMPORTANT]
> <The one reassurance or takeaway a reader must leave with, e.g. "Scores do not change, only the plumbing does, and the frontend needs no change.">

## Summary

- **Problem:** <1-2 sentences: what is wrong today>
- **Change:** <what we are building, in 1-2 sentences>
- **Why it is safe:** <the key reassurance: parity, no breaking change, reversibility>
- **Blast radius:** <what is affected and, just as important, what is not>
- **The ask:** <what the reader is being asked to do: approve these decisions, review phasing>

## Decisions

| Decision | Resolution | Why not the alternative |
|---|---|---|
| <name> | <what was chosen> | <why the other options lose> |

## How it works (one diagram)

```mermaid
<A single diagram. Reuse or simplify the clearest one from the source. GitHub renders mermaid natively.>
```

<0-4 bullets walking the diagram, only if it is not self-explanatory.>

## Phasing

<Include only if the spec is phased.>

| Phase | Scope | Delivers |
|---|---|---|

> [!WARNING]
> <A risk or caveat a reader must not miss: a watch item, a one-way door, an accepted-for-MVP tradeoff. Omit this callout entirely if the spec has none.>

## Out of scope

<One line listing what a reader might expect but is deliberately excluded.>

<details>
<summary><strong>Drill-down</strong> (open for what the full spec covers)</summary>

See the full spec for: <comma-separated list of the heavy detail that lives there: derivations, schema, SQL, sequence diagrams, acceptance scenarios, full implementation plan>.

</details>
````

## Mode wiring

**Companion (default):** the summary is its own file, with the `Full spec:` down-link in the header above. Add the matching up-link as a single line near the top of the spec (after its title or metadata table):

```markdown
> Shareable summary: [<spec-name>.summary.md](<relative-link-to-summary>)
```

**Prepend (opt-in):** make the summary the spec's first section, in one file, wrapped in markers so it can be split out later with no LLM. The `Full spec:` link becomes an in-page note ("full detail below") since it is the same file:

```markdown
<!-- spec-summary:begin (reflects <spec> as of <date>) -->

<the whole summary body goes here>

<!-- spec-summary:end -->

<the original spec, unchanged, follows below>
```

Everything outside the markers is left byte-for-byte unchanged, so re-running regenerates only the block between them.

## Layout notes

- The narrative lede plus the `[!IMPORTANT]` callout plus Summary must let a reader grasp the whole change in under 90 seconds.
- The decisions table is what a reviewer signs off on. It comes near the top, not buried in prose or pushed to the end.
- One diagram only. More than one diagram is detail that belongs in the drill-down.

## Human-readability affordances (GitHub-Flavored Markdown)

These render for human readers on GitHub (READMEs, issues, PRs, wikis). Use them, but sparingly.

- **Alert callouts:** `> [!NOTE]`, `> [!TIP]`, `> [!IMPORTANT]`, `> [!WARNING]`, `> [!CAUTION]`. Use at most two or three in a summary: one `[!IMPORTANT]` for the key takeaway, optionally one `[!WARNING]`/`[!CAUTION]` for a risk. Overusing them defeats the point.
- **Collapsible sections:** `<details><summary>…</summary>` hides content behind a click. Use it for the drill-down pointer and any optional deep supporting detail. Add `open` (`<details open>`) to start expanded.
- **Mermaid:** a ```` ```mermaid ```` fenced block renders as a diagram on GitHub. Prefer it for the one diagram.
- **Task lists / footnotes / tables** are all native GFM and fine to use.

### Rules

- **Decisions and safety-critical claims stay visible.** Never place the decisions table, the Summary, or any reviewer-approved / safety-critical claim inside a collapsed `<details>`. A human collapses past it and misses the thing they must approve. Collapse only the drill-down and optional depth.
- **Blank lines around `<details>` internals.** Leave a blank line after `</summary>` and around any Markdown inside `<details>`, or GitHub will not render the Markdown.
- **No CSS, JS, `<script>`, `<style>`, or styling attributes.** GitHub strips them. The only HTML that survives is `<details>`/`<summary>` and basic inline tags like `<strong>`. There is no real animation; do not promise any.
