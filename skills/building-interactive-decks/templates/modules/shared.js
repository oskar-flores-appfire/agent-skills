import { animate } from 'https://cdn.jsdelivr.net/npm/motion@latest/+esm';

// === Color tokens ===
// Single source of truth is the CSS custom properties in index.html.
// `colors` is filled in place at deck init by syncColors(); read it inside
// render()/steps (which run after init), never at module top level.
const COLOR_VARS = {
  bg: '--bg', surface: '--surface', border: '--border',
  textPrimary: '--text-primary', textSecondary: '--text-secondary',
  accent: '--accent', dimmed: '--dimmed',
  success: '--success', warning: '--warning', danger: '--danger',
  lexical: '--lexical', semantic: '--semantic', fusion: '--fusion',
};

export const colors = {};

/** Read the active theme's CSS variables into `colors` (in place). */
export function syncColors() {
  const cs = getComputedStyle(document.documentElement);
  for (const [key, cssVar] of Object.entries(COLOR_VARS)) {
    colors[key] = cs.getPropertyValue(cssVar).trim();
  }
}

// === DOM helpers ===

export function el(tag, attrs = {}, children = []) {
  const elem = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'style' && typeof v === 'object') Object.assign(elem.style, v);
    else if (k === 'className') elem.className = v;
    else if (k === 'textContent') elem.textContent = v;
    else if (k === 'innerHTML') elem.innerHTML = v;
    else elem.setAttribute(k, v);
  }
  for (const child of children) {
    if (child == null) continue;
    if (typeof child === 'string') elem.appendChild(document.createTextNode(child));
    else elem.appendChild(child);
  }
  return elem;
}

const SVG_NS = 'http://www.w3.org/2000/svg';

export function svgEl(tag, attrs = {}, children = []) {
  const elem = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'textContent') elem.textContent = v;
    else elem.setAttribute(k, v);
  }
  for (const child of children) elem.appendChild(child);
  return elem;
}

// === Inline line icons (Feather/Lucide outlines, stroke = currentColor) ===

const ICON_PATHS = {
  inbox: '<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
  filter: '<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>',
  cpu: '<rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/>',
  radio: '<circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"/>',
  zap: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
  scale: '<path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>',
  home: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
  globe: '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
  crown: '<path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.735H5.81a1 1 0 0 1-.957-.735L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z"/><path d="M5 21h14"/>',
  move: '<polyline points="5 9 2 12 5 15"/><polyline points="9 5 12 2 15 5"/><polyline points="15 19 12 22 9 19"/><polyline points="19 9 22 12 19 15"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="22"/>',
  xCircle: '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>',
};

export function icon(name, size = 24, color = 'currentColor') {
  const svg = svgEl('svg', {
    viewBox: '0 0 24 24', width: size, height: size,
    fill: 'none', stroke: color, 'stroke-width': 1.8,
    'stroke-linecap': 'round', 'stroke-linejoin': 'round',
    style: 'flex-shrink:0; vertical-align:-0.15em',
  });
  svg.innerHTML = ICON_PATHS[name];
  return svg;
}

export function slideHeader(kicker, title, sub = '') {
  const children = [
    el('div', { className: 'slide-kicker', textContent: kicker }),
    el('h2', { className: 'slide-title', textContent: title }),
  ];
  if (sub) children.push(el('p', { className: 'slide-sub', textContent: sub }));
  return children;
}

export function callout(html) {
  return el('div', { className: 'callout step' }, [el('p', { innerHTML: html })]);
}

// === AWS architecture diagram helpers ===

/** Inline a locally bundled AWS architecture SVG (full-color; never recolored). */
export function awsIcon(name, size = 48) {
  return el('img', {
    src: `assets/aws/${name}.svg`,
    width: size, height: size, alt: name,
    style: { display: 'block', flexShrink: '0' },
  });
}

/** A themed diagram node: an AWS icon above a label (and optional sublabel). */
export function serviceNode(iconName, label, sublabel = '') {
  return el('div', {
    style: {
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
      background: colors.surface, border: `1.5px solid ${colors.border}`,
      borderRadius: '12px', padding: '16px 18px', minWidth: '120px', textAlign: 'center',
    },
  }, [
    awsIcon(iconName, 44),
    el('div', { textContent: label, style: { fontWeight: '700', fontSize: '0.9rem', color: colors.textPrimary } }),
    sublabel ? el('div', { textContent: sublabel, style: { fontSize: '0.72rem', color: colors.textSecondary } }) : null,
  ]);
}

/** A simple left-to-right arrow separator for diagram flows. */
export function connector() {
  return el('div', { style: { color: colors.dimmed, fontSize: '1.6rem', fontWeight: '700' } }, ['→']);
}

// === Instant mode ===
// While the deck replays steps (navigating backwards or restoring a slide),
// reveals must apply final state without animating.

let instant = false;
export function setInstant(v) { instant = v; }
export function isInstant() { return instant; }

/** Reveal one element or a list, with optional stagger. Honors instant mode. */
export function reveal(target, { stagger = 0, delay = 0, y = 16 } = {}) {
  const els = target instanceof Element ? [target] : Array.from(target);
  for (const [i, e] of els.entries()) {
    if (instant) {
      e.style.opacity = '1';
      e.style.transform = 'none';
    } else {
      animate(e, { opacity: [0, 1], y: [y, 0] }, {
        duration: 0.5,
        delay: delay + stagger * i,
        easing: [0.25, 0.1, 0.25, 1],
      });
    }
  }
}

/** Animate arbitrary keyframes, or jump to final values in instant mode. */
export function tween(target, keyframes, options = {}) {
  const els = target instanceof Element ? [target] : Array.from(target);
  for (const e of els) {
    if (instant) {
      for (const [prop, frames] of Object.entries(keyframes)) {
        const final = Array.isArray(frames) ? frames[frames.length - 1] : frames;
        if (prop === 'opacity') e.style.opacity = String(final);
        else if (prop === 'x' || prop === 'y') e.style.transform = `translate${prop.toUpperCase()}(${final}px)`;
        else e.style[prop] = final;
      }
    } else {
      animate(e, keyframes, { duration: 0.6, easing: [0.25, 0.1, 0.25, 1], ...options });
    }
  }
}

export function fmt(n, dec = 3) {
  return typeof n === 'number' ? n.toFixed(dec) : '–';
}
