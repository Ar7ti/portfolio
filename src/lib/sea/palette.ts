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
