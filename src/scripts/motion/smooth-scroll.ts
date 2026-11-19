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
  return () => {
    cancelAnimationFrame(id);
    lenis.destroy();
  };
}
