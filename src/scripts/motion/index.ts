/**
 * Motion layer (#20). Loaded after first paint and idle, only without prefers-reduced-motion;
 * switching reduced motion on mid-visit tears everything down. The sea has its own scripts.
 * Scroll-linked media parallax is pure CSS (scroll-driven animations, Motion.astro).
 */
import { initBend } from './bend';
import { initCount } from './count';
import { initMagnetic } from './magnetic';
import { initReveal } from './reveal';
import { initSmoothScroll } from './smooth-scroll';

export function startMotion(): () => void {
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const stops = [initReveal(), initCount(), initBend()];
  if (fine) stops.push(initSmoothScroll(), initMagnetic());
  document.documentElement.classList.add('motion-on');
  return () => {
    for (const stop of stops) stop();
    document.documentElement.classList.remove('motion-on');
  };
}
