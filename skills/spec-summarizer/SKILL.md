---
name: spec-summarizer
description: Use when a technical spec, design doc, RFC, or PRD is too long to share and stakeholders will not read it. Triggers on "summarize this spec", "make this design doc shareable", "TL;DR of this RFC", "nobody will read this 600-line spec", or pointing at a long markdown spec and asking for a short version.
---

# spec-summarizer

## Overview

Turn a long spec into a ~2-page summary stakeholders actually read, then prove it works before declaring done. The spec stays the source of truth; the summary is a derived, lossy view of it. Output targets GitHub, where Mermaid, alert callouts, and `<details>` all render.

Core principle: a summary earns trust only if every claim traces to the source AND a fresh reader can answer the questions that matter from the summary alone.

## Modes

- **Companion (default):** write `<spec>.summary.md` next to the spec, linked bidirectionally. The summary header links down to the spec; a one-line pointer is added at the top of the spec linking up to the summary.
- **Prepend (opt-in, use when asked or when one shareable file is wanted):** insert the summary as the spec's first section, wrapped in `<!-- spec-summary:begin -->` / `<!-- spec-summary:end -->` markers, with the full spec below. One GitHub-shareable file, and the markers make the summary mechanically splittable later with no LLM (see "Splitting" below).

Both modes carry a freshness line naming the spec revision the summary reflects, so staleness is visible.

## When to use

- A spec, design doc, RFC, or PRD is too long to share (symptoms: "nobody will read this", "too long", 400+ lines).
- You need a shareable artifact for review or stakeholder sign-off.

When NOT to use:
- Authoring a brand-new spec from scratch (this summarizes an existing one).
- Rewriting the spec in place (this produces a separate companion file).

## Workflow

1. **Read the source spec fully.** Extract: the problem, what is being built, the decisions (look for a decisions / resolved / numbered-section table), out-of-scope items, the single clearest diagram, and every safety-critical or reviewer-approved claim.

2. **Produce the artifact** per `references/summary-template.md` and the chosen mode. The output IS, in order: narrative lede, an `[!IMPORTANT]` takeaway callout, Summary (problem, change, why-safe, blast-radius, the ask), decisions table, one Mermaid diagram, phasing (if present), an optional `[!WARNING]` for a risk, out-of-scope, a collapsible drill-down. Fill every slot. The template explains the GitHub-Flavored Markdown affordances (alert callouts, Mermaid, `<details>`) and their rules. Include the freshness line, and wire the link(s) for the mode: companion adds a down-link in the summary header and a one-line up-link at the top of the spec; prepend wraps the summary in the begin/end markers as the spec's first section.

3. **Apply THE RULE (self-check).** Anything in the decisions table, or any safety-critical / reviewer-approved claim, must be answerable from the summary itself, not only via the drill-down link. If a claim can only be resolved by opening the full spec, pull it up into the summary.

4. **Fidelity check (grounding).** Every factual claim in the summary must trace to a specific place in the source spec. Do not introduce tables, columns, mechanisms, mitigations, or rejected-alternatives the source does not state. When unsure of a detail, use the spec's own wording rather than paraphrasing into a stronger claim. This check is separate from the Reader Test: the Reader Test sees only the summary, so it cannot catch a confident fabrication. Only this check can.

5. **Reader Test (automatic, bounded).**
   - Generate 6-8 questions a reviewer, PM, and engineer would actually ask, drawn from the spec's key claims and decisions.
   - Spawn a fresh agent with NO prior context. Give it ONLY the summary file (not the source spec). Have it answer each question and rate it CLEAR, PARTIAL, or MISSING, and flag any contradiction.
   - Revise every PARTIAL, MISSING, or contradiction. Re-test. Maximum 2 rounds.
   - Report the final CLEAR/PARTIAL/MISSING scorecard and any residual gaps to the user.

## Constraints

- Body under ~500 words; about 2 pages; exactly one diagram, as a Mermaid block (GitHub renders it; prefer Mermaid over ASCII).
- Decisions table, Summary, and any safety-critical / reviewer-approved claim stay visible. Never put them inside a collapsed `<details>`; collapse only the drill-down and optional depth.
- At most two or three alert callouts; overusing them defeats the point. No CSS, JS, or styling HTML (GitHub strips it).
- No em dashes (use commas, parentheses, or restructure).
- Ground every claim in the source. Never invent.
- Do not change the spec's existing content. The only permitted edits to the spec file are: (a) a single one-line pointer to the summary near the top (companion mode), and (b) the summary block between the begin/end markers (prepend mode). Everything outside the markers stays byte-for-byte untouched.

## Splitting (no LLM needed)

In prepend mode the summary is delimited by HTML-comment markers so a human or script can split it later without a model. Given the combined file:

```bash
# Extract just the summary
awk '/spec-summary:begin/{f=1;next} /spec-summary:end/{f=0} f' spec.md > summary.md
# Strip the summary back out, leaving the original spec
awk '/spec-summary:begin/{s=1} /spec-summary:end/{s=0;next} !s' spec.md > spec-only.md
```

Keep each output section under its own clear `##` heading so a reader can also cut sections by hand.

## Common mistakes

| Mistake | Fix |
|---|---|
| Decisions buried in prose | Put them in the decisions table near the top so a reviewer finds the ask fast. |
| Safety-critical mechanism deferred to the drill-down link | THE RULE: pull it into the summary. Otherwise the Reader Test scores PARTIAL on the questions that matter. |
| Stating detail the source never says, to make the summary tidier (inventing a mechanism, column, mitigation, or rejected option, or hardening a hedged claim into a firm one) | Fidelity check: trace every claim to a specific place in the current source; quote the spec when unsure. Re-read the source fresh, specs change. |
| Skipping the Reader Test because the draft "looks clear" | Clear to the author is not clear to a fresh reader. Run it. |
| More than one diagram, or a 600-word body | One diagram; extra detail goes to the drill-down pointer. |
