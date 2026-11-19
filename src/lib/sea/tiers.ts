/**
 * Capability tiers for the hero sea. Decided once per visit, after first paint.
 *
 * 0 = static still (reduced motion, no WebGL, Save-Data, "Calm the water").
 * 1 = lightweight 2D shader sea (phones, weak devices, or tier 2 measured too slow).
 * 2 = full three.js "Stud Tide" sea (capable desktops).
 */
export type Tier = 0 | 1 | 2;

export interface Signals {
  /** `?tier=0|1|2` debug override. */
  override: Tier | null;
  /** The visitor chose "Calm the water" (remembered). */
  calm: boolean;
  reducedMotion: boolean;
  saveData: boolean;
  webgl: boolean;
  /** Touch-first device or a narrow screen (≤ 860 px). */
  mobile: boolean;
  /** navigator.deviceMemory in GB, when the browser exposes it. */
  deviceMemory: number | undefined;
  /** navigator.hardwareConcurrency, when exposed. */
  cores: number | undefined;
  /** Tier 2 already ran too slowly in this visit. */
  slow3d: boolean;
}

export const SLOW_FRAME_MS = 22;
export const SLOW_SAMPLE_FRAMES = 30;

export function decideTier(s: Signals): Tier {
  if (s.override !== null) return s.override;
  if (s.calm || s.reducedMotion || s.saveData || !s.webgl) return 0;
  if (s.mobile || s.slow3d) return 1;
  if (s.deviceMemory !== undefined && s.deviceMemory <= 4) return 1;
  if (s.cores !== undefined && s.cores <= 4) return 1;
  return 2;
}

/** Average of the first `SLOW_SAMPLE_FRAMES` frame times decides a downgrade from tier 2. */
export function isTooSlow(frameTimesMs: readonly number[]): boolean {
  if (frameTimesMs.length < SLOW_SAMPLE_FRAMES) return false;
  const sample = frameTimesMs.slice(0, SLOW_SAMPLE_FRAMES);
  const avg = sample.reduce((a, b) => a + b, 0) / sample.length;
  return avg > SLOW_FRAME_MS;
}

const CALM_KEY = 'sea:calm';
const SLOW_KEY = 'sea:slow3d';

function safeGet(storage: () => Storage, key: string): string | null {
  try {
    return storage().getItem(key);
  } catch {
    return null;
  }
}

function safeSet(storage: () => Storage, key: string, value: string | null): void {
  try {
    if (value === null) storage().removeItem(key);
    else storage().setItem(key, value);
  } catch {
    // Storage blocked (private mode, policies): the choice just isn't remembered.
  }
}

export const remember = {
  calm: (on: boolean) => safeSet(() => localStorage, CALM_KEY, on ? '1' : null),
  slow3d: () => safeSet(() => sessionStorage, SLOW_KEY, '1'),
};

/**
 * Cheap check: is the API there? Creating a throwaway context costs ~50–100 ms on phones.
 * If the GPU is blocklisted anyway, the renderer's mount fails and the still stays (sea.ts).
 */
function hasWebGL(): boolean {
  return 'WebGL2RenderingContext' in window || 'WebGLRenderingContext' in window;
}

export function readSignals(): Signals {
  const param = new URLSearchParams(location.search).get('tier');
  const override = param === '0' || param === '1' || param === '2' ? (Number(param) as Tier) : null;
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean };
  };
  return {
    override,
    calm: safeGet(() => localStorage, CALM_KEY) === '1',
    reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
    saveData: nav.connection?.saveData === true,
    webgl: hasWebGL(),
    mobile: matchMedia('(pointer: coarse), (max-width: 860px)').matches,
    deviceMemory: nav.deviceMemory,
    cores: nav.hardwareConcurrency || undefined,
    slow3d: safeGet(() => sessionStorage, SLOW_KEY) === '1',
  };
}
