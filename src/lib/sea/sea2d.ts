/**
 * Tier 1: the same studded sea, drawn by one fragment shader (raw WebGL 1, no three.js).
 *
 * Every pixel casts a ray from a perspective camera onto the sea plane, so it reads as the
 * same studded sea seen at an angle (never the rejected A′ side-view columns): per-cell stud
 * discs with lit/shadowed rims and brick gaps, the calm swell, fog into the sky, and the Sky
 * Island ray-marched inside its bounding box. The thick liquid (touch stirring, scroll waves)
 * runs on the CPU on a coarse grid and is uploaded as an 8-bit texture each frame.
 */
import { DAY, type SeaPalette } from './palette';
import { islandMask, Liquid } from './liquid';
import type { SeaFactory, SeaOptions, SeaRenderer } from './types';

const BASE = 3;
const STEP = 1 / 60;
/** Liquid grid: SIM_W × SIM_D cells of SIM_CELL world units each. */
const SIM_W = 64;
const SIM_D = 48;
const SIM_CELL = 2;
/** Max drawing-buffer pixels: keeps phones cool. */
const MAX_PIXELS = 700_000;

const VERTEX = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const FRAGMENT = `
#ifdef GL_OES_standard_derivatives
#extension GL_OES_standard_derivatives : enable
#endif
precision highp float;
varying vec2 vUv;

uniform vec3 uCamPos;
uniform vec3 uCamRight;
uniform vec3 uCamUp;
uniform vec3 uCamFwd;
uniform float uTanHalf;
uniform float uAspect;
uniform float uTime;
uniform float uFogNear;
uniform float uFogFar;

uniform vec3 uDeep;
uniform vec3 uMid;
uniform vec3 uFoam;
uniform vec3 uSand;
uniform vec3 uGrass;
uniform vec3 uFog;
uniform vec3 uSkyA;
uniform float uLight;

uniform sampler2D uLiquid;
uniform vec4 uSimRect;   // x0, z0, width, depth (world units)
uniform vec3 uIsland;    // centre x, centre z, radius (world units)

const float BASE = ${BASE.toFixed(1)};

float swell(vec2 p, float t) {
  return sin(p.x * 0.055 + p.y * 0.04 - t * 0.5) * 0.55
       + sin(-p.x * 0.03 + p.y * 0.07 - t * 0.36) * 0.35
       + sin(p.x * 0.12 + p.y * 0.02 - t * 0.7) * 0.08;
}

float liquid(vec2 p) {
  vec2 uv = (p - uSimRect.xy) / uSimRect.zw;
  if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) return 0.0;
  return (texture2D(uLiquid, uv).r - 0.5) * 4.0;
}

/** Island height above BASE at a world point (0 = no island). Blocky: one value per cell. */
float islandTop(vec2 p, float lift) {
  vec2 cell = floor(p) + 0.5;
  float d = length((cell - uIsland.xy) * vec2(1.0, 1.25));
  if (d < uIsland.z - 2.2) return 2.6 + lift;
  if (d < uIsland.z) return 1.4 + lift;
  return -10.0;
}

float aaWidth(vec2 p) {
#ifdef GL_OES_standard_derivatives
  return max(length(fwidth(p)), 1e-3);
#else
  return 0.02;
#endif
}

/** Stud pattern for one cell: returns brightness multiplier. */
float studs(vec2 p, vec2 light) {
  vec2 c = fract(p) - 0.5;
  float w = aaWidth(p);
  float d = length(c);
  float disc = 1.0 - smoothstep(0.28 - w, 0.28 + w, d);
  // Lit rim towards the light, shadow on the far side.
  float rim = dot(normalize(c + 1e-4), light);
  float edge = smoothstep(0.2, 0.28, d) * disc;
  float stud = 1.0 + disc * 0.05 + edge * rim * 0.22 - (1.0 - disc) * smoothstep(0.28, 0.4, d) * max(0.0, -rim) * 0.12;
  // Gaps between bricks.
  float gap = 0.5 - max(abs(c.x), abs(c.y));
  stud *= mix(0.8, 1.0, smoothstep(0.0, 0.04 + w, gap));
  // Far away the pattern is sub-pixel: fade to its average so it doesn't shimmer.
  return mix(stud, 1.0, smoothstep(0.25, 0.6, w));
}

vec3 sky(vec3 dir) {
  return mix(uFog, uSkyA, smoothstep(0.0, 0.35, dir.y));
}

void main() {
  vec3 dir = normalize(uCamFwd + uCamRight * vUv.x * uTanHalf * uAspect + uCamUp * vUv.y * uTanHalf);
  vec2 light = normalize(vec2(-0.6, -0.8));
  float t = uTime;

  if (dir.y > -0.002) { gl_FragColor = vec4(sky(dir), 1.0); return; }

  vec3 col;
  float dist;
  float lift = swell(uIsland.xy, t) * 0.7;

  // --- island: ray-march the band just above the sea, only if the ray passes its bbox
  bool hitIsland = false;
  float tTop = (uCamPos.y - (BASE + 4.0)) / -dir.y;
  float tBot = (uCamPos.y - (BASE - 1.0)) / -dir.y;
  vec3 a = uCamPos + dir * tTop;
  vec3 b = uCamPos + dir * tBot;
  vec2 lo = min(a.xz, b.xz);
  vec2 hi = max(a.xz, b.xz);
  vec2 ilo = uIsland.xy - vec2(uIsland.z) * vec2(1.0, 0.8) - 1.0;
  vec2 ihi = uIsland.xy + vec2(uIsland.z) * vec2(1.0, 0.8) + 1.0;
  if (hi.x > ilo.x && lo.x < ihi.x && hi.y > ilo.y && lo.y < ihi.y) {
    float prevT = tTop;
    for (int i = 1; i <= 28; i++) {
      float tt = mix(tTop, tBot, float(i) / 28.0);
      vec3 q = uCamPos + dir * tt;
      float top = BASE + islandTop(q.xz, lift);
      if (q.y <= top) {
        // refine
        float t0 = prevT, t1 = tt;
        for (int j = 0; j < 6; j++) {
          float tm = 0.5 * (t0 + t1);
          vec3 m = uCamPos + dir * tm;
          if (m.y <= BASE + islandTop(m.xz, lift)) t1 = tm; else t0 = tm;
        }
        vec3 h = uCamPos + dir * t1;
        float ht = islandTop(h.xz, lift);
        bool side = (BASE + ht) - h.y > 0.12;
        vec3 base = ht > 2.0 + lift ? uGrass : uSand;
        col = side ? base * 0.72 : base * studs(h.xz, light);
        dist = t1;
        hitIsland = true;
        break;
      }
      prevT = tt;
    }
  }

  if (!hitIsland) {
    // --- water: flat-plane hit, then two fixed-point steps onto the swollen surface
    float tt = (uCamPos.y - BASE) / -dir.y;
    vec3 p = uCamPos + dir * tt;
    for (int i = 0; i < 2; i++) {
      float hgt = swell(p.xz, t) + liquid(p.xz);
      tt = (uCamPos.y - (BASE + hgt)) / -dir.y;
      p = uCamPos + dir * tt;
    }
    float h = liquid(p.xz);
    float s = swell(p.xz, t);
    float k = clamp((h + s * 0.6) * 0.45 + 0.45, 0.0, 1.0);
    vec3 water = mix(uDeep, uMid, min(1.0, k * 1.4));
    if (h > 1.1) water = mix(water, uFoam, min(1.0, (h - 1.1) * 0.7));
    // Slope lighting from the surface gradient.
    float e = 0.6;
    float hx = swell(p.xz + vec2(e, 0.0), t) + liquid(p.xz + vec2(e, 0.0)) - (s + h);
    float hz = swell(p.xz + vec2(0.0, e), t) + liquid(p.xz + vec2(0.0, e)) - (s + h);
    vec3 n = normalize(vec3(-hx / e, 1.0, -hz / e));
    float diffuse = clamp(dot(n, normalize(vec3(-0.45, 0.85, 0.35))), 0.0, 1.0);
    col = water * (0.72 + 0.4 * diffuse) * studs(p.xz, light);
    dist = tt;
  }

  col *= uLight;
  float f = smoothstep(uFogNear, uFogFar, dist);
  gl_FragColor = vec4(mix(col, uFog, f), 1.0);
}`;

type Vec3 = [number, number, number];
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const norm = (a: Vec3): Vec3 => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};
const rgb = (c: number): Vec3 => [((c >> 16) & 255) / 255, ((c >> 8) & 255) / 255, (c & 255) / 255];

interface Camera {
  pos: Vec3;
  right: Vec3;
  up: Vec3;
  fwd: Vec3;
  tanHalf: number;
  aspect: number;
}

interface View {
  camera: Camera;
  /** Island centre x, z and radius (world units). */
  island: Vec3;
  fogNear: number;
  fogFar: number;
}

/**
 * Landscape mirrors tier 2. Portrait (phones, where the hero is a tall column of text):
 * a low camera pitched so the horizon sits behind the top of the H1 and the island floats
 * right of the short "web" line, where the text leaves room.
 */
function viewFor(aspect: number): View {
  const portrait = aspect < 1;
  const pos: Vec3 = portrait ? [-2, 17, 60] : [-6, 50.8, 64];
  const fovDeg = portrait ? 50 : 32;
  const tanHalf = Math.tan((fovDeg * Math.PI) / 360);
  let fwd: Vec3;
  if (portrait) {
    const pitch = (20 * Math.PI) / 180;
    fwd = [0, -Math.sin(pitch), -Math.cos(pitch)];
  } else {
    fwd = norm(sub([10, 13, -2], pos));
  }
  const right = norm(cross(fwd, [0, 1, 0]));
  const up = cross(right, fwd);
  const camera = { pos, right, up, fwd, tanHalf, aspect };
  return portrait
    ? { camera, island: [9, -61, 6], fogNear: 150, fogFar: 330 }
    : { camera, island: [31, -9, 7], fogNear: 85, fogFar: 125 };
}

export const createSea2D: SeaFactory = (options: SeaOptions): SeaRenderer => {
  let gl: WebGLRenderingContext | null = null;
  let frame = 0;
  let paused = false;
  let destroyed = false;
  let resume: () => void = () => {};
  const cleanups: (() => void)[] = [];

  async function mount(layer: HTMLElement): Promise<void> {
    const canvas = document.createElement('canvas');
    canvas.className = 'hero-sea-live';
    const context = canvas.getContext('webgl', {
      antialias: false,
      alpha: false,
      depth: false,
      powerPreference: 'low-power',
    });
    if (!context) throw new Error('WebGL unavailable');
    gl = context;
    const derivatives = gl.getExtension('OES_standard_derivatives');

    // Compile without asking for the status: that query blocks the main thread until the GPU
    // process is done. With KHR_parallel_shader_compile we poll for completion instead.
    const compile = (type: number, source: string) => {
      const shader = context.createShader(type);
      if (!shader) throw new Error('shader alloc failed');
      context.shaderSource(shader, derivatives ? source : source.replace(/#extension[^\n]*\n/, ''));
      context.compileShader(shader);
      return shader;
    };
    const parallel = gl.getExtension('KHR_parallel_shader_compile') as {
      COMPLETION_STATUS_KHR: number;
    } | null;
    const program = gl.createProgram();
    if (!program) throw new Error('program alloc failed');
    const vs = compile(gl.VERTEX_SHADER, VERTEX);
    const fs = compile(gl.FRAGMENT_SHADER, FRAGMENT);
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (parallel) {
      while (!context.getProgramParameter(program, parallel.COMPLETION_STATUS_KHR)) {
        await new Promise((resolve) => setTimeout(resolve, 16));
        if (destroyed) return;
      }
    }
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const log =
        context.getShaderInfoLog(fs) ||
        context.getShaderInfoLog(vs) ||
        context.getProgramInfoLog(program);
      throw new Error(log || 'link failed');
    }
    gl.useProgram(program);

    // One triangle that covers the screen.
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(program, 'aPos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const u = (name: string) => context.getUniformLocation(program, name);
    const loc = {
      camPos: u('uCamPos'),
      camRight: u('uCamRight'),
      camUp: u('uCamUp'),
      camFwd: u('uCamFwd'),
      tanHalf: u('uTanHalf'),
      aspect: u('uAspect'),
      time: u('uTime'),
      fogNear: u('uFogNear'),
      fogFar: u('uFogFar'),
      deep: u('uDeep'),
      mid: u('uMid'),
      foam: u('uFoam'),
      sand: u('uSand'),
      grass: u('uGrass'),
      fog: u('uFog'),
      skyA: u('uSkyA'),
      light: u('uLight'),
      liquid: u('uLiquid'),
      simRect: u('uSimRect'),
      island: u('uIsland'),
    };

    let camera = viewFor(1).camera;
    let island: Vec3 = [31, -9, 7];
    let simRect = { x0: -40, z0: -60, w: SIM_W * SIM_CELL, d: SIM_D * SIM_CELL };

    function setPalette(p: SeaPalette): void {
      if (!gl) return;
      gl.uniform3fv(loc.deep, rgb(p.deep));
      gl.uniform3fv(loc.mid, rgb(p.mid));
      gl.uniform3fv(loc.foam, rgb(p.foam));
      gl.uniform3fv(loc.sand, rgb(p.sand));
      gl.uniform3fv(loc.grass, rgb(p.grass));
      gl.uniform3fv(loc.fog, rgb(p.fog));
      gl.uniform3fv(loc.skyA, rgb(p.skyA));
      gl.uniform1f(loc.light, Math.min(1.15, 0.45 + p.hemi * 0.35));
    }

    function layout(): void {
      if (!gl) return;
      const r = layer.getBoundingClientRect();
      if (!r.width || !r.height) return;
      let dpr = Math.min(window.devicePixelRatio || 1, 1.25);
      const pixels = r.width * r.height * dpr * dpr;
      if (pixels > MAX_PIXELS) dpr *= Math.sqrt(MAX_PIXELS / pixels);
      canvas.width = Math.round(r.width * dpr);
      canvas.height = Math.round(r.height * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      const aspect = r.width / r.height;
      const view = viewFor(aspect);
      camera = view.camera;
      island = view.island;
      // Liquid grid in front of the camera, covering what the eye can stir.
      simRect =
        aspect < 1
          ? { x0: -50, z0: -40, w: SIM_W * SIM_CELL, d: SIM_D * SIM_CELL }
          : { x0: -50, z0: -66, w: SIM_W * SIM_CELL, d: SIM_D * SIM_CELL };
      gl.uniform3fv(loc.camPos, camera.pos);
      gl.uniform3fv(loc.camRight, camera.right);
      gl.uniform3fv(loc.camUp, camera.up);
      gl.uniform3fv(loc.camFwd, camera.fwd);
      gl.uniform1f(loc.tanHalf, camera.tanHalf);
      gl.uniform1f(loc.aspect, aspect);
      gl.uniform4f(loc.simRect, simRect.x0, simRect.z0, simRect.w, simRect.d);
      gl.uniform3fv(loc.island, island);
      gl.uniform1f(loc.fogNear, view.fogNear);
      gl.uniform1f(loc.fogFar, view.fogFar);
      buildLiquid();
    }

    // --- liquid: the same thick sim as tier 2, on a coarse grid
    let liquid = new Liquid({ width: SIM_W, depth: SIM_D });
    const bytes = new Uint8Array(SIM_W * SIM_D);
    const texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.uniform1i(loc.liquid, 0);

    function buildLiquid(): void {
      const mask = islandMask(
        SIM_W,
        SIM_D,
        (island[0] - simRect.x0) / SIM_CELL,
        (island[1] - simRect.z0) / SIM_CELL,
        island[2] / SIM_CELL,
      );
      liquid = new Liquid({ width: SIM_W, depth: SIM_D, solid: mask });
    }

    function upload(): void {
      if (!gl) return;
      const h = liquid.height;
      for (let i = 0; i < h.length; i++) {
        bytes[i] = Math.max(0, Math.min(255, Math.round((h[i]! * 0.25 + 0.5) * 255)));
      }
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.LUMINANCE,
        SIM_W,
        SIM_D,
        0,
        gl.LUMINANCE,
        gl.UNSIGNED_BYTE,
        bytes,
      );
    }

    /** Screen point → liquid grid cell (or null when it misses the sea). */
    function toCell(clientX: number, clientY: number): [number, number] | null {
      const r = canvas.getBoundingClientRect();
      const nx = ((clientX - r.left) / r.width) * 2 - 1;
      const ny = -((clientY - r.top) / r.height) * 2 + 1;
      const c = camera;
      const dir = norm([
        c.fwd[0] + c.right[0] * nx * c.tanHalf * c.aspect + c.up[0] * ny * c.tanHalf,
        c.fwd[1] + c.right[1] * nx * c.tanHalf * c.aspect + c.up[1] * ny * c.tanHalf,
        c.fwd[2] + c.right[2] * nx * c.tanHalf * c.aspect + c.up[2] * ny * c.tanHalf,
      ]);
      if (dir[1] >= -1e-3) return null;
      const t = (c.pos[1] - BASE) / -dir[1];
      const gx = (c.pos[0] + dir[0] * t - simRect.x0) / SIM_CELL;
      const gz = (c.pos[2] + dir[2] * t - simRect.z0) / SIM_CELL;
      if (gx < 0 || gz < 0 || gx >= SIM_W || gz >= SIM_D) return null;
      return [gx, gz];
    }

    let last: [number, number] | null = null;
    const onPointer = (event: PointerEvent) => {
      const cell = toCell(event.clientX, event.clientY);
      if (!cell) {
        last = null;
        return;
      }
      const speed = last ? Math.min(2, Math.hypot(cell[0] - last[0], cell[1] - last[1])) : 0;
      liquid.impulse(cell[0], cell[1], 2.2, -0.3 - speed * 0.35);
      last = cell;
    };
    addEventListener('pointermove', onPointer, { passive: true });
    addEventListener('pointerdown', onPointer, { passive: true });
    cleanups.push(() => {
      removeEventListener('pointermove', onPointer);
      removeEventListener('pointerdown', onPointer);
    });

    let lastScroll = scrollY;
    const onScroll = () => {
      const delta = scrollY - lastScroll;
      lastScroll = scrollY;
      if (delta) liquid.pushRow(SIM_D - 3, Math.max(-0.9, Math.min(0.9, delta * 0.012)));
    };
    addEventListener('scroll', onScroll, { passive: true });
    cleanups.push(() => removeEventListener('scroll', onScroll));

    const observer = new ResizeObserver(layout);
    observer.observe(layer);
    cleanups.push(() => observer.disconnect());

    setPalette(DAY);
    layout();

    const t0 = performance.now();
    let prev = t0;
    let acc = 0;
    let first = true;
    let resolveFirst: () => void = () => {};
    const firstFrame = new Promise<void>((resolve) => (resolveFirst = resolve));

    function tick(now: number): void {
      frame = 0;
      if (!gl || destroyed) return;
      const ms = now - prev;
      prev = now;
      if (!first) options.onFrame?.(ms);
      const t = (now - t0) / 1000;
      acc += Math.min(0.05, ms / 1000);
      const sweep = (t - 0.2) / 1.9;
      while (acc > STEP) {
        if (sweep > 0 && sweep < 1) liquid.pushColumn(sweep * SIM_W * 0.7, 0.5 * (1 - sweep * 0.5));
        liquid.step();
        acc -= STEP;
      }
      upload();
      gl.uniform1f(loc.time, t);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (first) {
        first = false;
        canvas.classList.add('is-ready');
        resolveFirst();
      }
      if (!paused) frame = requestAnimationFrame(tick);
    }

    layer.append(canvas);
    cleanups.push(() => canvas.remove());
    cleanups.push(() => {
      context.deleteTexture(texture);
      context.deleteBuffer(buffer);
      context.deleteProgram(program);
      context.deleteShader(vs);
      context.deleteShader(fs);
    });
    resume = () => {
      if (!frame && !destroyed) {
        prev = performance.now();
        frame = requestAnimationFrame(tick);
      }
    };
    frame = requestAnimationFrame(tick);
    await firstFrame;
  }

  return {
    mount,
    setPaused(next) {
      if (next === paused) return;
      paused = next;
      if (paused) {
        cancelAnimationFrame(frame);
        frame = 0;
      } else {
        resume();
      }
    },
    destroy() {
      destroyed = true;
      cancelAnimationFrame(frame);
      frame = 0;
      for (const cleanup of cleanups.splice(0)) cleanup();
      gl?.getExtension('WEBGL_lose_context')?.loseContext();
      gl = null;
    },
  };
};
