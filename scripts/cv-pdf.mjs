// Prints the /cv page to public/cv/kirill-jegosin-cv.pdf (one A4 page, selectable text).
// Usage: npm run cv   (builds the site first). Port: CV_PORT (default 4620).
// Fails if the CV does not fit on one page or the PDF is over 300 KB.
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { existsSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { chromium } from '@playwright/test';

const PORT = Number(process.env.CV_PORT ?? 4620);
const OUT = 'public/cv/kirill-jegosin-cv.pdf';
const MAX_BYTES = 300 * 1024;

// A tiny static server for dist/ (build format 'file': /cv → dist/cv.html), so this works
// next to a running `astro preview` (which allows only one instance per project).
const TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.woff2': 'font/woff2',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
};
const server = createServer((req, res) => {
  if (req.url?.includes('..')) return void res.writeHead(400).end();
  const path = normalize(decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname)).replace(
    /^[/\\]+/,
    '',
  );
  const candidates = [
    join('dist', path),
    join('dist', `${path}.html`),
    join('dist', path, 'index.html'),
  ];
  const file = candidates.find((c) => existsSync(c) && statSync(c).isFile());
  if (!file) return void res.writeHead(404).end();
  res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
  res.end(readFileSync(file));
});
await new Promise((resolve) => server.listen(PORT, resolve));

let failed = false;
try {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(`http://localhost:${PORT}/cv`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.emulateMedia({ media: 'print' });

  // Content must fit the sheet: nothing cut off by the one-page print rule.
  const overflow = await page.evaluate(() => {
    const sheet = document.querySelector('.sheet');
    return sheet ? sheet.scrollHeight - sheet.clientHeight : -1;
  });
  if (overflow > 0) throw new Error(`CV is ${overflow}px taller than one A4 page`);

  mkdirSync('public/cv', { recursive: true });
  await page.pdf({ path: OUT, preferCSSPageSize: true, printBackground: true });
  await browser.close();

  const bytes = statSync(OUT).size;
  const pages = (readFileSync(OUT, 'latin1').match(/\/Type\s*\/Page[^s]/g) ?? []).length;
  console.log(`${OUT}: ${(bytes / 1024).toFixed(0)} KB, ${pages} page(s)`);
  if (pages !== 1) throw new Error(`expected 1 page, got ${pages}`);
  if (bytes > MAX_BYTES) throw new Error(`PDF is over ${MAX_BYTES / 1024} KB`);
} catch (error) {
  failed = true;
  console.error(error instanceof Error ? error.message : error);
} finally {
  server.close();
}
process.exit(failed ? 1 : 0);
