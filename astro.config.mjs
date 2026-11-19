// @ts-check
import { defineConfig } from 'astro/config';

// Canonical URL for canonical links, Open Graph and the sitemap (#23). Production runs on the
// free workers.dev URL of the `portfolio` worker until a custom domain is chosen; override with SITE_URL.
const SITE = process.env.SITE_URL ?? 'https://portfolio.kirills-portfolio.workers.dev';

export default defineConfig({
  site: SITE,
  output: 'static',
  trailingSlash: 'never',
  // CSS is small; inlining it removes the only render-blocking request before the hero text.
  build: { format: 'file', inlineStylesheets: 'always' },
  vite: {
    build: {
      // Inline the hero font (≈31 KB) as a data URI; everything else uses the default limit.
      assetsInlineLimit: (file) => (file.endsWith('anybody.woff2') ? true : undefined),
    },
  },
});
