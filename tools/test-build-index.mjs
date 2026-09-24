#!/usr/bin/env node
/**
 * Tests for the gallery build tool and the gallery listing.
 *   node --test tools/test-*.mjs
 *
 * The rules defended here:
 *   - Running the build twice writes the same bytes twice. CI reruns the build
 *     and fails if anything in games/ changes, so a field that moved on every
 *     run would fail every pull request opened on a later day.
 *   - The honesty rule: a listing never shows a check as passed unless it ran.
 *     No validation record means "not checked", never green. All six manual
 *     checks are always shown, and a missing one is "Untested".
 *   - Nothing from a contributor's files reaches the page as live markup.
 *   - A bad manifest stops the build before it writes anything.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import {
  nextValidation, sha256, inline, safeHref, validationState, humanTestRows,
  manifestProblems, gamePage, plan, build, MANUAL_IDS,
} from './build-index.mjs';
import { MANUAL_CHECKS } from '../assets/js/validator.js';

const here = dirname(fileURLToPath(import.meta.url));

// The verdict names validate() really produces.
const clean = { verdict: 'ready-for-your-tests', blocking: [], warnings: [] };
const warned = { verdict: 'needs-work', blocking: [], warnings: [{ id: 'x' }] };
const hashA = sha256('<html>a</html>');
const hashB = sha256('<html>b</html>');

/* ---------------- stable dates ---------------- */

test('a first build stamps today', () => {
  const v = nextValidation(undefined, clean, hashA, '2026-09-14');
  assert.equal(v.checked_at, '2026-09-14');
  assert.equal(v.file_sha256, hashA);
  assert.equal(v.blocking, 0);
  assert.equal(v.warnings, 0);
});

test('rebuilding an unchanged file keeps the earlier date', () => {
  const first = nextValidation(undefined, clean, hashA, '2026-09-11');
  const later = nextValidation(first, clean, hashA, '2026-09-14');
  assert.deepEqual(later, first);
});

test('a changed game file moves the date', () => {
  const first = nextValidation(undefined, clean, hashA, '2026-09-11');
  const later = nextValidation(first, clean, hashB, '2026-09-14');
  assert.equal(later.checked_at, '2026-09-14');
  assert.equal(later.file_sha256, hashB);
});

test('a changed result moves the date even if the file did not', () => {
  const first = nextValidation(undefined, clean, hashA, '2026-09-11');
  const later = nextValidation(first, warned, hashA, '2026-09-14');
  assert.equal(later.checked_at, '2026-09-14');
  assert.equal(later.warnings, 1);
  assert.equal(later.verdict, 'needs-work');
});

test('a manifest from before hashes were recorded is stamped once, then stable', () => {
  const legacy = { verdict: 'ready-for-your-tests', checked_at: '2026-09-11', blocking: 0, warnings: 0 };
  const first = nextValidation(legacy, clean, hashA, '2026-09-14');
  assert.equal(first.checked_at, '2026-09-14', 'no hash on record, so the result is re-established');
  const again = nextValidation(first, clean, hashA, '2026-09-20');
  assert.deepEqual(again, first);
});

/* ---------------- Markdown links and escaping ---------------- */

test('a javascript: link in a teacher guide is shown as text, not made live', () => {
  const html = inline('[click me](javascript:alert(1))');
  assert.doesNotMatch(html, /<a /);
  assert.doesNotMatch(html, /href/);
  assert.match(html, /click me/);
});

test('other unsafe link targets are neutralised too', () => {
  for (const url of ['data:text/html,x', 'JaVaScRiPt:alert(1)', 'vbscript:x', '\x01javascript:alert(1)', '//evil.example/x']) {
    assert.equal(safeHref(url), null, url);
  }
});

test('web, email, same-page, and relative links stay live', () => {
  for (const url of ['https://loc.gov/item/1', 'http://example.org', 'mailto:a@b.org', '#sources', 'game.html', '../check/', 'notes/a:b']) {
    assert.equal(safeHref(url), url, url);
  }
  assert.equal(inline('[LoC](https://www.loc.gov/)'), '<a href="https://www.loc.gov/">LoC</a>');
});

test('a URL with parentheses in it is kept whole', () => {
  const html = inline('See [the article](https://en.wikipedia.org/wiki/Flu_(1918)) today.');
  assert.match(html, /href="https:\/\/en\.wikipedia\.org\/wiki\/Flu_\(1918\)"/);
  assert.match(html, /<\/a> today\.$/);
});

test('link syntax inside backtick code stays literal', () => {
  const html = inline('Type `[x](https://a.example)` into the box.');
  assert.doesNotMatch(html, /<a /);
  assert.match(html, /<code>\[x\]\(https:\/\/a\.example\)<\/code>/);
});

test('markup inside a link label or URL is escaped', () => {
  const html = inline('[<img src=x onerror=alert(1)>](https://a.example/"onmouseover="x)');
  assert.doesNotMatch(html, /<img/);
  assert.doesNotMatch(html, /href="[^"]*"onmouseover/);
});

/* ---------------- validation: missing means not checked ---------------- */

test('a manifest with no validation record is "not checked", never passing', () => {
  for (const v of [undefined, null, {}, { blocking: '0', warnings: 0 }, { warnings: 0 }]) {
    assert.equal(validationState(v).state, 'not-checked', JSON.stringify(v));
  }
  assert.equal(validationState({ blocking: 0, warnings: 0, checked_at: '2026-09-14' }).state, 'clean');
  assert.equal(validationState({ blocking: 1, warnings: 0 }).state, 'blocked');
  assert.equal(validationState({ blocking: 0, warnings: 2 }).state, 'warnings');
});

/* ---------------- a game page ---------------- */

function sampleGame(extra = {}) {
  return {
    slug: 'sample',
    title: 'Sample',
    summary: 'A sample.',
    session_minutes: 50,
    files: { game: 'game.html', teacher_guide: 'teacher-guide.md', history_bible: 'history-bible.md', test_ledger: 'test-ledger.md' },
    ...extra,
  };
}

test('the game page says "not checked" when there is no validation record', () => {
  const html = gamePage(sampleGame(), '/nonexistent');
  assert.match(html, /has not been through the automated check/);
  assert.doesNotMatch(html, /passed every automated check/);
});

test('the game page gives the date the automated check was run', () => {
  const html = gamePage(sampleGame({ validation: { blocking: 0, warnings: 0, checked_at: '2026-09-14' } }), '/nonexistent');
  assert.match(html, /check was run on 2026-09-14, this file passed every automated check/);
  assert.doesNotMatch(html, /on the day it was added/);
});

test('fields from game.json are escaped on the game page', () => {
  const html = gamePage(sampleGame({
    title: '<script>alert(1)</script>',
    session_minutes: '<b>50</b>',
    contributor: '<img src=x>',
    human_tests: [{ id: 'manual-offline', status: '<i>odd</i>', note: '<u>n</u>' }],
  }), '/nonexistent');
  assert.doesNotMatch(html, /<script>alert/);
  assert.doesNotMatch(html, /<b>50<\/b>/);
  assert.doesNotMatch(html, /<img src=x>/);
  assert.doesNotMatch(html, /<i>odd<\/i>/);
  assert.doesNotMatch(html, /<u>n<\/u>/);
});

test('all six manual checks are shown, and a missing one is Untested', () => {
  const rows = humanTestRows(sampleGame({ human_tests: [{ id: 'manual-offline', status: 'passed', tested_by: 'person' }] }));
  assert.deepEqual(rows.map((r) => r.id), MANUAL_CHECKS.map((c) => c.id));
  assert.equal(rows[0].label, 'Tested by a person');
  for (const r of rows.slice(1)) assert.equal(r.label, 'Untested', r.id);

  const none = humanTestRows(sampleGame());
  assert.equal(none.length, 6);
  assert.ok(none.every((r) => r.label === 'Untested'));

  const html = gamePage(sampleGame(), '/nonexistent');
  assert.equal((html.match(/>Untested</g) || []).length, 6);
});

test('a passed check says who tested it, or that the tester is not stated', () => {
  const label = (tested_by) => humanTestRows(sampleGame({
    human_tests: [{ id: 'manual-keyboard', status: 'passed', ...(tested_by ? { tested_by } : {}) }],
  }))[1].label;
  assert.equal(label('person'), 'Tested by a person');
  assert.equal(label('agent'), 'Tested by an agent');
  assert.equal(label('automated script'), 'Tested by a script');
  assert.equal(label(undefined), 'Tested (tester not stated)');
});

test('the gallery frame lets the game use dialogs and open links, but not this site', () => {
  const html = gamePage(sampleGame(), '/nonexistent');
  const sandbox = html.match(/sandbox="([^"]*)"/)[1].split(' ');
  for (const token of ['allow-scripts', 'allow-modals', 'allow-popups', 'allow-popups-to-escape-sandbox']) {
    assert.ok(sandbox.includes(token), token);
  }
  assert.ok(!sandbox.includes('allow-same-origin'));
  assert.doesNotMatch(html, /no network access/, 'the frame does not block the network, so do not say it does');
});

test('the tabs have a label and Home/End keys', () => {
  const html = gamePage(sampleGame(), '/nonexistent');
  assert.match(html, /role="tablist" aria-label="[^"]+"/);
  assert.match(html, /'Home'/);
  assert.match(html, /'End'/);
});

/* ---------------- manifests ---------------- */

test('a manifest missing required fields is reported, not crashed on', () => {
  const problems = manifestProblems({ slug: 'x', title: 'X' }, 'x');
  assert.ok(problems.some((p) => /summary/.test(p)));
  assert.ok(problems.some((p) => /session_minutes/.test(p)));
  assert.ok(problems.some((p) => /"files"/.test(p)));
  assert.deepEqual(manifestProblems(sampleGame(), 'sample'), []);
});

test('unknown manual check IDs, statuses, and testers are build problems', () => {
  const problems = manifestProblems(sampleGame({
    human_tests: [
      { id: 'manual-vibes', status: 'passed' },
      { id: 'manual-offline', status: 'probably' },
      { id: 'manual-timing', status: 'passed', tested_by: 'my cat' },
      { id: 'manual-timing', status: 'passed' },
    ],
  }), 'sample');
  assert.ok(problems.some((p) => /manual-vibes/.test(p)));
  assert.ok(problems.some((p) => /probably/.test(p)));
  assert.ok(problems.some((p) => /my cat/.test(p)));
  assert.ok(problems.some((p) => /repeats/.test(p)));
});

test('file names that leave the game folder are refused', () => {
  const problems = manifestProblems(sampleGame({ files: { ...sampleGame().files, game: '../../etc/passwd' } }), 'sample');
  assert.ok(problems.some((p) => /files\.game/.test(p)));
});

function scratchGallery() {
  const games = mkdtempSync(join(tmpdir(), 'pp-build-test-'));
  const write = (slug, name, text) => {
    mkdirSync(join(games, slug), { recursive: true });
    writeFileSync(join(games, slug, name), text);
  };
  return { games, write, done: () => rmSync(games, { recursive: true, force: true }) };
}

test('a bad manifest stops the build before anything is written', () => {
  const g = scratchGallery();
  try {
    const good = JSON.stringify(sampleGame({ slug: 'good' }), null, 2) + '\n';
    g.write('good', 'game.json', good);
    g.write('good', 'game.html', '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>t</title></head><body></body></html>');
    g.write('bad', 'game.json', JSON.stringify({ slug: 'bad', title: 'Bad', summary: 'No files.', session_minutes: 10 }));

    const log = console.log; const err = console.error;
    console.log = () => {}; console.error = () => {};
    let code;
    try { code = build(g.games); } finally { console.log = log; console.error = err; }

    assert.equal(code, 1);
    assert.ok(!existsSync(join(g.games, 'index.json')), 'no index.json');
    assert.ok(!existsSync(join(g.games, 'good', 'index.html')), 'no page for the good game either');
    assert.equal(readFileSync(join(g.games, 'good', 'game.json'), 'utf8'), good, 'game.json untouched');
  } finally {
    g.done();
  }
});

test('a missing game file drops a stale validation record', () => {
  const g = scratchGallery();
  try {
    g.write('sample', 'game.json', JSON.stringify(sampleGame({
      validation: { verdict: 'ready-for-your-tests', checked_at: '2026-09-01', blocking: 0, warnings: 0 },
    })));
    const result = plan(g.games, '2026-09-24');
    assert.deepEqual(result.manifestProblems, []);
    assert.ok(result.fileProblems.some((p) => /game\.html not found/.test(p)));
    assert.equal(result.entries[0].validation, undefined);
    const page = result.writes.find((w) => w.path.endsWith('index.html')).content;
    assert.match(page, /has not been through the automated check/);
  } finally {
    g.done();
  }
});

/* ---------------- the gallery listing (assets/js/gallery.js) ---------------- */

/** Runs gallery.js with just enough of a page around it to call card(). */
function loadGallery() {
  const el = () => ({ value: '', innerHTML: '', textContent: '', addEventListener() {}, appendChild() {} });
  const context = {
    document: { getElementById: el, createElement: el },
    fetch: () => new Promise(() => {}),
    console,
  };
  vm.createContext(context);
  vm.runInContext(readFileSync(join(here, '..', 'assets', 'js', 'gallery.js'), 'utf8'), context);
  return context;
}

test('the gallery knows the same six manual checks as the validator', () => {
  const ctx = loadGallery();
  assert.deepEqual([...vm.runInContext('MANUAL_IDS', ctx)], MANUAL_IDS);
});

test('a gallery card with no validation record is not shown as passing', () => {
  const { card } = loadGallery();
  const html = card(sampleGame());
  assert.match(html, /Not checked yet/);
  assert.doesNotMatch(html, /File checks passed/);
  assert.match(html, /6 of 6 hands-on checks untested/);
});

test('a gallery card counts unreported manual checks as untested', () => {
  const { card } = loadGallery();
  const html = card(sampleGame({
    validation: { blocking: 0, warnings: 0 },
    human_tests: [{ id: 'manual-offline', status: 'passed' }, { id: 'manual-debrief', status: 'failed' }],
  }));
  assert.match(html, /File checks passed/);
  assert.match(html, /4 of 6 hands-on checks untested/);
  assert.match(html, /1 hands-on check failed/);
});

test('fields from game.json are escaped on a gallery card', () => {
  const { card } = loadGallery();
  const html = card(sampleGame({
    emoji: '<img src=x onerror=alert(1)>',
    session_minutes: '<b>5</b>',
    title: '<script>x</script>',
  }));
  assert.doesNotMatch(html, /<img/);
  assert.doesNotMatch(html, /<b>5/);
  assert.doesNotMatch(html, /<script>/);
});
