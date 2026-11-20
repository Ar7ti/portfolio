import { expect, test, type Page } from '@playwright/test';

/**
 * The Sky Island never covers the hero text on desktop (1280–1920 px), on any tier.
 * Each renderer exposes where it put the island (data-island: left,top,right,bottom in its
 * canvas's CSS pixels); this test measures the text itself, independently of the renderers.
 */
const SIZES: [number, number][] = [
  [1280, 720],
  [1280, 800],
  [1366, 768],
  [1440, 900],
  [1536, 864],
  [1680, 1050],
  [1920, 1080],
  [1920, 1200],
];

async function overlaps(page: Page, canvasSelector: string): Promise<string[]> {
  return page.evaluate((sel) => {
    const canvas = document.querySelector<HTMLCanvasElement>(sel);
    const raw = canvas?.dataset['island'];
    if (!canvas || !raw) return ['no island box on ' + sel];
    if (raw === 'none') return []; // no free spot: no island drawn
    const c = canvas.getBoundingClientRect();
    const [l, t, r, b] = raw.split(',').map(Number) as [number, number, number, number];
    const island = { left: l + c.left, top: t + c.top, right: r + c.left, bottom: b + c.top };
    const hits: string[] = [];
    const check = (name: string, box: DOMRect) => {
      if (!box.width || !box.height) return;
      const hit =
        island.left < box.right &&
        island.right > box.left &&
        island.top < box.bottom &&
        island.bottom > box.top;
      if (hit) hits.push(`${name} ${JSON.stringify(box)} vs island ${raw}`);
    };
    const range = document.createRange();
    for (const el of document.querySelectorAll('.hero-label, .hero-title, .hero-line')) {
      range.selectNodeContents(el);
      for (const box of range.getClientRects()) check(el.className, box);
    }
    for (const el of document.querySelectorAll(
      '.hero .hero-stack, .hero .chips > li, .hero .contact-row a, .hero .contact-row button, .sea-toggle',
    ))
      check(el.textContent?.trim() ?? '', el.getBoundingClientRect());
    if (island.right > innerWidth) hits.push(`island cut by the right edge: ${raw}`);
    return hits;
  }, canvasSelector);
}

test.describe('hero island stays clear of the text', () => {
  // Tier 2 compiles its shaders on the CPU (SwiftShader) for each of the 8 sizes in CI.
  test.describe.configure({ timeout: 360_000 });

  for (const tier of [0, 1, 2] as const) {
    test(`tier ${tier}, 1280–1920 px`, async ({ page }) => {
      const selector = tier === 0 ? '[data-sea-still-canvas]' : '.hero-sea-live';
      // CI renders tier 2 on the CPU (SwiftShader, ~40 s a page): three representative sizes
      // there; all eight run on a real GPU locally.
      const sizes =
        tier === 2 && process.env['CI']
          ? SIZES.filter((_, i) => i === 0 || i === 3 || i === 6)
          : SIZES;
      for (const [width, height] of sizes) {
        await page.setViewportSize({ width, height });
        await page.goto(`/?tier=${tier}`);
        await page.locator(selector).and(page.locator('.is-ready')).waitFor({ timeout: 60_000 });
        await page.waitForFunction(() =>
          document.documentElement.classList.contains('fonts-ready'),
        );
        await page.waitForFunction(
          (sel) => Boolean(document.querySelector<HTMLElement>(sel)?.dataset['island']),
          selector,
        );
        await page.waitForTimeout(300); // a fonts.ready re-placement may still be queued
        expect(await overlaps(page, selector), `${width}×${height}`).toEqual([]);
      }
    });
  }
});
