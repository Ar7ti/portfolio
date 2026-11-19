/**
 * Build-time image info for files in public/media: which sizes exist and their pixel size,
 * so every <img> gets a srcset and width/height (no layout shift) without hard-coding.
 * A content `src` is a path without extension: either `<src>-sm/-lg/-full.webp` or `<src>.webp`.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const PUBLIC = join(process.cwd(), 'public');

export interface ImageInfo {
  src: string;
  srcset: string | undefined;
  width: number;
  height: number;
}

/** Reads width/height from a WebP header (VP8, VP8L or VP8X). */
export function webpSize(file: string): { width: number; height: number } {
  const b = readFileSync(file);
  if (b.toString('ascii', 0, 4) !== 'RIFF' || b.toString('ascii', 8, 12) !== 'WEBP') {
    throw new Error(`${file} is not a WebP file`);
  }
  const chunk = b.toString('ascii', 12, 16);
  if (chunk === 'VP8 ') {
    return { width: b.readUInt16LE(26) & 0x3fff, height: b.readUInt16LE(28) & 0x3fff };
  }
  if (chunk === 'VP8L') {
    const bits = b.readUInt32LE(21);
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }
  if (chunk === 'VP8X') {
    return { width: b.readUIntLE(24, 3) + 1, height: b.readUIntLE(27, 3) + 1 };
  }
  throw new Error(`${file}: unknown WebP chunk ${chunk}`);
}

const SIZES = ['sm', 'lg', 'full'] as const;

export function imageInfo(src: string): ImageInfo {
  const variants = SIZES.map((size) => `${src}-${size}.webp`).filter((path) =>
    existsSync(join(PUBLIC, path)),
  );
  if (variants.length > 0) {
    const sized = variants.map((path) => ({ path, ...webpSize(join(PUBLIC, path)) }));
    const fallback = sized.find((v) => v.path.endsWith('-lg.webp')) ?? sized[sized.length - 1];
    if (!fallback) throw new Error(`no image for ${src}`);
    return {
      src: fallback.path,
      srcset: sized.map((v) => `${v.path} ${v.width}w`).join(', '),
      width: fallback.width,
      height: fallback.height,
    };
  }
  const single = `${src}.webp`;
  if (!existsSync(join(PUBLIC, single))) throw new Error(`Image not found: public${single}`);
  return { src: single, srcset: undefined, ...webpSize(join(PUBLIC, single)) };
}
