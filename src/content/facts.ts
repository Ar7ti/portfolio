/**
 * The "no number without a source" rule, shared by the content schema (build fails)
 * and the tests. plan/FACTS.md is the single source of truth for fact ids.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const FACTS_MD = fileURLToPath(new URL('../../plan/FACTS.md', import.meta.url));

/** Fact ids are the first cell of a FACTS.md table row: P1, H3, SC5, ST10, YT2, … */
export function parseFactIds(markdown: string): Set<string> {
  const ids = new Set<string>();
  for (const line of markdown.split('\n')) {
    const match = /^\|\s*([A-Z]{1,3}\d{1,3})\s*\|/.exec(line);
    if (match?.[1]) ids.add(match[1]);
  }
  return ids;
}

let cached: Set<string> | undefined;
export function factIds(): Set<string> {
  cached ??= parseFactIds(readFileSync(FACTS_MD, 'utf8'));
  return cached;
}

/** Keys whose values are never claims: links, file paths, ids, dates and layout switches. */
const SKIP_KEYS = new Set([
  'href',
  'src',
  'slug',
  'id',
  'order',
  'asOf',
  'checkedOn',
  'date',
  'theme',
  'facts',
  'nofacts',
  'width',
  'height',
]);

type Problem = { path: string; message: string };

/**
 * A number is a digit that starts a token: "223", "2.6M", "3rd", "48-hour".
 * Digits inside names and handles ("Ar7ti", "krnl_159") are not numbers.
 */
export function hasNumber(text: string): boolean {
  return /(?<![\p{L}\p{N}_])\d/u.test(text);
}

/**
 * Walks content data. A string containing a digit must have a covering object on its path:
 * one with a non-empty `facts` array, or with `nofacts: "<reason>"`. Every id must exist in FACTS.md.
 */
export function findFactProblems(
  value: unknown,
  ids: Set<string> = factIds(),
  path = '',
  covered = false,
): Problem[] {
  if (typeof value === 'string') {
    if (!covered && hasNumber(value)) {
      return [{ path, message: `"${value}" has a number but no FACTS id (add facts: [...])` }];
    }
    return [];
  }
  if (Array.isArray(value)) {
    return value.flatMap((item, i) => findFactProblems(item, ids, `${path}[${i}]`, covered));
  }
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    const record = value as Record<string, unknown>;
    const problems: Problem[] = [];
    const facts = record['facts'];
    if (Array.isArray(facts)) {
      for (const id of facts) {
        if (typeof id !== 'string' || !ids.has(id)) {
          problems.push({ path: `${path}.facts`, message: `unknown FACTS id "${String(id)}"` });
        }
      }
    }
    const nofacts = record['nofacts'];
    const coversHere =
      covered ||
      (Array.isArray(facts) && facts.length > 0) ||
      (typeof nofacts === 'string' && nofacts.trim().length > 0);
    for (const [key, child] of Object.entries(record)) {
      if (SKIP_KEYS.has(key)) continue;
      problems.push(...findFactProblems(child, ids, path ? `${path}.${key}` : key, coversHere));
    }
    return problems;
  }
  return [];
}
