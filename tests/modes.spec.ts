import { expect, test } from '@playwright/test';

const PAGES = ['/', '/styleguide', '/work/shill-or-chill'];

test.describe('JS off', () => {
  test.use({ javaScriptEnabled: false });

  for (const path of PAGES) {
    test(`${path} is readable without JS`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(path);
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('h1')).not.toBeEmpty();
      await expect(page.getByRole('link', { name: 'k.jegosin@gmail.com' }).first()).toBeVisible();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  for (const path of PAGES) {
    test(`${path} has no running animations`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator('h1')).toBeVisible();
      const running = await page.evaluate(() =>
        document
          .getAnimations()
          .filter((a) => a.playState === 'running' && a.effect?.getTiming().iterations === Infinity)
          .map((a) => (a as CSSAnimation).animationName ?? a.id),
      );
      expect(running).toEqual([]);
      // The page asks for reduced motion and the CSS honours it.
      expect(
        await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches),
      ).toBe(true);
    });
  }
});
