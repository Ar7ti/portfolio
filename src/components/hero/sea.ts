/**
 * Picks the sea tier after first paint and mounts the matching renderer into the hero's
 * sea layer. Tier 0 keeps the static still that is already there.
 */
import {
  decideTier,
  isTooSlow,
  readSignals,
  remember,
  SLOW_SAMPLE_FRAMES,
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

function setPaused(next: boolean): void {
  paused = next;
  current?.setPaused(next);
}

async function apply(tier: Tier, layer: HTMLElement): Promise<void> {
  const run = ++generation;
  current?.destroy();
  current = null;
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
  const forced = readSignals().override !== null;
  const renderer = factory({
    onFrame: (ms) => {
      // A forced ?tier= is for testing: never downgrade it.
      if (tier !== 2 || forced || frames.length >= SLOW_SAMPLE_FRAMES) return;
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
    if (run === generation) root.dataset['seaTier'] = '0';
    console.warn('Sea renderer failed, keeping the still.', error);
    return;
  }
  if (run !== generation) {
    renderer.destroy();
    return;
  }
  current = renderer;
  renderer.setPaused(paused);
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
  const layer = document.querySelector<HTMLElement>('[data-sea-layer]');
  if (!layer) return;
  setupToggle(layer);

  const hero = layer.closest('section') ?? layer;
  let visible = true;
  new IntersectionObserver(([entry]) => {
    visible = entry?.isIntersecting ?? true;
    setPaused(!visible || document.hidden);
  }).observe(hero);
  document.addEventListener('visibilitychange', () => setPaused(!visible || document.hidden));

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
