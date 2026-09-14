#!/usr/bin/env node
/**
 * Tests for the gallery build tool.
 *   node --test tools/test-*.mjs
 *
 * The rule defended here: running the build twice must write the same bytes
 * twice. CI reruns the build and fails if anything in games/ changes, so a
 * field that moved on every run would fail every pull request opened on a
 * later day than the last commit.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nextValidation, sha256 } from './build-index.mjs';

const clean = { verdict: 'ready-for-your-tests', blocking: [], warnings: [] };
const warned = { verdict: 'fix-before-class', blocking: [], warnings: [{ id: 'x' }] };
const hashA = sha256('<html>a</html>');
const hashB = sha256('<html>b</html>');

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
  assert.equal(later.verdict, 'fix-before-class');
});

test('a manifest from before hashes were recorded is stamped once, then stable', () => {
  const legacy = { verdict: 'ready-for-your-tests', checked_at: '2026-09-11', blocking: 0, warnings: 0 };
  const first = nextValidation(legacy, clean, hashA, '2026-09-14');
  assert.equal(first.checked_at, '2026-09-14', 'no hash on record, so the result is re-established');
  const again = nextValidation(first, clean, hashA, '2026-09-20');
  assert.deepEqual(again, first);
});
