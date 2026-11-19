import { expect, test } from '@playwright/test';
import { readFileSync, readdirSync } from 'node:fs';
import { join, sep } from 'node:path';
import { parse } from 'yaml';
import { factIds, findFactProblems, hasNumber, parseFactIds } from '../src/content/facts';

const CONTENT = 'src/content';

function contentFiles(dir = CONTENT): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return contentFiles(path);
    return entry.name.endsWith('.yaml') ? [path] : [];
  });
}

test.describe('content: every number has a FACTS id', () => {
  test('FACTS.md ids are parsed', () => {
    const ids = factIds();
    for (const id of ['P1', 'H3', 'SC5', 'ST10', 'OR4', 'LS2', 'G4', 'X1', 'YT2', 'M4']) {
      expect(ids.has(id), id).toBe(true);
    }
  });

  for (const file of contentFiles()) {
    test(file.split(sep).join('/'), () => {
      const problems = findFactProblems(parse(readFileSync(file, 'utf8')));
      expect(problems).toEqual([]);
    });
  }
});

test.describe('content: the rule itself', () => {
  const ids = parseFactIds(
    '| H3 | Won the Oxylabs challenge | V | post |\n| ST10 | 223 commits | V | API |',
  );

  test('a number without facts fails', () => {
    expect(findFactProblems({ big: { value: '223', label: 'commits' } }, ids)).toHaveLength(1);
  });

  test('facts on the object or a parent cover it', () => {
    expect(findFactProblems({ value: '223', facts: ['ST10'] }, ids)).toEqual([]);
    expect(findFactProblems({ facts: ['ST10'], deep: { value: '223' } }, ids)).toEqual([]);
  });

  test('an unknown id fails', () => {
    expect(findFactProblems({ value: '223', facts: ['ST99'] }, ids)).toHaveLength(1);
  });

  test('nofacts needs a reason', () => {
    expect(findFactProblems({ text: '404', nofacts: 'HTTP status code' }, ids)).toEqual([]);
    expect(findFactProblems({ text: '404', nofacts: '' }, ids)).toHaveLength(1);
  });

  test('links, dates and handles are not numbers', () => {
    expect(findFactProblems({ href: 'https://example.com/2026', asOf: new Date() }, ids)).toEqual(
      [],
    );
    expect(hasNumber('github.com/Ar7ti')).toBe(false);
    expect(hasNumber('t.me/krnl_159')).toBe(false);
    for (const n of ['223', '2.6M', '3rd', '3–4×', '48-hour', '~23K'])
      expect(hasNumber(n), n).toBe(true);
  });
});
