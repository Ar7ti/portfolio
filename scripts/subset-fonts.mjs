// Re-creates the self-hosted fonts in public/fonts from the Fontsource packages (all SIL OFL 1.1).
// Needs Python with fonttools + brotli: `pip install fonttools brotli`.
// Usage: npm run fonts   (set PYTHON=python3 if `py` / `python3` is not the right binary)
//
// Each font is first limited to the axis ranges the design uses, then subset to the glyphs below.
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Basic Latin, Latin-1 (ä, ·, ×), general punctuation (– — ’ “ ” …), arrows (→), ™.
const UNICODES = 'U+0020-007E,U+00A0-00FF,U+2010-2027,U+2030-203A,U+2190-2193,U+2122';

/** [source in node_modules, output name, axis limits] */
const FONTS = [
  [
    '@fontsource-variable/anybody/files/anybody-latin-standard-normal.woff2',
    'anybody.woff2',
    ['wght=600:900', 'wdth=100:125'],
  ],
  [
    '@fontsource-variable/schibsted-grotesk/files/schibsted-grotesk-latin-wght-normal.woff2',
    'schibsted-grotesk.woff2',
    ['wght=400:800'],
  ],
  [
    '@fontsource-variable/martian-mono/files/martian-mono-latin-wght-normal.woff2',
    'martian-mono.woff2',
    ['wght=400:500'],
  ],
];

const python = process.env.PYTHON ?? (process.platform === 'win32' ? 'py' : 'python3');
const tmp = mkdtempSync(join(tmpdir(), 'fonts-'));
mkdirSync('public/fonts', { recursive: true });

function run(args) {
  const result = spawnSync(python, ['-m', ...args], { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

for (const [src, out, axes] of FONTS) {
  const limited = join(tmp, `${out}.ttf`);
  run(['fontTools', 'varLib.instancer', `node_modules/${src}`, ...axes, '-q', '-o', limited]);
  run([
    'fontTools.subset',
    limited,
    `--unicodes=${UNICODES}`,
    '--flavor=woff2',
    '--layout-features=kern,liga,calt,tnum,lnum,case',
    '--no-hinting',
    `--output-file=public/fonts/${out}`,
  ]);
  console.log(`public/fonts/${out}`);
}
