/**
 * Playable Past — the checker page.
 *
 * Two passes over the instructor's file:
 *   1. `validate()` from validator.js — a static read of the source.
 *   2. A live pass: the game is opened inside a sandboxed iframe under a strict
 *      Content-Security-Policy that forbids every outside request. Anything the
 *      game tries to fetch is reported by the browser as a CSP violation, which
 *      is real evidence rather than a guess from a regular expression.
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

async function handleFile(file) {
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
    source = await file.text();
  } catch (err) {
    renderFatal('The file could not be read', escapeHtml(String(err.message || err)));
    return;
  }

  const report = validate(source, { filename: file.name, bytes: file.size });
  render(report);
  runLiveTest(source, report);
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

/** Injected into the game so it can report violations back out of the sandbox. */
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
  window.addEventListener('load',function(){setTimeout(function(){
    var counts={buttons:document.querySelectorAll('button,[role=button]').length,
      focusable:document.querySelectorAll('a[href],button,input,select,textarea,[tabindex]:not([tabindex="-1"])').length,
      text:(document.body.innerText||'').trim().length};
    send('loaded',counts);
  },400)});
}())</script>`;
}

/**
 * Put the CSP and the probe as early as possible: a meta CSP only governs what
 * comes after it.
 */
function instrument(source, token) {
  const inject = `<meta http-equiv="Content-Security-Policy" content="${LIVE_CSP}">`
    + probeScript(token);

  const headOpen = source.match(/<head\b[^>]*>/i);
  if (headOpen) {
    const at = headOpen.index + headOpen[0].length;
    return source.slice(0, at) + inject + source.slice(at);
  }
  const htmlOpen = source.match(/<html\b[^>]*>/i);
  if (htmlOpen) {
    const at = htmlOpen.index + htmlOpen[0].length;
    return source.slice(0, at) + '<head>' + inject + '</head>' + source.slice(at);
  }
  return inject + source;
}

function runLiveTest(source, report) {
  const panel = $('#live-panel');
  const body = $('#live-body');
  if (!panel) return;
  panel.hidden = false;
  body.innerHTML = '<p class="small">Opening your game with every outside request blocked…</p>';

  const token = 'pp-' + Math.random().toString(36).slice(2);
  const violations = [];
  const errors = [];
  let loaded = null;

  const frame = document.createElement('iframe');
  // No allow-same-origin: the frame gets an opaque origin and cannot touch this
  // page. It also means browser storage is unavailable inside — the same
  // condition as a private window or a locked-down school device.
  frame.setAttribute('sandbox', 'allow-scripts allow-forms allow-modals allow-popups');
  frame.setAttribute('title', 'Offline test of your game');
  frame.className = 'live-frame';
  frame.srcdoc = instrument(source, token);

  function onMessage(e) {
    const d = e.data;
    if (!d || d.pp !== token) return;
    if (d.kind === 'csp') violations.push(d.payload);
    else if (d.kind === 'error') errors.push(d.payload);
    else if (d.kind === 'loaded') loaded = d.payload;
  }
  window.addEventListener('message', onMessage);

  $('#live-stage').replaceChildren(frame);

  setTimeout(() => {
    window.removeEventListener('message', onMessage);
    renderLive(body, { violations, errors, loaded, report });
    frame.remove();
  }, 3200);
}

function renderLive(body, { violations, errors, loaded, report }) {
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
  } else if (loaded) {
    parts.push(panelItem('ok', 'Nothing was fetched from outside', `
      <p>We ran the game with all outside requests blocked and it never reached for the
      network. That is the single most important property of a classroom game.</p>`));
  }

  if (otherErrors.length) {
    parts.push(panelItem('block', 'The game threw an error while loading', `
      <p>Something broke on its own, with no student touching it:</p>
      <ul class="evidence">${dedupeBy(otherErrors, 'message').slice(0, 6).map((e) =>
        `<li><code>${escapeHtml(e.message)}</code>${e.line ? ` <span class="small">line ${e.line}</span>` : ''}</li>`).join('')}</ul>
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

  if (!loaded && !outside.length && !errors.length) {
    parts.push(panelItem('warn', 'The game did not finish loading', `
      <p>Three seconds in, the page had not reported itself as loaded. That can mean a slow
      opening animation, or that it is waiting for something that will never arrive.</p>
      <p>Open the file yourself and watch what happens.</p>`));
  }

  if (loaded) {
    const bits = [];
    bits.push(`${loaded.buttons} real button${loaded.buttons === 1 ? '' : 's'}`);
    bits.push(`${loaded.focusable} keyboard-reachable control${loaded.focusable === 1 ? '' : 's'}`);
    bits.push(`${loaded.text.toLocaleString()} characters of readable text`);
    const noKeyboard = loaded.focusable === 0;
    parts.push(panelItem(noKeyboard ? 'warn' : 'manual', 'What the opening screen contains', `
      <p>${bits.join(', ')}.</p>
      ${noKeyboard
        ? '<p><strong>Nothing on the opening screen can be reached with the Tab key.</strong> '
          + 'A student who cannot use a mouse cannot start the game.</p>'
        : '<p class="small">Counting controls is not the same as playing the game. The keyboard '
          + 'test below is still yours to run.</p>'}`));
  }

  body.innerHTML = parts.join('');

  // The live pass can contradict the static read; say so rather than hide it.
  if (outside.length && !report.blocking.some((f) => /external|remote|network/.test(f.id))) {
    body.insertAdjacentHTML('afterbegin', `<div class="note"><p><strong>Worth knowing:</strong>
      reading the file did not reveal these requests, but running it did. Trust the live
      result.</p></div>`);
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
    <h2>${v.label}</h2>
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
      <h3>${escapeHtml(m.title)} <span class="badge quiet">~${m.minutes} min</span></h3>
      <p>${escapeHtml(m.plain)}</p></li>`).join('')}</ol>
  </section>`);

  html.push(`<div class="btn-row">
    <button class="btn secondary" type="button" id="download-report">Download this report</button>
    <button class="btn secondary" type="button" id="check-another">Check another file</button>
  </div>`);

  results.innerHTML = html.join('');

  $('#copy-fixes')?.addEventListener('click', (e) => copyText($('#agentprompt').textContent, e.target));
  $('#download-report').addEventListener('click', () => downloadReport(report));
  $('#check-another').addEventListener('click', () => {
    results.hidden = true;
    intro.hidden = false;
    $('#live-panel').hidden = true;
    fileInput.value = '';
    drop.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  results.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
          `<li>${e.line ? `<span class="lineno">line ${e.line}</span> ` : ''}<code>${escapeHtml(e.text)}</code></li>`).join('')}</ul>` : ''}
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
  lines.push(`Playable Past — classroom-readiness report`);
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

function renderFatal(title, html) {
  intro.hidden = true;
  results.hidden = false;
  results.innerHTML = `<div class="verdict block">
    <p class="eyebrow">Result</p><h2>${escapeHtml(title)}</h2><p>${html}</p></div>
    <div class="btn-row"><button class="btn secondary" type="button" id="check-another">Try another file</button></div>`;
  $('#check-another').addEventListener('click', () => {
    results.hidden = true;
    intro.hidden = false;
    fileInput.value = '';
  });
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
