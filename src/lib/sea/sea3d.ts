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
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  PerspectiveCamera,
  Plane,
  Raycaster,
  Scene,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { AdditiveBlending, MeshBasicMaterial } from 'three';
import { DAY, hex, mixPalette, NEON } from './palette';
import { islandMask, Liquid } from './liquid';
import { isSoftwareRenderer } from './tiers';
import type { SeaFactory, SeaOptions, SeaRenderer } from './types';

/** Sea surface rest height (world units) and column depth below the surface. */
const BASE = 3;
const COLUMN = 8;
const STEP = 1 / 60;

/** World z of the grid's near edge (towards the camera); the grid runs back from here. */
const NEAR_Z = 30;

interface Grid {
  width: number;
  depth: number;
  /** Share of the grid left of x = 0: the camera looks right, so the grid extends further right. */
  shift: number;
  /** Island centre in world units (x right, z towards the camera). */
  island: { x: number; z: number; r: number };
}

function gridFor(aspect: number): Grid {
  // The grid is wide and deep enough that its side and back edges are always outside the
  // view or inside full fog, so the sea runs to the horizon at any width (no "table" edge).
  // Portrait boxes see less width; fewer columns keep it fast on tablets that get tier 2.
  return aspect < 1
    ? { width: 64, depth: 74, shift: 0.5, island: { x: 10, z: -4, r: 5 } }
    : { width: 144, depth: 84, shift: 0.37, island: { x: 31, z: -9, r: 7 } };
}

/**
 * Calm, constant swell: long slow waves from two directions, no short chop, so the idle sea
 * reads as heavy water (honey-slow) and never twitches. World units, seconds.
 */
function swell(px: number, pz: number, t: number): number {
  return (
    Math.sin(px * 0.055 + pz * 0.04 - t * 0.5) * 0.55 +
    Math.sin(-px * 0.03 + pz * 0.07 - t * 0.36) * 0.35 +
    Math.sin(px * 0.12 + pz * 0.02 - t * 0.7) * 0.08
  );
}

export const createSea3D: SeaFactory = (options: SeaOptions): SeaRenderer => {
  let renderer: WebGLRenderer | null = null;
  let frame = 0;
  let paused = false;
  let destroyed = false;
  /** Day (0) → night (1), set from outside, applied in the render loop. */
  let night = 0;
  let applied = -1;
  const cleanups: (() => void)[] = [];

  async function mount(layer: HTMLElement): Promise<void> {
    const box = layer.getBoundingClientRect();
    const aspect = box.width / Math.max(1, box.height);
    const { width: W, depth: D, shift, island } = gridFor(aspect);
    const N = W * D;
    // Grid cell (x, z) sits at world (x + X0, z + Z0).
    const X0 = -W * shift;
    const Z0 = NEAR_Z - D;

    renderer = new WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
      failIfMajorPerformanceCaveat: !options.allowSoftware,
    });
    if (!options.allowSoftware && isSoftwareRenderer(renderer.getContext())) {
      throw new Error('No hardware WebGL (software renderer)');
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setSize(box.width, box.height, false);
    const canvas = renderer.domElement;
    canvas.className = 'hero-sea-live';
    // The sky is a CSS gradient behind the transparent canvas: cheaper than a sky mesh.
    // Sky: a CSS gradient behind the transparent canvas that reaches exactly the fog colour at
    // the horizon line (set in placeCamera), so the fogged far water melts into the sky.
    let horizonPct = 50;
    let palette = DAY;
    const setSky = () => {
      canvas.style.background = `linear-gradient(${hex(palette.skyA)}, ${hex(palette.skyB)} ${(horizonPct * 0.6).toFixed(1)}%, ${hex(palette.fog)} ${horizonPct.toFixed(1)}%, ${hex(palette.fog)})`;
    };

    const scene = new Scene();
    const fog = new Fog(DAY.fog, 60, 140);
    scene.fog = fog;
    const camera = new PerspectiveCamera(32, aspect, 1, 300);
    const hemi = new HemisphereLight(0xffffff, 0x2a6d8c, DAY.hemi);
    const sun = new DirectionalLight(0xffffff, DAY.sun);
    sun.position.set(-30, 60, 40);
    scene.add(hemi, sun);

    // Column + stud merged into one geometry, top of the stud base at y = 0.
    const column = new BoxGeometry(0.96, COLUMN, 0.96).translate(0, -COLUMN / 2, 0);
    const stud = new CylinderGeometry(0.28, 0.28, 0.18, 8).translate(0, 0.09, 0);
    const geometry = mergeGeometries([column, stud]);
    column.dispose();
    stud.dispose();
    if (!geometry) throw new Error('could not build the stud geometry');
    const material = new MeshStandardMaterial({ roughness: 0.42 });
    const mesh = new InstancedMesh(geometry, material, N);
    mesh.frustumCulled = false;
    scene.add(mesh);

    // Far water: a flat plane under and around the stud grid, in the sea's average colour.
    // Wherever the grid ends, this continues to the horizon and dissolves into the fog.
    const farGeometry = new PlaneGeometry(4000, 4000).rotateX(-Math.PI / 2);
    const farMaterial = new MeshStandardMaterial({
      color: new Color(DAY.deep).lerp(new Color(DAY.mid), 0.55),
      roughness: 0.6,
    });
    const far = new Mesh(farGeometry, farMaterial);
    // Below the deepest swell trough (≈ −1), so it never pokes through the studs.
    far.position.y = BASE - 1.6;
    scene.add(far);

    // --- neon light sticks (Junction 2026 photos): crossing pairs standing in the far water,
    // invisible by day, glowing at night; their streaks are added to the water colours below.
    const STICK_Z = -40;
    const stickDefs: [number, number, number][] =
      aspect < 1
        ? [
            [-14, 9, 0],
            [-4, -9, 1],
            [4, 10, 2],
            [14, -8, 0],
          ]
        : [
            [6, 10, 0],
            [13, -10, 1],
            [20, 11, 2],
            [27, -9, 0],
            [34, 10, 1],
            [41, -11, 2],
            [47, 8, 0],
          ];
    const stickGeometry = new CylinderGeometry(0.22, 0.22, 30, 8).translate(0, 15, 0);
    const haloGeometry = new CylinderGeometry(1.1, 1.1, 30, 8).translate(0, 15, 0);
    const sticks = stickDefs.map(([bx, lean, c]) => {
      const neon = new Color(NEON[c]!);
      const core = new Mesh(
        stickGeometry,
        new MeshBasicMaterial({
          color: neon.clone().lerp(new Color(0xffffff), 0.45),
          transparent: true,
          opacity: 0,
          fog: false,
        }),
      );
      const halo = new Mesh(
        haloGeometry,
        new MeshBasicMaterial({
          color: neon,
          transparent: true,
          opacity: 0,
          blending: AdditiveBlending,
          depthWrite: false,
          fog: false,
        }),
      );
      const angle = Math.atan2(lean, 30);
      for (const m of [core, halo]) {
        m.position.set(bx, BASE - 1, STICK_Z);
        m.rotation.z = -angle;
        m.visible = false;
        scene.add(m);
      }
      return { core, halo, bx, tx: bx + lean, color: neon };
    });
    const streak = new Color();
    const rowCentre = new Float32Array(stickDefs.length);

    const mask = islandMask(W, D, island.x - X0, island.z - Z0, island.r);
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
      // The island rides the swell: it rises and falls with the water at its centre and tilts
      // gently with the local slope.
      const islandLift = swell(island.x, island.z, t) * 0.7;
      const islandSwell = swell(island.x, island.z, t);
      for (let z = 0; z < D; z++) {
        const pz = z + Z0;
        // Reflection terms that only depend on the row: computed once, not per cell.
        const reflect = night > 0.01 && pz > STICK_Z;
        const tt = reflect ? Math.min(1, (pz - STICK_Z) / (NEAR_Z - STICK_Z)) : 0;
        const rowWobble = reflect ? Math.sin(pz * 0.9 + t * 2.2) * 0.35 : 0;
        const width = 1.3 + tt * 3.2;
        const reach = Math.sqrt(width) * 2.6 + 4; // beyond this exp() < 0.02 even with slope
        const rowFade = (1 - tt * 0.55) * 1.6 * night;
        if (reflect) {
          for (let k = 0; k < sticks.length; k++) {
            const st = sticks[k]!;
            rowCentre[k] = st.bx + (st.tx - st.bx) * tt * 0.55 + rowWobble;
          }
        }
        let prevS = swell(X0 - 1, pz, t);
        for (let x = 0; x < W; x++) {
          const i = z * W + x;
          const px = x + X0;
          const cell = mask[i];
          const s = swell(px, pz, t);
          let top: number;
          if (cell) {
            top = BASE + (cell === 2 ? 2.6 : 1.4) + islandLift + (s - islandSwell) * 0.35;
            color.copy(cell === 2 ? grass : sand);
          } else {
            const hi = h[i]!;
            top = BASE + hi + s;
            // Crests a little lighter, troughs a little deeper: the swell reads even at rest.
            const k = Math.min(1, Math.max(0, (hi + s * 0.6) * 0.45 + 0.45));
            color.copy(deep).lerp(mid, Math.min(1, k * 1.4));
            if (hi > 1.1) color.lerp(foam, Math.min(1, (hi - 1.1) * 0.7));
            if (reflect) {
              // Reflections: each stick throws a streak towards the viewer; the waves bend it
              // (local slope shifts x) and the swell breaks it into bands.
              const slope =
                (x < W - 1 ? h[i + 1]! : hi) - (x > 0 ? h[i - 1]! : hi) + (s - prevS) * 2;
              const crest = 0.55 + 0.45 * Math.max(0, Math.min(1, hi + s + 0.6));
              for (let k = 0; k < sticks.length; k++) {
                const dx = px - rowCentre[k]! - slope * 3.2;
                if (dx > reach || dx < -reach) continue;
                const intensity = Math.exp((-dx * dx) / width) * crest * rowFade;
                if (intensity > 0.032)
                  color.add(streak.copy(sticks[k]!.color).multiplyScalar(intensity));
              }
            }
          }
          m4.makeTranslation(px, top, pz);
          mesh.setMatrixAt(i, m4);
          mesh.setColorAt(i, color);
          prevS = s;
        }
      }
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }

    function placeCamera(): void {
      const a = camera.aspect;
      const dist = a < 1 ? 110 : 82;
      // At night the camera drops a little so the reflections stretch towards the viewer.
      camera.position.set(-6, dist * (0.62 - 0.14 * night), dist * (0.78 + 0.06 * night));
      camera.lookAt(a < 1 ? 0 : 10, (a < 1 ? 14 : 13) - 3 * night, -2);
      camera.updateProjectionMatrix();
      // Fog reaches the sky colour right at the grid's back edge, so no edge is ever visible.
      const back = Math.hypot(camera.position.x, camera.position.y - BASE, camera.position.z - Z0);
      fog.far = back * 0.97;
      fog.near = back * 0.66;
      // Where does the (infinitely far) sea meet the sky on screen? Put the gradient's fog stop there.
      const horizon = new Vector3(camera.position.x, BASE, camera.position.z - 1e5).project(camera);
      horizonPct = Math.min(100, Math.max(0, (1 - horizon.y) * 50));
      setSky();
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
      const gx = hit.x - X0;
      const gz = hit.z - Z0;
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
      while (acc > STEP) {
        if (sweep > 0 && sweep < 1) liquid.pushColumn(sweep * W * 0.62, 0.55 * (1 - sweep * 0.5));
        liquid.step();
        acc -= STEP;
      }
      if (Math.abs(night - applied) > 1e-3) applyNight(t);
      write(t);
      renderer.render(scene, camera);
      if (first) {
        first = false;
        canvas.classList.add('is-ready');
        resolveFirst();
      }
      if (!paused) frame = requestAnimationFrame(tick);
    }

    /** Palette, fog, lights, sky, sticks and camera for the current hour. */
    function applyNight(t: number): void {
      applied = night;
      palette = mixPalette(night);
      deep.set(palette.deep);
      mid.set(palette.mid);
      foam.set(palette.foam);
      sand.set(palette.sand);
      grass.set(palette.grass);
      fog.color.set(palette.fog);
      farMaterial.color.set(palette.deep).lerp(new Color(palette.mid), 0.55);
      hemi.intensity = palette.hemi;
      sun.intensity = palette.sun;
      for (const st of sticks) {
        const on = night > 0.01;
        st.core.visible = on;
        st.halo.visible = on;
        (st.core.material as MeshBasicMaterial).opacity = night;
        (st.halo.material as MeshBasicMaterial).opacity =
          0.22 * night * (0.85 + 0.15 * Math.sin(t * 3 + st.bx));
      }
      placeCamera();
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
      farGeometry.dispose();
      farMaterial.dispose();
      stickGeometry.dispose();
      haloGeometry.dispose();
      for (const st of sticks) {
        (st.core.material as MeshBasicMaterial).dispose();
        (st.halo.material as MeshBasicMaterial).dispose();
      }
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
    setProgress(p) {
      night = Math.min(1, Math.max(0, p));
    },
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
