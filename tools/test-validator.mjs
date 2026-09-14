#!/usr/bin/env node
/**
 * Tests for the classroom-readiness validator.
 *   node --test tools/test-*.mjs
 *
 * Each case states the Playable Past rule it defends, so a future maintainer
 * can tell an intentional rule change from a regression.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { validate } from '../assets/js/validator.js';

const ids = (list) => list.map((f) => f.id);
const run = (html) => validate(html, { filename: 'fixture.html' });

/** A minimal file that satisfies every automated check. */
const CLEAN = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Test Game</title>
<style>body{font-family:system-ui}</style>
</head>
<body>
<h1>Test Game</h1>
<button id="start">Start</button>
<button id="restart">Play again</button>
<section id="sources"><h2>Sources &amp; assumptions</h2>
<p>Built from one attested source. The linking dialogue is invented.</p></section>
<script>
/* GAME_DATA — edit the text below to change the game. */
const GAME_DATA = { questions: [{ q: 'One', a: 'Two' }] };
try { localStorage.getItem('x'); } catch (e) { /* storage blocked */ }
document.getElementById('start').addEventListener('click', () => {});
</script>
</body>
</html>`;

test('a clean single-file game passes every automated check', () => {
  const r = run(CLEAN);
  assert.deepEqual(r.blocking, [], `unexpected blocking: ${ids(r.blocking)}`);
  assert.deepEqual(r.warnings, [], `unexpected warnings: ${ids(r.warnings)}`);
  assert.equal(r.verdict, 'ready-for-your-tests');
});

test('a pass is never reported as classroom-ready on its own', () => {
  const r = run(CLEAN);
  // Hard rule 10: the manual checks must survive a clean run.
  assert.equal(r.manual.length, 6);
  assert.match(r.summary, /does not mean the game is good history/);
});

test('external script is blocking (strong default: everything inlined)', () => {
  const r = run(CLEAN.replace('</head>', '<script src="https://cdn.example.com/x.js"></script></head>'));
  assert.ok(ids(r.blocking).includes('external-script'));
});

test('external stylesheet is blocking', () => {
  const r = run(CLEAN.replace('</head>', '<link rel="stylesheet" href="https://x.example/a.css"></head>'));
  assert.ok(ids(r.blocking).includes('external-stylesheet'));
});

test('a web font in CSS is blocking and named as a font', () => {
  const r = run(CLEAN.replace('body{', '@import url(https://fonts.googleapis.com/css2?family=X);body{'));
  const f = r.blocking.find((x) => x.id === 'remote-css-resource');
  assert.ok(f, 'expected remote-css-resource');
  assert.match(f.title, /font/i);
});

test('@import url() reports one row, not two', () => {
  const r = run(CLEAN.replace('body{', '@import url(https://x.example/a.css);body{'));
  const f = r.blocking.find((x) => x.id === 'remote-css-resource');
  assert.equal(f.evidence.length, 1);
});

test('protocol-relative URLs count as remote', () => {
  const r = run(CLEAN.replace('</head>', '<script src="//cdn.example.com/x.js"></script></head>'));
  assert.ok(ids(r.blocking).includes('external-script'));
});

test('inline data: URIs are not treated as network use', () => {
  const r = run(CLEAN.replace('<h1>', '<img alt="seal" src="data:image/svg+xml,%3Csvg%3E%3C/svg%3E"><h1>'));
  assert.deepEqual(r.blocking, []);
});

test('an outbound <a href> link is not a runtime fetch', () => {
  const r = run(CLEAN.replace('<h1>', '<a href="https://example.org/source">source</a><h1>'));
  assert.deepEqual(r.blocking, []);
});

test('network calls during play are blocking (rule 12)', () => {
  for (const call of ['fetch("/x")', 'new XMLHttpRequest()', 'new WebSocket("ws://x")',
    'new EventSource("/x")', 'navigator.sendBeacon("/x")']) {
    const r = run(CLEAN.replace('const GAME_DATA', `${call};\nconst GAME_DATA`));
    assert.ok(ids(r.blocking).includes('network-during-play'), `missed: ${call}`);
  }
});

test('a protocol-relative url() in CSS is still caught as remote', () => {
  // Regression: the JS line-comment stripper must not eat `url(//host/x)`.
  const r = run(CLEAN.replace('body{', 'body{background:url(//cdn.example.com/bg.png);'));
  assert.ok(ids(r.blocking).includes('remote-css-resource'));
});

test('network calls inside comments are ignored', () => {
  for (const line of ['// we deliberately avoid fetch( here',
    'const ok = 1; // no fetch( at play time']) {
    const r = run(CLEAN.replace('const GAME_DATA', `${line}\nconst GAME_DATA`));
    assert.ok(!ids(r.blocking).includes('network-during-play'), `false positive on: ${line}`);
  }
  // ...but a quoted protocol-relative URL in JS is not a comment.
  const real = run(CLEAN.replace('const GAME_DATA', 'const u = "//cdn.example.com/x";\nconst GAME_DATA'));
  assert.ok(!ids(real.blocking).includes('network-during-play'));
});

test('a live model dependency is blocking (rule 12)', () => {
  const r = run(CLEAN.replace('const GAME_DATA', 'const url="https://api.anthropic.com/v1/messages";\nconst GAME_DATA'));
  assert.ok(ids(r.blocking).includes('model-dependency'));
});

test('an embedded API key is blocking and is never echoed back', () => {
  const secret = 'sk-ant-ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const r = run(CLEAN.replace('const GAME_DATA', `const K="${secret}";\nconst GAME_DATA`));
  assert.ok(ids(r.blocking).includes('exposed-secret'));
  assert.ok(!JSON.stringify(r).includes(secret), 'the report leaked the secret');
});

test('a missing Sources & assumptions screen is blocking (rule 4)', () => {
  const r = run(CLEAN.replace(/<section id="sources">[\s\S]*?<\/section>/, ''));
  assert.ok(ids(r.blocking).includes('no-sources-screen'));
});

test('a sources screen with nothing marked as invented warns', () => {
  const r = run(CLEAN.replace('The linking dialogue is invented.', 'All of it is true.'));
  assert.ok(ids(r.warnings).includes('invented-content-unlabelled'));
});

test('wording checks read the content data block, not just the markup', () => {
  // The build standard tells authors to keep game text in a data block, so a
  // game can be almost entirely string literals inside <script>.
  const dataOnly = CLEAN
    .replace(/<section id="sources">[\s\S]*?<\/section>/, '<div id="app"></div>')
    .replace('<button id="restart">Play again</button>', '')
    .replace("const GAME_DATA = { questions: [{ q: 'One', a: 'Two' }] };",
      "const GAME_DATA = { sources: 'Sources & assumptions: one attested letter; "
      + "the linking dialogue is invented.', restart: 'Play again' };");
  const r = run(dataOnly);
  assert.ok(!ids(r.blocking).includes('no-sources-screen'), 'missed sources text in data block');
  assert.ok(!ids(r.warnings).includes('no-restart'), 'missed restart text in data block');
  assert.ok(!ids(r.warnings).includes('invented-content-unlabelled'));
});

test('non-ASCII text with no charset is blocking, ASCII-only only warns', () => {
  const noCharset = CLEAN
    .replace('<meta charset="utf-8">\n', '')
    .replace('GAME_DATA — edit', 'GAME_DATA - edit'); // keep this case genuinely ASCII-only
  assert.equal(run(noCharset).warnings.find((f) => f.id === 'missing-charset').severity, 'warning');
  const cjk = noCharset.replace('<h1>Test Game</h1>', '<h1>絲路貿易</h1>');
  assert.equal(run(cjk).blocking.find((f) => f.id === 'missing-charset').severity, 'blocking');
});

test('a fragment rather than a whole page is blocking', () => {
  const r = run('<div><button>Start</button></div>');
  assert.ok(ids(r.blocking).includes('not-a-full-page'));
});

test('placeholder text in the file warns', () => {
  const r = run(CLEAN.replace('const GAME_DATA', '// ... rest of the code here\nconst GAME_DATA'));
  assert.ok(ids(r.warnings).includes('placeholder-content'));
});

test('unguarded localStorage warns, guarded does not', () => {
  const r = run(CLEAN.replace("try { localStorage.getItem('x'); } catch (e) { /* storage blocked */ }",
    "localStorage.setItem('x', 1);"));
  assert.ok(ids(r.warnings).includes('unguarded-storage'));
  assert.ok(!ids(run(CLEAN).warnings).includes('unguarded-storage'));
});

test('a clickable div warns, a real button does not', () => {
  const r = run(CLEAN.replace('<button id="start">Start</button>', '<div onclick="go()">Start</div>'));
  assert.ok(ids(r.warnings).includes('clickable-non-button'));
});

test('a restart control is recognised in the classroom language', () => {
  const zh = CLEAN.replace('<button id="restart">Play again</button>', '<button id="restart">重新開始</button>');
  assert.ok(!ids(run(zh).warnings).includes('no-restart'));
});

test('file size thresholds escalate from warning to blocking', () => {
  const pad = (n) => CLEAN + `<!--${'x'.repeat(n)}-->`;
  assert.ok(ids(run(pad(4 * 1024 * 1024)).warnings).includes('file-large'));
  assert.ok(ids(run(pad(11 * 1024 * 1024)).blocking).includes('file-too-large'));
});

test('the verdict tracks the worst finding', () => {
  assert.equal(run(CLEAN).verdict, 'ready-for-your-tests');
  assert.equal(run(CLEAN.replace('<title>Test Game</title>', '')).verdict, 'needs-work');
  assert.equal(run('<div>x</div>').verdict, 'blocked');
});

test('the published demo game passes its own gate', (t) => {
  const path = new URL('../games/corroboration-demo/game.html', import.meta.url);
  if (!existsSync(path)) return t.skip('demo game not present');
  const src = readFileSync(path, 'utf8');
  const r = validate(src, { filename: 'game.html' });
  assert.deepEqual(r.blocking, [], `demo game is blocking on: ${ids(r.blocking)}`);
  assert.deepEqual(r.warnings, [], `demo game warns on: ${ids(r.warnings)}`);
});
