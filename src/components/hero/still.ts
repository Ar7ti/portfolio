/**
 * Draws the static day sea (the hidden <img> chosen by <picture>: AVIF/WebP, right width)
 * into the hero canvas with `object-fit: cover; object-position: 64% 100%`, and redraws on resize.
 * A canvas is never an LCP candidate, so the H1 stays the LCP element.
 * The image is decoded off the main thread (createImageBitmap) so drawing never blocks input.
 */
const POSITION_X = 0.64;
const POSITION_Y = 1;

export function mountStill(): void {
  const canvas = document.querySelector<HTMLCanvasElement>('[data-sea-still-canvas]');
  const img = canvas?.parentElement?.querySelector('img');
  if (!canvas || !img) return;

  let source: CanvasImageSource & { width: number; height: number } = img;

  const draw = () => {
    const box = canvas.getBoundingClientRect();
    const width = source instanceof HTMLImageElement ? source.naturalWidth : source.width;
    const height = source instanceof HTMLImageElement ? source.naturalHeight : source.height;
    if (!box.width || !box.height || !width) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(box.width * dpr);
    canvas.height = Math.round(box.height * dpr);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const scale = Math.max(canvas.width / width, canvas.height / height);
    const w = width * scale;
    const h = height * scale;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(source, (canvas.width - w) * POSITION_X, (canvas.height - h) * POSITION_Y, w, h);
    canvas.classList.add('is-ready');
  };

  const start = async () => {
    try {
      source = await createImageBitmap(img);
    } catch {
      // Older browsers: draw the <img> directly.
    }
    draw();
    new ResizeObserver(draw).observe(canvas);
  };

  if (img.complete && img.naturalWidth) void start();
  else img.addEventListener('load', () => void start(), { once: true });
}
