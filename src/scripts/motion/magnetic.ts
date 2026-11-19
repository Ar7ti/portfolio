/**
 * Magnetic primary buttons (#20): a `.button` leans toward a nearby mouse pointer and springs
 * back. Uses the `translate` property only, so layout never moves.
 */
import { loop, SNAPPY, Spring } from './spring';

const RADIUS = 90;
const PULL = 0.28;

export function initMagnetic(): () => void {
  const items = [...document.querySelectorAll<HTMLElement>('.button')].map((el) => ({
    el,
    x: new Spring(0, SNAPPY),
    y: new Spring(0, SNAPPY),
  }));
  let stop: (() => void) | null = null;

  const run = () => {
    stop ??= loop((dt) => {
      let moving = false;
      for (const item of items) {
        moving = item.x.step(dt) || moving;
        moving = item.y.step(dt) || moving;
        const still = item.x.value === 0 && item.y.value === 0;
        item.el.style.translate = still
          ? ''
          : `${item.x.value.toFixed(2)}px ${item.y.value.toFixed(2)}px`;
      }
      if (!moving) stop = null;
      return moving;
    });
  };

  const onMove = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    for (const item of items) {
      const r = item.el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      const near = Math.hypot(dx, dy) < RADIUS + Math.max(r.width, r.height) / 2;
      item.x.target = near ? dx * PULL : 0;
      item.y.target = near ? dy * PULL : 0;
    }
    run();
  };

  addEventListener('pointermove', onMove, { passive: true });
  return () => {
    removeEventListener('pointermove', onMove);
    stop?.();
    for (const item of items) item.el.style.translate = '';
  };
}
