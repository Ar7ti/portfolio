import { expect, test } from '@playwright/test';

test.describe('hero', () => {
  test('LCP element is the H1, not the sea image', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    const lcp = await page.evaluate(
      () =>
        new Promise<string>((resolve) => {
          new PerformanceObserver((list) => {
            const entries = list.getEntries() as (PerformanceEntry & { element?: Element })[];
            const last = entries.at(-1);
            resolve(last?.element?.closest('h1') ? 'h1' : (last?.element?.tagName ?? 'none'));
          }).observe({ type: 'largest-contentful-paint', buffered: true });
        }),
    );
    expect(lcp).toBe('h1');
  });

  test('copy button copies the email', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/');
    const copy = page.locator('button[data-copy]');
    await expect(copy).toBeVisible();
    await copy.click();
    await expect(copy).toHaveText('Copied');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('k.jegosin@gmail.com');
  });

  test('a canvas mounted into the sea layer shifts nothing', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    const before = await page.locator('#hero-title').boundingBox();
    const shift = await page.evaluate(
      () =>
        new Promise<number>((resolve) => {
          let total = 0;
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries() as (PerformanceEntry & { value: number })[]) {
              total += entry.value;
            }
          }).observe({ type: 'layout-shift' });
          const canvas = document.createElement('canvas');
          canvas.width = 390;
          canvas.height = 844;
          document.querySelector('[data-sea-layer]')?.append(canvas);
          requestAnimationFrame(() => requestAnimationFrame(() => resolve(total)));
        }),
    );
    expect(shift).toBe(0);
    expect(await page.locator('#hero-title').boundingBox()).toEqual(before);
  });
});

test.describe('hero without JS', () => {
  test.use({ javaScriptEnabled: false });

  test('everything but the copy button is there', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      /I build games,\s*web products\s*& AI tools\./,
    );
    await expect(
      page.locator('#point').getByRole('link', { name: 'k.jegosin@gmail.com' }),
    ).toBeVisible();
    await expect(page.locator('#point').getByRole('link', { name: 'LinkedIn' })).toBeVisible();
    await expect(
      page.locator('#point').getByRole('link', { name: 'GitHub', exact: true }),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Copy' })).toBeHidden();
    await expect(page.locator('.chips li')).toHaveCount(3);
    for (const chip of await page.locator('.chips li').all()) {
      await expect(chip).toHaveAttribute('data-facts', /\w/);
    }
    await expect(page.locator('.hero-sea img')).toBeVisible();
  });
});
