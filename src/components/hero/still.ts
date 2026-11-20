/**
 * Draws the static day sea (the hidden <img> chosen by <picture>: AVIF/WebP, right width)
 * into the hero canvas with `object-fit: cover; object-position: 64% 100%`, and redraws on resize.
 * A canvas is never an LCP candidate, so the H1 stays the LCP element.
 * The image is decoded off the main thread (createImageBitmap) so drawing never blocks input.
 *
 * The island is a separate sprite (scripts/hero-still.mjs) drawn on top: from its home spot in
 * the render it steps right, and if the right edge runs out, up towards the horizon and a
 * little smaller (further away), until it is clear of the hero text, like the live sea does.
 */
import placement from '../../assets/hero/sea-island.json';
import { heroBoxes, isClear } from './avoid';

const POSITION_X = 0.64;
const POSITION_Y = 1;

type Source = CanvasImageSource & { width: number; height: number };

function size(source: Source): [number, number] {
  return source instanceof HTMLImageElement
    ? [source.naturalWidth, source.naturalHeight]
    : [source.width, source.height];
}

async function decode(img: HTMLImageElement): Promise<Source> {
  if (!img.complete || !img.naturalWidth)
    await new Promise((resolve) => img.addEventListener('load', resolve, { once: true }));
  try {
    return await createImageBitmap(img);
  } catch {
    return img; // Older browsers: draw the <img> directly.
  }
}

export function mountStill(): void {
  const canvas = document.querySelector<HTMLCanvasElement>('[data-sea-still-canvas]');
  const layer = canvas?.parentElement;
  const img = layer?.querySelector<HTMLImageElement>('.hero-sea-still img, img.hero-sea-still');
  const islandImg = layer?.querySelector<HTMLImageElement>('img.hero-sea-island');
  if (!canvas || !layer || !img) return;

  let sea: Source | null = null;
  let island: Source | null = null;

  /** Island box in CSS pixels of the canvas, clear of the hero text when possible. */
  /**
   * Phones: the text fills the width, so look for the nearest free spot below the horizon at
   * 70–40 % of the size (further away), with less air. None free: no island (never over text).
   */
  function placePortrait(
    home: DOMRect,
    boxes: DOMRect[],
    box: DOMRect,
    horizon: number,
  ): DOMRect | null {
    const cx = home.x + home.width / 2;
    const cy = home.y + home.height / 2;
    let best: DOMRect | null = null;
    let bestCost = Infinity;
    // Coarse grid (14 px, three sizes): this runs on the main thread at load on phones.
    for (let f = 0.7; f >= 0.4; f -= 0.15) {
      const w = home.width * f;
      const h = home.height * f;
      for (let y0 = Math.max(horizon, 0); y0 + h <= box.height; y0 += 14) {
        for (let x0 = 12; x0 + w <= box.width - 12; x0 += 14) {
          const c = new DOMRect(x0, y0, w, h);
          const cost = Math.hypot(x0 + w / 2 - cx, y0 + h / 2 - cy) + (0.7 - f) * 200;
          if (cost < bestCost && isClear(c, boxes, 10)) {
            best = c;
            bestCost = cost;
          }
        }
      }
    }
    return best;
  }

  function placeIsland(scale: number, ox: number, oy: number, box: DOMRect): DOMRect | null {
    const { x, y, width, height } = placement.island;
    const home = new DOMRect(ox + x * scale, oy + y * scale, width * scale, height * scale);
    // Text boxes are page pixels at scroll 0; the canvas starts at the hero's top.
    const top = box.top + scrollY;
    const boxes = heroBoxes().map(
      (b) => new DOMRect(b.left - box.left, b.top - top, b.width, b.height),
    );
    if (!boxes.length) return home;
    if (box.width < box.height) {
      // The still's horizon sits about a third of the way down the image.
      return placePortrait(home, boxes, box, oy + 0.36 * placement.image.height * scale);
    }
    for (let k = 0; k <= 12; k++) {
      const f = 1 - 0.03 * k;
      const w = home.width * f;
      const h = home.height * f;
      const y0 = home.bottom - h - k * 0.008 * placement.image.height * scale;
      for (let x0 = home.left + (home.width - w) / 2; x0 + w <= box.width - 16; x0 += 4) {
        const candidate = new DOMRect(x0, y0, w, h);
        if (isClear(candidate, boxes)) return candidate;
      }
    }
    return home;
  }

  /** Last drawn size + island spot: resize, fonts and the first observer callback often change nothing. */
  let drawn = '';
  const draw = () => {
    if (!sea) return;
    const box = canvas.getBoundingClientRect();
    const [width, height] = size(sea);
    if (!box.width || !box.height || !width) return;
    // Cover, in CSS pixels; `scale` maps still pixels to CSS pixels.
    const scale = Math.max(box.width / width, box.height / height);
    const ox = (box.width - width * scale) * POSITION_X;
    const oy = (box.height - height * scale) * POSITION_Y;
    const spot = island ? placeIsland(scale * (width / placement.image.width), ox, oy, box) : null;
    const key = [box.width, box.height, spot?.x, spot?.y, spot?.width]
      .map((v) => (v ?? 0).toFixed(1))
      .join();
    if (key === drawn) return;
    drawn = key;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(box.width * dpr);
    canvas.height = Math.round(box.height * dpr);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(sea, ox * dpr, oy * dpr, width * scale * dpr, height * scale * dpr);
    if (island) {
      if (spot) {
        ctx.drawImage(island, spot.x * dpr, spot.y * dpr, spot.width * dpr, spot.height * dpr);
      }
      canvas.dataset['island'] = spot
        ? [spot.left, spot.top, spot.right, spot.bottom].map(Math.round).join(',')
        : 'none';
    }
    canvas.classList.add('is-ready');
  };

  const start = async () => {
    [sea, island] = await Promise.all([decode(img), islandImg ? decode(islandImg) : null]);
    draw();
    new ResizeObserver(draw).observe(canvas);
    // The hero text can still move once its fonts are in.
    void document.fonts?.ready.then(draw);
  };
  void start();
}
