import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';

// CV page (#22): one A4 page from src/content/cv.yaml; Kirill's brief: ~180 words, no paragraphs.
const cv = (
  parse(readFileSync('src/content/cv.yaml', 'utf8')) as { cv: { sections: { title: string }[] } }
).cv;

test('renders every section, at most 180 words, no paragraph over 20 words', async ({ page }) => {
  await page.goto('/cv');
  await expect(page.locator('h1')).toHaveText('Kirill Jegosin');
  for (const s of cv.sections) {
    await expect(page.getByRole('heading', { level: 2, name: s.title })).toHaveCount(1);
  }
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
  const text = await page.locator('main').innerText();
  // Words = tokens with a letter or digit (the · and — separators don't count).
  const words = text.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w));
  expect(words.length).toBeLessThanOrEqual(180);
  // Prose lines stay short; the dotted lists (.inline) are lists, not paragraphs.
  for (const p of await page.locator('main p:not(.inline)').allInnerTexts()) {
    expect(p.split(/\s+/).filter(Boolean).length, p).toBeLessThanOrEqual(20);
  }
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
