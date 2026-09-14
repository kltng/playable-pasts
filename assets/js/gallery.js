/**
 * The gallery listing. Reads games/index.json, which tools/build-index.mjs
 * regenerates from each game's manifest.
 */
const grid = document.getElementById('grid');
const count = document.getElementById('count');
const search = document.getElementById('q');
const modeFilter = document.getElementById('mode');
const lengthFilter = document.getElementById('length');

let games = [];

fetch('index.json')
  .then((r) => {
    if (!r.ok) throw new Error('index.json returned ' + r.status);
    return r.json();
  })
  .then((data) => {
    games = data;
    fillFilter(modeFilter, unique(games.map((g) => g.learning_mode)));
    render();
  })
  .catch((err) => {
    grid.innerHTML = `<li class="empty-state"><p>The gallery list could not be loaded.</p>
      <p class="small">${escapeHtml(err.message)}</p></li>`;
  });

[search, modeFilter, lengthFilter].forEach((el) => {
  el.addEventListener('input', render);
});

function render() {
  const q = search.value.trim().toLowerCase();
  const mode = modeFilter.value;
  const len = lengthFilter.value;

  const shown = games.filter((g) => {
    if (mode && g.learning_mode !== mode) return false;
    if (len === 'short' && g.session_minutes > 20) return false;
    if (len === 'session' && (g.session_minutes <= 20 || g.session_minutes > 90)) return false;
    if (len === 'long' && g.session_minutes <= 90) return false;
    if (!q) return true;
    const haystack = [g.title, g.subtitle, g.summary, g.learning_mode, g.game_form,
      g.period, g.region, (g.tags || []).join(' ')].join(' ').toLowerCase();
    return haystack.includes(q);
  });

  count.textContent = shown.length === games.length
    ? `${games.length} game${games.length === 1 ? '' : 's'}`
    : `${shown.length} of ${games.length}`;

  if (!shown.length) {
    grid.innerHTML = `<li class="empty-state"><p>Nothing matches that.</p>
      <p class="small">Try clearing the filters, or <a href="../submit/">add the game you were
      looking for</a>.</p></li>`;
    return;
  }

  grid.innerHTML = shown.map(card).join('');
}

function card(g) {
  const v = g.validation || {};
  const clean = (v.blocking || 0) === 0 && (v.warnings || 0) === 0;
  const untested = (g.human_tests || []).filter((t) => t.status === 'untested').length;

  return `<li class="game-card">
    <div class="thumb" aria-hidden="true">${g.emoji || '🎲'}</div>
    <div class="body">
      <h3><a href="${encodeURIComponent(g.slug)}/">${escapeHtml(g.title)}</a></h3>
      <p class="meta">${escapeHtml(g.learning_mode || '')} · ${g.session_minutes} min ·
        ${escapeHtml(g.level || '')}</p>
      <p class="desc">${escapeHtml(g.summary)}</p>
      <p class="meta">
        ${clean ? '<span class="badge ok">File checks passed</span>'
    : `<span class="badge warn">${(v.blocking || 0) + (v.warnings || 0)} open finding(s)</span>`}
        ${untested ? `<span class="badge warn">${untested} untested by a person</span>` : ''}
      </p>
      <p class="tags">${(g.tags || []).slice(0, 4).map((t) =>
    `<span class="tag">${escapeHtml(t)}</span>`).join('')}</p>
    </div>
  </li>`;
}

function unique(list) {
  return [...new Set(list.filter(Boolean))].sort();
}

function fillFilter(select, values) {
  values.forEach((v) => {
    const opt = document.createElement('option');
    opt.value = v;
    opt.textContent = v;
    select.appendChild(opt);
  });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}
