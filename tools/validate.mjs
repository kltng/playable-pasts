#!/usr/bin/env node
/**
 * Playable Pasts validator — command line.
 *
 *   node tools/validate.mjs path/to/game.html [--json] [--markdown]
 *
 * Exit status: 0 when nothing is blocking, 1 when something is, 2 when a file
 * could not be read or the command line was wrong (worst status wins).
 * Used by .github/workflows/validate-submission.yml and runnable by an agent
 * on an instructor's behalf. Same module as the website's checker.
 */
import { readFileSync, statSync } from 'node:fs';
import { validate, formatBytes } from '../assets/js/validator.js';

const VERDICT_LABEL = {
  blocked: 'Will not work in a classroom yet',
  'needs-work': 'Runs, but worth improving',
  'ready-for-your-tests': 'Passed every automated check',
};

const USAGE = 'usage: node tools/validate.mjs <game.html> [more.html ...] [--json | --markdown]';
const KNOWN_FLAGS = new Set(['--json', '--markdown']);

const args = process.argv.slice(2);
const files = args.filter((a) => !a.startsWith('--'));
const flags = args.filter((a) => a.startsWith('--'));
const unknown = flags.filter((a) => !KNOWN_FLAGS.has(a));
const asJson = flags.includes('--json');
const asMarkdown = flags.includes('--markdown');

if (unknown.length) {
  console.error(`unknown option${unknown.length === 1 ? '' : 's'}: ${unknown.join(' ')}`);
  console.error(USAGE);
  process.exit(2);
}
if (asJson && asMarkdown) {
  console.error('choose one output format: --json or --markdown, not both');
  console.error(USAGE);
  process.exit(2);
}
if (!files.length) {
  console.error(USAGE);
  process.exit(2);
}

// Exit status is the worst across all files: 2 (a file could not be read)
// beats 1 (something is blocking) beats 0. One unreadable file does not stop
// the others from being checked and printed.
let worstExit = 0;
const reports = [];
const errors = [];

for (const file of files) {
  let source;
  let bytes;
  try {
    source = readFileSync(file, 'utf8');
    bytes = statSync(file).size;
  } catch (err) {
    const message = `cannot read ${file}: ${err.message}`;
    console.error(message);
    errors.push({ filename: file, error: message });
    worstExit = 2;
    continue;
  }
  const report = validate(source, { filename: file, bytes });
  reports.push(report);
  if (report.blocking.length) worstExit = Math.max(worstExit, 1);
}

if (asJson) {
  const all = [...reports, ...errors];
  console.log(JSON.stringify(files.length === 1 && reports.length === 1 ? reports[0] : all, null, 2));
} else if (asMarkdown) {
  const parts = reports.map(markdownReport)
    .concat(errors.map((e) => `### Could not check \`${e.filename}\`\n\n${e.error}`));
  if (parts.length) console.log(parts.join('\n\n---\n\n'));
} else if (reports.length) {
  console.log(reports.map(textReport).join('\n\n'));
}

process.exit(worstExit);

function textReport(r) {
  const lines = [];
  lines.push(`${r.filename} — ${formatBytes(r.bytes)}`);
  lines.push(`${VERDICT_LABEL[r.verdict]}`);
  lines.push('');
  lines.push(r.summary);

  for (const [heading, items] of [['MUST FIX', r.blocking], ['WORTH FIXING', r.warnings]]) {
    if (!items.length) continue;
    lines.push('', `${heading} (${items.length})`, '');
    for (const f of items) {
      lines.push(`  ${f.title}`);
      lines.push(`    ${wrap(f.plain, 4)}`);
      lines.push(`    -> ${wrap(f.fix, 7)}`);
      for (const e of f.evidence.slice(0, 4)) {
        lines.push(`    line ${e.line}: ${e.text}`);
      }
      lines.push('');
    }
  }

  lines.push(`ONLY YOU CAN CHECK THESE (${r.manual.length})`, '');
  for (const m of r.manual) {
    lines.push(`  [ ] ${m.title} (~${m.minutes} min)`);
    lines.push(`      ${wrap(m.plain, 6)}`);
  }
  return lines.join('\n');
}

function markdownReport(r) {
  const lines = [];
  const badge = { blocked: '🔴', 'needs-work': '🟡', 'ready-for-your-tests': '🟢' }[r.verdict];
  lines.push(`### ${badge} ${VERDICT_LABEL[r.verdict]}`);
  lines.push('');
  lines.push(`\`${r.filename}\` · ${formatBytes(r.bytes)}`);
  lines.push('');
  lines.push(r.summary);

  for (const [heading, items] of [['Must fix', r.blocking], ['Worth fixing', r.warnings]]) {
    if (!items.length) continue;
    lines.push('', `#### ${heading} (${items.length})`, '');
    for (const f of items) {
      lines.push(`**${f.title}**`);
      lines.push('');
      lines.push(f.plain);
      lines.push('');
      lines.push(`> ${f.fix}`);
      if (f.evidence.length) {
        lines.push('');
        for (const e of f.evidence.slice(0, 6)) {
          lines.push(`- line ${e.line}: \`${e.text}\``);
        }
      }
      lines.push('');
    }
  }

  lines.push('', '#### Checks only a person can run', '');
  lines.push('The validator reads the file; it cannot play the game. These stay unverified '
    + 'until you do them, and the gallery records them as untested.');
  lines.push('');
  for (const m of r.manual) {
    lines.push(`- [ ] **${m.title}** (~${m.minutes} min) — ${m.plain}`);
  }
  return lines.join('\n');
}

function wrap(text, indent) {
  const width = 76 - indent;
  const words = String(text).split(/\s+/);
  const out = [];
  let line = '';
  for (const w of words) {
    if ((line + ' ' + w).trim().length > width) {
      out.push(line.trim());
      line = w;
    } else {
      line += ' ' + w;
    }
  }
  if (line.trim()) out.push(line.trim());
  return out.join('\n' + ' '.repeat(indent));
}
