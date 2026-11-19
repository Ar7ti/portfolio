import type { APIRoute } from 'astro';
import { cases } from '../lib/cases';
import { data } from '../lib/content';

/**
 * sitemap.xml (#23): the home page and every case page. Noindex pages (styleguide, cv, 404)
 * stay out. lastmod = the site's "numbers checked" date.
 */
export const GET: APIRoute = async ({ site }) => {
  const checked = (await data('site', 'site')).footer.checkedOn.toISOString().slice(0, 10);
  const paths = ['/', ...(await cases()).map((c) => `/work/${c.slug}`)];
  const urls = paths
    .map((p) => `  <url><loc>${new URL(p, site).href}</loc><lastmod>${checked}</lastmod></url>`)
    .join('\n');
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    { headers: { 'content-type': 'application/xml; charset=utf-8' } },
  );
};
