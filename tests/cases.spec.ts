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

test('case 03: two solo sub-projects with media and links, a video, no "Next time"', async ({
  page,
}) => {
  await page.goto('/');
  const section = page.locator('#case-junction-x-turku');
  await expect(section.getByRole('heading', { level: 2 })).toHaveText(
    'Two solo projects. One hackathon.',
  );
  const subs = section.locator('.sub');
  await expect(subs).toHaveCount(2);
  await expect(subs.locator('h3')).toHaveText(['Ocean Opportunity Radar', 'Life Simulator']);
  for (const i of [0, 1]) {
    await expect(subs.nth(i).locator('figure img').first()).toBeVisible();
    await expect(subs.nth(i).locator('.pill')).toHaveCount(2);
  }
  await expect(subs.nth(1).locator('a.fig-link')).toHaveAttribute('href', /youtube\.com\/watch/);
  await expect(section).not.toContainText('Next time.');
});

test('case 02: gameplay video slot (poster until the loop lands), Short, play + code links', async ({
  page,
}) => {
  await page.goto('/');
  const section = page.locator('#case-sky-island-tower-defense');
  await expect(section.getByRole('heading', { level: 2 })).toHaveText('Sky Island Tower Defense');
  const slot = section.locator('.video-slot');
  await expect(slot).toHaveCount(1);
  // Either the real loop (muted, never autoplaying under reduced motion) or the poster in its place.
  const media = slot.locator('video, img');
  await expect(media).toHaveCount(1);
  const box = await media.boundingBox();
  if (!box) throw new Error('video slot not rendered');
  expect(box.width / box.height).toBeCloseTo(16 / 9, 1);
  await expect(section.locator('.fig.short figcaption a')).toHaveAttribute(
    'href',
    /youtube\.com\/watch/,
  );
  await expect(section.locator('.blocks .pill')).toHaveText(['Play on Roblox', 'Read the code']);
});
