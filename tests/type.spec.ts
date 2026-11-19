import { expect, test } from '@playwright/test';

// Port of the mock's mobile type check (concepts/f-full-copy.html, COPY.md "Mobile type rules").
const PAGES = ['/', '/styleguide', '/404', '/work/shill-or-chill'];
const WIDTHS = [360, 390, 768, 1440];

for (const path of PAGES) {
  for (const width of WIDTHS) {
    test(`type check ${path} at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(path);
      await page.evaluate(() => document.fonts.ready);

      const report = await page.evaluate(() => {
        const problems: string[] = [];
        const describe = (el: Element) =>
          `${el.tagName.toLowerCase()}.${[...el.classList].join('.')} "${el.textContent?.trim().slice(0, 40)}"`;

        // 1. No page h-scroll.
        const doc = document.documentElement;
        if (doc.scrollWidth > doc.clientWidth) {
          problems.push(`page scrolls sideways by ${doc.scrollWidth - doc.clientWidth}px`);
        }

        // 2. No heading or big figure wider than its own box, and none sticking out of its parent.
        for (const el of document.querySelectorAll<HTMLElement>('h1, h2, h3, .big')) {
          if (el.scrollWidth > el.clientWidth + 1)
            problems.push(`wider than its box: ${describe(el)}`);
          const parent = el.parentElement;
          if (
            parent &&
            el.getBoundingClientRect().right > parent.getBoundingClientRect().right + 1
          ) {
            problems.push(`sticks out of its parent: ${describe(el)}`);
          }
        }

        // 3. Headings never break mid-word: every line break falls between words.
        for (const el of document.querySelectorAll<HTMLElement>('h1, h2, h3')) {
          const style = getComputedStyle(el);
          if (
            style.overflowWrap !== 'normal' ||
            style.wordBreak !== 'normal' ||
            style.hyphens === 'auto'
          ) {
            problems.push(`heading may break mid-word: ${describe(el)}`);
          }
        }

        // 4. Big figures stay on one line.
        for (const el of document.querySelectorAll<HTMLElement>('.big')) {
          const lh = parseFloat(getComputedStyle(el).lineHeight);
          if (el.getBoundingClientRect().height > lh * 1.5)
            problems.push(`figure wraps: ${describe(el)}`);
        }

        // 5. Mono font only on labels (and code samples in the styleguide).
        for (const el of document.querySelectorAll<HTMLElement>('body *')) {
          if (!el.textContent?.trim() || el.children.length > 0) continue;
          const mono = getComputedStyle(el).fontFamily.includes('Martian Mono');
          if (mono && !el.closest('.label')) problems.push(`mono outside a label: ${describe(el)}`);
        }

        // 6. Body text 17–18 px.
        for (const el of document.querySelectorAll<HTMLElement>('.body')) {
          const size = parseFloat(getComputedStyle(el).fontSize);
          if (size < 17 || size > 18) problems.push(`body text ${size}px: ${describe(el)}`);
        }

        return problems;
      });

      expect(report).toEqual([]);
    });
  }
}
