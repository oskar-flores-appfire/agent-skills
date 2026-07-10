---
name: building-interactive-decks
description: Use when creating an interactive presentation, explainer, or slide deck as a self-contained HTML artifact; covers architecture walkthroughs (including AWS architecture diagrams with service icons), light or dark themes, hackathon demos, and keyboard-driven decks with per-slide build steps.
---

# Building Interactive Decks

House style and reusable engine for interactive presentations. Canonical example: this skill's `templates/` (see `modules/slide-example.js`).

## Format choice

- **Slide deck** (this skill's `templates/`): presenting live; a narrator controls pacing with arrow keys and build steps.
- **Scroll-driven explainer**: self-serve reading; scroll-snap sections with Motion `inView` triggers. Prefer the deck unless the artifact is meant to be read alone.

## Quick start

1. Copy `templates/` from this skill to wherever the deck should live (e.g. `docs/<topic>-deck/`). The deck folder is fully self-contained (any location works); the only external dependency is the Motion CDN.
2. Write one module per slide in `modules/slide-*.js`; register each in the `SLIDES` array in `index.html`.
3. Run: `npx serve . -p <port>`. Port convention: each deck claims a port in its README; record yours there to avoid collisions with sibling decks.

## Slide module interface

Each slide is one self-contained module, removable by deleting one line in `SLIDES` (dots, counter, overview adjust automatically). Slide modules never import each other; shared helpers come only from `shared.js`.

```js
export default {
  id: 'my-slide',            // URL hash
  title: 'My slide',         // overview grid + dot tooltip
  render(container) {        // build full DOM up front; hidden bits get class 'step'
    return { card, note };   // api object the steps use
  },
  steps: [                   // one build step per arrow press; idempotent
    api => reveal(api.card),
    api => reveal(api.note),
  ],
};
```

`steps: []` is valid: a hero slide can reveal everything in `render()` and advance straight to the next slide.

## Style tokens

Light theme, generous whitespace. Fonts: Inter (UI) + JetBrains Mono (data) from Google Fonts. Cards: white bg, 1.5px `#e2e8f0` border, 12-14px radius, colored 3px top border for category accent. All tokens exported as `colors` in `shared.js`.

| Token | Value |
|---|---|
| bg | `#fafaf9` |
| text primary / secondary | `#1e293b` / `#64748b` |
| border | `#e2e8f0` |
| accent (indigo) | `#6366f1` |
| category accents (amber / indigo / violet) | `#f59e0b` / `#6366f1` / `#8b5cf6` |
| success / danger | `#10b981` / `#ef4444` |

### Theme (light default, opt-in dark)

Colors are driven by CSS custom properties defined once in `index.html` (`:root` for light,
`:root[data-theme="dark"]` for dark). `shared.js` reads them into `colors` at init via
`syncColors()`, so JS-built styles and CSS never diverge.

- Default is light. For a dark deck, set `data-theme="dark"` on the `<html>` tag; omit it for light.
- Never hardcode hex values in slides. Use `colors.*` in JS and `var(--token)` in CSS.

| Token | Light | Dark |
|---|---|---|
| bg | `#fafaf9` | `#0b0f17` |
| surface | `#ffffff` | `#151b26` |
| border | `#e2e8f0` | `#263042` |
| text primary / secondary | `#1e293b` / `#64748b` | `#e5e9f0` / `#94a3b8` |
| accent | `#6366f1` | `#818cf8` |
| success / warning / danger | `#10b981` / `#f59e0b` / `#ef4444` | `#34d399` / `#fbbf24` / `#f87171` |

## Writing conventions

- NO em dashes anywhere; use `;` `:` or parentheses.
- No formulas on screen; decks serve mixed audiences. Visual > text.
- Icons: inline SVG line icons via `icon()` from `shared.js`; never emojis.
- Mono font (`.mono` class) for data, numbers, IDs.

## Animation conventions

- Motion library from CDN: `https://cdn.jsdelivr.net/npm/motion@latest/+esm` (deck needs internet).
- ALWAYS use `reveal()` / `tween()` from `shared.js` instead of raw `animate()`, both in `render()` and in steps: they honor instant mode, so back navigation replays without animating (the engine wraps `render()` in `setInstant()` for you). Raw `animate()` is allowed only behind an `isInstant()` check, e.g. for hero word-stagger effects:

```js
if (isInstant()) { words.forEach(w => { w.style.opacity = '1'; }); }
else { animate(words, { opacity: [0, 1], y: [10, 0] }, { delay: stagger(0.07) }); }
```

- Elements hidden until a step reveals them get `className: 'step'` (CSS sets opacity 0). Note `callout()` from `shared.js` bakes in the `step` class; if a callout must be visible without a step, `reveal()` it in `render()`.

## Interactive playgrounds

- Mark interactive containers with `data-interactive` so clicks inside do not advance the deck (buttons, links, inputs are excluded automatically).
- SVG pointer-drag: `pointerdown` on the element, `setPointerCapture`, then map `pointermove` coordinates via `svg.getBoundingClientRect()` scaled to the viewBox.
- Keep step functions idempotent; back navigation re-renders the slide and replays steps instantly.

## Architecture diagrams (AWS icons)

- Download the SVGs you need from https://aws-icons.com/ into the deck's `assets/aws/` folder,
  named short and lowercase (`fargate.svg`, `sqs.svg`, `aurora.svg`, `s3.svg`, `cloudfront.svg`).
  The skill template ships an empty `assets/aws/` (see its README); each deck bundles its own icons.
- `awsIcon(name, size)` inlines a bundled icon as an `<img>`; full-color icons are never recolored.
- `serviceNode(iconName, label, sublabel)` builds a themed diagram card (icon + label) from
  `colors.surface`/`colors.border`, so nodes theme automatically in light and dark.
- `connector()` from `shared.js` is the default arrow separator between diagram nodes (a themed
  Unicode arrow; NO em dashes). For anything more elaborate, draw per-slide with `svgEl`. On dark
  backgrounds prefer AWS full-color "Resource" icons; label text uses `colors`.

## Common mistakes

- Hardcoding hex colors in a slide instead of `colors.*` / `var(--token)`; breaks dark theme.
- Recoloring full-color AWS icons (setting `stroke`/`fill`); use them as-is.
- Referencing an AWS icon that was never downloaded into `assets/aws/` (image 404s).
- Reading `colors` at slide-module top level; it is empty until `syncColors()` runs at init. Read it inside `render()`/steps.
- Forgetting `data-theme="dark"` on `<html>` when a dark deck was requested.

## Verification

1. Serve the deck, then walk it with a browser automation tool (Playwright, or the playwright-cli skill if installed): arrow through EVERY step of every slide, check the console for errors, screenshot key slides.
2. Slide-removal acceptance test: comment out one line in `SLIDES`; the deck must still work (dots, counter, overview, hash navigation).
3. Press `←` through a fully built slide: reveals must apply instantly, no animation replay.
4. Backward-compat: a default deck (no `data-theme`) must look identical to the light house style; a dark deck (`data-theme="dark"`) must keep AA-legible text on the dark background.
