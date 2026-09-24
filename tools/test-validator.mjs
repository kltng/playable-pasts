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
import { validate, MANUAL_CHECKS } from '../assets/js/validator.js';

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
  // ...but a quoted protocol-relative URL in JS is not a comment: the call
  // after it on the same line must still be seen.
  const real = run(CLEAN.replace('const GAME_DATA', 'const u = "//cdn.example.com/x"; fetch(u);\nconst GAME_DATA'));
  assert.ok(ids(real.blocking).includes('network-during-play'), 'a quoted "//" hid the fetch after it');
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

test('an ellipsis standing in for code warns, in a comment or alone on a line', () => {
  assert.ok(ids(run(CLEAN.replace('const GAME_DATA', '  // ...\nconst GAME_DATA')).warnings).includes('placeholder-content'));
  assert.ok(ids(run(CLEAN.replace('const GAME_DATA', '  ...\nconst GAME_DATA')).warnings).includes('placeholder-content'));
  assert.ok(ids(run(CLEAN.replace('<h1>Test Game</h1>', '<h1>Test Game</h1>\n<!-- ... -->')).warnings).includes('placeholder-content'));
});

test('an ellipsis inside quoted game text is punctuation, not a placeholder (rule 6)', () => {
  // Newspaper extracts, letters, and dialogue elide with "..." all the time.
  const r = run(CLEAN.replace("{ q: 'One', a: 'Two' }",
    "{ q: 'The city must close ... there were 666 new cases', a: 'Courts to suspend \u2026 two weeks' }"));
  assert.ok(!ids(r.warnings).includes('placeholder-content'), `flagged: ${JSON.stringify(r.warnings.map((w) => w.evidence))}`);
});

test('a screen called Sources & limitations or Provenance & limitations satisfies rule 4', () => {
  for (const name of ['Sources &amp; limitations', 'Provenance &amp; limitations', 'Sources and caveats']) {
    const r = run(CLEAN.replace('Sources &amp; assumptions', name));
    assert.ok(!ids(r.blocking).includes('no-sources-screen'), `"${name}" was not accepted`);
  }
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
  const ok = run(CLEAN.replace('<button id="start">Start</button>', '<button id="start" onclick="go()">Start</button>'));
  assert.ok(!ids(ok.warnings).includes('clickable-non-button'), 'a real button with onclick was flagged');
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

/* ------------------------------------------------------------------ *
 * Helpers for the cases below
 * ------------------------------------------------------------------ */

const inScript = (code) => CLEAN.replace('const GAME_DATA', `${code}\nconst GAME_DATA`);
const inHead = (html) => CLEAN.replace('</head>', `${html}\n</head>`);
const inBody = (html) => CLEAN.replace('<h1>', `${html}\n<h1>`);
const inCss = (css) => CLEAN.replace('body{', `${css}body{`);
const inGameText = (text) => CLEAN.replace("{ q: 'One', a: 'Two' }", `{ q: ${JSON.stringify(text)}, a: 'Two' }`);
const has = (list, id) => ids(list).includes(id);

/* ------------------------------------------------------------------ *
 * Honesty rule (Playable Past hard rule 10)
 * ------------------------------------------------------------------ */

test('a check that crashes is blocking, never a quiet pass (rule 10)', () => {
  function checkThatBreaks() { throw new Error('boom'); }
  const r = validate(CLEAN, { filename: 'x.html', checks: [checkThatBreaks] });
  const f = r.blocking.find((x) => x.id === 'checker-error');
  assert.ok(f, 'checker-error must be blocking');
  assert.equal(r.verdict, 'blocked');
  assert.match(f.plain, /not checked/);
  assert.match(r.summary, /not checked/);
  assert.doesNotMatch(r.summary, /problem/, 'a checker fault is not a problem in the game');
});

test('each report gets its own copy of the manual checks (rule 10)', () => {
  const first = run(CLEAN);
  assert.notEqual(first.manual, MANUAL_CHECKS);
  first.manual[0].title = 'changed';
  first.manual.length = 0;
  const second = run(CLEAN);
  assert.equal(second.manual.length, MANUAL_CHECKS.length);
  assert.notEqual(second.manual[0].title, 'changed');
  assert.ok(Object.isFrozen(MANUAL_CHECKS) && MANUAL_CHECKS.every(Object.isFrozen));
});

test('the summary counts the manual tests from the list itself (rule 10)', () => {
  const words = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
  const expected = new RegExp(`\\b${words[MANUAL_CHECKS.length]} tests?\\b`);
  assert.match(run(CLEAN).summary, expected);
  assert.match(run(CLEAN.replace('<title>Test Game</title>', '')).summary, expected);
});

test('scattered words are not a Sources & assumptions screen (rule 4)', () => {
  const r = run(CLEAN.replace(/<section id="sources">[\s\S]*?<\/section>/,
    '<p>Source: my notes. Limitations apply to shipping.</p>'));
  assert.ok(has(r.blocking, 'no-sources-screen'));
  // Two separate data-block strings do not make one label either.
  const split = run(CLEAN.replace(/<section id="sources">[\s\S]*?<\/section>/, '')
    .replace("{ q: 'One', a: 'Two' }", "{ q: 'Pick a source', a: 'Assumptions are yours' }"));
  assert.ok(has(split.blocking, 'no-sources-screen'));
});

/* ------------------------------------------------------------------ *
 * False positives: a finding on a correct game is worse than a miss
 * ------------------------------------------------------------------ */

test('commented-out HTML is not scanned for tags (strong default)', () => {
  const r = run(inHead('<!-- <script src="https://cdn.example.com/x.js"></script> -->'));
  assert.deepEqual(r.blocking, [], `flagged: ${ids(r.blocking)}`);
  const img = run(inBody('<!-- <img src="data:,x"> -->'));
  assert.ok(!has(img.warnings, 'img-missing-alt'));
});

test('utf8 without a hyphen, or a byte-order mark, declares the encoding', () => {
  const cjk = CLEAN.replace('<h1>Test Game</h1>', '<h1>絲路貿易</h1>');
  const r = run(cjk.replace('<meta charset="utf-8">', '<meta charset="utf8">'));
  assert.ok(!has(r.blocking, 'missing-charset') && !has(r.warnings, 'missing-charset'));
  const bom = run('﻿' + cjk.replace('<meta charset="utf-8">\n', ''));
  assert.ok(!has(bom.blocking, 'missing-charset') && !has(bom.warnings, 'missing-charset'));
  // Still caught when genuinely missing.
  assert.ok(has(run(cjk.replace('<meta charset="utf-8">\n', '')).blocking, 'missing-charset'));
});

test('game text that mentions fetch, debugger, or localStorage is not code (rule 12)', () => {
  const r1 = run(inGameText('Send a servant to fetch (and pay for) grain'));
  assert.ok(!has(r1.blocking, 'network-during-play'));
  const r2 = run(inGameText('The debugger of the ship'));
  assert.ok(!has(r2.warnings, 'debugger-statement'));
  const r3 = run(inGameText('Progress is not saved to localStorage'));
  assert.ok(!has(r3.warnings, 'unguarded-storage'));
  const r4 = run(inScript("const canSave = 'localStorage' in window;"));
  assert.ok(!has(r4.warnings, 'unguarded-storage'));
  // The call itself sits outside the string, so a real fetch is still caught.
  assert.ok(has(run(inScript('fetch("https://x.example/d.json");')).blocking, 'network-during-play'));
});

test('url() written in visible prose is not CSS', () => {
  const r = run(CLEAN.replace('<p>Built from', '<p>Scan at url(https://archive.org/x). Built from'));
  assert.ok(!has(r.blocking, 'remote-css-resource'));
  // ...but a style attribute and style text set from a script are.
  assert.ok(has(run(inBody('<div style="background:url(https://x.example/a.png)"></div>')).blocking, 'remote-css-resource'));
  assert.ok(has(run(inScript('el.style.background = "url(https://x.example/a.png)";')).blocking, 'remote-css-resource'));
});

test('a // inside a URL does not make a later ellipsis a placeholder', () => {
  const r = run(CLEAN.replace('<p>Built from', '<p>See https://archive.org/details/x, "The city must close..." Built from'));
  assert.ok(!has(r.warnings, 'placeholder-content'));
  const spread = run(inScript('const SRC = "https://archive.org/x"; const all = [...GAME_DATA.questions];'));
  assert.ok(!has(spread.warnings, 'placeholder-content'));
  const block = run(inScript('/* note */ const more = [...GAME_DATA.questions];'));
  assert.ok(!has(block.warnings, 'placeholder-content'), 'an ellipsis after a closed block comment');
});

test('transition: none is not animation', () => {
  assert.ok(!has(run(inCss('button{transition:none}')).warnings, 'no-reduced-motion'));
  assert.ok(!has(run(inBody('<p style="animation: none">x</p>')).warnings, 'no-reduced-motion'));
  const prose = run(inGameText('Transition: from peace to war'));
  assert.ok(!has(prose.warnings, 'no-reduced-motion'));
});

test('no-reduced-motion warns on real animation and clears with the media query', () => {
  assert.ok(has(run(inCss('button{transition:opacity .2s}')).warnings, 'no-reduced-motion'));
  assert.ok(has(run(inCss('@keyframes spin{to{transform:rotate(1turn)}}')).warnings, 'no-reduced-motion'));
  const ok = run(inCss('button{transition:opacity .2s}@media (prefers-reduced-motion: reduce){button{transition:none}}'));
  assert.ok(!has(ok.warnings, 'no-reduced-motion'));
});

/* ------------------------------------------------------------------ *
 * False negatives: things that break in class and used to pass
 * ------------------------------------------------------------------ */

test('a file that loads sibling files is blocking (rule 1: one file)', () => {
  for (const html of ['<script src="game.js"></script>', '<link rel="stylesheet" href="style.css">']) {
    assert.ok(has(run(inHead(html)).blocking, 'local-file'), `missed: ${html}`);
  }
  for (const html of ['<img alt="map" src="map.png">', '<audio src="sounds/bell.mp3" controls></audio>',
    '<img alt="" srcset="a.png 1x, b.png 2x">', '<video poster="poster.jpg"></video>']) {
    assert.ok(has(run(inBody(html)).blocking, 'local-file'), `missed: ${html}`);
  }
  // Inline data, fragments, about:blank, and plain links are fine.
  for (const html of ['<img alt="" src="data:image/png;base64,AAAA">', '<img alt="" src="blob:x">',
    '<svg><use href="#icon"></use></svg>', '<iframe src="about:blank"></iframe>',
    '<a href="notes.html">notes</a>', '<link rel="icon" href="favicon.ico">']) {
    const r = run(inBody(html));
    assert.ok(!has(r.blocking, 'local-file'), `false positive: ${html}`);
  }
  // HTML built by a script is assembled at run time; do not guess.
  assert.ok(!has(run(inScript('el.innerHTML = `<img alt="" src="${pic}">`;')).blocking, 'local-file'));
});

test('module imports, backtick imports, and window.XMLHttpRequest are network use (rule 12)', () => {
  const mod = CLEAN.replace('</body>', '<script type="module">import confetti from "https://cdn.skypack.dev/confetti";</script></body>');
  assert.ok(has(run(mod).blocking, 'network-during-play'));
  const bare = CLEAN.replace('</body>', '<script type="module">import "https://cdn.example.com/side.js";</script></body>');
  assert.ok(has(run(bare).blocking, 'network-during-play'));
  assert.ok(has(run(inScript('import(`https://cdn.example.com/x.js`);')).blocking, 'network-during-play'));
  assert.ok(has(run(inScript('import("https://cdn.example.com/x.js");')).blocking, 'network-during-play'));
  assert.ok(has(run(inScript('const x = new window.XMLHttpRequest();')).blocking, 'network-during-play'));
  assert.ok(has(run(inScript('importScripts("https://cdn.example.com/w.js");')).blocking, 'network-during-play'));
});

test('pictures, sounds, and workers loaded from a URL in code are network use (rule 12)', () => {
  for (const code of ['new Image().src = "https://x.example/p.png";', 'const s = new Audio("https://x.example/a.mp3");',
    'const w = new Worker("https://x.example/w.js");']) {
    assert.ok(has(run(inScript(code)).blocking, 'network-during-play'), `missed: ${code}`);
  }
  // A picture drawn from inline data is fine.
  assert.ok(!has(run(inScript('new Image().src = "data:image/png;base64,AAAA";')).blocking, 'network-during-play'));
});

test('redirects, <base>, body background, srcdoc, and image-set() are caught (strong default)', () => {
  assert.ok(has(run(inHead('<meta http-equiv="refresh" content="0;url=https://x.example/">')).blocking, 'remote-navigation'));
  assert.ok(has(run(inHead('<base href="https://x.example/">')).blocking, 'remote-navigation'));
  assert.ok(has(run(CLEAN.replace('<body>', '<body background="https://x.example/bg.png">')).blocking, 'external-asset'));
  assert.ok(has(run(inBody('<iframe srcdoc="<img src=https://x.example/a.png>"></iframe>')).blocking, 'external-asset'));
  assert.ok(has(run(inCss('body{background-image:image-set("https://x.example/a.png" 1x);}')).blocking, 'remote-css-resource'));
  // A refresh with no address just reloads the page; it fetches nothing new.
  assert.ok(!has(run(inHead('<meta http-equiv="refresh" content="600">')).blocking, 'remote-navigation'));
});

test('entity-encoded addresses are decoded before checking (strong default)', () => {
  assert.ok(has(run(inHead('<script src="https&#58;//cdn.example.com/x.js"></script>')).blocking, 'external-script'));
  assert.ok(has(run(inBody('<img alt="" src="&#104;ttps://x.example/a.png">')).blocking, 'external-asset'));
  assert.ok(has(run(inBody('<img alt="" src="https&colon;&sol;&sol;x.example/a.png">')).blocking, 'external-asset'));
});

test('strings and regexes do not fool the comment stripper (rule 12)', () => {
  assert.ok(has(run(inScript('var a="a//b";fetch("https://x.example/d.json");')).blocking, 'network-during-play'));
  assert.ok(has(run(inScript('var g="src/*.js";\nfetch("/d.json");\nvar h="*/";')).blocking, 'network-during-play'));
  assert.ok(has(run(inScript('var re=/a\\/\\/b/;fetch("/d.json");')).blocking, 'network-during-play'));
  assert.ok(has(run(inScript('var t=`a // b ${1}`;fetch("/d.json");')).blocking, 'network-during-play'));
});

test('a try block that already closed does not guard later storage', () => {
  const r = run(CLEAN.replace("try { localStorage.getItem('x'); } catch (e) { /* storage blocked */ }",
    "try { init(); } catch (e) {}\nlocalStorage.setItem('x', 1);"));
  assert.ok(has(r.warnings, 'unguarded-storage'));
  const nested = run(CLEAN.replace("try { localStorage.getItem('x'); } catch (e) { /* storage blocked */ }",
    "try { if (ok) { localStorage.getItem('x'); } } catch (e) {}"));
  assert.ok(!has(nested.warnings, 'unguarded-storage'));
});

test('the word "again" in prose is not a restart control', () => {
  const r = run(CLEAN.replace('<button id="restart">Play again</button>', '<p>The plague struck again.</p>'));
  assert.ok(has(r.warnings, 'no-restart'));
  const label = run(CLEAN.replace('<button id="restart">Play again</button>', '<button id="restart">Again</button>'));
  assert.ok(!has(label.warnings, 'no-restart'));
  for (const phrase of ['Try again', 'Start again', 'Restart']) {
    const ok = run(CLEAN.replace('Play again', phrase));
    assert.ok(!has(ok.warnings, 'no-restart'), `"${phrase}" not recognised`);
  }
});

/* ------------------------------------------------------------------ *
 * Checks that had no test of their own
 * ------------------------------------------------------------------ */

test('remote srcset and SVG <image href> are external assets (strong default)', () => {
  assert.ok(has(run(inBody('<img alt="" srcset="a.png 1x, https://x.example/b.png 2x">')).blocking, 'external-asset'));
  assert.ok(has(run(inBody('<svg><image href="https://x.example/a.png"/></svg>')).blocking, 'external-asset'));
});

test('a remote preload or preconnect only warns', () => {
  const r = run(inHead('<link rel="preconnect" href="https://fonts.gstatic.com">'));
  assert.ok(has(r.warnings, 'external-preload'));
  assert.ok(!has(r.blocking, 'external-preload'));
});

test('missing lang, viewport, alt, and title each warn (build standard: accessibility)', () => {
  assert.ok(has(run(CLEAN.replace('<html lang="en">', '<html>')).warnings, 'missing-lang'));
  assert.ok(has(run(CLEAN.replace(/<meta name="viewport"[^>]*>\n/, '')).warnings, 'missing-viewport'));
  assert.ok(has(run(inBody('<img src="data:,x">')).warnings, 'img-missing-alt'));
  assert.ok(!has(run(inBody('<img alt="" src="data:,x">')).warnings, 'img-missing-alt'));
  assert.ok(has(run(CLEAN.replace('<title>Test Game</title>', '')).warnings, 'no-title'));
});

test('a canvas with no buttons warns (build standard: accessibility)', () => {
  const r = run(CLEAN.replace(/<button[^>]*>[^<]*<\/button>\n/g, '').replace('<h1>', '<canvas></canvas><h1>'));
  assert.ok(has(r.warnings, 'canvas-only'));
  assert.ok(!has(run(inBody('<canvas></canvas>')).warnings, 'canvas-only'), 'canvas beside real buttons');
});

test('autoplaying media warns', () => {
  assert.ok(has(run(inBody('<audio autoplay src="data:audio/wav;base64,AAAA"></audio>')).warnings, 'autoplay-media'));
});

test('a debugger statement warns', () => {
  assert.ok(has(run(inScript('debugger;')).warnings, 'debugger-statement'));
});

test('game content with no marked data block warns (build standard: instructor ownership)', () => {
  const r = run(CLEAN.replace('/* GAME_DATA — edit the text below to change the game. */\n', '')
    .replace('const GAME_DATA = { questions:', 'const stuff = { items:'));
  assert.ok(has(r.warnings, 'no-content-block'));
});

test('calls to OpenAI, Google, and a host AI global are model dependencies (rule 12)', () => {
  for (const code of ['const u = "https://api.openai.com/v1/chat/completions";',
    'const u = "https://generativelanguage.googleapis.com/v1/models";',
    'window.claude.complete("hi");']) {
    assert.ok(has(run(inScript(code)).blocking, 'model-dependency'), `missed: ${code}`);
  }
});

test('OpenAI, Google, and GitHub keys are caught and never echoed back', () => {
  // Obviously fake values that still have the shape of a real key.
  const fakes = ['sk-' + 'FAKE'.repeat(10), 'AIza' + 'FAKEFAKE'.repeat(4), 'ghp_' + 'FAKE'.repeat(9)];
  for (const secret of fakes) {
    const r = run(inScript(`const K = "${secret}";`));
    assert.ok(has(r.blocking, 'exposed-secret'), `missed: ${secret.slice(0, 5)}...`);
    assert.ok(!JSON.stringify(r).includes(secret), 'the report leaked the secret');
  }
  // A key inside a comment is just as readable.
  assert.ok(has(run(inScript(`// old key: ${fakes[0]}`)).blocking, 'exposed-secret'));
});

test('real games in the gallery pass without new findings', (t) => {
  // Any new finding on a published game is a false positive until proven otherwise.
  for (const slug of ['chronology-demo', 'corroboration-demo', 'influenza-front-page']) {
    const path = new URL(`../games/${slug}/game.html`, import.meta.url);
    if (!existsSync(path)) { t.diagnostic(`${slug} not present`); continue; }
    const r = validate(readFileSync(path, 'utf8'), { filename: 'game.html' });
    assert.deepEqual(r.blocking, [], `${slug} is blocking on: ${ids(r.blocking)}`);
    const unexpected = r.warnings.filter((w) => w.id !== 'file-large');
    assert.deepEqual(unexpected, [], `${slug} warns on: ${ids(unexpected)}`);
  }
});
