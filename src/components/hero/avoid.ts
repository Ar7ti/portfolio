/**
 * The hero text the island must never cover (on any tier). Boxes are in page pixels at
 * scroll 0: the ink of the label, headline and line (text rects, not their wider blocks), plus
 * every chip, contact button and link and the sea toggle.
 */
export function heroBoxes(): DOMRect[] {
  const hero = document.querySelector('.hero');
  if (!hero) return [];
  const boxes: DOMRect[] = [];
  const add = (r: DOMRect) => {
    if (r.width && r.height) boxes.push(new DOMRect(r.left, r.top + scrollY, r.width, r.height));
  };
  const range = document.createRange();
  for (const el of hero.querySelectorAll('.hero-label, .hero-title, .hero-line')) {
    range.selectNodeContents(el);
    for (const r of range.getClientRects()) add(r);
  }
  for (const el of hero.querySelectorAll(
    '.hero-stack, .chips > li, .contact-row a, .contact-row button, .sea-toggle',
  ))
    add(el.getBoundingClientRect());
  return boxes;
}

/** Air kept between the island and any text box, in CSS pixels. */
export const ISLAND_GAP = 28;

/** True when `box` keeps `gap` (default ISLAND_GAP) from every box in `boxes`. */
export function isClear(box: DOMRect, boxes: readonly DOMRect[], gap = ISLAND_GAP): boolean {
  return boxes.every(
    (t) =>
      box.right <= t.left - gap ||
      box.left >= t.right + gap ||
      box.bottom <= t.top - gap ||
      box.top >= t.bottom + gap,
  );
}
