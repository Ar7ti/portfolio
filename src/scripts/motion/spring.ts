/**
 * Springs for every motion on the site (#20): no linear or default easing anywhere.
 * `Spring` steps a damped spring per frame; `springEasing` samples the same physics into a CSS
 * `linear()` curve for transitions (the `--ease-spring` token in tokens.css comes from it).
 */
export interface SpringConfig {
  stiffness: number;
  damping: number;
  mass?: number;
}

export const SOFT: SpringConfig = { stiffness: 170, damping: 22 };
export const SNAPPY: SpringConfig = { stiffness: 320, damping: 26 };

export class Spring {
  value: number;
  target: number;
  velocity = 0;
  private config: SpringConfig;

  constructor(initial: number, config: SpringConfig = SOFT) {
    this.value = initial;
    this.target = initial;
    this.config = config;
  }

  /** Advances by dt seconds (sub-stepped for stability). Returns true while still moving. */
  step(dt: number): boolean {
    const { stiffness, damping, mass = 1 } = this.config;
    const steps = Math.max(1, Math.ceil(dt * 240));
    const h = dt / steps;
    for (let i = 0; i < steps; i++) {
      const force = -stiffness * (this.value - this.target) - damping * this.velocity;
      this.velocity += (force / mass) * h;
      this.value += this.velocity * h;
    }
    const moving = Math.abs(this.velocity) > 0.001 || Math.abs(this.value - this.target) > 0.001;
    if (!moving) {
      this.value = this.target;
      this.velocity = 0;
    }
    return moving;
  }
}

/** A CSS `linear()` easing that follows a spring from 0 to 1 (overshoot included). */
export function springEasing(config: SpringConfig = SOFT, points = 32): string {
  const probe = new Spring(0, config);
  probe.target = 1;
  let duration = 0;
  while (probe.step(1 / 120) && duration < 3) duration += 1 / 120;
  const spring = new Spring(0, config);
  spring.target = 1;
  const samples = ['0'];
  for (let i = 1; i <= points; i++) {
    spring.step(duration / points);
    samples.push(i === points ? '1' : String(Math.round(spring.value * 1000) / 1000));
  }
  return `linear(${samples.join(', ')})`;
}

/** Runs `update(dt)` every frame until it returns false; returns a stop function. */
export function loop(update: (dt: number) => boolean): () => void {
  let last = performance.now();
  let id = requestAnimationFrame(function frame(now) {
    const dt = Math.min((now - last) / 1000, 1 / 20);
    last = now;
    id = update(dt) ? requestAnimationFrame(frame) : 0;
  });
  return () => cancelAnimationFrame(id);
}
