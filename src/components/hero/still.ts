/**
 * Draws the static day sea (the hidden <img> chosen by <picture>: AVIF/WebP, right width)
 * into the hero canvas with `object-fit: cover; object-position: 64% 100%`, and redraws on resize.
 * A canvas is never an LCP candidate, so the H1 stays the LCP element.
 */
const POSITION_X = 0.64;
const POSITION_Y = 1;

export function mountStill(): void {
  const canvas = document.querySelector<HTMLCanvasElement>('[data-sea-still-canvas]');
  const img = canvas?.parentElement?.querySelector('img');
  if (!canvas || !img) return;

  const draw = () => {
    const box = canvas.getBoundingClientRect();
    if (!box.width || !box.height || !img.naturalWidth) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(box.width * dpr);
    canvas.height = Math.round(box.height * dpr);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const scale = Math.max(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, (canvas.width - w) * POSITION_X, (canvas.height - h) * POSITION_Y, w, h);
    canvas.classList.add('is-ready');
  };

  const start = () => {
    draw();
    new ResizeObserver(draw).observe(canvas);
  };

  if (img.complete && img.naturalWidth) start();
  else img.addEventListener('load', start, { once: true });
}
