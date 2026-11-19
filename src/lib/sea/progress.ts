/**
 * The one day → dusk → night value. Scroll position sets a target from the page's sky bands
 * (dusk band after the hero, sunrise band before Case 02); a soft spring follows it, so the
 * change itself feels liquid. Everything that changes with the hour reads this one value:
 * both WebGL tiers and the CSS variable --sea-p.
 */

export interface Band {
  /** Top and bottom of the band in page pixels. */
  top: number;
  bottom: number;
  /** 'dusk' goes day → night across the band; 'sunrise' goes night → day. */
  kind: 'dusk' | 'sunrise';
}

/** Target progress for a reading line at page y (pure: unit-tested). */
export function targetAt(y: number, bands: readonly Band[]): number {
  let p = 0;
  for (const band of [...bands].sort((a, b) => a.top - b.top)) {
    if (y < band.top) break;
    const t = Math.min(1, (y - band.top) / Math.max(1, band.bottom - band.top));
    p = band.kind === 'dusk' ? t : 1 - t;
  }
  return p;
}

/** Critically-damped-ish spring with a little overshoot (prototype D values). */
export function springStep(
  state: { p: number; v: number },
  target: number,
  dt: number,
): { p: number; v: number } {
  const v = state.v + ((target - state.p) * 40 - state.v * 9) * dt;
  return { p: state.p + v * dt, v };
}

export function startDayNight(onChange: (p: number) => void): () => void {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const readBands = (): Band[] =>
    [...document.querySelectorAll<HTMLElement>('[data-sky-band]')].map((el) => {
      const r = el.getBoundingClientRect();
      return {
        top: r.top + scrollY,
        bottom: r.bottom + scrollY,
        kind: el.dataset['skyBand'] === 'sunrise' ? 'sunrise' : 'dusk',
      };
    });
  let bands = readBands();
  let state = { p: 0, v: 0 };
  let frame = 0;
  let prev = 0;
  // The reading line sits in the upper third, so the hour only turns once the hero text has
  // mostly scrolled away (its dark text stays on a day sky).
  const target = () => targetAt(scrollY + innerHeight * 0.35, bands);

  const emit = (p: number) => {
    const clamped = Math.min(1, Math.max(0, p));
    document.documentElement.style.setProperty('--sea-p', clamped.toFixed(3));
    onChange(clamped);
  };

  const tick = (now: number) => {
    frame = 0;
    const dt = Math.min(0.05, (now - prev) / 1000);
    prev = now;
    const goal = target();
    state = springStep(state, goal, dt);
    emit(state.p);
    if (Math.abs(goal - state.p) > 1e-3 || Math.abs(state.v) > 1e-3) {
      frame = requestAnimationFrame(tick);
    }
  };

  const onScroll = () => {
    if (reduce) {
      state = { p: target(), v: 0 };
      emit(state.p);
      return;
    }
    if (!frame) {
      prev = performance.now();
      frame = requestAnimationFrame(tick);
    }
  };
  const onResize = () => {
    bands = readBands();
    onScroll();
  };

  state = { p: target(), v: 0 };
  emit(state.p);
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onResize);
  const observer = new ResizeObserver(onResize);
  observer.observe(document.body);
  return () => {
    cancelAnimationFrame(frame);
    removeEventListener('scroll', onScroll);
    removeEventListener('resize', onResize);
    observer.disconnect();
  };
}
