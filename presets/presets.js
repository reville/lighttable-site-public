'use strict';

// Generated HTML is complete without JavaScript. This layer only filters and compares.
const filters = document.querySelector('[data-filters]');
if (filters) {
  const grid = document.querySelector('[data-preset-grid]');
  const cards = [...grid.querySelectorAll('[data-preset]')];
  const count = document.querySelector('[data-result-count]');
  const empty = document.querySelector('[data-empty]');
  const search = filters.elements.q;
  const tag = filters.elements.tag;
  const collections = [...filters.querySelectorAll('[data-collection]')];
  const initial = new URLSearchParams(location.search);
  let collection = ['all', 'featured', 'new'].includes(initial.get('collection')) ? initial.get('collection') : 'all';
  search.value = initial.get('q') || '';
  if ([...tag.options].some(option => option.value === initial.get('tag'))) tag.value = initial.get('tag');

  function render(updateURL = true) {
    const terms = search.value.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
    const visible = cards.filter(card => {
      const matches = terms.every(term => card.dataset.search.includes(term))
        && (!tag.value || JSON.parse(card.dataset.tags).includes(tag.value))
        && (collection !== 'featured' || card.dataset.featured === 'true');
      card.hidden = !matches;
      return matches;
    });
    const ordered = [...cards].sort(collection === 'new'
      ? (a, b) => b.dataset.date.localeCompare(a.dataset.date) || Number(a.dataset.position) - Number(b.dataset.position)
      : (a, b) => Number(a.dataset.position) - Number(b.dataset.position));
    ordered.forEach(card => grid.appendChild(card));
    collections.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.collection === collection)));
    count.textContent = `${visible.length} ${visible.length === 1 ? 'preset' : 'presets'}${collection === 'new' ? ' · Newest first' : collection === 'featured' ? ' · Featured' : ''}`;
    empty.hidden = visible.length !== 0;
    if (updateURL) {
      const params = new URLSearchParams();
      if (search.value.trim()) params.set('q', search.value.trim());
      if (tag.value) params.set('tag', tag.value);
      if (collection !== 'all') params.set('collection', collection);
      history.replaceState(null, '', `${location.pathname}${params.size ? `?${params}` : ''}${location.hash}`);
    }
  }
  filters.addEventListener('submit', event => event.preventDefault());
  search.addEventListener('input', () => render());
  tag.addEventListener('change', () => render());
  collections.forEach(button => button.addEventListener('click', () => { collection = button.dataset.collection; render(); }));
  document.querySelector('[data-reset]').addEventListener('click', () => { search.value = ''; tag.value = ''; collection = 'all'; render(); search.focus(); });
  filters.hidden = false;
  render(false);
}

document.querySelectorAll('[data-compare]').forEach(button => {
  const img = button.closest('.tile-photo').querySelector('[data-preview]');
  const originalAlt = img.alt;
  button.hidden = false;
  button.addEventListener('click', () => {
    const showBefore = button.getAttribute('aria-pressed') !== 'true';
    button.setAttribute('aria-pressed', String(showBefore));
    img.src = showBefore ? img.dataset.before : img.dataset.after;
    img.alt = showBefore ? `${originalAlt.split(', with ')[0]}, before the preset` : originalAlt;
    button.textContent = showBefore ? 'Show after' : 'Before';
  });
});

document.querySelectorAll('[data-comparison]').forEach(comparison => {
  const range = comparison.querySelector('input');
  const beforeLabel = comparison.querySelector('.label-before');
  const afterLabel = comparison.querySelector('.label-after');
  const update = () => {
    const value = Number(range.value);
    comparison.style.setProperty('--compare', `${value}%`);
    range.setAttribute('aria-valuetext', `${value}% original photograph visible`);
    beforeLabel.hidden = value < 16;
    afterLabel.hidden = value > 84;
  };
  range.hidden = false;
  range.addEventListener('input', update);
  update();
});
