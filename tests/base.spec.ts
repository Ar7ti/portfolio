import { expect, test } from '@playwright/test';

const WIDTHS = [360, 390, 768, 1440];

test('base layout: lang, landmarks, skip link', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (msg) => msg.type() === 'error' && errors.push(msg.text()));
  page.on('pageerror', (err) => errors.push(err.message));

  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('banner')).toHaveCount(1);
  await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible();
  await expect(page.getByRole('main')).toHaveCount(1);
  await expect(page.getByRole('contentinfo')).toHaveCount(1);

  // The skip link is the first thing keyboard users reach.
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Skip to the point' });
  await expect(skip).toBeFocused();
  await expect(skip).toBeInViewport();
  await skip.press('Enter');
  await expect(page).toHaveURL(/#point$/);

  expect(errors).toEqual([]);
});

test('hero font is inlined, the small body and label fonts are preloaded', async ({ page }) => {
  await page.goto('/');
  const preloads = await page
    .locator('link[rel="preload"][as="font"]')
    .evaluateAll((links) => links.map((l) => l.getAttribute('href')));
  expect(preloads).toEqual(['/fonts/schibsted-grotesk.woff2', '/fonts/martian-mono.woff2']);
  const inlined = await page.evaluate(() =>
    [...document.querySelectorAll('style')].some((s) =>
      /font-family:\s*['"]?Anybody['"]?[^}]*url\(\s*['"]?data:font\/woff2/.test(
        s.textContent ?? '',
      ),
    ),
  );
  expect(inlined).toBe(true);
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => document.fonts.check('850 40px Anybody'))).toBe(true);
});

for (const width of WIDTHS) {
  test(`no horizontal scroll, headings fit at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);

    // No heading is wider than its own box (a word that doesn't fit would overflow).
    const tooWide = await page
      .locator('h1, h2, h3')
      .evaluateAll((els) =>
        els.filter((el) => el.scrollWidth > el.clientWidth + 1).map((el) => el.textContent),
      );
    expect(tooWide).toEqual([]);
  });
}

test('unknown paths get the custom 404', async ({ page }) => {
  const response = await page.goto('/this-page-does-not-exist');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('This island sank.');
  await expect(page.getByRole('link', { name: 'Back to the surface' })).toHaveAttribute(
    'href',
    '/',
  );
});
