/**
 * Ink drip (prototype B, concepts/b-realistic-receipts.html), lightweight version:
 * hovering or focusing a receipt mark pulls a strand of receipts-green ink from the claim to its
 * receipt. A head drop springs to the target, a lagging middle point makes the strand sag like a
 * liquid neck, and a "gooey" SVG filter (blur + alpha threshold) melts drops and strand together.
 *
 * Desktop enhancement only: the caller loads this on first hover/focus of a mark, and only for
 * fine pointers without reduced motion. Purely decorative (aria-hidden, pointer-events: none).
 */
const SVG = 'http://www.w3.org/2000/svg';

interface Body {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface Parts {
  svg: SVGSVGElement;
  neck: SVGPathElement;
  head: SVGCircleElement;
  source: SVGCircleElement;
}

let parts: Parts | null = null;
const head: Body = { x: 0, y: 0, vx: 0, vy: 0 };
const mid: Body = { x: 0, y: 0, vx: 0, vy: 0 };
let from = { x: 0, y: 0 };
let to = { x: 0, y: 0 };
let size = 0; // 0 → 1: how much ink is out
let active = false;
let frame = 0;
let last = 0;
let target: HTMLElement | null = null;

function makeParts(): Parts {
  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('class', 'ink-drip');
  Object.assign(svg.style, {
    position: 'fixed',
    inset: '0',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    zIndex: '40',
  });
  svg.innerHTML = `<defs><filter id="ink-goo" x="-50%" y="-50%" width="200%" height="200%">
    <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="b"/>
    <feColorMatrix in="b" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -8"/>
  </filter></defs>
  <g filter="url(#ink-goo)" fill="#c8f560" stroke="#c8f560" stroke-linecap="round">
    <path fill="none" stroke-width="0"/><circle r="0"/><circle r="0"/>
  </g>`;
  document.body.append(svg);
  const neck = svg.querySelector('path');
  const [headEl, sourceEl] = svg.querySelectorAll('circle');
  if (!neck || !headEl || !sourceEl) throw new Error('ink layer');
  return { svg, neck, head: headEl, source: sourceEl };
}

/** The ink wells out from under the mark, so the mark's text stays readable. */
const underneath = (el: Element) => {
  const r = el.getBoundingClientRect();
  return { x: r.left + Math.min(16, r.width / 2), y: r.bottom + 2 };
};

/** Where the ink lands: the receipt if its list is open, else the list's summary. Off screen: the edge. */
function landing(mark: HTMLAnchorElement) {
  const id = decodeURIComponent(mark.hash.slice(1));
  const receipt = id ? document.getElementById(id) : null;
  if (!receipt) return null;
  const details = receipt.closest('details');
  const anchor = details && !details.open ? details.querySelector('summary') : receipt;
  if (!anchor) return null;
  const r = anchor.getBoundingClientRect();
  return {
    receipt,
    point: {
      x: Math.min(Math.max(r.left + 18, 12), innerWidth - 12),
      y: Math.min(Math.max(r.top + r.height / 2, 12), innerHeight - 12),
    },
  };
}

function spring(b: Body, tx: number, ty: number, stiff: number, damp: number, dt: number) {
  b.vx += ((tx - b.x) * stiff - b.vx * damp) * dt;
  b.vy += ((ty - b.y) * stiff - b.vy * damp) * dt;
  b.x += b.vx * dt;
  b.y += b.vy * dt;
}

function tick(now: number) {
  if (!parts) return;
  const dt = Math.min((now - last) / 1000, 1 / 30);
  last = now;

  const goal = active ? to : from;
  spring(head, goal.x, goal.y, active ? 38 : 90, active ? 9 : 14, dt);
  // The middle of the strand lags behind and sags: that's what makes it read as liquid.
  const sag = Math.min(120, Math.hypot(head.x - from.x, head.y - from.y) * 0.18);
  spring(mid, (from.x + head.x) / 2, (from.y + head.y) / 2 + sag, 22, 7, dt);
  size += ((active ? 1 : 0) - size) * Math.min(1, dt * (active ? 6 : 10));

  const wobble = 1 + 0.08 * Math.sin(now / 140);
  parts.neck.setAttribute(
    'd',
    `M${from.x.toFixed(1)} ${from.y.toFixed(1)} Q${mid.x.toFixed(1)} ${mid.y.toFixed(1)} ${head.x.toFixed(1)} ${head.y.toFixed(1)}`,
  );
  parts.neck.setAttribute('stroke-width', Math.max(0, 9 * size).toFixed(2));
  parts.head.setAttribute('cx', head.x.toFixed(1));
  parts.head.setAttribute('cy', head.y.toFixed(1));
  parts.head.setAttribute('r', Math.max(0, 12 * size * wobble).toFixed(2));
  parts.source.setAttribute('cx', from.x.toFixed(1));
  parts.source.setAttribute('cy', from.y.toFixed(1));
  parts.source.setAttribute('r', Math.max(0, 5 * size).toFixed(2));

  if (active && target && Math.hypot(head.x - to.x, head.y - to.y) < 14) {
    target.classList.add('is-dripped');
  }
  const settled = !active && size < 0.01 && Math.abs(head.vx) + Math.abs(head.vy) < 1;
  frame = settled ? 0 : requestAnimationFrame(tick);
}

function run() {
  if (!frame) {
    last = performance.now();
    frame = requestAnimationFrame(tick);
  }
}

function start(mark: HTMLAnchorElement) {
  const land = landing(mark);
  if (!land) return;
  parts ??= makeParts();
  from = underneath(mark);
  to = land.point;
  if (size < 0.05) {
    Object.assign(head, { x: from.x, y: from.y, vx: 0, vy: 0 });
    Object.assign(mid, { x: from.x, y: from.y, vx: 0, vy: 0 });
  }
  target?.classList.remove('is-dripped');
  target = land.receipt;
  active = true;
  run();
}

function stop() {
  active = false;
  target?.classList.remove('is-dripped');
  run();
}

const markOf = (event: Event) =>
  (event.target as Element | null)?.closest?.<HTMLAnchorElement>('a[data-receipt-mark]') ?? null;

export function initInkDrip() {
  addEventListener('pointerover', (e) => {
    const mark = markOf(e);
    if (mark) start(mark);
  });
  addEventListener('pointerout', (e) => {
    if (markOf(e)) stop();
  });
  addEventListener('focusin', (e) => {
    const mark = markOf(e);
    if (mark) start(mark);
  });
  addEventListener('focusout', (e) => {
    if (markOf(e)) stop();
  });
  addEventListener('scroll', () => active && stop(), { passive: true });
  // The hover/focus that loaded this module should drip right away.
  const current = document.querySelector<HTMLAnchorElement>(
    'a[data-receipt-mark]:hover, a[data-receipt-mark]:focus',
  );
  if (current) start(current);
}
