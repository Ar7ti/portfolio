import { expect, test } from '@playwright/test';

// Records every cross-document view transition: its types and how long its animations run.
const recordTransitions = () => {
  const w = window as unknown as { __vt: { types: string[]; ms: number }[] };
  const log = JSON.parse(sessionStorage.getItem('__vt') ?? '[]') as {
    types: string[];
    ms: number;
  }[];
  w.__vt = log;
  addEventListener('pagereveal', (event) => {
    const vt = (event as Event & { viewTransition?: ViewTransition & { types: Set<string> } })
      .viewTransition;
    if (!vt) return;
    vt.ready
      .then(() => {
        const ms = Math.max(
          0,
          ...document
            .getAnimations()
            .filter((a) =>
              (a.effect as KeyframeEffect | null)?.pseudoElement?.startsWith('::view-transition'),
            )
            .map((a) => Number(a.effect?.getComputedTiming().endTime ?? 0)),
        );
        log.push({ types: [...vt.types], ms });
        sessionStorage.setItem('__vt', JSON.stringify(log));
      })
      .catch(() => {});
  });
};

test.describe('tsunami wipe (#19)', () => {
  test('into a case: "tsunami" ≤ 1.2 s; back: "tsunami-back" and the scroll position returns', async ({
    page,
  }) => {
    await page.addInitScript(recordTransitions);
    await page.goto('/?tier=0');
    const link = page.locator('a[href="/work/shill-or-chill"]').first();
    await link.scrollIntoViewIfNeeded();
    const before = await page.evaluate(() => Math.round(scrollY));

    await link.click();
    await page.waitForURL('**/work/shill-or-chill');
    await page.waitForTimeout(1500);
    let log = await page.evaluate(
      () => (window as unknown as { __vt: { types: string[]; ms: number }[] }).__vt,
    );
    expect(log.at(-1)?.types).toEqual(['tsunami']);
    expect(log.at(-1)?.ms).toBeLessThanOrEqual(1200);

    await page.goBack();
    await page.waitForURL((url) => url.pathname === '/');
    await page.waitForTimeout(1500);
    log = await page.evaluate(() => JSON.parse(sessionStorage.getItem('__vt') ?? '[]'));
    expect(log.at(-1)?.types).toEqual(['tsunami-back']);
    await expect.poll(() => page.evaluate(() => Math.round(scrollY))).toBeGreaterThan(before - 80);
  });

  test.describe('reduced motion', () => {
    test.use({ reducedMotion: 'reduce' });
    test('instant swap: no view transition at all', async ({ page }) => {
      await page.addInitScript(recordTransitions);
      await page.goto('/?tier=0');
      await page.locator('a[href="/work/shill-or-chill"]').first().click();
      await page.waitForURL('**/work/shill-or-chill');
      await page.waitForTimeout(800);
      const log = await page.evaluate(() => JSON.parse(sessionStorage.getItem('__vt') ?? '[]'));
      expect(log).toEqual([]);
    });
  });
});
