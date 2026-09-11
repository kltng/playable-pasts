#!/usr/bin/env node
/**
 * Playable Pasts validator — command line.
 *
 *   node tools/validate.mjs path/to/game.html [--json] [--markdown]
 *
 * Exit status: 0 when nothing is blocking, 1 when something is.
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

const args = process.argv.slice(2);
const files = args.filter((a) => !a.startsWith('--'));
const asJson = args.includes('--json');
const asMarkdown = args.includes('--markdown');

if (!files.length) {
  console.error('usage: node tools/validate.mjs <game.html> [--json] [--markdown]');
  process.exit(2);
}

let worstExit = 0;
const reports = [];

for (const file of files) {
  let source;
  try {
    source = readFileSync(file, 'utf8');
  } catch (err) {
    console.error(`cannot read ${file}: ${err.message}`);
    process.exit(2);
  }
  const report = validate(source, { filename: file, bytes: statSync(file).size });
  reports.push(report);
  if (report.blocking.length) worstExit = 1;
}

if (asJson) {
  console.log(JSON.stringify(reports.length === 1 ? reports[0] : reports, null, 2));
} else if (asMarkdown) {
  console.log(reports.map(markdownReport).join('\n\n---\n\n'));
} else {
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
