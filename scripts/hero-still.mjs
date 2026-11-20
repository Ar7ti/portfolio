/**
 * Renders the static hero still from the production tier-2 scene (src/lib/sea/sea3d.ts):
 *   src/assets/hero/sea-day.webp     the sea without the island, 2400×1500
 *   src/assets/hero/sea-island.webp  the island alone, transparent background
 *   src/assets/hero/sea-island.json  where the island sits in the sea image (image pixels)
 * The island is a separate sprite so tier 0 (still.ts) can move it clear of the hero text,
 * like the live sea does. Needs a GPU-capable Chrome; starts and stops its own dev server.
 *
 *   npm run still
 */
import { spawn } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import sharp from 'sharp';

const PORT = 4799;
const BASE = `http://localhost:${PORT}/`;
const OUT = new URL('../src/assets/hero/', import.meta.url);
// 1280×800 at DPR 1.875 = 2400×1500 device pixels, the size of the old still.
const VIEWPORT = { width: 1280, height: 800 };
const DPR = 1.875;

const server = spawn('npx', ['astro', 'dev', '--port', String(PORT)], {
  shell: true,
  stdio: 'ignore',
});
const stop = () => {
  if (process.platform === 'win32') spawn('taskkill', ['/pid', String(server.pid), '/t', '/f']);
  else server.kill();
};

async function waitForServer() {
  for (let i = 0; i < 120; i++) {
    try {
      if ((await fetch(BASE)).ok) return;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('dev server did not start');
}

async function render(browser, mode) {
  const page = await browser.newPage({ viewport: VIEWPORT, deviceScaleFactor: DPR });
  await page.goto(`${BASE}?tier=2&still=${mode}`);
  await page.waitForSelector('canvas.hero-sea-live.is-ready', { timeout: 60_000 });
  // Only the sea canvas: hide the page around it.
  await page.addStyleTag({
    content: `*{visibility:hidden!important;transition:none!important}
      .sea-backdrop,.sea-backdrop *{visibility:visible!important}
      html,body{background:transparent!important}`,
  });
  await page.waitForTimeout(800);
  const canvas = page.locator('canvas.hero-sea-live');
  const png = await canvas.screenshot();
  const box = await canvas.getAttribute('data-island');
  await page.close();
  return { png, box: box?.split(',').map(Number) };
}

try {
  await waitForServer();
  const browser = await chromium.launch({
    channel: 'chrome',
    args: ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-gpu'],
  });
  const sea = await render(browser, 'sea');
  await sharp(sea.png)
    .webp({ quality: 82 })
    .toFile(fileURLToPath(new URL('sea-day.webp', OUT)));

  const island = await render(browser, 'island');
  await browser.close();

  // The sprite is the difference between the two frames (same frozen moment, same camera):
  // where they match it is transparent, so the island keeps its real waterline.
  const [l, t, r, b] = island.box;
  const pad = 12;
  const left = Math.max(0, Math.round((l - pad) * DPR));
  const top = Math.max(0, Math.round((t - pad) * DPR));
  const region = {
    left,
    top,
    width: Math.round((r - l + 2 * pad) * DPR),
    height: Math.round((b - t + 2 * pad) * DPR),
  };
  const raw = (png) => sharp(png).extract(region).ensureAlpha().raw().toBuffer();
  const [bg, fg] = await Promise.all([raw(sea.png), raw(island.png)]);
  const out = Buffer.alloc(fg.length);
  for (let i = 0; i < fg.length; i += 4) {
    const diff = Math.max(
      Math.abs(fg[i] - bg[i]),
      Math.abs(fg[i + 1] - bg[i + 1]),
      Math.abs(fg[i + 2] - bg[i + 2]),
    );
    // Hard inside, soft over the anti-aliased edge (~1 px).
    const a = Math.min(1, Math.max(0, (diff - 6) / 40));
    for (let c = 0; c < 3; c++) {
      // Un-mix the sea from edge pixels: fg = a·island + (1 − a)·sea.
      const v = a > 0 ? (fg[i + c] - (1 - a) * bg[i + c]) / a : 0;
      out[i + c] = Math.max(0, Math.min(255, Math.round(v)));
    }
    out[i + 3] = Math.round(a * 255);
  }
  const matte = await sharp(out, {
    raw: { width: region.width, height: region.height, channels: 4 },
  })
    .png()
    .toBuffer();
  const { data, info } = await sharp(matte)
    .trim({ threshold: 1 })
    .toBuffer({ resolveWithObject: true });
  await sharp(data)
    .webp({ quality: 88, alphaQuality: 90 })
    .toFile(fileURLToPath(new URL('sea-island.webp', OUT)));
  const placement = {
    image: { width: VIEWPORT.width * DPR, height: VIEWPORT.height * DPR },
    island: {
      x: left - (info.trimOffsetLeft ?? 0),
      y: top - (info.trimOffsetTop ?? 0),
      width: info.width,
      height: info.height,
    },
  };
  await writeFile(new URL('sea-island.json', OUT), JSON.stringify(placement, null, 2) + '\n');
  console.log('still rendered', placement);
} finally {
  stop();
}
