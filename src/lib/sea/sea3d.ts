/**
 * Tier 2: the "Stud Tide" sea in three.js (port of concepts/d-day-to-night.html, day only;
 * #11 adds dusk/night). Loaded with a dynamic import after first paint, never in the
 * initial bundle.
 *
 * One InstancedMesh: every cell is a fixed-height column with a stud on top, so a frame only
 * moves instances up and down (translation) and recolours them. The liquid runs on the CPU
 * (≈4.4K cells) at a fixed 60 Hz step.
 */
import {
  BoxGeometry,
  Color,
  CylinderGeometry,
  Fog,
  HemisphereLight,
  DirectionalLight,
  InstancedMesh,
  Matrix4,
  MeshStandardMaterial,
  PerspectiveCamera,
  Plane,
  Raycaster,
  Scene,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { DAY, hex } from './palette';
import { islandMask, Liquid } from './liquid';
import type { SeaFactory, SeaOptions, SeaRenderer } from './types';

/** Sea surface rest height (world units) and column depth below the surface. */
const BASE = 3;
const COLUMN = 8;
const STEP = 1 / 60;

interface Grid {
  width: number;
  depth: number;
  island: { x: number; z: number; r: number };
}

function gridFor(aspect: number): Grid {
  // Portrait boxes see less width; fewer columns keep it fast on tablets that get tier 2.
  return aspect < 1
    ? { width: 48, depth: 44, island: { x: 34, z: 18, r: 5 } }
    : { width: 84, depth: 52, island: { x: 73, z: 17, r: 7 } };
}

export const createSea3D: SeaFactory = (options: SeaOptions): SeaRenderer => {
  let renderer: WebGLRenderer | null = null;
  let frame = 0;
  let paused = false;
  let destroyed = false;
  const cleanups: (() => void)[] = [];

  async function mount(layer: HTMLElement): Promise<void> {
    const box = layer.getBoundingClientRect();
    const aspect = box.width / Math.max(1, box.height);
    const { width: W, depth: D, island } = gridFor(aspect);
    const N = W * D;

    renderer = new WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setSize(box.width, box.height, false);
    const canvas = renderer.domElement;
    canvas.className = 'hero-sea-live';
    // The sky is a CSS gradient behind the transparent canvas: cheaper than a sky mesh.
    canvas.style.background = `linear-gradient(${hex(DAY.skyA)}, ${hex(DAY.skyB)})`;

    const scene = new Scene();
    scene.fog = new Fog(DAY.fog, 60, 140);
    const camera = new PerspectiveCamera(32, aspect, 1, 300);
    const hemi = new HemisphereLight(0xffffff, 0x2a6d8c, DAY.hemi);
    const sun = new DirectionalLight(0xffffff, DAY.sun);
    sun.position.set(-30, 60, 40);
    scene.add(hemi, sun);

    // Column + stud merged into one geometry, top of the stud base at y = 0.
    const column = new BoxGeometry(0.96, COLUMN, 0.96).translate(0, -COLUMN / 2, 0);
    const stud = new CylinderGeometry(0.28, 0.28, 0.18, 14).translate(0, 0.09, 0);
    const geometry = mergeGeometries([column, stud]);
    column.dispose();
    stud.dispose();
    if (!geometry) throw new Error('could not build the stud geometry');
    const material = new MeshStandardMaterial({ roughness: 0.42 });
    const mesh = new InstancedMesh(geometry, material, N);
    mesh.frustumCulled = false;
    scene.add(mesh);

    const mask = islandMask(W, D, island.x, island.z, island.r);
    const liquid = new Liquid({ width: W, depth: D, solid: mask });

    const deep = new Color(DAY.deep);
    const mid = new Color(DAY.mid);
    const foam = new Color(DAY.foam);
    const sand = new Color(DAY.sand);
    const grass = new Color(DAY.grass);
    const color = new Color();
    const m4 = new Matrix4();

    function write(t: number): void {
      const h = liquid.height;
      for (let z = 0; z < D; z++) {
        const pz = z - D / 2;
        for (let x = 0; x < W; x++) {
          const i = z * W + x;
          const px = x - W / 2;
          const cell = mask[i];
          let top: number;
          if (cell) {
            top = BASE + (cell === 2 ? 2.6 : 1.4) + Math.sin(t * 0.8) * 0.12;
            color.copy(cell === 2 ? grass : sand);
          } else {
            const hi = h[i]!;
            top =
              BASE +
              hi +
              // Ambient swell: one long slow roll plus two short ripples, so the idle sea breathes.
              Math.sin(px * 0.07 + pz * 0.05 - t * 0.6) * 0.42 +
              Math.sin(px * 0.21 + t * 0.9) * 0.18 +
              Math.sin(pz * 0.33 - t * 0.7) * 0.14;
            const k = Math.min(1, Math.max(0, hi * 0.45 + 0.45));
            color.copy(deep).lerp(mid, Math.min(1, k * 1.4));
            if (hi > 1.1) color.lerp(foam, Math.min(1, (hi - 1.1) * 0.7));
          }
          m4.makeTranslation(px, top, pz);
          mesh.setMatrixAt(i, m4);
          mesh.setColorAt(i, color);
        }
      }
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }

    function placeCamera(): void {
      const a = camera.aspect;
      const dist = a < 1 ? 110 : 82;
      camera.position.set(-6, dist * 0.62, dist * 0.78);
      camera.lookAt(a < 1 ? 0 : 10, a < 1 ? 14 : 13, -2);
      camera.updateProjectionMatrix();
    }

    function resize(): void {
      if (!renderer) return;
      const r = layer.getBoundingClientRect();
      if (!r.width || !r.height) return;
      renderer.setSize(r.width, r.height, false);
      camera.aspect = r.width / r.height;
      placeCamera();
    }
    placeCamera();

    // --- stirring: pointer (mouse, pen, finger) pushes the surface down where it moves
    const ray = new Raycaster();
    const ndc = new Vector2();
    const surface = new Plane(new Vector3(0, 1, 0), -BASE);
    const hit = new Vector3();
    let last: [number, number] | null = null;
    const onPointer = (event: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      if (event.clientY < r.top || event.clientY > r.bottom) {
        last = null;
        return;
      }
      ndc.set(
        ((event.clientX - r.left) / r.width) * 2 - 1,
        -((event.clientY - r.top) / r.height) * 2 + 1,
      );
      ray.setFromCamera(ndc, camera);
      if (!ray.ray.intersectPlane(surface, hit)) return;
      const gx = hit.x + W / 2;
      const gz = hit.z + D / 2;
      if (gx < 0 || gz < 0 || gx >= W || gz >= D) {
        last = null;
        return;
      }
      const speed = last ? Math.min(3, Math.hypot(gx - last[0], gz - last[1])) : 0;
      liquid.impulse(gx, gz, 3.2, -0.22 - speed * 0.25);
      last = [gx, gz];
      wake();
    };
    addEventListener('pointermove', onPointer, { passive: true });
    cleanups.push(() => removeEventListener('pointermove', onPointer));

    // --- scroll sends a wave from the near edge, sized by how fast you scroll
    let lastScroll = scrollY;
    const onScroll = () => {
      const delta = scrollY - lastScroll;
      lastScroll = scrollY;
      if (!delta) return;
      liquid.pushRow(D - 3, Math.max(-0.9, Math.min(0.9, delta * 0.012)));
      wake();
    };
    addEventListener('scroll', onScroll, { passive: true });
    cleanups.push(() => removeEventListener('scroll', onScroll));

    const observer = new ResizeObserver(resize);
    observer.observe(layer);
    cleanups.push(() => observer.disconnect());

    // --- loop: fixed-step sim, render every frame while anything moves
    const t0 = performance.now();
    let prev = t0;
    let acc = 0;
    let first = true;
    let nextDrop = 2.6;
    let resolveFirst: () => void = () => {};
    const firstFrame = new Promise<void>((resolve) => (resolveFirst = resolve));

    function tick(now: number): void {
      frame = 0;
      if (!renderer || destroyed) return;
      const ms = now - prev;
      prev = now;
      if (!first) options.onFrame?.(ms);
      const t = (now - t0) / 1000;
      acc += Math.min(0.05, ms / 1000);
      // Opening wave: a crest rolls in from the left over ~2 s, then the sea settles.
      const sweep = (t - 0.2) / 1.9;
      // Idle drops: a slow, thick splash every couple of seconds shows the viscosity.
      if (t > nextDrop) {
        nextDrop = t + 1.8 + Math.random() * 1.6;
        liquid.impulse(8 + Math.random() * (W - 16), 6 + Math.random() * (D - 12), 2.4, -0.5);
      }
      while (acc > STEP) {
        if (sweep > 0 && sweep < 1) liquid.pushColumn(sweep * W * 0.62, 0.55 * (1 - sweep * 0.5));
        liquid.step();
        acc -= STEP;
      }
      write(t);
      renderer.render(scene, camera);
      if (first) {
        first = false;
        canvas.classList.add('is-ready');
        resolveFirst();
      }
      if (!paused) frame = requestAnimationFrame(tick);
    }

    function wake(): void {
      if (!paused && !frame && !destroyed) {
        prev = performance.now();
        frame = requestAnimationFrame(tick);
      }
    }

    layer.append(canvas);
    cleanups.push(() => canvas.remove());
    cleanups.push(() => {
      geometry.dispose();
      material.dispose();
      mesh.dispose();
    });
    resume = () => {
      prev = performance.now();
      wake();
    };
    frame = requestAnimationFrame(tick);
    await firstFrame;
  }

  let resume: () => void = () => {};

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
      renderer?.dispose();
      renderer?.forceContextLoss();
      renderer = null;
    },
  };
};
