import { expect, test } from '@playwright/test';

// Home page sections (M3). Content comes from src/content; these check structure, not copy.
test.describe('hackathons strip', () => {
  test('three events, Junction 2026 highlighted, photo credited', async ({ page }) => {
    await page.goto('/');
    const strip = page.locator('#hackathons');
    await expect(strip.getByRole('heading', { level: 2 })).toHaveText('3 hackathons. 4 projects.');
    await expect(strip.locator('.event')).toHaveCount(3);
    const win = strip.locator('.event.win');
    await expect(win).toHaveCount(1);
    await expect(win.getByRole('heading', { level: 3 })).toHaveText('Junction 2026');
    await expect(win).toContainText('won the Oxylabs challenge');
    await expect(strip.locator('.strip-photo')).toHaveAttribute('alt', /.+/);
    await expect(strip).toContainText('Photo: Junction');
  });

  test('readable without JS', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('/');
    await expect(page.locator('#hackathons .event')).toHaveCount(3);
    await context.close();
  });
});
