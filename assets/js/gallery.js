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
    games = Array.isArray(data) ? data : [];
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
    const minutes = Number(g.session_minutes);
    if (len && !Number.isFinite(minutes)) return false;
    if (len === 'short' && minutes > 20) return false;
    if (len === 'session' && (minutes <= 20 || minutes > 90)) return false;
    if (len === 'long' && minutes <= 90) return false;
    if (!q) return true;
    const haystack = [g.title, g.subtitle, g.summary, g.learning_mode, g.game_form,
      g.period, g.region, (Array.isArray(g.tags) ? g.tags : []).join(' ')].join(' ').toLowerCase();
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

/*
 * These two readings match validationState() and humanTestRows() in
 * tools/build-index.mjs, which the tests cover. Keep them in step.
 */
const MANUAL_IDS = ['manual-offline', 'manual-keyboard', 'manual-timing',
  'manual-classroom-setup', 'manual-provenance-accuracy', 'manual-debrief'];

/** No validation record, or one without real counts, was never checked. */
function validationBadge(v) {
  if (!v || typeof v !== 'object'
    || !Number.isInteger(v.blocking) || v.blocking < 0
    || !Number.isInteger(v.warnings) || v.warnings < 0) {
    return '<span class="badge quiet">Not checked yet</span>';
  }
  if (v.blocking > 0) {
    return `<span class="badge block">${v.blocking} blocking finding${v.blocking === 1 ? '' : 's'}</span>`;
  }
  if (v.warnings > 0) {
    return `<span class="badge warn">${v.warnings} open finding${v.warnings === 1 ? '' : 's'}</span>`;
  }
  return '<span class="badge ok">File checks passed</span>';
}

/** All six checks count. One the contributor did not report is untested. */
function humanTally(g) {
  const reported = {};
  (Array.isArray(g.human_tests) ? g.human_tests : []).forEach((t) => {
    if (t && typeof t === 'object' && !(t.id in reported)) reported[t.id] = t.status;
  });
  let untested = 0;
  let failed = 0;
  MANUAL_IDS.forEach((id) => {
    const status = reported[id];
    if (status === 'failed') failed++;
    else if (status !== 'passed' && status !== 'not-applicable') untested++;
  });
  return { untested, failed };
}

function card(g) {
  const tally = humanTally(g);
  const minutes = Number(g.session_minutes);

  return `<li class="game-card">
    <div class="thumb" aria-hidden="true">${escapeHtml(g.emoji || '🎲')}</div>
    <div class="body">
      <h3><a href="${escapeHtml(encodeURIComponent(g.slug))}/">${escapeHtml(g.title)}</a></h3>
      <p class="meta">${escapeHtml(g.learning_mode || '')} · ${Number.isFinite(minutes) ? escapeHtml(String(minutes)) : '?'} min ·
        ${escapeHtml(g.level || '')}</p>
      <p class="desc">${escapeHtml(g.summary)}</p>
      <p class="meta">
        ${validationBadge(g.validation)}
        ${tally.untested ? `<span class="badge warn">${tally.untested} of ${MANUAL_IDS.length} hands-on checks untested</span>` : ''}
        ${tally.failed ? `<span class="badge block">${tally.failed} hands-on check${tally.failed === 1 ? '' : 's'} failed</span>` : ''}
      </p>
      <p class="tags">${(Array.isArray(g.tags) ? g.tags : []).slice(0, 4).map((t) =>
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
