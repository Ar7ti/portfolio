import { expect, test } from '@playwright/test';

test.describe('tier 2 sea', () => {
  test('tier 0 never downloads three.js', async ({ page }) => {
    const chunks: string[] = [];
    page.on('request', (r) => r.url().includes('/_astro/') && chunks.push(r.url()));
    await page.goto('/?tier=0');
    await page.waitForFunction(() => document.documentElement.dataset['seaTier'] === '0');
    await page.waitForTimeout(500);
    expect(chunks.filter((url) => /sea3d/.test(url))).toEqual([]);
  });

  test('mounts after first paint, draws, pauses off-screen, no errors', async ({ page }) => {
    test.setTimeout(120_000);
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    // Small viewport: CI renders WebGL in software (SwiftShader), where fill rate is the cost.
    await page.setViewportSize({ width: 800, height: 500 });
    await page.goto('/?tier=2');

    // The H1 is there before any sea code runs.
    await expect(page.locator('#hero-title')).toBeVisible();
    const live = page.locator('.hero-sea-live');
    await expect(live).toHaveClass(/is-ready/, { timeout: 30_000 });
    await expect(page.locator('html')).toHaveAttribute('data-sea-tier', '2');

    // Canvas fills the fixed sea backdrop exactly: nothing moved when it arrived.
    const [layer, canvas] = await Promise.all([
      page.locator('[data-sea-backdrop]').boundingBox(),
      live.boundingBox(),
    ]);
    expect(canvas).toEqual(layer);

    // Count GL draw calls; positive control first (hero visible), then scrolled away.
    await page.evaluate(() => {
      const c = document.querySelector<HTMLCanvasElement>('.hero-sea-live');
      const gl = (c?.getContext('webgl2') ?? null) as WebGL2RenderingContext | null;
      if (!gl) throw new Error('no WebGL2 context on the sea canvas');
      const w = window as unknown as { __draws: number };
      w.__draws = 0;
      for (const name of ['drawElements', 'drawElementsInstanced', 'drawArrays'] as const) {
        const original = (gl[name] as (...args: unknown[]) => void).bind(gl);
        (gl as unknown as Record<string, unknown>)[name] = (...args: unknown[]) => {
          w.__draws++;
          return original(...args);
        };
      }
    });
    const drawsIn = async (ms: number) => {
      await page.evaluate(() => ((window as unknown as { __draws: number }).__draws = 0));
      await page.waitForTimeout(ms);
      return page.evaluate(() => (window as unknown as { __draws: number }).__draws);
    };
    await expect.poll(() => drawsIn(500), { timeout: 10_000 }).toBeGreaterThan(0);

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);
    expect(await drawsIn(500)).toBe(0);

    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(300);
    await expect.poll(() => drawsIn(500), { timeout: 10_000 }).toBeGreaterThan(0);
    expect(errors).toEqual([]);
  });
});
