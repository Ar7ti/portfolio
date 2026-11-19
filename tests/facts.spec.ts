import { expect, test } from '@playwright/test';
import { factIds } from '../src/content/facts';

// Every number shown on a page must sit inside an element that names its source:
// data-facts="<FACTS.md ids>" or data-nofacts="<reason>". Hard-coded numbers in components fail here.
const PAGES = ['/', '/styleguide', '/404'];

for (const path of PAGES) {
  test(`every number on ${path} has a source`, async ({ page }) => {
    await page.goto(path);
    const found = await page.evaluate(() => {
      const isNumber = (text: string) => /(?<![\p{L}\p{N}_])\d/u.test(text);
      const results: { text: string; facts: string | null; nofacts: string | null }[] = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        const text = node.textContent ?? '';
        const parent = node.parentElement;
        if (!parent || !isNumber(text) || parent.closest('script, style')) continue;
        const owner = parent.closest('[data-facts], [data-nofacts]');
        results.push({
          text: text.trim(),
          facts: owner?.getAttribute('data-facts') ?? null,
          nofacts: owner?.getAttribute('data-nofacts') ?? null,
        });
      }
      return results;
    });

    const ids = factIds();
    const problems = found.flatMap(({ text, facts, nofacts }) => {
      if (nofacts?.trim()) return [];
      if (!facts) return [`"${text}" has no data-facts`];
      return facts
        .split(' ')
        .filter((id) => !ids.has(id))
        .map((id) => `"${text}" cites unknown FACTS id ${id}`);
    });

    expect(found.length).toBeGreaterThan(0);
    expect(problems).toEqual([]);
  });
}
