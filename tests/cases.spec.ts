import { expect, test } from '@playwright/test';
import { readFileSync, readdirSync } from 'node:fs';
import { parse } from 'yaml';

// Case studies (M4). Word limit and skim test come from plan/COPY.md rules 4 and 5.
interface Block {
  lead: string;
  text: string;
}
interface Part {
  title: string;
  oneliner: { text: string };
  blocks: Block[];
}
interface Case extends Part {
  slug: string;
  results: { value: string; label: string }[];
  subprojects?: Part[];
}

const DIR = 'src/content/cases';
const CASES: Case[] = readdirSync(DIR)
  .filter((f) => f.endsWith('.yaml'))
  .map((f) => parse(readFileSync(`${DIR}/${f}`, 'utf8')) as Case);

const words = (text: string) => text.replace(/\*\*/g, '').split(/\s+/).filter(Boolean).length;

function caseWords(c: Case): number {
  const part = (p: Part) =>
    words(p.title) +
    words(p.oneliner.text) +
    p.blocks.reduce((n, b) => n + words(b.lead) + words(b.text), 0);
  return (
    part(c) +
    c.results.reduce((n, r) => n + words(r.value) + words(r.label), 0) +
    (c.subprojects ?? []).reduce((n, s) => n + part(s), 0)
  );
}

for (const c of CASES) {
  test.describe(`case ${c.slug}`, () => {
    test('≤ 150 words (title, one-liner, figures, blocks)', () => {
      expect(caseWords(c)).toBeLessThanOrEqual(150);
    });

    test('skim test: one-liner and every block have a highlight', () => {
      const parts: Part[] = [c, ...(c.subprojects ?? [])];
      for (const p of parts) {
        expect(p.oneliner.text, p.title).toMatch(/\*\*.+?\*\*/);
        for (const b of p.blocks) {
          if (b.lead === 'Team.') continue; // names are links, not highlights
          expect(b.text, `${p.title} · ${b.lead}`).toMatch(/\*\*.+?\*\*/);
        }
      }
    });

    test('own page: H1 title, three results, CTA', async ({ page }) => {
      await page.goto(`/work/${c.slug}`);
      await expect(page.locator('h1')).toHaveText(c.title.replace(/\s+/g, ' '));
      await expect(page.locator('.case-results li')).toHaveCount(3);
      await expect(page.locator('.case-cta a[href^="mailto:"]')).toBeVisible();
    });
  });
}

test('case 01 on the home page links to its own page and credits the team', async ({ page }) => {
  await page.goto('/');
  const section = page.locator('#case-shill-or-chill');
  await expect(section.getByRole('heading', { level: 2 })).toHaveText('Shill or Chill');
  await expect(section.getByRole('link', { name: 'Shill or Chill' })).toHaveAttribute(
    'href',
    '/work/shill-or-chill',
  );
  for (const name of ['Justinas Launikonis', 'Temuulen Norovpel', 'Valtteri Pertilä']) {
    await expect(section.getByRole('link', { name })).toHaveAttribute('href', /github\.com/);
  }
  await expect(section.locator('figure img')).toHaveCount(2);
  await expect(section.locator('details.receipts')).not.toHaveAttribute('open');
});
