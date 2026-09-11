#!/usr/bin/env node
/**
 * Regenerates the gallery from the game folders.
 *
 *   node tools/build-index.mjs
 *
 * Reads every games/<slug>/game.json and writes:
 *   - games/index.json      the list the gallery page fetches
 *   - games/<slug>/index.html   that game's page
 *
 * This runs at authoring time, not when anyone visits: the published site is
 * plain static HTML with no build step. Re-run it after adding or editing a
 * game, and commit what it writes.
 */
import { readdirSync, readFileSync, writeFileSync, statSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validate } from '../assets/js/validator.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const gamesDir = join(root, 'games');

/* ------------------------------------------------------------------ *
 * A small Markdown renderer — enough for the teacher guide, the history
 * bible, and the test ledger. Not a general-purpose parser.
 * ------------------------------------------------------------------ */

function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function inline(text) {
  return escapeHtml(text)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[\s(])\*([^*\n]+)\*/g, '$1<em>$2</em>')
    .replace(/(^|[\s(])_([^_\n]+)_/g, '$1<em>$2</em>');
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

function nav(current) {
  const items = [
    ['/start/', 'Make a game', 'start'],
    ['/check/', 'Check a game', 'check'],
    ['/games/', 'Gallery', 'games'],
    ['/submit/', 'Share yours', 'submit'],
    ['/for-agents/', 'For agents', 'agents'],
  ];
  return `<header class="masthead">
  <div class="masthead-inner">
    <a class="wordmark" href="/">Playable <span>Pasts</span></a>
    <nav aria-label="Main">
${items.map(([href, label, slug]) =>
    `      <a href="${href}"${slug === current ? ' aria-current="page"' : ''}>${label}</a>`).join('\n')}
    </nav>
  </div>
</header>`;
}

const FOOTER = `<footer class="site-footer">
  <div class="wrap cols">
    <div><strong>Playable Pasts</strong><br>A gallery and checker for classroom history games.</div>
    <div><a href="/start/">Make a game</a><br><a href="/check/">Check a game</a><br><a href="/games/">Gallery</a></div>
    <div><a href="/submit/">Share your game</a><br><a href="/for-agents/">For agents</a><br><a href="${GIST}">The workflow (gist)</a></div>
    <div>The workflow instructions are CC BY 4.0. Games in the gallery keep their own terms, and their sources keep theirs.</div>
  </div>
</footer>`;

const TEST_STATUS = {
  passed: ['ok', 'Tested'],
  untested: ['warn', 'Untested'],
  failed: ['block', 'Failed'],
  'not-applicable': ['quiet', 'Not applicable'],
};

const MANUAL_TITLES = {
  'manual-offline': 'Runs with the wifi off',
  'manual-keyboard': 'Playable by keyboard alone',
  'manual-timing': 'Fits the stated session length',
  'manual-classroom-setup': 'Opened on a real classroom setup',
  'manual-provenance-accuracy': 'Sources checked against the material',
  'manual-debrief': 'Debrief questions delivered',
};

function docPanel(dir, file, id, label) {
  const path = join(dir, file);
  if (!file || !existsSync(path)) return null;
  return { id, label, html: markdown(readFileSync(path, 'utf8')) };
}

function gamePage(game, dir) {
  const f = game.files || {};
  const panels = [
    { id: 'play', label: 'Play', html: null },
    docPanel(dir, f.teacher_guide, 'guide', 'Teacher guide'),
    docPanel(dir, f.history_bible, 'bible', 'Sources & evidence'),
    docPanel(dir, f.test_ledger, 'ledger', 'What was tested'),
  ].filter(Boolean);

  const tested = (game.human_tests || []).map((t) => {
    const [kind, label] = TEST_STATUS[t.status] || ['quiet', t.status];
    return `<tr>
      <td>${escapeHtml(MANUAL_TITLES[t.id] || t.id)}</td>
      <td><span class="badge ${kind}">${label}</span></td>
      <td>${escapeHtml(t.note || '')}</td>
    </tr>`;
  }).join('');

  const v = game.validation || {};
  const clean = (v.blocking || 0) === 0 && (v.warnings || 0) === 0;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(game.title)} — Playable Pasts</title>
<meta name="description" content="${escapeHtml(game.summary)}">
<link rel="stylesheet" href="/assets/css/site.css">
</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>
${nav('games')}

<main id="main">
<div class="wrap">
  <section class="game-header">
    <p class="eyebrow"><a href="/games/">Gallery</a> · ${escapeHtml(game.learning_mode || '')}</p>
    <h1>${escapeHtml(game.title)}</h1>
    <p class="lede">${escapeHtml(game.summary)}</p>
    <p class="game-meta">
      <span>${escapeHtml(game.game_form || '')}</span>
      <span>${game.session_minutes} minutes</span>
      <span>${escapeHtml(game.social_topology || '')}</span>
      <span>${escapeHtml(game.level || '')}</span>
      <span>Contributed by ${escapeHtml(game.contributor || 'anonymous')}</span>
    </p>
    <div class="btn-row">
      <a class="btn" href="${escapeHtml(f.game)}" download>Download the game file</a>
      <a class="btn secondary" href="${escapeHtml(f.game)}">Open it full screen</a>
    </div>
  </section>

  <div class="note">
    <p><strong>Before you teach with it:</strong> ${clean
      ? 'this file passed every automated check on the day it was added.'
      : 'this file has open findings from the automated check.'}
    That is a statement about the <em>file</em> — self-contained, accessible, honest about its
    sources. Whether the history is right and the lesson works is yours to judge. Read
    <em>Sources &amp; evidence</em> below, then
    <a href="/check/">re-check the file</a> yourself.</p>
  </div>

  <div class="tabs" role="tablist">
${panels.map((p, i) => `    <button role="tab" id="tab-${p.id}" aria-controls="panel-${p.id}" aria-selected="${i === 0}">${p.label}</button>`).join('\n')}
  </div>

${panels.map((p, i) => `  <div class="tabpanel" role="tabpanel" id="panel-${p.id}" aria-labelledby="tab-${p.id}"${i === 0 ? '' : ' hidden'}>
${p.id === 'play'
    ? `    <iframe class="play-frame" src="${escapeHtml(f.game)}" title="${escapeHtml(game.title)}"
      sandbox="allow-scripts allow-downloads"></iframe>
    <p class="small">Running in a sandbox with no network access and no storage — the same
    conditions as a locked-down classroom laptop.</p>`
    : `    <div class="prose" style="max-width:44rem">\n${p.html}\n    </div>`}
  </div>`).join('\n')}

  <section>
    <h2>Checks a person had to run</h2>
    <p class="prose">A validator reads a file; it cannot play a game or stand in a classroom.
    This is what the contributor reported, in their words.</p>
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
${FOOTER}
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
      var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      var next = tabs[(i + d + tabs.length) % tabs.length];
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

const entries = [];
const problems = [];

for (const slug of readdirSync(gamesDir)) {
  const dir = join(gamesDir, slug);
  if (!statSync(dir).isDirectory()) continue;
  const manifestPath = join(dir, 'game.json');
  if (!existsSync(manifestPath)) continue;

  let game;
  try {
    game = JSON.parse(readFileSync(manifestPath, 'utf8'));
  } catch (err) {
    problems.push(`${slug}/game.json is not valid JSON: ${err.message}`);
    continue;
  }

  for (const field of ['slug', 'title', 'summary', 'files']) {
    if (!game[field]) problems.push(`${slug}/game.json is missing "${field}"`);
  }
  if (game.slug && game.slug !== slug) {
    problems.push(`${slug}/game.json says slug "${game.slug}" — it must match the folder name`);
  }

  // Never publish a listing that claims a check the file no longer passes.
  const gamePath = join(dir, game.files?.game || 'game.html');
  if (existsSync(gamePath)) {
    const report = validate(readFileSync(gamePath, 'utf8'), { filename: game.files.game, bytes: statSync(gamePath).size });
    game.validation = {
      ...(game.validation || {}),
      verdict: report.verdict,
      blocking: report.blocking.length,
      warnings: report.warnings.length,
      checked_at: new Date().toISOString().slice(0, 10),
    };
    if (report.blocking.length) {
      problems.push(`${slug}: the game file has ${report.blocking.length} blocking finding(s) — `
        + `run "node tools/validate.mjs ${gamePath}"`);
    }
    writeFileSync(manifestPath, JSON.stringify(game, null, 2) + '\n');
  } else {
    problems.push(`${slug}: ${game.files?.game || 'game.html'} not found`);
  }

  writeFileSync(join(dir, 'index.html'), gamePage(game, dir));
  entries.push(game);
  console.log(`  built games/${slug}/index.html`);
}

entries.sort((a, b) => String(b.contributed_at).localeCompare(String(a.contributed_at)));
writeFileSync(join(gamesDir, 'index.json'), JSON.stringify(entries, null, 2) + '\n');
console.log(`\ngames/index.json — ${entries.length} game${entries.length === 1 ? '' : 's'}`);

if (problems.length) {
  console.error('\nProblems:');
  problems.forEach((p) => console.error('  - ' + p));
  process.exit(1);
}
