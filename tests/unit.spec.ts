/**
 * Unit tests for the pure logic (no browser): the liquid, the receipt matcher, dates and the
 * rich-text helper. Playwright runs them in Node like any other spec.
 */
import { expect, test } from '@playwright/test';
import { asOf, fillAsOf, formatDate } from '../src/lib/dates';
import { matchReceipt, receiptId } from '../src/lib/receipts';
import { plain, rich } from '../src/lib/rich';
import { islandMask, Liquid } from '../src/lib/sea/liquid';

test.describe('liquid', () => {
  test('a push overshoots a little, then settles back to rest (thick, not ringing)', () => {
    const liquid = new Liquid({ width: 32, depth: 32 });
    liquid.impulse(16, 16, 4, -0.6);
    const centre = 16 * 32 + 16;
    let lowest = 0;
    let highestAfter = 0;
    for (let i = 0; i < 600; i++) {
      liquid.step();
      const h = liquid.height[centre] ?? 0;
      lowest = Math.min(lowest, h);
      if (lowest < -0.1) highestAfter = Math.max(highestAfter, h);
    }
    expect(lowest).toBeLessThan(-0.1);
    // Some rebound above rest, but much smaller than the push.
    expect(highestAfter).toBeGreaterThan(0);
    expect(highestAfter).toBeLessThan(Math.abs(lowest) * 0.6);
    for (let i = 0; i < 1200; i++) liquid.step();
    expect(liquid.isCalm(1e-3)).toBe(true);
  });

  test('island mask: grass inside a sand ring, nothing outside the radius', () => {
    const mask = islandMask(40, 40, 20, 20, 7);
    expect(mask[20 * 40 + 20]).toBe(2);
    expect(mask[20 * 40 + 26]).toBe(1);
    expect(mask[20 * 40 + 28]).toBe(0);
    expect(mask[0]).toBe(0);
  });
});

test.describe('receipts', () => {
  const receipts = [
    { kind: 'code', facts: ['ST10', 'ST12'] },
    { kind: 'verified', facts: ['ST10'] },
    { kind: 'live', facts: ['ST1'] },
  ];

  test('a claim links to the verified receipt first when several share its facts', () => {
    expect(matchReceipt('sky', ['ST10'], receipts)).toEqual({
      href: `#${receiptId('sky', 1)}`,
      kind: 'verified',
    });
  });

  test('no shared fact, no link', () => {
    expect(matchReceipt('sky', ['YT2'], receipts)).toBeUndefined();
    expect(matchReceipt('sky', undefined, receipts)).toBeUndefined();
    expect(matchReceipt('sky', ['ST1'], [])).toBeUndefined();
  });
});

test.describe('dates', () => {
  const day = new Date('2026-11-19T00:00:00Z');

  test('one format everywhere', () => {
    expect(formatDate(day)).toBe('19 Nov 2026');
    expect(asOf(day)).toBe('as of 19 Nov 2026');
  });

  test('{asOf} is filled with non-breaking spaces, and a missing date is an error', () => {
    expect(fillAsOf({ text: 'updated {asOf}' }, day).text).toBe('updated 19 Nov 2026');
    expect(fillAsOf({ text: 'no slot' }, undefined).text).toBe('no slot');
    expect(() => fillAsOf({ text: '{asOf}' }, undefined)).toThrow(/no asOf date/);
  });
});

test.describe('rich text', () => {
  test('only **bold** becomes markup; everything else is escaped', () => {
    expect(rich('**Won** <script>&"')).toBe('<b>Won</b> &lt;script&gt;&amp;&quot;');
    expect(plain('a **b** c')).toBe('a b c');
  });
});
