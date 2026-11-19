// @ts-check
import { defineConfig } from 'astro/config';

// `site` (canonical URL) is set in the deploy issue (#6), once the production URL is known.
export default defineConfig({
  output: 'static',
  trailingSlash: 'never',
  build: { format: 'file' },
});
