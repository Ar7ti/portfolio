import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';

// SEO, Open Graph, favicon (#23). Copy from site.yaml (COPY.md §0).
const site = parse(readFileSync('src/content/site.yaml', 'utf8')).site as {
  title: string;
  description: { text: string };
  og: { title: string; description: string };
};
const description = site.description.text.replace(/\s+/g, ' ').trim();

test('home: title, description, canonical, Open Graph', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(site.title);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', description);
  const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
  expect(canonical).toMatch(/^https:\/\/[^/]+\/$/);
  const og = (p: string) => page.locator(`meta[property="og:${p}"]`);
  await expect(og('title')).toHaveAttribute('content', site.og.title);
  await expect(og('description')).toHaveAttribute('content', site.og.description);
  await expect(og('url')).toHaveAttribute('content', canonical ?? '');
  await expect(og('image')).toHaveAttribute('content', /^https:\/\/.+\/og\.jpg$/);
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
    'content',
    'summary_large_image',
  );
  await expect(page.locator('meta[name="theme-color"]')).toHaveCount(1);
});

test('case page: own canonical and OG title', async ({ page }) => {
  await page.goto('/work/shill-or-chill');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    /\/work\/shill-or-chill$/,
  );
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    'content',
    /^Shill or Chill/,
  );
});

test('noindex pages have no canonical', async ({ page }) => {
  await page.goto('/styleguide');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
});

test('icons and OG image exist', async ({ request }) => {
  for (const [path, type] of [
    ['/favicon.svg', 'svg'],
    ['/favicon-32.png', 'png'],
    ['/apple-touch-icon.png', 'png'],
    ['/og.jpg', 'jpeg'],
  ] as const) {
    const res = await request.get(path);
    expect(res.status(), path).toBe(200);
    expect(res.headers()['content-type'], path).toContain(type);
  }
});

test('sitemap lists home and every case; robots points to it', async ({ request }) => {
  const sitemap = await (await request.get('/sitemap.xml')).text();
  for (const path of [
    '/<',
    '/work/shill-or-chill<',
    '/work/junction-x-turku<',
    '/work/sky-island-tower-defense<',
  ]) {
    expect(sitemap).toContain(path);
  }
  for (const hidden of ['styleguide', '/cv', '404']) expect(sitemap).not.toContain(hidden);
  const robots = await (await request.get('/robots.txt')).text();
  expect(robots).toMatch(/Sitemap: https:\/\/.+\/sitemap\.xml/);
});
