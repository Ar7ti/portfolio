import { expect, test } from '@playwright/test';
import { decideTier, isTooSlow, type Signals } from '../src/lib/sea/tiers';

const desktop: Signals = {
  override: null,
  calm: false,
  reducedMotion: false,
  saveData: false,
  webgl: true,
  mobile: false,
  deviceMemory: 8,
  cores: 8,
  slow3d: false,
};

test.describe('decideTier', () => {
  const cases: [string, Partial<Signals>, 0 | 1 | 2][] = [
    ['capable desktop', {}, 2],
    ['unknown memory/cores (Firefox, Safari)', { deviceMemory: undefined, cores: undefined }, 2],
    ['reduced motion', { reducedMotion: true }, 0],
    ['Save-Data', { saveData: true }, 0],
    ['no WebGL', { webgl: false }, 0],
    ['Calm the water', { calm: true }, 0],
    ['phone', { mobile: true }, 1],
    ['4 GB memory', { deviceMemory: 4 }, 1],
    ['4 cores', { cores: 4 }, 1],
    ['tier 2 was too slow', { slow3d: true }, 1],
    ['override beats everything', { override: 2, reducedMotion: true, mobile: true }, 2],
    ['calm beats mobile', { calm: true, mobile: true }, 0],
  ];
  for (const [name, signals, tier] of cases) {
    test(name, () => expect(decideTier({ ...desktop, ...signals })).toBe(tier));
  }

  test('slow frames: average of the first 30 frames over 22 ms', () => {
    expect(isTooSlow(Array(29).fill(40))).toBe(false);
    expect(isTooSlow(Array(30).fill(16.7))).toBe(false);
    expect(isTooSlow(Array(30).fill(23))).toBe(true);
    expect(isTooSlow([...Array(30).fill(16), 500])).toBe(false);
  });
});

test.describe('tiers in the browser', () => {
  const tierOf = (page: import('@playwright/test').Page) =>
    page
      .waitForFunction(() => document.documentElement.dataset['seaTier'])
      .then(() => page.evaluate(() => document.documentElement.dataset['seaTier']));

  test('?tier=0 forces the still', async ({ page }) => {
    await page.goto('/?tier=0');
    expect(await tierOf(page)).toBe('0');
  });

  test.describe('reduced motion', () => {
    test.use({ reducedMotion: 'reduce' });
    test('gets tier 0', async ({ page }) => {
      await page.goto('/');
      expect(await tierOf(page)).toBe('0');
    });
  });

  test('Calm the water forces tier 0 and is remembered', async ({ page }) => {
    await page.goto('/');
    const toggle = page.locator('[data-sea-toggle]');
    await expect(toggle).toHaveText('Calm the water');
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await expect(toggle).toHaveText('Bring the water back');
    expect(await tierOf(page)).toBe('0');

    await page.reload();
    await expect(page.locator('[data-sea-toggle]')).toHaveAttribute('aria-pressed', 'true');
    expect(await tierOf(page)).toBe('0');

    await page.locator('[data-sea-toggle]').click();
    await expect(page.locator('[data-sea-toggle]')).toHaveText('Calm the water');
  });

  test.describe('JS off', () => {
    test.use({ javaScriptEnabled: false });
    test('no toggle without JS', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('[data-sea-toggle]')).toBeHidden();
    });
  });
});

test.describe('slow tier 2 downgrade', () => {
  test('a slow first 30 frames downgrades tier 2 and is remembered for the visit', async ({
    page,
  }) => {
    // Make every frame look slow: rAF timestamps advance 40 ms per frame.
    await page.addInitScript(() => {
      // A capable desktop, whatever machine runs the test.
      Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8 });
      Object.defineProperty(navigator, 'deviceMemory', { get: () => 8 });
      let fake = performance.now();
      const raf = window.requestAnimationFrame.bind(window);
      window.requestAnimationFrame = (cb) => raf(() => cb((fake += 40)));
    });
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await page.waitForFunction(() => sessionStorage.getItem('sea:slow3d') === '1', null, {
      timeout: 30_000,
    });
    // Tier 1 isn't built yet (#10), so the downgrade lands on the still.
    await expect(page.locator('html')).not.toHaveAttribute('data-sea-tier', '2');
  });
});
