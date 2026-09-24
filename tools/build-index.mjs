#!/usr/bin/env node
/**
 * Regenerates the gallery from the game folders.
 *
 *   node tools/build-index.mjs
 *
 * Reads every games/<slug>/game.json and writes:
 *   - games/index.json      the list the gallery page fetches
 *   - games/<slug>/index.html   that game's page
 *   - games/<slug>/game.json    with its `validation` record brought up to date
 *
 * Every manifest is checked before anything is written. If one is unusable,
 * the build writes nothing and exits 1.
 *
 * This runs at authoring time, not when anyone visits: the published site is
 * plain static HTML with no build step. Re-run it after adding or editing a
 * game, and commit what it writes.
 */
import { readdirSync, readFileSync, writeFileSync, statSync, existsSync } from 'node:fs';
import { join, dirname, resolve, relative } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { validate, MANUAL_CHECKS } from '../assets/js/validator.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const gamesDir = join(root, 'games');

/* ------------------------------------------------------------------ *
 * A small Markdown renderer — enough for the teacher guide, the history
 * bible, and the test ledger. Not a general-purpose parser.
 * ------------------------------------------------------------------ */

function escapeHtml(s) {
  // Every attribute this file writes is double-quoted, so these four are enough.
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

/**
 * Only these link targets become live links: web pages, email, a spot on the
 * same page, or a path relative to this one. Anything else, including
 * `javascript:` and `data:`, is shown as plain text. Control characters and
 * spaces are refused outright, because browsers strip them before reading the
 * scheme, so "\x01javascript:" would otherwise slip through as "relative".
 */
export function safeHref(url) {
  if (typeof url !== 'string' || !url || /[\x00-\x20\x7f\\]/.test(url)) return null;
  if (/^(?:https?:|mailto:)/i.test(url)) return url;
  if (url.startsWith('#')) return url;
  if (url.startsWith('//')) return null; // another site, with the scheme left implicit
  // relative: no scheme before the first / ? or #
  const head = url.split(/[/?#]/)[0];
  if (head.includes(':')) return null;
  return url;
}

const TOKEN_OPEN = '';
const TOKEN_CLOSE = '';

/** Reads `[label](url)` starting at `start`. Parentheses inside the URL may nest. */
function readLink(text, start) {
  const close = text.indexOf(']', start + 1);
  if (close < 0 || text[close + 1] !== '(') return null;
  const label = text.slice(start + 1, close);
  if (!label || label.includes('[')) return null;
  let i = close + 2;
  while (text[i] === ' ') i++;
  let url = '';
  if (text[i] === '<') {
    const end = text.indexOf('>', i);
    if (end < 0) return null;
    url = text.slice(i + 1, end).replace(/ /g, '%20'); // <...> may hold spaces
    i = end + 1;
  } else {
    let depth = 0;
    const from = i;
    for (; i < text.length; i++) {
      const c = text[i];
      if (/\s/.test(c)) break;
      if (c === '(') depth++;
      else if (c === ')') { if (depth === 0) break; depth--; }
    }
    url = text.slice(from, i);
  }
  if (url.includes(TOKEN_OPEN)) return null;
  while (text[i] === ' ') i++;
  // an optional "title", ignored
  if (text[i] === '"') {
    const end = text.indexOf('"', i + 1);
    if (end < 0) return null;
    i = end + 1;
    while (text[i] === ' ') i++;
  }
  if (text[i] !== ')') return null;
  return { label, url, end: i + 1, raw: text.slice(start, i + 1) };
}

function emphasis(escaped) {
  return escaped
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[\s(])\*([^*\n]+)\*/g, '$1<em>$2</em>')
    .replace(/(^|[\s(])_([^_\n]+)_/g, '$1<em>$2</em>');
}

/**
 * Inline Markdown: `code`, [links](url), **bold**, *italic*, _italic_.
 * Code spans are cut out first so that link syntax inside them stays literal;
 * links are cut out next so their URLs never meet the emphasis rules. Both are
 * put back after the surrounding text has been escaped.
 */
export function inline(text) {
  const tokens = [];
  const hold = (html) => `${TOKEN_OPEN}${tokens.push(html) - 1}${TOKEN_CLOSE}`;
  const restore = (s) => s.replace(new RegExp(`${TOKEN_OPEN}(\\d+)${TOKEN_CLOSE}`, 'g'), (_, n) => tokens[Number(n)]);

  let src = String(text).replace(/[]/g, '');
  src = src.replace(/`([^`]+)`/g, (_, code) => hold(`<code>${escapeHtml(code)}</code>`));

  let out = '';
  for (let i = 0; i < src.length;) {
    if (src[i] === '[') {
      const link = readLink(src, i);
      if (link) {
        const label = emphasis(escapeHtml(link.label));
        const href = safeHref(link.url);
        out += hold(href
          ? `<a href="${escapeHtml(href)}">${label}</a>`
          : `${label} (${escapeHtml(link.url)})`);
        i = link.end;
        continue;
      }
    }
    out += src[i];
    i++;
  }
  // tokens can nest (a code span inside a link label), so restore until stable
  let html = emphasis(escapeHtml(out));
  for (let n = 0; n < 3 && html.includes(TOKEN_OPEN); n++) html = restore(html);
  return html;
}

function markdown(src) {
  const lines = src.replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let i = 0;

  const flushParagraph = (buf) => {
    if (buf.length) out.push(`<p>${inline(buf.join(' '))}</p>`);
    buf.length = 0;
  };
  const para = [];

  while (i < lines.length) {
    const line = lines[i];

    if (/^\s*$/.test(line)) { flushParagraph(para); i++; continue; }

    const h = line.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      flushParagraph(para);
      const level = Math.min(h[1].length + 1, 5); // the page already has an <h1>
      out.push(`<h${level}>${inline(h[2])}</h${level}>`);
      i++;
      continue;
    }

    if (/^>\s?/.test(line)) {
      flushParagraph(para);
      const quote = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) { quote.push(lines[i].replace(/^>\s?/, '')); i++; }
      out.push(`<blockquote>${markdown(quote.join('\n'))}</blockquote>`);
      continue;
    }

    // table: a header row followed by a |---|---| divider
    if (/^\|/.test(line) && /^\|[\s:|-]+\|$/.test(lines[i + 1] || '')) {
      flushParagraph(para);
      const cells = (row) => row.replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
      const head = cells(line);
      i += 2;
      const body = [];
      while (i < lines.length && /^\|/.test(lines[i])) { body.push(cells(lines[i])); i++; }
      out.push('<div class="table-scroll"><table><thead><tr>'
        + head.map((c) => `<th>${inline(c)}</th>`).join('')
        + '</tr></thead><tbody>'
        + body.map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')
        + '</tbody></table></div>');
      continue;
    }

    if (/^\s*[-*]\s+/.test(line) || /^\s*\d+\.\s+/.test(line)) {
      flushParagraph(para);
      const ordered = /^\s*\d+\.\s+/.test(line);
      const items = [];
      while (i < lines.length && (/^\s*[-*]\s+/.test(lines[i]) || /^\s*\d+\.\s+/.test(lines[i]))) {
        items.push(lines[i].replace(/^\s*(?:[-*]|\d+\.)\s+/, ''));
        i++;
        // continuation lines indented under the item
        while (i < lines.length && /^\s{2,}\S/.test(lines[i]) && !/^\s*(?:[-*]|\d+\.)\s+/.test(lines[i])) {
          items[items.length - 1] += ' ' + lines[i].trim();
          i++;
        }
      }
      const tag = ordered ? 'ol' : 'ul';
      out.push(`<${tag}>${items.map((it) => `<li>${inline(it)}</li>`).join('')}</${tag}>`);
      continue;
    }

    para.push(line.trim());
    i++;
  }
  flushParagraph(para);
  return out.join('\n');
}

/* ------------------------------------------------------------------ *
 * Page assembly
 * ------------------------------------------------------------------ */

const GIST = 'https://gist.github.com/kltng/2a2b26a8817540531f3191412c308276';

/**
 * Links are relative, never root-absolute, so the site works from a project
 * page such as https://kltng.github.io/playable-pasts/ as well as from a
 * custom domain or a folder on disk. `up` is the path from the current page
 * back to the site root: '' at the root, '../' one level down, and so on.
 */
function nav(current, up) {
  const items = [
    [`${up}start/`, 'Make a game', 'start'],
    [`${up}check/`, 'Check a game', 'check'],
    [`${up}games/`, 'Gallery', 'games'],
    [`${up}submit/`, 'Share yours', 'submit'],
    [`${up}for-agents/`, 'For agents', 'agents'],
  ];
  return `<header class="masthead">
  <div class="masthead-inner">
    <a class="wordmark" href="${up || './'}">Playable <span>Pasts</span></a>
    <nav aria-label="Main">
${items.map(([href, label, slug]) =>
    `      <a href="${href}"${slug === current ? ' aria-current="page"' : ''}>${label}</a>`).join('\n')}
    </nav>
  </div>
</header>`;
}

const footer = (up) => `<footer class="site-footer">
  <div class="wrap cols">
    <div><strong>Playable Pasts</strong><br>A gallery and checker for classroom history games.</div>
    <div><a href="${up}start/">Make a game</a><br><a href="${up}check/">Check a game</a><br><a href="${up}games/">Gallery</a></div>
    <div><a href="${up}submit/">Share your game</a><br><a href="${up}for-agents/">For agents</a><br><a href="${GIST}">The workflow (gist)</a></div>
    <div>The workflow instructions are CC BY 4.0. Games in the gallery keep their own terms, and their sources keep theirs.</div>
  </div>
</footer>`;

/* ------------------------------------------------------------------ *
 * What the listing may claim
 * ------------------------------------------------------------------ */

/** The six checks only a person can make, in the order the checker lists them. */
export const MANUAL_IDS = MANUAL_CHECKS.map((c) => c.id);

const MANUAL_TITLES = {
  'manual-offline': 'Runs with the wifi off',
  'manual-keyboard': 'Playable by keyboard alone',
  'manual-timing': 'Fits the stated session length',
  'manual-classroom-setup': 'Opened on a real classroom setup',
  'manual-provenance-accuracy': 'Sources checked against the material',
  'manual-debrief': 'Debrief questions delivered',
};

export const TEST_STATUSES = ['passed', 'untested', 'failed', 'not-applicable'];

/** Who ran a check the contributor reports as passed. Optional. */
export const TESTERS = {
  person: 'Tested by a person',
  agent: 'Tested by an agent',
  'automated script': 'Tested by a script',
};

/**
 * One row per manual check, always all six. A check the manifest does not
 * mention is shown as untested: silence is not a pass.
 */
export function humanTestRows(game) {
  const reported = new Map();
  for (const t of Array.isArray(game.human_tests) ? game.human_tests : []) {
    if (t && typeof t === 'object' && !reported.has(t.id)) reported.set(t.id, t);
  }
  return MANUAL_IDS.map((id) => {
    const t = reported.get(id);
    const title = MANUAL_TITLES[id] || MANUAL_CHECKS.find((c) => c.id === id).title;
    if (!t) {
      return { id, title, kind: 'warn', label: 'Untested', note: 'The contributor did not report this check.' };
    }
    const note = typeof t.note === 'string' ? t.note : '';
    switch (t.status) {
      case 'passed':
        return { id, title, kind: 'ok', label: TESTERS[t.tested_by] || 'Tested (tester not stated)', note };
      case 'failed':
        return { id, title, kind: 'block', label: 'Failed', note };
      case 'not-applicable':
        return { id, title, kind: 'quiet', label: 'Not applicable', note };
      default:
        return { id, title, kind: 'warn', label: 'Untested', note };
    }
  });
}

/**
 * What the automated check found, read strictly. A manifest with no
 * validation record, or one that does not hold real counts, was not checked,
 * and must never be shown as passing.
 */
export function validationState(v) {
  if (!v || typeof v !== 'object'
    || !Number.isInteger(v.blocking) || v.blocking < 0
    || !Number.isInteger(v.warnings) || v.warnings < 0) {
    return { state: 'not-checked', kind: 'quiet', label: 'Not checked yet' };
  }
  const date = typeof v.checked_at === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v.checked_at) ? v.checked_at : '';
  if (v.blocking > 0) {
    return { state: 'blocked', kind: 'block', label: `${v.blocking} blocking finding${v.blocking === 1 ? '' : 's'}`, date };
  }
  if (v.warnings > 0) {
    return { state: 'warnings', kind: 'warn', label: `${v.warnings} open finding${v.warnings === 1 ? '' : 's'}`, date };
  }
  return { state: 'clean', kind: 'ok', label: 'File checks passed', date };
}

/**
 * Everything the build needs from a manifest, checked before anything is
 * written. Returns a list of problems in plain words; empty means usable.
 */
export function manifestProblems(game, folder) {
  const problems = [];
  const where = `${folder}/game.json`;
  if (!game || typeof game !== 'object' || Array.isArray(game)) {
    return [`${where} must be a JSON object`];
  }
  const text = (field) => typeof game[field] === 'string' && game[field].trim() !== '';

  if (!text('slug')) problems.push(`${where} is missing "slug"`);
  else if (game.slug !== folder) problems.push(`${where} says slug "${game.slug}" — it must match the folder name "${folder}"`);
  else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(game.slug)) problems.push(`${where}: slug "${game.slug}" must be lowercase letters, numbers, and hyphens`);

  for (const field of ['title', 'summary']) {
    if (!text(field)) problems.push(`${where} is missing "${field}" (a non-empty piece of text)`);
  }
  if (typeof game.session_minutes !== 'number' || !Number.isFinite(game.session_minutes) || game.session_minutes <= 0) {
    problems.push(`${where}: "session_minutes" must be a number of minutes, like 50`);
  }

  for (const field of ['subtitle', 'emoji', 'learning_mode', 'game_form', 'period', 'region', 'language',
    'level', 'social_topology', 'contributor', 'contributed_at', 'license', 'sources_rights', 'provenance_note']) {
    if (game[field] !== undefined && typeof game[field] !== 'string') {
      problems.push(`${where}: "${field}" must be text if it is given`);
    }
  }
  if (game.tags !== undefined && !(Array.isArray(game.tags) && game.tags.every((t) => typeof t === 'string'))) {
    problems.push(`${where}: "tags" must be a list of text labels`);
  }

  const f = game.files;
  if (!f || typeof f !== 'object' || Array.isArray(f)) {
    problems.push(`${where} is missing "files" (game, teacher_guide, history_bible, test_ledger)`);
  } else {
    for (const key of ['game', 'teacher_guide', 'history_bible', 'test_ledger']) {
      const name = f[key];
      if (typeof name !== 'string' || !name) {
        problems.push(`${where}: "files.${key}" is missing`);
      } else if (!/^[A-Za-z0-9._-]+$/.test(name) || name.startsWith('.')) {
        problems.push(`${where}: "files.${key}" must be a plain file name in the game's own folder, not "${name}"`);
      }
    }
  }

  if (game.human_tests !== undefined) {
    if (!Array.isArray(game.human_tests)) {
      problems.push(`${where}: "human_tests" must be a list`);
    } else {
      const seen = new Set();
      game.human_tests.forEach((t, i) => {
        const at = `${where}: human_tests[${i}]`;
        if (!t || typeof t !== 'object') { problems.push(`${at} must be an object with "id" and "status"`); return; }
        if (!MANUAL_IDS.includes(t.id)) {
          problems.push(`${at} has unknown id "${t.id}" — use one of ${MANUAL_IDS.join(', ')}`);
        } else if (seen.has(t.id)) {
          problems.push(`${at} repeats "${t.id}" — report each check once`);
        }
        seen.add(t.id);
        if (!TEST_STATUSES.includes(t.status)) {
          problems.push(`${at} has unknown status "${t.status}" — use one of ${TEST_STATUSES.join(', ')}`);
        }
        if (t.tested_by !== undefined && !Object.hasOwn(TESTERS, t.tested_by)) {
          problems.push(`${at} has unknown tested_by "${t.tested_by}" — use one of ${Object.keys(TESTERS).join(', ')}`);
        }
        if (t.note !== undefined && typeof t.note !== 'string') problems.push(`${at}: "note" must be text`);
      });
    }
  }
  return problems;
}

/* ------------------------------------------------------------------ *
 * Page assembly
 * ------------------------------------------------------------------ */

function docPanel(dir, file, id, label) {
  if (!file) return null;
  const path = join(dir, file);
  if (!existsSync(path)) return null;
  return { id, label, html: markdown(readFileSync(path, 'utf8')) };
}

export function gamePage(game, dir) {
  const f = game.files || {};
  const panels = [
    { id: 'play', label: 'Play', html: null },
    docPanel(dir, f.teacher_guide, 'guide', 'Teacher guide'),
    docPanel(dir, f.history_bible, 'bible', 'Sources & evidence'),
    docPanel(dir, f.test_ledger, 'ledger', 'What was tested'),
  ].filter(Boolean);

  const tested = humanTestRows(game).map((r) => `<tr>
      <td>${escapeHtml(r.title)}</td>
      <td><span class="badge ${r.kind}">${escapeHtml(r.label)}</span></td>
      <td>${escapeHtml(r.note)}</td>
    </tr>`).join('');

  const up = '../../'; // games/<slug>/index.html is two levels below the root
  const vs = validationState(game.validation);
  const on = vs.date ? ` on ${vs.date}` : '';
  const verdict = {
    'not-checked': 'this file has not been through the automated check yet, so nothing about it has been confirmed.',
    blocked: `when the automated check was run${on}, it found ${escapeHtml(vs.label)} — problems that will stop the game working in a classroom.`,
    warnings: `when the automated check was run${on}, it found ${escapeHtml(vs.label)}. None of them stops the game running.`,
    clean: `when the automated check was run${on}, this file passed every automated check.`,
  }[vs.state];
  const minutes = Number(game.session_minutes);
  const gameHref = escapeHtml(f.game || 'game.html');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(game.title)} — Playable Pasts</title>
<meta name="description" content="${escapeHtml(game.summary)}">
<link rel="stylesheet" href="${up}assets/css/site.css">
</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>
${nav('games', up)}

<main id="main">
<div class="wrap">
  <section class="game-header">
    <p class="eyebrow"><a href="${up}games/">Gallery</a> · ${escapeHtml(game.learning_mode || '')}</p>
    <h1>${escapeHtml(game.title)}</h1>
    <p class="lede">${escapeHtml(game.summary)}</p>
    <p class="game-meta">
      <span>${escapeHtml(game.game_form || '')}</span>
      <span>${Number.isFinite(minutes) ? escapeHtml(String(minutes)) : 'Unstated'} minutes</span>
      <span>${escapeHtml(game.social_topology || '')}</span>
      <span>${escapeHtml(game.level || '')}</span>
      <span>Contributed by ${escapeHtml(game.contributor || 'anonymous')}</span>
    </p>
    <div class="btn-row">
      <a class="btn" href="${gameHref}" download>Download the game file</a>
      <a class="btn secondary" href="${gameHref}">Open it full screen</a>
    </div>
  </section>

  <div class="note">
    <p><strong>Before you teach with it:</strong> ${verdict}
    That is a statement about the <em>file</em> — self-contained, free of the faults a machine
    can spot, with a sources screen in place. Whether the history is right and the lesson works
    is yours to judge. Read
    <em>Sources &amp; evidence</em> below, then
    <a href="${up}check/">re-check the file</a> yourself.</p>
  </div>

  <div class="tabs" role="tablist" aria-label="About this game">
${panels.map((p, i) => `    <button type="button" role="tab" id="tab-${p.id}" aria-controls="panel-${p.id}" aria-selected="${i === 0}"${i === 0 ? '' : ' tabindex="-1"'}>${escapeHtml(p.label)}</button>`).join('\n')}
  </div>

${panels.map((p, i) => `  <div class="tabpanel" role="tabpanel" id="panel-${p.id}" aria-labelledby="tab-${p.id}"${i === 0 ? '' : ' hidden'}>
${p.id === 'play'
    ? `    <iframe class="play-frame" src="${gameHref}" title="${escapeHtml(game.title)}"
      sandbox="allow-scripts allow-downloads allow-modals allow-popups allow-popups-to-escape-sandbox"></iframe>
    <p class="small">The game runs here walled off from this website, and it cannot keep saved
    progress between visits. This page does not switch off the internet, though. To see the
    game as a classroom with no wifi would, download it and open it with the wifi off.</p>`
    : `    <div class="prose" style="max-width:44rem">\n${p.html}\n    </div>`}
  </div>`).join('\n')}

  <section>
    <h2>Checks the automated checker cannot make</h2>
    <p class="prose">The checker reads a file; it cannot play a game or stand in a classroom.
    These six checks need someone to actually do them. This is what the contributor reported,
    in their words. Where they said who did the testing, the status says so: a check run by an
    agent or a script is not the same as a person trying it. A check they did not report is
    shown as untested.</p>
    <div class="table-scroll"><table>
      <thead><tr><th>Check</th><th>Status</th><th>What they said</th></tr></thead>
      <tbody>${tested}</tbody>
    </table></div>
  </section>

  <section>
    <h2>Sources and rights</h2>
    <div class="prose">
      <p>${escapeHtml(game.provenance_note || '')}</p>
      <p class="small">${escapeHtml(game.sources_rights || '')} Licence: ${escapeHtml(game.license || 'not stated')}.</p>
    </div>
  </section>

  <section>
    <h2>Make it yours</h2>
    <div class="prose">
      <p>Download the file and hand it to your own agent with something like this:</p>
    </div>
    <div class="copybox" style="max-width:44rem">
      <header>Paste this to your agent <button class="btn small secondary" type="button" id="copy-remix">Copy</button></header>
      <pre id="remix-prompt">I am adapting a Playable Past game for my own course. Here is the game file and its
documents. Follow ${GIST}
and keep the format rules: one self-contained HTML file, nothing fetched during play, no AI
needed to run it, and an accurate Sources &amp; assumptions screen.

What I want changed: [describe your course, your students, and your sources]

Update the history bible and the test ledger to match, and tell me plainly which checks you
actually ran and which I still need to run myself.</pre>
    </div>
  </section>
</div>
</main>
${footer(up)}
<script>
(function () {
  var tabs = [].slice.call(document.querySelectorAll('[role="tab"]'));
  function select(tab) {
    tabs.forEach(function (t) {
      var panel = document.getElementById(t.getAttribute('aria-controls'));
      var on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      panel.hidden = !on;
    });
  }
  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () { select(tab); });
    tab.addEventListener('keydown', function (e) {
      var next = null;
      if (e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
      else if (e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
      else if (e.key === 'Home') next = tabs[0];
      else if (e.key === 'End') next = tabs[tabs.length - 1];
      if (!next) return;
      e.preventDefault();
      select(next);
      next.focus();
    });
  });
  select(tabs[0]);

  var copy = document.getElementById('copy-remix');
  copy.addEventListener('click', function () {
    var pre = document.getElementById('remix-prompt');
    navigator.clipboard.writeText(pre.textContent).then(function () {
      copy.textContent = 'Copied';
      setTimeout(function () { copy.textContent = 'Copy'; }, 2000);
    });
  });
}());
</script>
</body>
</html>`;
}

/* ------------------------------------------------------------------ *
 * Main
 * ------------------------------------------------------------------ */

/**
 * The validation record for a manifest. `checked_at` only moves when the
 * game file or the result changes, so running this script twice writes the
 * same bytes twice. A date that changed on every run made the CI step
 * "gallery index is up to date" fail on any day after the last commit.
 *
 * The date therefore means "the result shown here was established on this
 * day and the file has not changed since", not "the script last ran on".
 */
export function nextValidation(previous, report, fileHash, today) {
  const next = {
    verdict: report.verdict,
    checked_at: today,
    blocking: report.blocking.length,
    warnings: report.warnings.length,
    file_sha256: fileHash,
  };
  const p = previous || {};
  const sameResult = p.verdict === next.verdict
    && p.blocking === next.blocking
    && p.warnings === next.warnings
    && p.file_sha256 === next.file_sha256;
  if (sameResult && typeof p.checked_at === 'string' && p.checked_at) {
    next.checked_at = p.checked_at;
  }
  return next;
}

export const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');
const today = () => new Date().toISOString().slice(0, 10);

/**
 * Works out every file the build would write, without writing any.
 *
 * Two kinds of problem come back:
 *   - `manifestProblems`: a game.json the build cannot trust. If there are any,
 *     nothing at all should be written, so a half-finished gallery is never left
 *     on disk.
 *   - `fileProblems`: the manifest is fine but the game has open trouble — a
 *     missing file, or blocking findings. The pages are still written, and say
 *     so honestly; the build still exits 1.
 */
export function plan(gamesRoot, date = today()) {
  const writes = [];
  const entries = [];
  const manifestIssues = [];
  const fileIssues = [];

  for (const slug of readdirSync(gamesRoot).sort()) {
    const dir = join(gamesRoot, slug);
    if (!statSync(dir).isDirectory()) continue;
    const manifestPath = join(dir, 'game.json');
    if (!existsSync(manifestPath)) continue;

    let game;
    try {
      game = JSON.parse(readFileSync(manifestPath, 'utf8'));
    } catch (err) {
      manifestIssues.push(`${slug}/game.json is not valid JSON: ${err.message}`);
      continue;
    }
    const issues = manifestProblems(game, slug);
    if (issues.length) { manifestIssues.push(...issues); continue; }

    const f = game.files;
    for (const key of ['teacher_guide', 'history_bible', 'test_ledger']) {
      if (!existsSync(join(dir, f[key]))) fileIssues.push(`${slug}: ${f[key]} not found (files.${key})`);
    }

    // Never publish a listing that claims a check the file no longer passes.
    const gamePath = join(dir, f.game);
    if (existsSync(gamePath)) {
      const source = readFileSync(gamePath);
      const report = validate(source.toString('utf8'), { filename: f.game, bytes: statSync(gamePath).size });
      game.validation = nextValidation(game.validation, report, sha256(source), date);
      if (report.blocking.length) {
        fileIssues.push(`${slug}: the game file has ${report.blocking.length} blocking finding(s) — `
          + `run "node tools/validate.mjs ${join('games', slug, f.game)}"`);
      }
    } else {
      // A result for a file that is not there describes nothing. Drop it.
      delete game.validation;
      fileIssues.push(`${slug}: ${f.game} not found (files.game)`);
    }

    writes.push({ path: manifestPath, content: JSON.stringify(game, null, 2) + '\n' });
    writes.push({ path: join(dir, 'index.html'), content: gamePage(game, dir) });
    entries.push(game);
  }

  entries.sort((a, b) => String(b.contributed_at).localeCompare(String(a.contributed_at))
    || a.slug.localeCompare(b.slug));
  writes.push({ path: join(gamesRoot, 'index.json'), content: JSON.stringify(entries, null, 2) + '\n' });
  return { writes, entries, manifestProblems: manifestIssues, fileProblems: fileIssues };
}

export function build(gamesRoot = gamesDir) {
  const result = plan(gamesRoot);

  if (result.manifestProblems.length) {
    console.error('Nothing was written. These game.json files need fixing first:');
    result.manifestProblems.forEach((p) => console.error('  - ' + p));
    if (result.fileProblems.length) {
      console.error('\nAlso found:');
      result.fileProblems.forEach((p) => console.error('  - ' + p));
    }
    return 1;
  }

  for (const w of result.writes) {
    // Only touch files whose contents change, so a rebuild is quiet in git.
    if (existsSync(w.path) && readFileSync(w.path, 'utf8') === w.content) continue;
    writeFileSync(w.path, w.content);
    console.log(`  wrote ${relative(root, w.path)}`);
  }
  const n = result.entries.length;
  console.log(`\n${relative(root, join(gamesRoot, 'index.json'))} — ${n} game${n === 1 ? '' : 's'}`);

  if (result.fileProblems.length) {
    console.error('\nProblems:');
    result.fileProblems.forEach((p) => console.error('  - ' + p));
    return 1;
  }
  return 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = build();
