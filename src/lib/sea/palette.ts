/**
 * Sea and sky palettes (prototype D, mirrored as --sea-* tokens in src/styles/tokens.css).
 * Both WebGL tiers read these; #11 blends DAY → DUSK → NIGHT with one scroll value.
 */
export interface SeaPalette {
  deep: number;
  mid: number;
  foam: number;
  fog: number;
  sand: number;
  grass: number;
  skyA: number;
  skyB: number;
  hemi: number;
  sun: number;
}

export const DAY: SeaPalette = {
  deep: 0x0e3b57,
  mid: 0x1fa3a8,
  foam: 0xf7fbfc,
  fog: 0xdcebf3,
  sand: 0xf1d9a0,
  grass: 0x63c06b,
  skyA: 0xcfe4ef,
  skyB: 0xdcebf3,
  hemi: 1.6,
  sun: 2.2,
};

export const NIGHT: SeaPalette = {
  deep: 0x07050a,
  mid: 0x1d0f2b,
  foam: 0x6b3a8c,
  fog: 0x090709,
  sand: 0x3a2a3a,
  grass: 0x1c3a2a,
  skyA: 0x090709,
  skyB: 0x1a0b24,
  hemi: 0.35,
  sun: 0.25,
};

/** Sunset stop for sky and fog only (violet → coral), so day never turns muddy grey. */
export const DUSK: Pick<SeaPalette, 'skyA' | 'skyB' | 'fog'> = {
  skyA: 0x8823b5,
  skyB: 0xe0685b,
  fog: 0xb8506e,
};

/** Neon light sticks from the Junction 2026 photos. */
export const NEON = [0x8823b5, 0xe0685b, 0xcf2672] as const;

export function hex(color: number): string {
  return `#${color.toString(16).padStart(6, '0')}`;
}

function lerpColor(a: number, b: number, t: number): number {
  const r = Math.round(((a >> 16) & 255) + (((b >> 16) & 255) - ((a >> 16) & 255)) * t);
  const g = Math.round(((a >> 8) & 255) + (((b >> 8) & 255) - ((a >> 8) & 255)) * t);
  const bl = Math.round((a & 255) + ((b & 255) - (a & 255)) * t);
  return (r << 16) | (g << 8) | bl;
}

/**
 * Day (0) → night (1). Sky and fog pass through the DUSK stop (violet → coral) at 0.5 so the
 * sunset never goes muddy grey; the sea, island and lights blend straight from day to night.
 */
export function mixPalette(p: number): SeaPalette {
  const t = Math.min(1, Math.max(0, p));
  const out = {} as SeaPalette;
  for (const key of Object.keys(DAY) as (keyof SeaPalette)[]) {
    if (key === 'hemi' || key === 'sun') {
      out[key] = DAY[key] + (NIGHT[key] - DAY[key]) * t;
    } else if (key === 'skyA' || key === 'skyB' || key === 'fog') {
      out[key] =
        t < 0.5
          ? lerpColor(DAY[key], DUSK[key], t * 2)
          : lerpColor(DUSK[key], NIGHT[key], (t - 0.5) * 2);
    } else {
      out[key] = lerpColor(DAY[key], NIGHT[key], t);
    }
  }
  return out;
}

/**
 * Sky of the WebGL tiers (both): deeper than the CSS sky tokens, so tone mapping keeps colour.
 * Day → dusk at 0.5 → night.
 */
const SKY_DAY = { top: 0x3f8fd0, mid: 0x8cc6e6, haze: 0xc2e0ee };
const SKY_DUSK = { top: 0x341a6b, mid: 0xc85a7c, haze: 0xf0956a };
const SKY_NIGHT = { top: 0x05030c, mid: 0x1c0d30, haze: 0x4a1f55 };

export function skyAt(p: number): { top: number; mid: number; haze: number } {
  const t = Math.min(1, Math.max(0, p));
  const [a, b, k] = t < 0.5 ? [SKY_DAY, SKY_DUSK, t * 2] : [SKY_DUSK, SKY_NIGHT, (t - 0.5) * 2];
  return {
    top: lerpColor(a.top, b.top, k),
    mid: lerpColor(a.mid, b.mid, k),
    haze: lerpColor(a.haze, b.haze, k),
  };
}

export interface Sun {
  /** Unit direction towards the sun (world: x right, y up, z towards the camera). */
  dir: [number, number, number];
  /** Linear RGB. */
  color: [number, number, number];
  power: number;
  /** Strength of the sun disc and glow in the sky. */
  glow: number;
}

/** High white sun → warm on the horizon at dusk → a cool moon, high on the left, at night. */
export function sunAt(p: number): Sun {
  const t = Math.min(1, Math.max(0, p));
  const dusk = Math.min(1, t * 2);
  const gone = Math.max(0, t * 2 - 1);
  const elevation = 0.2 * (1 - dusk) + 0.03 * dusk - 0.2 * gone + 0.75 * gone;
  const x = 0.5 - 1.35 * gone;
  const l = Math.hypot(x, elevation, 1);
  const mix3 = (a: number[], b: number[], k: number) => a.map((v, i) => v + (b[i]! - v) * k);
  const warm = mix3([1, 0.94, 0.84], [1, 0.5, 0.28], dusk);
  const color = mix3(warm, [0.55, 0.5, 1], gone) as [number, number, number];
  return {
    dir: [x / l, elevation / l, -1 / l],
    color,
    power: 1.9 * (1 - dusk) + 1.4 * dusk * (1 - gone) + 0.42 * gone,
    glow: (1 + dusk * 0.8) * (1 - gone),
  };
}
