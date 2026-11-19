import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';

// CV page (#22): one A4 page from src/content/cv.yaml; pending parts are never rendered.
interface Section {
  title: string;
  pending?: string;
  items?: { title: string; pending?: string }[];
}
const cv = (
  parse(readFileSync('src/content/cv.yaml', 'utf8')) as { cv: { main: Section[]; side: Section[] } }
).cv;
const sections = [...cv.main, ...cv.side];

test('renders confirmed sections only', async ({ page }) => {
  await page.goto('/cv');
  await expect(page.locator('h1')).toHaveText('Kirill Jegosin');
  for (const s of sections) {
    const heading = page.getByRole('heading', { level: 2, name: s.title });
    await expect(heading).toHaveCount(s.pending ? 0 : 1);
  }
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
});

test('fits one A4 page when printed', async ({ page }) => {
  await page.goto('/cv');
  await page.evaluate(() => document.fonts.ready);
  await page.emulateMedia({ media: 'print' });
  const overflow = await page.evaluate(() => {
    const sheet = document.querySelector('.sheet');
    return sheet ? sheet.scrollHeight - sheet.clientHeight : -1;
  });
  expect(overflow).toBeLessThanOrEqual(0);
});

test('readable on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/cv');
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});
