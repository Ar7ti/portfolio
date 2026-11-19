/**
 * Headline mask reveals (#20): each word of a section/case heading rises from behind its own
 * mask, staggered, on the spring easing, when the heading comes on screen. Only headings below
 * the fold at load (never the hero H1, the LCP); text stays fully opaque (contrast is never
 * reduced); hash jumps reveal everything; teardown restores the original markup.
 */
const SELECTOR = 'main h2.h2, main h2.h2-long, main h2.h2-sec, main h2.h2-xl';

/** Wraps every word of the element's text nodes: <span class="w"><span class="wi">word</span></span>. */
function splitWords(el: HTMLElement): void {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) nodes.push(n as Text);
  let index = 0;
  for (const node of nodes) {
    const parts = (node.textContent ?? '').split(/(\s+)/);
    const frag = document.createDocumentFragment();
    for (const part of parts) {
      if (!part) continue;
      if (/^\s+$/.test(part)) {
        frag.append(part);
        continue;
      }
      const outer = document.createElement('span');
      outer.className = 'w';
      const inner = document.createElement('span');
      inner.className = 'wi';
      inner.style.setProperty('--i', String(index++));
      inner.textContent = part;
      outer.append(inner);
      frag.append(outer);
    }
    node.replaceWith(frag);
  }
}

export function initReveal(): () => void {
  const fold = innerHeight;
  const heads = [...document.querySelectorAll<HTMLElement>(SELECTOR)].filter(
    (el) => el.getBoundingClientRect().top > fold,
  );
  const original = new Map(heads.map((el) => [el, el.innerHTML]));
  for (const el of heads) {
    splitWords(el);
    el.classList.add('motion-mask');
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add('motion-in');
        io.unobserve(e.target);
      }
    },
    { rootMargin: '0px 0px -10% 0px' },
  );
  for (const el of heads) io.observe(el);
  const showAll = () => heads.forEach((el) => el.classList.add('motion-in'));
  addEventListener('hashchange', showAll);
  return () => {
    io.disconnect();
    removeEventListener('hashchange', showAll);
    for (const [el, html] of original) {
      el.innerHTML = html;
      el.classList.remove('motion-mask', 'motion-in');
    }
  };
}
