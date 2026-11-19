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

test.describe('more work cards', () => {
  const DATE = /\d{1,2}\s[A-Z][a-z]{2}\s\d{4}/;

  test('YouTube, Guardio, Now building', async ({ page }) => {
    await page.goto('/');
    const cards = page.locator('#more .card');
    await expect(cards).toHaveCount(3);

    const yt = cards.nth(0);
    await expect(yt.getByRole('heading', { level: 3 })).toHaveText('Sharky_blox');
    await expect(yt.locator('.label').first()).toContainText(new RegExp(`as of ${DATE.source}`));
    await expect(yt.locator('.covers li')).toHaveCount(3);
    // "2.6M views" on one line: figure and label share a baseline row.
    const [fig, label] = await Promise.all([
      yt.locator('.card-big .big').boundingBox(),
      yt.locator('.card-big .big-label').boundingBox(),
    ]);
    if (!fig || !label) throw new Error('figure not rendered');
    expect(label.y).toBeLessThan(fig.y + fig.height);

    const guardio = cards.nth(1);
    await expect(guardio.locator('img.card-shot')).toHaveAttribute('alt', /.+/);
    await expect(guardio.getByRole('link')).toHaveText(['Live', 'Code']);

    const now = cards.nth(2);
    await expect(now).toHaveClass(/\bnow\b/);
    await expect(now.locator('.label').first()).toContainText(new RegExp(`updated ${DATE.source}`));
    await expect(now.getByRole('link')).toHaveCount(0);
  });

  for (const width of [360, 390]) {
    test(`"2.6M views" fits one line at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto('/');
      const li = page.locator('#more .card-big li');
      const box = await li.boundingBox();
      const big = await page.locator('#more .card-big .big').boundingBox();
      if (!box || !big) throw new Error('figure not rendered');
      expect(box.height).toBeLessThan(big.height * 1.3);
    });
  }
});
