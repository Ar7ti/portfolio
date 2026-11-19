import { expect, test } from '@playwright/test';

// #25: heavy code never sits in the initial bundle: three.js (sea3d) and Lenis (motion) load
// only after the page has loaded, and only when needed.
test('three.js and Lenis are not loaded before the load event', async ({ page }) => {
  const early: string[] = [];
  let loaded = false;
  page.on('request', (r) => {
    if (!loaded && r.url().includes('/_astro/') && r.url().endsWith('.js')) early.push(r.url());
  });
  await page.goto('/', { waitUntil: 'load' });
  loaded = true;
  expect(early.filter((u) => /sea3d|three/.test(u))).toEqual([]);
  expect(early.filter((u) => /lenis/i.test(u))).toEqual([]);
  // Lenis, if bundled into the motion chunk, must not be in a script tag of the HTML.
  const html = await page.content();
  expect(html).not.toMatch(/<script[^>]+src="[^"]*(sea3d|lenis)[^"]*"/);
});

test('hero still and photos come as AVIF/WebP', async ({ page }) => {
  await page.goto('/');
  const sources = await page
    .locator('img')
    .evaluateAll((imgs) =>
      imgs
        .map((i) => (i as HTMLImageElement).currentSrc || (i as HTMLImageElement).src)
        .filter(Boolean),
    );
  const raster = sources.filter((s) => !s.startsWith('data:') && !s.endsWith('.svg'));
  expect(raster.filter((s) => !/\.(avif|webp)(\?|$)/.test(s))).toEqual([]);
});
