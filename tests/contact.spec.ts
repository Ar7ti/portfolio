import { expect, test } from '@playwright/test';

// Contact section, sticky contact link, footer, 404 (#21).
test.describe('contact section', () => {
  test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

  test('copy, links and small print from content', async ({ page }) => {
    await page.goto('/');
    const contact = page.locator('#contact');
    await expect(contact.getByRole('heading', { level: 2 })).toHaveText("Let's build something.");
    await expect(contact.getByRole('link', { name: 'k.jegosin@gmail.com' })).toHaveAttribute(
      'href',
      'mailto:k.jegosin@gmail.com',
    );
    for (const name of ['LinkedIn', 'GitHub', 'Telegram']) {
      await expect(contact.getByRole('link', { name, exact: true })).toBeVisible();
    }
    await expect(contact).toContainText('Kanta-Häme, Finland');

    const copy = contact.getByRole('button', { name: 'Copy' });
    await copy.click();
    await expect(contact.getByRole('button', { name: 'Copied' })).toBeVisible();
    await expect(contact.getByRole('status')).toHaveText('Email address copied');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('k.jegosin@gmail.com');
  });
});

test.describe('without JS', () => {
  test.use({ javaScriptEnabled: false });
  test('email still works, no dead Copy button', async ({ page }) => {
    await page.goto('/');
    await expect(
      page.locator('#contact').getByRole('link', { name: 'k.jegosin@gmail.com' }),
    ).toBeVisible();
    await expect(page.locator('#contact [data-copy-email]')).toBeHidden();
  });
});

for (const path of [
  '/work/shill-or-chill',
  '/work/junction-x-turku',
  '/work/sky-island-tower-defense',
]) {
  test(`contact is one click away on ${path}`, async ({ page }) => {
    await page.goto(path);
    await page.mouse.wheel(0, 600);
    const sticky = page.locator('[data-sticky-contact]');
    await expect(sticky).toBeVisible();
    await expect(sticky).not.toHaveClass(/is-hidden/);
    await sticky.click();
    await expect(page.locator('#contact')).toBeInViewport();
    await expect(sticky).toHaveClass(/is-hidden/);
    await expect(page.locator('.case-cta')).toHaveCount(0);
  });
}

test('footer: repo link and numbers-checked date', async ({ page }) => {
  await page.goto('/');
  const footer = page.locator('footer');
  await expect(footer.getByRole('link', { name: 'github.com/Ar7ti/portfolio' })).toBeVisible();
  await expect(footer.locator('time')).toHaveAttribute('datetime', /^\d{4}-\d{2}-\d{2}$/);
});

test('404: the island sank, a way back, footer at the bottom', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const response = await page.goto('/this-page-does-not-exist');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('This island sank.');
  await expect(page.getByRole('link', { name: 'Back to the surface' })).toHaveAttribute(
    'href',
    '/',
  );
  const footer = await page.locator('footer').boundingBox();
  if (!footer) throw new Error('no footer');
  expect(footer.y + footer.height).toBeGreaterThanOrEqual(843);
});

test('phones: sticky Contact steps aside while scrolling down, returns on scroll up; never without JS', async ({
  page,
  browser,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/work/shill-or-chill');
  const sticky = page.locator('[data-sticky-contact]');
  // Real scroll steps (no smooth-scroll easing in between), down then up.
  for (const y of [200, 400, 600])
    await page.evaluate((top) => scrollTo({ top, behavior: 'instant' }), y);
  await expect(sticky).toHaveClass(/is-away/);
  for (const y of [500, 400])
    await page.evaluate((top) => scrollTo({ top, behavior: 'instant' }), y);
  await expect(sticky).not.toHaveClass(/is-away/);

  const context = await browser.newContext({ javaScriptEnabled: false });
  const nojs = await context.newPage();
  await nojs.goto(page.url());
  await expect(nojs.locator('[data-sticky-contact]')).toBeHidden();
  await context.close();
});
