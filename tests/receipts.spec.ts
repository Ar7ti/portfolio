import { expect, test } from '@playwright/test';

// Receipts system (#18): claim marks → receipts, collapsed list, ink drip only on desktop.
const CASE = '#case-shill-or-chill';

test('claims link to their receipts; the list starts closed', async ({ page }) => {
  await page.goto('/');
  const marks = page.locator(`${CASE} [data-receipt-mark]`);
  await expect(marks.first()).toBeVisible();
  for (const mark of await marks.all()) {
    const href = await mark.getAttribute('href');
    expect(href).toMatch(/^#shill-or-chill-receipt-\d+$/);
    await expect(page.locator(href ?? '')).toHaveCount(1);
  }
  // "Won" → the verified Oxylabs receipt, "3rd" → the Hostinger source.
  const results = page.locator(`${CASE} .case-results li`);
  await expect(results.nth(0).locator('[data-receipt-mark]')).toContainText('verified');
  await expect(results.nth(1).locator('[data-receipt-mark]')).toContainText('source');
  await expect(page.locator(`${CASE} details.receipts`)).not.toHaveAttribute('open');
  await expect(page.locator(`${CASE} .receipts li`)).toHaveCount(4);
  await expect(page.locator(`${CASE} .receipts li .checked`).first()).toContainText(/checked/);
});

test('keyboard: Enter on a mark opens the list at that receipt', async ({ page }) => {
  await page.goto('/');
  const mark = page.locator(`${CASE} .case-results [data-receipt-mark]`).first();
  await mark.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator(`${CASE} details.receipts`)).toHaveAttribute('open', '');
  await expect(page.locator('#shill-or-chill-receipt-1')).toBeFocused();
  await expect(page.locator('#shill-or-chill-receipt-1')).toBeInViewport();
});

test('desktop hover drips ink to the receipt', async ({ page }) => {
  await page.goto('/');
  await page.locator(`${CASE} .case-results [data-receipt-mark]`).first().hover();
  await expect(page.locator('svg.ink-drip')).toHaveCount(1);
  await expect(page.locator('svg.ink-drip')).toHaveAttribute('aria-hidden', 'true');
});

test.describe('reduced motion: no ink', () => {
  test.use({ reducedMotion: 'reduce' });
  test('hover does nothing', async ({ page }) => {
    await page.goto('/');
    await page.locator(`${CASE} .case-results [data-receipt-mark]`).first().hover();
    await page.waitForTimeout(300);
    await expect(page.locator('svg.ink-drip')).toHaveCount(0);
  });
});

test.describe('touch: no ink', () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });
  test('tap follows the link, no drip', async ({ page }) => {
    await page.goto('/');
    await page.locator(`${CASE} .case-results [data-receipt-mark]`).first().tap();
    await expect(page.locator(`${CASE} details.receipts`)).toHaveAttribute('open', '');
    await expect(page.locator('svg.ink-drip')).toHaveCount(0);
  });
});

test.describe('without JS', () => {
  test.use({ javaScriptEnabled: false });
  test('receipts open by hand and every mark has a target', async ({ page }) => {
    await page.goto('/');
    await page.locator(`${CASE} .receipts summary`).click();
    await expect(page.locator(`${CASE} .receipts li`).first()).toBeVisible();
  });
});
