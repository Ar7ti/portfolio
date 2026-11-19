// Renders public/og.jpg (1200×630: day sea + name + line) and the PNG favicons from
// public/favicon.svg. Self-contained HTML with the site's fonts and the hero's day-sea still,
// copy from src/content/site.yaml. Usage: npm run og
import { readFileSync, statSync } from 'node:fs';
import { chromium } from '@playwright/test';
import { parse } from 'yaml';

const site = parse(readFileSync('src/content/site.yaml', 'utf8')).site;
const dataUri = (file, type) => `data:${type};base64,${readFileSync(file).toString('base64')}`;
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

const anybody = dataUri('src/assets/fonts/anybody.woff2', 'font/woff2');
const grotesk = dataUri('public/fonts/schibsted-grotesk.woff2', 'font/woff2');
const mono = dataUri('public/fonts/martian-mono.woff2', 'font/woff2');
const sea = dataUri('src/assets/hero/sea-day.webp', 'image/webp');
const won = site.hero.chips[0];

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: Anybody; src: url(${anybody}) format('woff2'); font-weight: 600 900; font-stretch: 100% 125%; }
@font-face { font-family: Grotesk; src: url(${grotesk}) format('woff2'); font-weight: 400 800; }
@font-face { font-family: Mono; src: url(${mono}) format('woff2'); font-weight: 400 500; }
* { box-sizing: border-box; margin: 0; }
body { width: 1200px; height: 630px; overflow: hidden; font-family: Grotesk, sans-serif; color: #0b2233;
  background: #cfe4ef url(${sea}) right bottom / cover no-repeat; }
.wash { position: absolute; inset: 0; background: linear-gradient(100deg, #e7f1f6 0%, rgb(231 241 246 / .92) 42%, rgb(231 241 246 / .15) 72%, transparent); }
.text { position: absolute; left: 72px; top: 76px; }
.label { font-family: Mono, monospace; font-size: 22px; font-weight: 500; letter-spacing: .06em; text-transform: uppercase; color: #4b6476; }
h1 { margin-top: 22px; font-family: Anybody, sans-serif; font-weight: 850; font-stretch: 112%; font-size: 84px; line-height: .94; color: #0e3b57; white-space: nowrap; }
.chip { position: absolute; left: 72px; bottom: 70px; display: flex; align-items: baseline; gap: 18px; }
.big { font-family: Anybody, sans-serif; font-weight: 900; font-stretch: 118%; font-size: 64px; line-height: 1; color: #1a8f62; }
.chip-label { font-size: 30px; font-weight: 700; color: #0e3b57; background: linear-gradient(transparent 62%, #ffc933 62%); }
</style></head><body><div class="wash"></div>
<div class="text"><p class="label">${esc(site.og.title)}</p><h1>${site.hero.h1.map(esc).join('<br>')}</h1></div>
<div class="chip"><span class="big">${esc(won.value)}</span><span class="chip-label">${esc(won.label)}</span></div>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: 'public/og.jpg', type: 'jpeg', quality: 86 });

const svg = readFileSync('public/favicon.svg', 'utf8');
for (const [size, out] of [
  [32, 'public/favicon-32.png'],
  [180, 'public/apple-touch-icon.png'],
]) {
  const icon = await browser.newPage({ viewport: { width: size, height: size } });
  await icon.setContent(
    `<style>*{margin:0}body{width:${size}px;height:${size}px}svg{width:100%;height:100%;display:block}</style>${svg}`,
  );
  await icon.screenshot({ path: out, omitBackground: true });
}
await browser.close();
for (const f of ['public/og.jpg', 'public/favicon-32.png', 'public/apple-touch-icon.png']) {
  console.log(`${f}: ${(statSync(f).size / 1024).toFixed(0)} KB`);
}
