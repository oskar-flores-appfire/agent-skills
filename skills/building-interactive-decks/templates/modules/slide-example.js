// === Slide module contract ===
// Every slide module default-exports: { id, title, render(container) -> api, steps }
//   id      unique string; becomes the URL hash (#id) for deep links.
//   title   shown in dot tooltips and the Esc overview grid.
//   render  builds the FULL slide DOM up front and returns an api object
//           with references the steps need. Elements that a later step
//           reveals get className 'step' (global CSS hides them, opacity 0).
//   steps   array of (api) => void; each advances one build step. Steps must
//           be idempotent and must use reveal()/tween() from shared.js (never
//           raw animate()) so instant-mode replay works on back navigation.
// Slide modules NEVER import each other; shared helpers come from ./shared.js only.

import { el, reveal, slideHeader, callout, colors, icon } from './shared.js';

export default {
  id: 'example',
  title: 'Example slide',

  render(container) {
    const header = slideHeader(
      'Kicker label',
      'Example slide',
      'One sentence of context; keep it short and concrete.'
    );

    const card = el('div', {
      className: 'step',
      style: {
        background: colors.surface,
        border: `1.5px solid ${colors.border}`,
        borderTop: `3px solid ${colors.accent}`,
        borderRadius: '12px',
        padding: '24px 26px',
        minWidth: '220px',
        textAlign: 'center',
        marginTop: '28px',
      },
    }, [
      el('div', { style: { display: 'flex', justifyContent: 'center', color: colors.accent } }, [icon('zap', 34)]),
      el('div', { textContent: 'A card', style: { fontWeight: '700', fontSize: '1.1rem', marginTop: '8px' } }),
      el('div', { textContent: 'revealed by step 1', style: { fontSize: '0.85rem', color: colors.textSecondary } }),
    ]);

    const note = callout('A closing takeaway, revealed by step 2; <strong>inline HTML</strong> is allowed here.');

    container.append(...header, card, note);
    reveal(header[0]); reveal(header[1], { delay: 0.1 }); reveal(header[2], { delay: 0.2 });

    return { card, note };
  },

  steps: [
    api => reveal(api.card),
    api => reveal(api.note),
  ],
};
