# <Deck Title>

Interactive slide deck built on the shared deck engine from the building-interactive-decks skill. Visual-first, light theme by default, no formulas on screen.

## Theme

Default is light. For a dark deck, set `data-theme="dark"` on the `<html>` tag in `index.html`;
omit it for light. Colors live as CSS custom properties in `index.html` and are read into
`colors` at init by `syncColors()` (`modules/shared.js`); never hardcode hex values in slides.

## AWS icons

Drop the SVGs a deck needs into `assets/aws/` (see that folder's README), then reference them
with `awsIcon(name, size)` or `serviceNode(iconName, label, sublabel)` from `modules/shared.js`.
This folder ships empty; each deck bundles only the icons it uses.

## Run

Pick a free port (check sibling decks' READMEs for claimed ones) and record it here:

```bash
cd <deck-folder>
npx serve . -p <port>
```

> Requires internet; the Motion animation library loads from CDN.

## Controls

| Key | Action |
|---|---|
| `→` / `Space` / click | next build step, then next slide |
| `←` | previous step / slide |
| `Esc` | overview grid (click a tile to jump) |
| `Home` / `End` | first / last slide |

## Removing a slide

Each slide is one self-contained module. To drop a slide, delete (or comment out)
its line in the `SLIDES` array in `index.html`:

```js
const SLIDES = [
  hero,
  // whatIs,   <- removed
  pipeline,
];
```

Dots, counter, and overview adjust automatically. Slide modules never reference
each other; shared helpers live in `modules/shared.js`.
