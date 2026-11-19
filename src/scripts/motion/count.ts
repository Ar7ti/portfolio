/**
 * Big figures count up (#20): "223", "2.6M", "36", "1.1" run from 0 to their value on a spring
 * when they come on screen; words ("Won", "3rd", "Live") rise from a mask instead.
 * Only figures below the fold at load. The real text never changes: it stays in place
 * (transparent) for layout, screen readers and the facts check, and an aria-hidden overlay
 * shows the counting digits on top of it.
 */
import { loop, Spring } from './spring';

const NUMBER = /^(\d+(?:\.\d+)?)(.*)$/;

interface Figure {
  el: HTMLElement;
  run: () => void;
  reset: () => void;
}

function prepare(el: HTMLElement): Figure {
  const text = el.textContent?.trim() ?? '';
  const match = NUMBER.exec(text);
  if (!match?.[1]) {
    el.classList.add('count-word');
    return {
      el,
      run: () => el.classList.add('count-in'),
      reset: () => el.classList.remove('count-word', 'count-in'),
    };
  }
  const target = Number(match[1]);
  const decimals = match[1].split('.')[1]?.length ?? 0;
  const suffix = match[2] ?? '';
  const overlay = document.createElement('span');
  overlay.className = 'count-overlay';
  overlay.setAttribute('aria-hidden', 'true');
  overlay.textContent = `${(0).toFixed(decimals)}${suffix}`;
  el.style.setProperty('--count-color', getComputedStyle(el).color);
  el.classList.add('count-run');
  el.append(overlay);
  let stop: (() => void) | null = null;
  const reset = () => {
    stop?.();
    overlay.remove();
    el.classList.remove('count-run');
    el.style.removeProperty('--count-color');
  };
  return {
    el,
    reset,
    run: () => {
      const spring = new Spring(0, { stiffness: 55, damping: 13 });
      spring.target = 1;
      stop = loop((dt) => {
        const moving = spring.step(dt);
        overlay.textContent = `${(Math.min(spring.value, 1) * target).toFixed(decimals)}${suffix}`;
        if (!moving) reset();
        return moving;
      });
    },
  };
}

export function initCount(): () => void {
  const fold = innerHeight;
  const figures = [...document.querySelectorAll<HTMLElement>('main .big')]
    .filter((el) => el.getBoundingClientRect().top > fold)
    .map(prepare);
  const byEl = new Map(figures.map((f) => [f.el as Element, f]));
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        io.unobserve(e.target);
        byEl.get(e.target)?.run();
      }
    },
    { rootMargin: '0px 0px -12% 0px' },
  );
  for (const f of figures) io.observe(f.el);
  const showAll = () => figures.forEach((f) => f.reset());
  addEventListener('hashchange', showAll);
  return () => {
    io.disconnect();
    removeEventListener('hashchange', showAll);
    for (const f of figures) f.reset();
  };
}
