/**
 * Headline mask reveals (#20): section and case headings that are below the fold at load slide
 * up from behind a mask when they come on screen, with the spring easing. The hero H1 (LCP)
 * and anything visible at load are never hidden; without JS nothing is.
 */
const SELECTOR = 'main h2.h2, main h2.h2-long, main h2.h2-sec, main h2.h2-xl';

export function initReveal(): () => void {
  const fold = innerHeight;
  const heads = [...document.querySelectorAll<HTMLElement>(SELECTOR)].filter(
    (el) => el.getBoundingClientRect().top > fold,
  );
  for (const el of heads) el.classList.add('motion-mask');
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add('motion-in');
        io.unobserve(e.target);
      }
    },
    { rootMargin: '0px 0px -8% 0px' },
  );
  for (const el of heads) io.observe(el);
  // Jumps (skip link, nav anchors) must never land on a hidden heading.
  const showAll = () => heads.forEach((el) => el.classList.add('motion-in'));
  addEventListener('hashchange', showAll);
  return () => {
    io.disconnect();
    removeEventListener('hashchange', showAll);
    for (const el of heads) el.classList.remove('motion-mask', 'motion-in');
  };
}
