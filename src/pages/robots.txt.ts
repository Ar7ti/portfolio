import type { APIRoute } from 'astro';

/** robots.txt (#23): everything public is crawlable; the sitemap lists the indexable pages. */
export const GET: APIRoute = ({ site }) => {
  const sitemap = new URL('/sitemap.xml', site).href;
  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${sitemap}\n`, {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
};
