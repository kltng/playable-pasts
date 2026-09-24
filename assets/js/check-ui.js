/**
 * Playable Pasts — the checker page.
 *
 * Two passes over the instructor's file:
 *   1. `validate()` from validator.js — a static read of the source.
 *   2. A live pass: the game is opened for a few seconds, unattended, inside a
 *      sandboxed iframe under a strict Content-Security-Policy that forbids
 *      every outside request. Anything the game tries to fetch in that window is
 *      reported by the browser as a CSP violation, which is real evidence rather
 *      than a guess from a regular expression. Later screens and clicks are not
 *      covered; the report says so.
 *
 * Nothing leaves the browser. There is no upload and no server.
 */
import { validate, formatBytes, SEVERITY } from './validator.js';

const $ = (sel, root = document) => root.querySelector(sel);

const drop = $('#drop');
const fileInput = $('#file');
const results = $('#results');
const intro = $('#intro');

/* ------------------------------------------------------------------ *
 * File intake
 * ------------------------------------------------------------------ */

fileInput.addEventListener('change', () => {
  if (fileInput.files.length) handleFile(fileInput.files[0]);
});

['dragenter', 'dragover'].forEach((evt) => {
  drop.addEventListener(evt, (e) => {
    e.preventDefault();
    drop.classList.add('dragging');
  });
});
['dragleave', 'drop'].forEach((evt) => {
  drop.addEventListener(evt, (e) => {
    e.preventDefault();
    drop.classList.remove('dragging');
  });
});
drop.addEventListener('drop', (e) => {
  const file = e.dataTransfer?.files?.[0];
  if (file) handleFile(file);
});

/** Counts every check started, so a slow earlier file can never paint over a later one. */
let runCounter = 0;

async function handleFile(file) {
  const runId = ++runCounter;
  cancelLiveTest();

  if (!/\.html?$/i.test(file.name)) {
    renderFatal(
      'That is not an HTML file',
      `You dropped <code>${escapeHtml(file.name)}</code>. A Playable Past game is one `
      + '<code>.html</code> file. If your agent gave you the game as text, paste it into a '
      + 'plain text editor and save it with a <code>.html</code> ending first — not '
      + '<code>.html.txt</code>.',
    );
    return;
  }

  let source;
  try {
    // Decode by hand so a byte-order mark survives: file.text() drops it, and
    // the mark alone is enough to tell the browser the file is UTF-8.
    source = new TextDecoder('utf-8', { ignoreBOM: true }).decode(await file.arrayBuffer());
  } catch (err) {
    if (runId !== runCounter) return;
    renderFatal('The file could not be read', escapeHtml(String(err.message || err)));
    return;
  }
  // Another file was chosen while this one was being read.
  if (runId !== runCounter) return;

  const report = validate(source, { filename: file.name, bytes: file.size });
  render(report);
  runLiveTest(source, report, runId);
}

/* ------------------------------------------------------------------ *
 * The live pass
 * ------------------------------------------------------------------ */

const LIVE_CSP = [
  "default-src 'none'",
  "script-src 'unsafe-inline' 'unsafe-eval' blob:",
  "style-src 'unsafe-inline'",
  "img-src data: blob:",
  "media-src data: blob:",
  "font-src data:",
  "connect-src 'none'",
  "form-action 'none'",
  "frame-src 'none'",
  "base-uri 'none'",
].join('; ');

/** How long the game runs, unattended, before we read the results. */
const LIVE_MS = 3200;

/**
 * Injected into the game so it can report violations back out of the frame.
 *
 * Trust note: the probe runs inside the game's own page, so the game can read
 * the token and could, if it wanted to, silence the probe (for example with
 * stopImmediatePropagation on 'securitypolicyviolation') or send made-up
 * counts. That cannot be prevented from inside the page. The live pass assumes
 * the game is not actively fighting the check; it is evidence about honest
 * mistakes, not a defence against a hostile file. The parent page still treats
 * every message as untrusted data (see onMessage and renderLive).
 */
function probeScript(token) {
  return `<script>(function(){
  var T=${JSON.stringify(token)};
  function send(kind,payload){try{parent.postMessage({pp:T,kind:kind,payload:payload},'*')}catch(e){}}
  document.addEventListener('securitypolicyviolation',function(e){
    send('csp',{directive:e.violatedDirective,uri:String(e.blockedURI||'').slice(0,300)});
  });
  window.addEventListener('error',function(e){
    send('error',{message:String(e.message||'').slice(0,300),line:e.lineno||0});
  });
  window.addEventListener('unhandledrejection',function(e){
    send('error',{message:'Unhandled promise rejection: '+String((e.reason&&e.reason.message)||e.reason||'').slice(0,300),line:0});
  });
  function usable(el){
    if(el.closest('[hidden],[aria-hidden="true"],[inert]'))return false;
    if(!el.getClientRects().length)return false;
    var cs=getComputedStyle(el);
    if(cs.visibility==='hidden'||cs.visibility==='collapse')return false;
    if(el.matches(':disabled')||el.getAttribute('aria-disabled')==='true')return false;
    return true;
  }
  function count(sel){return Array.prototype.filter.call(document.querySelectorAll(sel),usable).length}
  window.addEventListener('load',function(){setTimeout(function(){
    var counts={buttons:count('button,[role=button]'),
      focusable:count('a[href],button,input:not([type=hidden]),select,textarea,[tabindex]:not([tabindex="-1"])'),
      text:((document.body&&document.body.innerText)||'').trim().length};
    send('loaded',counts);
  },400)});
}())</script>`;
}

/**
 * Put the CSP and the probe at the very start of the document: a meta CSP only
 * governs what comes after it.
 *
 * We do not search for "<head": the first match could sit inside a comment or a
 * script string, and then the CSP would land somewhere the browser ignores.
 * Instead we skip only what may legally come before the doctype (a byte-order
 * mark, whitespace, comments), step over the doctype if there is one, and insert
 * there. The parser then opens an implicit <head> for our <meta> and <script>,
 * and the game's own <html>/<head> tags merge into it. Inserting after the
 * doctype, not before it, keeps the game in standards mode; anything before the
 * doctype would switch the browser to quirks mode and change how it lays out.
 */
function instrument(source, token) {
  const inject = `<meta http-equiv="Content-Security-Policy" content="${LIVE_CSP}">`
    + probeScript(token);

  const prologue = source.match(/^﻿?(?:\s|<!--[\s\S]*?-->)*/);
  let at = prologue ? prologue[0].length : 0;
  const doctype = source.slice(at).match(/^<!doctype\b[^>]*>/i);
  if (doctype) at += doctype[0].length;
  return source.slice(0, at) + inject + source.slice(at);
}

/** The live pass currently running, if any, so a new file can stop it. */
let liveRun = null;

function cancelLiveTest() {
  if (!liveRun) return;
  clearTimeout(liveRun.timer);
  window.removeEventListener('message', liveRun.onMessage);
  liveRun.frame.remove();
  liveRun = null;
}

/** Keep at most this many messages; a runaway error loop should not stall the page. */
const MAX_MESSAGES = 200;

const toText = (x, max = 300) => String(x ?? '').slice(0, max);
const toCount = (x) => Math.max(0, Math.floor(Number(x) || 0));

function runLiveTest(source, report, runId) {
  const panel = $('#live-panel');
  const body = $('#live-body');
  const status = $('#live-status');
  if (!panel) return;
  panel.hidden = false;
  body.innerHTML = '';
  if (status) status.textContent = 'Opening your game for a few seconds with every outside request blocked…';

  const token = 'pp-' + Math.random().toString(36).slice(2);
  const violations = [];
  const errors = [];
  let loaded = null;
  let loads = 0;

  const frame = document.createElement('iframe');
  // Only allow-scripts. No allow-same-origin: the frame gets an opaque origin
  // and cannot touch this page, and browser storage is unavailable inside — the
  // same condition as a private window or a locked-down school device.
  // No allow-forms (the CSP also has form-action 'none'), no allow-popups, and
  // no allow-modals, so an alert() loop cannot freeze the checker; confirm()
  // simply returns false while we watch.
  frame.setAttribute('sandbox', 'allow-scripts');
  frame.setAttribute('title', 'Offline test of your game');
  frame.className = 'live-frame';

  // CSP does not cover a page sending itself somewhere else. The first load is
  // our own copy of the game; any later load means it navigated away.
  frame.addEventListener('load', () => { loads += 1; });

  function onMessage(e) {
    // Only the frame we made may speak, and only with this run's token.
    if (e.source !== frame.contentWindow) return;
    const d = e.data;
    if (!d || typeof d !== 'object' || d.pp !== token) return;
    const p = d.payload && typeof d.payload === 'object' ? d.payload : {};
    if (d.kind === 'csp' && violations.length < MAX_MESSAGES) {
      violations.push({ directive: toText(p.directive, 80), uri: toText(p.uri) });
    } else if (d.kind === 'error' && errors.length < MAX_MESSAGES) {
      errors.push({ message: toText(p.message), line: toCount(p.line) });
    } else if (d.kind === 'loaded' && !loaded) {
      loaded = { buttons: toCount(p.buttons), focusable: toCount(p.focusable), text: toCount(p.text) };
    }
  }
  window.addEventListener('message', onMessage);

  const timer = setTimeout(() => {
    if (runId !== runCounter) return;
    const navigated = loads > 1;
    cancelLiveTest();
    renderLive(body, { violations, errors, loaded, navigated, report });
  }, LIVE_MS);

  liveRun = { timer, onMessage, frame };
  frame.srcdoc = instrument(source, token);
  $('#live-stage').replaceChildren(frame);
}

function renderLive(body, { violations, errors, loaded, navigated, report }) {
  const parts = [];

  const outside = dedupe(violations.filter((v) => v.uri && v.uri !== 'self' && v.uri !== 'inline'));
  const storageErrors = errors.filter((e) => /storage|localStorage|sessionStorage|indexedDB|SecurityError/i.test(e.message));
  const otherErrors = errors.filter((e) => !storageErrors.includes(e));

  if (outside.length) {
    parts.push(panelItem('block', 'Your game reached for the internet', `
      <p>We opened the game with every outside request blocked, the way a classroom with the
      wifi off would. It still tried to load ${outside.length}
      ${outside.length === 1 ? 'thing' : 'things'} from elsewhere:</p>
      <ul class="evidence">${outside.map((v) => `<li><code>${escapeHtml(v.uri)}</code>
        <span class="small">(${escapeHtml(v.directive)})</span></li>`).join('')}</ul>
      <p class="small">This is measured, not guessed: the browser blocked each one and told us.</p>`));
  }

  if (navigated) {
    parts.push(panelItem('block', 'Your game tried to leave its own page', `
      <p>While we watched, the game sent itself to another address. In a classroom with no
      wifi, students would see an error page instead of the game.</p>
      <p>Ask your agent: &ldquo;The game navigates away from its own page when it opens. Find
      where it changes the page address or refreshes, remove it, and give me the corrected
      complete file.&rdquo;</p>`));
  }

  if (!outside.length && !navigated && loaded) {
    parts.push(panelItem('ok', 'No reach for the internet in the first few seconds', `
      <p>In the first three seconds, with nobody clicking, the game did not try to reach the
      internet. That is the most important property of a classroom game, and it is a good
      start.</p>
      <p class="small">This only covers the opening. Later screens, clicks, and links that open
      new windows were not tested. The &ldquo;Open the file with the wifi off&rdquo; check below is
      how you cover them.</p>`));
  }

  if (otherErrors.length) {
    parts.push(panelItem('block', 'The game threw an error while loading', `
      <p>Something broke on its own, with no student touching it:</p>
      <ul class="evidence">${dedupeBy(otherErrors, 'message').slice(0, 6).map((e) =>
        `<li><code>${escapeHtml(e.message)}</code>${e.line ? ` <span class="small">line ${toCount(e.line)}</span>` : ''}</li>`).join('')}</ul>
      <p>Ask your agent: &ldquo;The game throws this error when it opens — here is the message.
      Find the cause and give me the corrected complete file.&rdquo;</p>`));
  }

  if (storageErrors.length) {
    parts.push(panelItem('warn', 'Saved progress fails when storage is blocked', `
      <p>We ran the game the way a private window or a managed school laptop behaves, with
      browser storage unavailable, and it errored:</p>
      <ul class="evidence">${dedupeBy(storageErrors, 'message').slice(0, 3).map((e) =>
        `<li><code>${escapeHtml(e.message)}</code></li>`).join('')}</ul>
      <p>Ask your agent: &ldquo;Wrap every localStorage call in try/catch so the game still
      plays when storage is blocked.&rdquo;</p>`));
  }

  if (!loaded && !outside.length && !errors.length && !navigated) {
    parts.push(panelItem('warn', 'The game did not finish loading', `
      <p>Three seconds in, the page had not reported itself as loaded. That can mean a slow
      opening animation, or that it is waiting for something that will never arrive.</p>
      <p>Open the file yourself and watch what happens.</p>`));
  }

  if (loaded) {
    const buttons = toCount(loaded.buttons);
    const focusable = toCount(loaded.focusable);
    const text = toCount(loaded.text);
    const bits = [];
    bits.push(`${buttons} visible button${buttons === 1 ? '' : 's'}`);
    bits.push(`${focusable} visible control${focusable === 1 ? '' : 's'} you can reach with the Tab key`);
    bits.push(`${text.toLocaleString()} characters of readable text`);
    const noKeyboard = focusable === 0;
    parts.push(panelItem(noKeyboard ? 'warn' : 'manual', 'What the opening screen contains', `
      <p>${bits.join(', ')}.</p>
      ${noKeyboard
        ? '<p><strong>Nothing on the opening screen can be reached with the Tab key.</strong> '
          + 'A student who cannot use a mouse cannot start the game.</p>'
        : '<p class="small">We counted only what a student can see and use on the first screen, '
          + 'not controls on later screens or ones that are switched off. Counting controls is not '
          + 'the same as playing the game. The keyboard test below is still yours to run.</p>'}`));
  }

  body.innerHTML = parts.join('');

  // The live pass can contradict the static read; say so rather than hide it.
  if (outside.length && !report.blocking.some((f) => /external|remote|network/.test(f.id))) {
    body.insertAdjacentHTML('afterbegin', `<div class="note"><p><strong>Worth knowing:</strong>
      reading the file did not reveal these requests, but running it did. Trust the live
      result.</p></div>`);
  }

  const status = $('#live-status');
  if (status) {
    const trouble = outside.length || navigated || errors.length;
    status.textContent = trouble
      ? 'Finished running your game for three seconds. Something needs fixing; see below.'
      : 'Finished running your game for three seconds. The results are below.';
  }
}

function panelItem(kind, title, html) {
  const label = { block: 'Must fix', warn: 'Worth fixing', ok: 'Good', manual: 'Note' }[kind];
  return `<article class="finding ${kind}">
    <header><span class="badge ${kind === 'block' ? 'block' : kind}">${label}</span>
    <h3>${escapeHtml(title)}</h3></header>
    <div class="finding-body">${html}</div></article>`;
}

/* ------------------------------------------------------------------ *
 * Report rendering
 * ------------------------------------------------------------------ */

const VERDICT = {
  blocked: {
    kind: 'block',
    label: 'Not ready for a classroom',
  },
  'needs-work': {
    kind: 'warn',
    label: 'It will run, but it can be better',
  },
  'ready-for-your-tests': {
    kind: 'ok',
    label: 'Passed every automated check',
  },
};

function render(report) {
  intro.hidden = true;
  results.hidden = false;

  const v = VERDICT[report.verdict];
  const html = [];

  html.push(`<div class="verdict ${v.kind}">
    <p class="eyebrow">Result</p>
    <h2 id="verdict-heading" tabindex="-1">${v.label}</h2>
    <p class="verdict-file"><code>${escapeHtml(report.filename)}</code> · ${formatBytes(report.bytes)}</p>
    <p>${escapeHtml(report.summary)}</p>
    <div class="tally">
      ${tallyChip('block', report.blocking.length, 'must fix')}
      ${tallyChip('warn', report.warnings.length, 'worth fixing')}
      ${tallyChip('manual', report.manual.length, 'only you can check')}
    </div>
  </div>`);

  if (report.blocking.length || report.warnings.length) {
    html.push(`<div class="copybox" id="agentbox">
      <header>Paste this to your agent
        <button class="btn small secondary" type="button" id="copy-fixes">Copy</button>
      </header>
      <pre id="agentprompt">${escapeHtml(agentPrompt(report))}</pre>
    </div>`);
  }

  if (report.blocking.length) {
    html.push(sectionOf('Must fix', 'block',
      'These will stop the game working in a real classroom.', report.blocking));
  }
  if (report.warnings.length) {
    html.push(sectionOf('Worth fixing', 'warn',
      'None of these break the game. All of them make it better for students.', report.warnings));
  }

  html.push(`<section class="report-section">
    <h2>Only you can check these</h2>
    <p class="prose">A validator reads a file. It cannot play your game, sit in your room, or
    know whether the history is right. These six stay unverified until you do them — about
    thirty minutes, best spent a few days before class.</p>
    <ol class="manual-list">${report.manual.map((m) => `<li>
      <h3>${escapeHtml(m.title)} <span class="badge quiet">~${Number(m.minutes) || 0} min</span></h3>
      <p>${escapeHtml(m.plain)}</p></li>`).join('')}</ol>
  </section>`);

  html.push(`<div class="btn-row">
    <button class="btn secondary" type="button" id="download-report">Download this report</button>
    <button class="btn secondary" type="button" id="check-another">Check another file</button>
  </div>`);

  results.innerHTML = html.join('');

  $('#copy-fixes')?.addEventListener('click', (e) => copyText($('#agentprompt').textContent, e.target));
  $('#download-report').addEventListener('click', () => downloadReport(report));
  $('#check-another').addEventListener('click', resetToStart);

  // Move keyboard and screen-reader users to the result, not just the eye.
  $('#verdict-heading').focus({ preventScroll: true });
  results.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/** Back to the empty drop zone: stop any live pass and put focus on the file picker. */
function resetToStart() {
  runCounter += 1;
  cancelLiveTest();
  results.hidden = true;
  results.innerHTML = '';
  intro.hidden = false;
  $('#live-panel').hidden = true;
  $('#live-body').innerHTML = '';
  const status = $('#live-status');
  if (status) status.textContent = '';
  fileInput.value = '';
  fileInput.focus({ preventScroll: true });
  drop.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function tallyChip(kind, n, label) {
  if (!n) return '';
  return `<span class="badge ${kind}">${n} ${label}</span>`;
}

function sectionOf(title, kind, blurb, findings) {
  return `<section class="report-section">
    <h2>${title} <span class="count">${findings.length}</span></h2>
    <p class="prose">${blurb}</p>
    ${findings.map((f) => `<article class="finding ${kind}">
      <header><span class="badge ${kind}">${kind === 'block' ? 'Must fix' : 'Worth fixing'}</span>
      <h3>${escapeHtml(f.title)}</h3></header>
      <div class="finding-body">
        <p>${escapeHtml(f.plain)}</p>
        <p class="fix">${escapeHtml(f.fix)}</p>
        ${f.evidence.length ? `<ul class="evidence">${f.evidence.slice(0, 6).map((e) =>
          `<li>${e.line ? `<span class="lineno">line ${Number(e.line) || 0}</span> ` : ''}<code>${escapeHtml(e.text)}</code></li>`).join('')}</ul>` : ''}
      </div>
    </article>`).join('')}
  </section>`;
}

/** A ready-to-paste instruction, because the instructor should not have to write it. */
function agentPrompt(report) {
  const lines = [];
  lines.push('I checked my Playable Past game with the classroom-readiness checker.');
  lines.push('Please fix everything below and give me back the complete corrected HTML file,');
  lines.push('with nothing left out and no placeholders.');
  lines.push('');
  if (report.blocking.length) {
    lines.push('MUST FIX — these stop the game working in a classroom:');
    report.blocking.forEach((f, i) => {
      lines.push(`${i + 1}. ${f.title}`);
      lines.push(`   ${f.fix}`);
      f.evidence.slice(0, 4).forEach((e) => {
        lines.push(`   found at line ${e.line}: ${e.text}`);
      });
    });
    lines.push('');
  }
  if (report.warnings.length) {
    lines.push('ALSO FIX — these make it better for students:');
    report.warnings.forEach((f, i) => {
      lines.push(`${i + 1}. ${f.title}`);
      lines.push(`   ${f.fix}`);
    });
    lines.push('');
  }
  lines.push('Keep the game one self-contained HTML file: no external scripts, stylesheets,');
  lines.push('fonts, or images, no network requests during play, and no AI model calls.');
  lines.push('Keep the Sources & assumptions screen accurate. Tell me plainly which of these');
  lines.push('you actually verified and which you could not test.');
  return lines.join('\n');
}

function downloadReport(report) {
  const lines = [];
  lines.push(`Playable Pasts — classroom-readiness report`);
  lines.push(`File: ${report.filename} (${formatBytes(report.bytes)})`);
  lines.push(`Checked: ${new Date().toISOString()}`);
  lines.push(`Result: ${VERDICT[report.verdict].label}`);
  lines.push('');
  lines.push(report.summary);
  for (const [heading, items] of [['MUST FIX', report.blocking], ['WORTH FIXING', report.warnings]]) {
    if (!items.length) continue;
    lines.push('', `${heading} (${items.length})`, '');
    for (const f of items) {
      lines.push(`- ${f.title}`);
      lines.push(`  ${f.plain}`);
      lines.push(`  ${f.fix}`);
      f.evidence.slice(0, 6).forEach((e) => lines.push(`  line ${e.line}: ${e.text}`));
      lines.push('');
    }
  }
  lines.push('', 'NOT CHECKED BY THE VALIDATOR — RUN THESE YOURSELF', '');
  report.manual.forEach((m) => {
    lines.push(`[ ] ${m.title} (~${m.minutes} min)`);
    lines.push(`    ${m.plain}`);
  });
  lines.push('', 'This report records an automated read of one file. It is not a judgement of');
  lines.push('the history, the teaching, or the accessibility of the finished game.');

  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = report.filename.replace(/\.html?$/i, '') + '-check.txt';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

/** `html` must already be escaped by the caller; `title` is escaped here. */
function renderFatal(title, html) {
  cancelLiveTest();
  $('#live-panel').hidden = true;
  intro.hidden = true;
  results.hidden = false;
  results.innerHTML = `<div class="verdict block">
    <p class="eyebrow">Result</p><h2 id="verdict-heading" tabindex="-1">${escapeHtml(title)}</h2><p>${html}</p></div>
    <div class="btn-row"><button class="btn secondary" type="button" id="check-another">Try another file</button></div>`;
  $('#check-another').addEventListener('click', resetToStart);
  $('#verdict-heading').focus({ preventScroll: true });
  results.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */

async function copyText(text, button) {
  const original = button.textContent;
  try {
    await navigator.clipboard.writeText(text);
    button.textContent = 'Copied';
  } catch {
    button.textContent = 'Press Ctrl/Cmd-C';
    const pre = $('#agentprompt');
    const range = document.createRange();
    range.selectNodeContents(pre);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }
  setTimeout(() => { button.textContent = original; }, 2200);
}

function dedupe(list) {
  const seen = new Set();
  return list.filter((v) => {
    const k = v.uri + '|' + v.directive;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function dedupeBy(list, key) {
  const seen = new Set();
  return list.filter((v) => {
    if (seen.has(v[key])) return false;
    seen.add(v[key]);
    return true;
  });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}
