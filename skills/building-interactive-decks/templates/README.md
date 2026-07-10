# <Deck Title>

Interactive slide deck built on the shared deck engine from the building-interactive-decks skill. Visual-first, light theme, no formulas on screen.

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
