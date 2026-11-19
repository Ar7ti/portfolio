import { expect, test } from '@playwright/test';

test.describe('tier 1 sea (phones)', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test('phones get the 2D shader sea: no three.js, draws, pauses off-screen', async ({ page }) => {
    test.setTimeout(90_000);
    const errors: string[] = [];
    const chunks: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    page.on('request', (r) => r.url().includes('/_astro/') && chunks.push(r.url()));
    // Count draw calls on every WebGL 1 context the page creates.
    await page.addInitScript(() => {
      const w = window as unknown as { __draws: number };
      w.__draws = 0;
      const original = WebGLRenderingContext.prototype.drawArrays;
      WebGLRenderingContext.prototype.drawArrays = function (...args) {
        w.__draws++;
        return original.apply(this, args);
      };
    });

    // ?gpu=software: CI renders WebGL in software; real phones have a GPU.
    await page.goto('/?gpu=software');
    await expect(page.locator('#hero-title')).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('data-sea-tier', '1', { timeout: 30_000 });
    await expect(page.locator('.hero-sea-live')).toHaveClass(/is-ready/, { timeout: 60_000 });
    expect(chunks.some((url) => /sea3d/.test(url))).toBe(false);
    expect(chunks.some((url) => /sea2d/.test(url))).toBe(true);

    const drawsIn = async (ms: number) => {
      await page.evaluate(() => ((window as unknown as { __draws: number }).__draws = 0));
      await page.waitForTimeout(ms);
      return page.evaluate(() => (window as unknown as { __draws: number }).__draws);
    };
    await expect.poll(() => drawsIn(500), { timeout: 20_000 }).toBeGreaterThan(0);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(400);
    expect(await drawsIn(600)).toBe(0);
    expect(errors).toEqual([]);
  });
});
