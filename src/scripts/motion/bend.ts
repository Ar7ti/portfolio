/**
 * Media that bends with scroll velocity (#20): case and card images skew slightly
 * (max ±3°) with a spring-smoothed scroll speed and settle back when scrolling stops.
 */
import { loop, SOFT, Spring } from './spring';

const MEDIA = '.case .fig img, .case .fig video, .card-shot, .covers img';
const MAX_DEG = 3;

export function initBend(): () => void {
  const media = [...document.querySelectorAll<HTMLElement>(MEDIA)];
  if (media.length === 0) return () => {};
  const skew = new Spring(0, SOFT);
  let lastY = scrollY;
  let lastT = performance.now();
  let stop: (() => void) | null = null;

  const apply = () => {
    const css = skew.value === 0 ? '' : `skewY(${skew.value.toFixed(3)}deg)`;
    for (const el of media) el.style.transform = css;
  };

  const onScroll = () => {
    const now = performance.now();
    const speed = (scrollY - lastY) / Math.max(now - lastT, 1); // px per ms
    lastY = scrollY;
    lastT = now;
    skew.target = Math.max(-MAX_DEG, Math.min(MAX_DEG, speed * 1.4));
    stop ??= loop((dt) => {
      skew.target *= 0.9; // the push fades once scrolling stops
      if (Math.abs(skew.target) < 0.01) skew.target = 0;
      const moving = skew.step(dt) || skew.target !== 0;
      apply();
      if (!moving) stop = null;
      return moving;
    });
  };

  addEventListener('scroll', onScroll, { passive: true });
  return () => {
    removeEventListener('scroll', onScroll);
    stop?.();
    for (const el of media) el.style.transform = '';
  };
}
