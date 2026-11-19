/**
 * Picks the sea tier after first paint and mounts the matching renderer into the fixed sea
 * backdrop behind the page (seen through the hero and the dusk / sunrise sky bands).
 * Tier 0 keeps the static still in the hero and the CSS sky bands.
 * One day → night value (src/lib/sea/progress.ts) drives the renderer and --sea-p.
 */
import { startDayNight } from '../../lib/sea/progress';
import {
  decideTier,
  isTooSlow,
  readSignals,
  remember,
  SLOW_SAMPLE_FRAMES,
  WARMUP_FRAMES,
  type Tier,
} from '../../lib/sea/tiers';
import type { SeaFactory, SeaRenderer } from '../../lib/sea/types';

/** Renderers load only when their tier is chosen (never in the initial bundle). */
const LOADERS: Record<1 | 2, () => Promise<SeaFactory | null>> = {
  1: () => import('../../lib/sea/sea2d').then((m) => m.createSea2D),
  2: () => import('../../lib/sea/sea3d').then((m) => m.createSea3D),
};

const root = document.documentElement;
let current: SeaRenderer | null = null;
let generation = 0;
let paused = false;
let hour = 0;

function setPaused(next: boolean): void {
  paused = next;
  current?.setPaused(next);
}

async function apply(tier: Tier, layer: HTMLElement): Promise<void> {
  const run = ++generation;
  current?.destroy();
  current = null;
  root.classList.remove('sea-live');
  root.dataset['seaTier'] = String(tier);
  if (tier === 0) return;

  const factory = await LOADERS[tier]();
  if (run !== generation) return;
  if (!factory) {
    root.dataset['seaTier'] = '0';
    root.dataset['seaFallback'] = `tier ${tier} not built yet`;
    return;
  }

  const frames: number[] = [];
  const signals = readSignals();
  const forced = signals.override !== null;
  const renderer = factory({
    allowSoftware: signals.allowSoftware,
    onFrame: (ms) => {
      // A forced ?tier= is for testing: never downgrade it.
      if (tier !== 2 || forced || frames.length >= WARMUP_FRAMES + SLOW_SAMPLE_FRAMES) return;
      frames.push(ms);
      if (isTooSlow(frames)) {
        remember.slow3d();
        void apply(1, layer);
      }
    },
  });
  try {
    await renderer.mount(layer);
  } catch (error) {
    renderer.destroy();
    if (run === generation) {
      root.dataset['seaTier'] = '0';
      root.dataset['seaFallback'] = error instanceof Error ? error.message : 'renderer failed';
    }
    console.warn('Sea renderer failed, keeping the still.', error);
    return;
  }
  if (run !== generation) {
    renderer.destroy();
    return;
  }
  current = renderer;
  renderer.setProgress?.(hour);
  renderer.setPaused(paused);
  // The bands and the hero go transparent so the live sea shows through them.
  root.classList.add('sea-live');
}

function setupToggle(layer: HTMLElement): void {
  const button = document.querySelector<HTMLButtonElement>('[data-sea-toggle]');
  if (!button) return;
  const label = button.querySelector('[data-sea-toggle-label]');
  const sync = (calm: boolean) => {
    button.setAttribute('aria-pressed', String(calm));
    if (label)
      label.textContent = calm ? (button.dataset['back'] ?? '') : (button.dataset['calm'] ?? '');
  };
  sync(readSignals().calm);
  button.addEventListener('click', () => {
    const calm = button.getAttribute('aria-pressed') !== 'true';
    remember.calm(calm);
    sync(calm);
    void apply(decideTier(readSignals()), layer);
  });
}

function start(): void {
  const layer = document.querySelector<HTMLElement>('[data-sea-backdrop]');
  const hero = document.querySelector<HTMLElement>('[data-sea-layer]')?.closest('section');
  if (!layer || !hero) return;
  setupToggle(layer);

  // The sea is only seen through the hero and the sky bands: render only while one is on screen.
  const windows = [hero, ...document.querySelectorAll<HTMLElement>('[data-sky-band]')];
  const onScreen = new Set<Element>();
  const update = () => setPaused(onScreen.size === 0 || document.hidden);
  new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) onScreen.add(entry.target);
      else onScreen.delete(entry.target);
    }
    update();
  }).observe(hero);
  const bandObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) onScreen.add(entry.target);
      else onScreen.delete(entry.target);
    }
    update();
  });
  for (const el of windows.slice(1)) bandObserver.observe(el);
  document.addEventListener('visibilitychange', update);

  startDayNight((p) => {
    hour = p;
    current?.setProgress?.(p);
  });

  void apply(decideTier(readSignals()), layer);

  // Free the GPU when leaving the page (also before a view-transition swap, #19).
  const teardown = () => {
    generation++;
    current?.destroy();
    current = null;
  };
  addEventListener('pagehide', teardown);
  document.addEventListener('astro:before-swap', teardown);
}

// After first paint and once the page is idle, so the sea never competes with the hero text.
function whenIdle(fn: () => void): void {
  const idle = () =>
    'requestIdleCallback' in window
      ? requestIdleCallback(fn, { timeout: 1500 })
      : setTimeout(fn, 200);
  if (document.readyState === 'complete') idle();
  else addEventListener('load', idle, { once: true });
}

whenIdle(start);
