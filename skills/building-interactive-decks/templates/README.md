# <Deck Title>

Interactive slide deck built on the shared SignalIQ deck engine. Visual-first, light theme, no formulas on screen.

## Run

Existing explainers occupy ports 3000-3004; pick the next free port and record it here:

```bash
cd docs/architecture/interactive/<name>
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
