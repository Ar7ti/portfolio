import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { springEasing } from '../src/scripts/motion/spring';

// Motion layer (#20): springs only, never blocks native scrolling, off under reduced motion.
const motionReady = (page: Page) =>
  expect(page.locator('html')).toHaveClass(/motion-on/, { timeout: 8000 });

test('the CSS spring token is the SOFT spring', () => {
  const css = readFileSync('src/styles/tokens.css', 'utf8');
  expect(css).toContain(`--ease-spring: ${springEasing()};`);
});

test('desktop: smooth wheel on, anchors and keyboard still native', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await motionReady(page);
  await expect(page.locator('html')).toHaveClass(/lenis/);
  await page
    .getByRole('navigation', { name: 'Main' })
    .getByRole('link', { name: 'Timeline' })
    .click();
  await expect(page.locator('#timeline')).toBeInViewport();
  await expect(page.locator('#timeline h2')).toHaveCSS('opacity', '1');
  await page.locator('body').press('End');
  await expect(page.locator('footer')).toBeInViewport();
});

test('headings below the fold reveal when scrolled to; nothing above the fold is hidden', async ({
  page,
}) => {
  await page.goto('/');
  await motionReady(page);
  await expect(page.locator('#point .motion-mask')).toHaveCount(0);
  const heading = page.locator('#more h2');
  await heading.scrollIntoViewIfNeeded();
  await expect(heading).toHaveClass(/motion-in/);
  await expect(heading).toHaveCSS('opacity', '1');
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('no motion layer at all', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);
    await expect(page.locator('html')).not.toHaveClass(/motion-on|lenis/);
    await expect(page.locator('.motion-mask')).toHaveCount(0);
  });
});

test.describe('touch', () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });
  test('native scrolling, no magnetic buttons', async ({ page }) => {
    await page.goto('/');
    await motionReady(page);
    await expect(page.locator('html')).not.toHaveClass(/lenis/);
  });
});
