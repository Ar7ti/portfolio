import { expect, test, type Page } from '@playwright/test';
import { springStep, targetAt, type Band } from '../src/lib/sea/progress';
import { DAY, DUSK, mixPalette, NIGHT } from '../src/lib/sea/palette';

test.describe('day → night progress (pure)', () => {
  const bands: Band[] = [
    { top: 1000, bottom: 2000, kind: 'dusk' },
    { top: 5000, bottom: 5600, kind: 'sunrise' },
  ];

  test('day before the dusk band, night between the bands, day after sunrise', () => {
    expect(targetAt(0, bands)).toBe(0);
    expect(targetAt(1500, bands)).toBeCloseTo(0.5);
    expect(targetAt(3000, bands)).toBe(1);
    expect(targetAt(5300, bands)).toBeCloseTo(0.5);
    expect(targetAt(9000, bands)).toBe(0);
  });

  test('the spring settles on the target with a little overshoot, never jumps', () => {
    let state = { p: 0, v: 0 };
    let max = 0;
    for (let i = 0; i < 240; i++) {
      state = springStep(state, 1, 1 / 60);
      max = Math.max(max, state.p);
    }
    expect(state.p).toBeCloseTo(1, 2);
    expect(max).toBeGreaterThan(1);
    expect(max).toBeLessThan(1.15);
    expect(springStep({ p: 0, v: 0 }, 1, 1 / 60).p).toBeLessThan(0.05);
  });

  test('the sunset stop is violet → coral, not grey', () => {
    expect(mixPalette(0).skyA).toBe(DAY.skyA);
    expect(mixPalette(0.5).skyA).toBe(DUSK.skyA);
    expect(mixPalette(0.5).skyB).toBe(DUSK.skyB);
    expect(mixPalette(1).fog).toBe(NIGHT.fog);
  });
});

async function seaP(page: Page): Promise<number> {
  return Number(
    await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--sea-p'),
    ),
  );
}

async function scrollToHour(page: Page, where: 'hackathons' | 'case02'): Promise<void> {
  await page.evaluate((w) => {
    const el =
      w === 'hackathons'
        ? document.querySelector('#hackathons')
        : document.querySelector('[data-sky-band="sunrise"]')?.nextElementSibling;
    if (!el) throw new Error(`no anchor for ${w}`);
    window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY + 40);
  }, where);
}

test.describe('day → night in the browser', () => {
  test('--sea-p follows the page: day in the hero, night at the hackathons, day at Case 02', async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await page.goto('/?tier=0');
    await page.waitForFunction(
      () => document.documentElement.style.getPropertyValue('--sea-p') !== '',
    );
    expect(await seaP(page)).toBe(0);
    await scrollToHour(page, 'hackathons');
    await expect.poll(() => seaP(page), { timeout: 10_000 }).toBeGreaterThan(0.98);
    await scrollToHour(page, 'case02');
    await expect.poll(() => seaP(page), { timeout: 10_000 }).toBeLessThan(0.02);
  });

  test('tier 0: the sky bands are CSS gradients; live sea: they let the sea through', async ({
    page,
  }) => {
    await page.goto('/?tier=0');
    await page.waitForFunction(() => document.documentElement.dataset['seaTier'] === '0');
    const bg = () =>
      page.locator('[data-sky-band="dusk"]').evaluate((el) => getComputedStyle(el).backgroundImage);
    expect(await bg()).toContain('linear-gradient');
    await page.evaluate(() => document.documentElement.classList.add('sea-live'));
    expect(await bg()).toBe('none');
  });

  test.describe('JS off', () => {
    test.use({ javaScriptEnabled: false });
    test('sky bands still show the sunset and the sunrise', async ({ page }) => {
      await page.goto('/');
      for (const kind of ['dusk', 'sunrise']) {
        const image = await page
          .locator(`[data-sky-band="${kind}"]`)
          .evaluate((el) => getComputedStyle(el).backgroundImage);
        expect(image).toContain('linear-gradient');
      }
    });
  });
});

test.describe('no hard seams', () => {
  test('sections next to the hour bands dissolve into the live sea; the hackathons photo fades', async ({
    page,
  }) => {
    await page.goto('/?tier=0');
    const mask = (sel: string) =>
      page
        .locator(sel)
        .first()
        .evaluate((el) => getComputedStyle(el).maskImage || getComputedStyle(el).webkitMaskImage);
    // Every tier: the photo fades into its own night background.
    expect(await mask('#hackathons img')).toContain('linear-gradient');
    // Live sea: the edges next to the bands become soft masks.
    await page.evaluate(() => document.documentElement.classList.add('sea-live'));
    expect(await mask('.sky-band--dusk + section')).toContain('linear-gradient');
    expect(await mask('.sky-band--sunrise + section')).toContain('linear-gradient');
  });
});
