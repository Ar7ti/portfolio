/**
 * Lenis smooth scrolling for the mouse wheel only (#20). Touch, keyboard (arrows, Page/Space,
 * Home/End), anchors, the skip link and scrollIntoView stay native: Lenis follows the real
 * scroll position, so nothing is blocked. Inner scrollers can opt out with data-lenis-prevent.
 */
import Lenis from 'lenis';

export function initSmoothScroll(): () => void {
  const lenis = new Lenis({ smoothWheel: true, syncTouch: false, lerp: 0.12, anchors: false });
  let id = requestAnimationFrame(function raf(time) {
    lenis.raf(time);
    id = requestAnimationFrame(raf);
  });
  // Native jumps win: an anchor click, a key press or a hash change cancels any wheel glide,
  // so Lenis never pulls the page back to an old target.
  const settle = () => {
    lenis.stop();
    lenis.start();
  };
  const onClick = (e: MouseEvent) => {
    if ((e.target as Element | null)?.closest?.('a[href*="#"]')) settle();
  };
  addEventListener('click', onClick, { capture: true });
  addEventListener('keydown', settle, { capture: true });
  addEventListener('hashchange', settle);
  return () => {
    removeEventListener('click', onClick, { capture: true });
    removeEventListener('keydown', settle, { capture: true });
    removeEventListener('hashchange', settle);
    cancelAnimationFrame(id);
    lenis.destroy();
  };
}
