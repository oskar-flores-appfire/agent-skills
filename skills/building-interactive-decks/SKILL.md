---
name: building-interactive-decks
description: Use when creating an interactive presentation, explainer, or slide deck for SignalIQ; covers docs under docs/architecture/interactive/, hackathon demos, and architecture walkthroughs.
---

# Building Interactive Decks

House style and reusable engine for SignalIQ interactive presentations. Canonical example: `docs/architecture/interactive/hackathon-hybrid/`.

## Format choice

- **Slide deck** (this skill's `templates/`): presenting live; a narrator controls pacing with arrow keys and build steps.
- **Scroll-driven explainer** (see `docs/architecture/interactive/hybrid-search/`): self-serve reading; scroll-snap sections with Motion `inView` triggers. Older style; prefer the deck unless the artifact is meant to be read alone.

## Quick start

1. Copy `templates/` from this skill to `docs/architecture/interactive/<name>/`. The deck folder is fully self-contained (any location works); the only external dependency is the Motion CDN.
2. Write one module per slide in `modules/slide-*.js`; register each in the `SLIDES` array in `index.html`.
3. Run: `npx serve . -p <port>`. Port convention: each deck claims a port in its README; find the next free one with `rg -i 'port' docs/architecture/interactive/*/README.md` and record yours in the new deck's README.

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
| lexical / BM25 (amber) | `#f59e0b` |
| semantic / kNN | indigo `#6366f1` |
| fusion / RRF (violet) | `#8b5cf6` |
| success / danger | `#10b981` / `#ef4444` |

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
- SVG pointer-drag: `pointerdown` on the element, `setPointerCapture`, then map `pointermove` coordinates via `svg.getBoundingClientRect()` scaled to the viewBox (see `slide-cosine.js`).
- Keep step functions idempotent; back navigation re-renders the slide and replays steps instantly.

## Verification

1. Serve the deck, then walk it with playwright-cli: arrow through EVERY step of every slide, check the console for errors, screenshot key slides.
2. Slide-removal acceptance test: comment out one line in `SLIDES`; the deck must still work (dots, counter, overview, hash navigation).
3. Press `←` through a fully built slide: reveals must apply instantly, no animation replay.
