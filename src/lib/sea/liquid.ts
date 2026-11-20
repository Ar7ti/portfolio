/**
 * Thick-liquid height field (prototype A/D, approved motion): a damped wave equation plus a
 * viscosity blur. High damping and the blur make it feel like honey: pushes overshoot a little,
 * then settle slowly instead of ringing like water.
 */
export interface LiquidOptions {
  width: number;
  depth: number;
  /** Cells that never move (the island). */
  solid?: Uint8Array;
  /** Feel overrides (defaults: the approved honey-thick prototype values below). */
  spring?: number;
  damping?: number;
  viscosity?: number;
}

/** Tuned in the prototypes; Kirill approved this feel (MOODBOARD: Lusion, Igloo). */
const SPRING = 0.22; // pull towards the neighbours' average
const RESTORE = 0.012; // pull back to rest
const DAMPING = 0.965; // velocity kept per step
const VISCOSITY = 0.18; // blur per step: the "thick" part

export class Liquid {
  readonly width: number;
  readonly depth: number;
  readonly height: Float32Array;
  private readonly velocity: Float32Array;
  private readonly scratch: Float32Array;
  private readonly solid: Uint8Array;
  private readonly k: { spring: number; damping: number; viscosity: number };

  constructor({ width, depth, solid, spring, damping, viscosity }: LiquidOptions) {
    this.k = {
      spring: spring ?? SPRING,
      damping: damping ?? DAMPING,
      viscosity: viscosity ?? VISCOSITY,
    };
    this.width = width;
    this.depth = depth;
    const n = width * depth;
    this.height = new Float32Array(n);
    this.velocity = new Float32Array(n);
    this.scratch = new Float32Array(n);
    this.solid = solid ?? new Uint8Array(n);
  }

  /** Adds a smooth (cosine) bump of velocity around a cell. Negative = push down. */
  impulse(cx: number, cz: number, radius: number, amount: number): void {
    const { width: W, depth: D, velocity } = this;
    const x0 = Math.max(0, Math.floor(cx - radius));
    const x1 = Math.min(W - 1, Math.ceil(cx + radius));
    const z0 = Math.max(0, Math.floor(cz - radius));
    const z1 = Math.min(D - 1, Math.ceil(cz + radius));
    for (let z = z0; z <= z1; z++) {
      for (let x = x0; x <= x1; x++) {
        const d = Math.hypot(x - cx, z - cz);
        if (d <= radius)
          velocity[z * W + x]! += amount * (0.5 + 0.5 * Math.cos((Math.PI * d) / radius));
      }
    }
  }

  /** Pushes a whole column (constant x) — used for the opening wave. */
  pushColumn(x: number, amount: number): void {
    const xi = Math.round(x);
    if (xi < 0 || xi >= this.width) return;
    for (let z = 0; z < this.depth; z++) this.velocity[z * this.width + xi]! += amount;
  }

  /** Pushes a whole row (constant z) — used for scroll-sent waves. */
  pushRow(z: number, amount: number): void {
    const zi = Math.round(z);
    if (zi < 0 || zi >= this.depth) return;
    const start = zi * this.width;
    for (let x = 0; x < this.width; x++) this.velocity[start + x]! += amount;
  }

  /** One fixed 1/60 s step. */
  step(): void {
    const { width: W, depth: D, height: h, velocity: v, scratch: tmp, solid } = this;
    for (let z = 0; z < D; z++) {
      for (let x = 0; x < W; x++) {
        const i = z * W + x;
        if (solid[i]) {
          h[i] = 0;
          v[i] = 0;
          continue;
        }
        const hi = h[i]!;
        const l = x > 0 ? h[i - 1]! : hi;
        const r = x < W - 1 ? h[i + 1]! : hi;
        const u = z > 0 ? h[i - W]! : hi;
        const d = z < D - 1 ? h[i + W]! : hi;
        let vi = v[i]! + ((l + r + u + d) * 0.25 - hi) * this.k.spring - hi * RESTORE;
        vi *= this.k.damping;
        v[i] = vi;
      }
    }
    for (let i = 0; i < h.length; i++) h[i]! += v[i]!;
    for (let z = 1; z < D - 1; z++) {
      for (let x = 1; x < W - 1; x++) {
        const i = z * W + x;
        tmp[i] =
          h[i]! +
          this.k.viscosity * ((h[i - 1]! + h[i + 1]! + h[i - W]! + h[i + W]!) * 0.25 - h[i]!);
      }
    }
    for (let z = 1; z < D - 1; z++) {
      for (let x = 1; x < W - 1; x++) {
        const i = z * W + x;
        h[i] = tmp[i]!;
      }
    }
  }

  /** True when the surface is (almost) at rest — lets callers skip work. */
  isCalm(epsilon = 1e-3): boolean {
    for (let i = 0; i < this.velocity.length; i++) {
      if (Math.abs(this.velocity[i]!) > epsilon) return false;
    }
    return true;
  }
}

/** Island mask: 1 = sand ring, 2 = grass top. Elliptic so it reads round in perspective. */
export function islandMask(
  width: number,
  depth: number,
  cx: number,
  cz: number,
  radius: number,
): Uint8Array {
  const mask = new Uint8Array(width * depth);
  for (let z = 0; z < depth; z++) {
    for (let x = 0; x < width; x++) {
      const d = Math.hypot(x - cx, (z - cz) * 1.25);
      if (d < radius) mask[z * width + x] = d < radius - 2.2 ? 2 : 1;
    }
  }
  return mask;
}
