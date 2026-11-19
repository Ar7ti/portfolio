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

test('the committed PDF is one small file and the site links to it', async ({ page, request }) => {
  const res = await request.get('/cv/kirill-jegosin-cv.pdf');
  expect(res.status()).toBe(200);
  const body = await res.body();
  expect(body.byteLength).toBeLessThanOrEqual(300 * 1024);
  expect(body.toString('latin1').match(/\/Type\s*\/Page[^s]/g)).toHaveLength(1);
  await page.goto('/');
  await expect(page.locator('#contact a[href="/cv/kirill-jegosin-cv.pdf"]')).toBeVisible();
});

test('no age, no phone on the CV', async ({ page }) => {
  await page.goto('/cv');
  const text = (await page.locator('main').textContent()) ?? '';
  // "18" alone is fine ("as of 18 Nov 2026"); an age or a phone number is not.
  expect(text).not.toMatch(/\b18[ -]year|\baged?\b|\+358|phone|born/i);
});
