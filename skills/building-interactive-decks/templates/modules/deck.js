import { el, setInstant } from './shared.js';

/**
 * Slide deck engine. Each slide module exports:
 *   { id, title, render(container) -> api, steps: [(api) => void, ...] }
 *
 * Advancing first plays the slide's build steps, then moves to the next slide.
 * Going back re-renders the slide with one fewer step applied (instantly).
 */
export function initDeck(slides) {
  const stage = document.getElementById('stage');
  const dotsBox = document.getElementById('dots');
  const counter = document.getElementById('counter');
  const overview = document.getElementById('overview');
  const overviewGrid = document.getElementById('overviewGrid');

  let current = 0;
  let applied = 0;   // build steps applied on the current slide
  let api = null;

  const dots = slides.map((s, i) => {
    const d = el('div', { className: 'dot', title: s.title });
    d.addEventListener('click', e => { e.stopPropagation(); goTo(i, 0); });
    dotsBox.appendChild(d);
    return d;
  });

  const tiles = slides.map((s, i) => {
    const tile = el('div', { className: 'overview-tile' }, [
      el('div', { className: 'num', textContent: String(i + 1).padStart(2, '0') }),
      el('div', { className: 'name', textContent: s.title }),
    ]);
    tile.addEventListener('click', e => {
      e.stopPropagation();
      closeOverview();
      goTo(i, 0);
    });
    overviewGrid.appendChild(tile);
    return tile;
  });

  function renderSlide(index, stepsToApply, instantRender) {
    const slide = slides[index];
    stage.innerHTML = '';
    const container = el('div', { className: 'slide' });
    stage.appendChild(container);

    setInstant(instantRender);
    api = slide.render(container) ?? {};
    for (let s = 0; s < stepsToApply; s++) slide.steps[s](api);
    setInstant(false);

    current = index;
    applied = stepsToApply;
    updateChrome();
  }

  function updateChrome() {
    dots.forEach((d, i) => d.classList.toggle('active', i === current));
    tiles.forEach((t, i) => t.classList.toggle('current', i === current));
    counter.textContent = `${current + 1} / ${slides.length}`;
    history.replaceState(null, '', `#${slides[current].id}`);
  }

  function goTo(index, stepsToApply, instantRender = false) {
    if (index < 0 || index >= slides.length) return;
    renderSlide(index, stepsToApply, instantRender);
  }

  function next() {
    const slide = slides[current];
    if (applied < slide.steps.length) {
      slide.steps[applied](api);
      applied++;
    } else if (current < slides.length - 1) {
      goTo(current + 1, 0);
    }
  }

  function prev() {
    if (applied > 0) {
      renderSlide(current, applied - 1, true);
    } else if (current > 0) {
      // Land on the previous slide as the audience last saw it: fully built.
      renderSlide(current - 1, slides[current - 1].steps.length, true);
    }
  }

  function openOverview() { overview.classList.add('open'); }
  function closeOverview() { overview.classList.remove('open'); }

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      overview.classList.contains('open') ? closeOverview() : openOverview();
      return;
    }
    if (overview.classList.contains('open')) return;
    if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') { e.preventDefault(); next(); }
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); prev(); }
    else if (e.key === 'Home') goTo(0, 0);
    else if (e.key === 'End') goTo(slides.length - 1, 0);
  });

  stage.addEventListener('click', e => {
    if (e.target.closest('[data-interactive], button, a, input, select, textarea')) return;
    next();
  });

  overview.addEventListener('click', e => {
    if (e.target === overview) closeOverview();
  });

  const startIndex = Math.max(0, slides.findIndex(s => s.id === location.hash.slice(1)));
  goTo(startIndex, 0);
}
