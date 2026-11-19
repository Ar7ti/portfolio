// @ts-check
import { defineConfig } from 'astro/config';

// `site` (canonical URL) is set in the deploy issue (#6), once the production URL is known.
export default defineConfig({
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
