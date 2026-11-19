import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// Accessibility pass (#24): axe on every page at phone and desktop width, keyboard path with a
// visible focus ring, alt text on every image.
const PAGES = [
  '/',
  '/work/shill-or-chill',
  '/work/junction-x-turku',
  '/work/sky-island-tower-defense',
  '/404',
];

for (const path of PAGES) {
  for (const width of [390, 1440]) {
    test(`axe: no serious/critical issues on ${path} at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(path);
      await page.evaluate(() => document.fonts.ready);
      // Open every <details> so collapsed content is checked too.
      await page.evaluate(() =>
        document.querySelectorAll('details').forEach((d) => (d.open = true)),
      );
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
        .analyze();
      const bad = results.violations
        .filter((v) => v.impact === 'serious' || v.impact === 'critical')
        .map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`);
      expect(bad).toEqual([]);
    });
  }
}

test('every image has alt text (decorative ones are empty and hidden)', async ({ page }) => {
  for (const path of PAGES) {
    await page.goto(path);
    const missing = await page.evaluate(() =>
      [...document.querySelectorAll('img')]
        .filter((img) => !img.hasAttribute('alt'))
        .map((img) => img.currentSrc || img.src),
    );
    expect(missing, path).toEqual([]);
  }
});

test('keyboard: every focus stop is visible and has a ring', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const seen = new Set<string>();
  for (let i = 0; i < 120; i++) {
    await page.keyboard.press('Tab');
    const info = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || el === document.body) return null;
      const style = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return {
        key: `${el.tagName}#${el.id}.${el.className}|${el.textContent?.trim().slice(0, 30)}|${rect.top + scrollY}`,
        ring: style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) >= 2,
        visible: rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden',
        // Accessible name: aria-label, text, or the alt of an image inside the link.
        label: (
          el.getAttribute('aria-label') ??
          (el.textContent?.trim() || el.querySelector('img')?.getAttribute('alt')) ??
          ''
        ).trim(),
      };
    });
    if (!info) continue;
    if (seen.has(info.key)) break; // wrapped around
    seen.add(info.key);
    expect(info.visible, info.key).toBe(true);
    expect(info.ring, `no focus ring: ${info.key}`).toBe(true);
    expect(info.label.length, `no accessible name: ${info.key}`).toBeGreaterThan(0);
  }
  expect(seen.size).toBeGreaterThan(20);
});
