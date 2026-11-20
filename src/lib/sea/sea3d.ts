/**
 * Tier 2: the "Stud Tide" sea in three.js. Loaded with a dynamic import after first paint,
 * never in the initial bundle.
 *
 * One instanced draw: every cell is a block with a stud on top. The CPU runs the thick liquid
 * (fixed 60 Hz step) and uploads its height field as a float texture; the vertex shader places
 * and colours every block (swell, island, foam, neon streaks) and the fragment shader lights it
 * as glossy toy plastic under a real sky (sea3d-shaders.ts). The frame then goes through a
 * small post chain: bloom (neon, sun glints), ACES tone mapping, a soft far blur at the
 * horizon, vignette and grain.
 */
import {
  AdditiveBlending,
  BackSide,
  DoubleSide,
  FrontSide,
  BoxGeometry,
  Color,
  CylinderGeometry,
  DataTexture,
  FloatType,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  Mesh,
  NearestFilter,
  PerspectiveCamera,
  Plane,
  PlaneGeometry,
  RingGeometry,
  Raycaster,
  RedFormat,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  Vector2,
  Vector3,
  Vector4,
  WebGLRenderer,
  WebGLRenderTarget,
  HalfFloatType,
  ACESFilmicToneMapping,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { DAY, mixPalette, NEON, skyAt, sunAt, type SeaPalette } from './palette';
import { islandMask, Liquid } from './liquid';
import { createIslandProps } from './island-props';
import { isSoftwareRenderer } from './tiers';
import type { SeaFactory, SeaOptions, SeaRenderer } from './types';
import {
  FAR_VERTEX,
  FINISH_FRAGMENT,
  SEA_FRAGMENT,
  SEA_VERTEX,
  SKY_FRAGMENT,
  SKY_VERTEX,
  BEAM_VERTEX,
  BEAM_FRAGMENT,
} from './sea3d-shaders';

/** Sea surface rest height (world units) and column depth below the surface. */
const BASE = 3;
const COLUMN = 8;
const STEP = 1 / 60;

/** World z of the grid's near edge (towards the camera); the grid runs back from here. */
const NEAR_Z = 60;
const STICK_Z = -34;

interface Grid {
  width: number;
  depth: number;
  /** Share of the grid left of x = 0: the camera looks right, so the grid extends further right. */
  shift: number;
  /** Island centre in world units (x right, z towards the camera). */
  island: { x: number; z: number; r: number };
}

function gridFor(aspect: number): Grid {
  // Wide and deep enough that the side and back edges are always outside the view or inside
  // full haze, so the sea runs to the horizon at any width.
  return aspect < 1
    ? { width: 64, depth: 80, shift: 0.5, island: { x: 10, z: 2, r: 5 } }
    : { width: 184, depth: 160, shift: 0.36, island: { x: 31, z: 4, r: 9 } };
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

    renderer = new WebGLRenderer({
      antialias: false,
      alpha: false,
      powerPreference: 'high-performance',
      failIfMajorPerformanceCaveat: !options.allowSoftware,
    });
    if (!options.allowSoftware && isSoftwareRenderer(renderer.getContext())) {
      throw new Error('No hardware WebGL (software renderer)');
    }
    // Software WebGL (only reachable with ?tier= / ?gpu=software, i.e. tests and CI): a light
    // version of the same scene, so a CPU renderer can draw it in reasonable time.
    const soft = isSoftwareRenderer(renderer.getContext());
    const full = gridFor(aspect);
    // Software WebGL: a smaller grid (fewer instances); the camera sees the same framing.
    const W = soft ? Math.round(full.width * 0.45) : full.width;
    const D = soft ? Math.round(full.depth * 0.45) : full.depth;
    const { shift, island } = full;
    const N = W * D;
    // Grid cell (x, z) sits at world (x + X0, z + Z0).
    const X0 = Math.round(-W * shift);
    const Z0 = NEAR_Z - D;
    const dpr = soft ? 1 : Math.min(window.devicePixelRatio || 1, 1.5);
    renderer.setPixelRatio(dpr);
    renderer.setSize(box.width, box.height, false);
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.9;
    const canvas = renderer.domElement;
    canvas.className = 'hero-sea-live';

    const scene = new Scene();
    const camera = new PerspectiveCamera(35, aspect, 0.5, 3000);

    // --- sky dome (drawn first, at the far plane)
    const skyUniforms = {
      uSkyTop: { value: new Color() },
      uSkyMid: { value: new Color() },
      uHaze: { value: new Color() },
      uSunDir: { value: new Vector3() },
      uSunColor: { value: new Color() },
      uSunGlow: { value: 1 },
      uNight: { value: 0 },
    };
    const skyGeometry = new SphereGeometry(100, 32, 16);
    const skyMaterial = new ShaderMaterial({
      uniforms: skyUniforms,
      vertexShader: SKY_VERTEX,
      fragmentShader: SKY_FRAGMENT,
      side: BackSide,
      depthWrite: false,
    });
    const skyMesh = new Mesh(skyGeometry, skyMaterial);
    skyMesh.frustumCulled = false;
    skyMesh.renderOrder = -1;
    scene.add(skyMesh);

    // --- the blocks: column + stud merged, one instance per cell
    const column = new BoxGeometry(0.96, COLUMN, 0.96).translate(0, -COLUMN / 2, 0);
    const stud = new CylinderGeometry(0.28, 0.3, 0.2, soft ? 6 : 12).translate(0, 0.1, 0);
    const merged = mergeGeometries([column, stud]);
    column.dispose();
    stud.dispose();
    if (!merged) throw new Error('could not build the stud geometry');
    const geometry = new InstancedBufferGeometry();
    geometry.index = merged.index;
    geometry.setAttribute('position', merged.getAttribute('position'));
    geometry.setAttribute('normal', merged.getAttribute('normal'));
    const cells = new Float32Array(N * 2);
    for (let z = 0; z < D; z++)
      for (let x = 0; x < W; x++) {
        cells[(z * W + x) * 2] = x;
        cells[(z * W + x) * 2 + 1] = z;
      }
    geometry.setAttribute('aCell', new InstancedBufferAttribute(cells, 2));
    geometry.instanceCount = N;

    const mask = islandMask(W, D, island.x - X0, island.z - Z0, island.r);
    // Rings spread further and settle over a few seconds (still thick, no ringing).
    const liquid = new Liquid({
      width: W,
      depth: D,
      solid: mask,
      spring: 0.32,
      damping: 0.986,
      viscosity: 0.05,
    });
    // Dev only (scripts/hero-still.mjs): '?still=sea' renders the frozen sea without the island,
    // '?still=island' the same frame with the island (the sprite is their difference).
    const still = import.meta.env.DEV ? new URLSearchParams(location.search).get('still') : null;
    if (still === 'sea') mask.fill(0);

    const heightTex = new DataTexture(liquid.height, W, D, RedFormat, FloatType);
    heightTex.minFilter = heightTex.magFilter = NearestFilter;
    heightTex.needsUpdate = true;
    const maskData = new Float32Array(N);
    const maskTex = new DataTexture(maskData, W, D, RedFormat, FloatType);
    maskTex.minFilter = maskTex.magFilter = NearestFilter;
    const syncMask = () => {
      for (let i = 0; i < N; i++) maskData[i] = mask[i]!;
      maskTex.needsUpdate = true;
    };
    syncMask();

    const stickDefs: [number, number, number][] =
      aspect < 1
        ? [
            [-14, 9, 0],
            [-4, -9, 1],
            [4, 10, 2],
            [14, -8, 0],
          ]
        : [
            // Three upright light pillars far out (the Junction 2026 neon), framing the island.
            [4, 0, 0],
            [22, 0, 2],
            [44, 0, 1],
          ];
    const stickUniform = Array.from({ length: 7 }, (_, i) => {
      const d = stickDefs[i];
      return d ? new Vector4(d[0], d[0] + d[1], d[2], 1) : new Vector4(0, 0, 0, 0);
    });

    const seaUniforms = {
      ...skyUniforms,
      uHeight: { value: heightTex },
      uMask: { value: maskTex },
      uGrid: { value: new Vector4(X0, Z0, W, D) },
      uTime: { value: 0 },
      uTimeF: { value: 0 },
      uBase: { value: BASE },
      uIsland: { value: new Vector3(island.x, island.z, island.r) },
      uDeep: { value: new Color() },
      uMid: { value: new Color() },
      uFoam: { value: new Color() },
      uSand: { value: new Color() },
      uGrass: { value: new Color() },
      uNightV: { value: 0 },
      uSticks: { value: stickUniform },
      uNeon: { value: NEON.map((c) => new Color(c).multiplyScalar(1.6)) },
      uStickZ: { value: STICK_Z },
      uNearZ: { value: NEAR_Z },
      uCam: { value: new Vector3() },
      uAmbient: { value: new Color() },
      uSunPower: { value: 1 },
      uFogNear: { value: 60 },
      uFogFar: { value: 140 },
      uMistZ: { value: Z0 },
      uMistK: { value: 0.35 },
      uIslandF: { value: new Vector3(island.x, island.z, island.r) },
      uSunDirV: { value: new Vector3(0.4, 0.5, -1).normalize() },
    };
    const material = new ShaderMaterial({
      uniforms: seaUniforms,
      vertexShader: SEA_VERTEX,
      fragmentShader: SEA_FRAGMENT,
    });
    const mesh = new Mesh(geometry, material);
    mesh.frustumCulled = false;
    scene.add(mesh);

    // Far water to the horizon, just under the lowest block tops (hidden beneath the grid).
    // Dense near (it follows the swell), then a huge flat ring out to the horizon.
    const cx = X0 + W / 2;
    const cz = Z0 + D / 2;
    const farGeometry = new PlaneGeometry(900, 900, soft ? 60 : 300, soft ? 60 : 300)
      .rotateX(-Math.PI / 2)
      .translate(cx, 0, cz);
    // A ring with a hole under the grid: pushed-down blocks must never reveal a flat plane.
    const horizonGeometry = new RingGeometry(430, 9000, 96, 1)
      .rotateX(-Math.PI / 2)
      .translate(cx, 0, cz);
    const farMaterial = new ShaderMaterial({
      uniforms: seaUniforms,
      vertexShader: FAR_VERTEX,
      fragmentShader: SEA_FRAGMENT,
    });
    const far = new Mesh(farGeometry, farMaterial);
    far.frustumCulled = false;
    // The horizon plane sits a hair lower, so where both exist the dense one wins.
    const horizon = new Mesh(horizonGeometry, farMaterial);
    horizon.position.y = -0.6;
    horizon.frustumCulled = false;
    scene.add(far, horizon);

    // --- neon light sticks (Junction 2026 photos): crossing pairs standing in the far water,
    // invisible by day, glowing at night (HDR colours, so the bloom pass gives them a halo).
    const stickGeometry = new CylinderGeometry(0.2, 0.2, 30, 8).translate(0, 15, 0);
    const haloGeometry = new CylinderGeometry(1.6, 1.6, 30, 16, 1, true).translate(0, 15, 0);
    const beamMaterial = (color: Color, halo: boolean) =>
      new ShaderMaterial({
        uniforms: {
          uColor: { value: color },
          uOpacity: { value: 0 },
          uHalo: { value: halo ? 1 : 0 },
        },
        vertexShader: BEAM_VERTEX,
        fragmentShader: BEAM_FRAGMENT,
        transparent: true,
        blending: AdditiveBlending,
        depthWrite: false,
        side: halo ? DoubleSide : FrontSide,
      });
    const sticks = stickDefs.map(([bx, lean, c]) => {
      const neon = new Color(NEON[c]!);
      // Core: bright (bloom picks it up); halo: a soft volume of light around it.
      const core = new Mesh(
        stickGeometry,
        beamMaterial(neon.clone().lerp(new Color(0xffffff), 0.15).multiplyScalar(5.5), false),
      );
      const halo = new Mesh(haloGeometry, beamMaterial(neon.clone().multiplyScalar(0.9), true));
      for (const m of [core, halo]) {
        m.position.set(bx, BASE - 1, STICK_Z);
        m.rotation.z = -Math.atan2(lean, 30);
        m.visible = false;
        scene.add(m);
      }
      return { core, halo, bx };
    });

    // --- island props: brick lighthouse, trees, rocks (glossy plastic, own lights)
    const props = createIslandProps(
      soft,
      scene,
      stickDefs.map(([x, , c]) => ({ x, z: STICK_Z, color: c })),
    );
    const islandSwell = (t: number) =>
      (Math.sin(island.x * 0.055 + island.z * 0.04 - t * 0.5) * 0.55 +
        Math.sin(-island.x * 0.03 + island.z * 0.07 - t * 0.36) * 0.35) *
      0.25;

    // --- post: render → bloom (half res) → ACES + sRGB → far blur, vignette, grain
    // Multisampled HDR target: clean brick edges without a separate AA pass.
    const target = new WebGLRenderTarget(box.width * dpr, box.height * dpr, {
      type: HalfFloatType,
      samples: soft ? 0 : 4,
    });
    const composer = new EffectComposer(renderer, target);
    composer.setPixelRatio(dpr);
    composer.setSize(box.width, box.height);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(new Vector2(box.width / 2, box.height / 2), 0.3, 0.42, 0.9);
    if (!soft) composer.addPass(bloom);
    composer.addPass(new OutputPass());
    const finish = new ShaderPass({
      uniforms: {
        tDiffuse: { value: null },
        uRes: { value: new Vector2(box.width * dpr, box.height * dpr) },
        uTime: { value: 0 },
        uHorizon: { value: 0.8 },
        uGrain: { value: 0.026 },
      },
      vertexShader: /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: FINISH_FRAGMENT,
    });
    composer.addPass(finish);

    /** Scroll (0 at the top of the hero, 1 a screen down) and pointer parallax, both smoothed. */
    let lift = 0;
    let liftTarget = 0;
    let parallax = 0;
    let parallaxTarget = 0;

    function pose(cam: PerspectiveCamera, n: number, k = 0, px = 0): void {
      const a = cam.aspect;
      if (a < 1) {
        cam.position.set(-2 + px, 60 * (1 - 0.15 * n) + k * 6, 100);
        cam.lookAt(0, 8 - 3 * n - k * 4, -10);
      } else {
        // Low, cinematic: the horizon sits in the top quarter, the sun glints towards the viewer.
        // Day → night pushes in and drifts right towards the island, lower and closer.
        cam.position.set(-4 + px + 8 * n, 21 * (1 - 0.12 * n) + k * 7, 74 - 12 * n);
        cam.lookAt(14 + px * 0.5 + 8 * n, 5.5 - 0.6 * n - k * 5, -20);
      }
      cam.updateProjectionMatrix();
      cam.updateMatrixWorld();
    }

    let palette: SeaPalette = mixPalette(0);
    function placeCamera(): void {
      pose(camera, night, lift, parallax);
      seaUniforms.uCam.value.copy(camera.position);
      // Haze reaches full strength before the grid's back edge, so no edge is ever visible.
      // Light atmospheric haze: the sea itself now runs to the horizon (far water plane).
      const horizon = new Vector3(camera.position.x, BASE, camera.position.z - 1e4).project(camera);
      finish.uniforms['uHorizon']!.value = Math.min(1.2, Math.max(-0.2, (horizon.y + 1) / 2));
    }

    // --- keep the island clear of the hero text (same rule as before; see tests/hero-island)
    const home = { x: island.x, z: island.z };
    const homeR = island.r;
    /** Props are modelled for an island of radius 7. */
    let propScale = homeR / 7;
    const probe = new PerspectiveCamera(35, aspect, 0.5, 600);
    const corner = new Vector3();
    function islandBox(cx: number, cz: number, w: number, h: number): DOMRect {
      let x0 = Infinity;
      let y0 = Infinity;
      let x1 = -Infinity;
      let y1 = -Infinity;
      // The island's footprint up to its grass top, plus the lighthouse (a narrow column up to
      // its cap): their union is what must stay clear of the text.
      const pts: [number, number, number][] = [];
      for (const dx of [-1, 1])
        for (const dz of [-1, 1]) {
          for (const y of [BASE - 1, BASE + 4.5])
            pts.push([cx + dx * island.r, y, cz + (dz * island.r) / 1.25]);
          const k = island.r / 7;
          for (const y of [BASE + 4.5, BASE + 2.6 + 9 * k])
            pts.push([cx + k + dx * 2.2 * k, y, cz - 0.5 * k + dz * 2.2 * k]);
        }
      for (const [px, py, pz] of pts) {
        corner.set(px, py, pz).project(probe);
        const sx = ((corner.x + 1) / 2) * w;
        const sy = ((1 - corner.y) / 2) * h;
        x0 = Math.min(x0, sx);
        x1 = Math.max(x1, sx);
        y0 = Math.min(y0, sy);
        y1 = Math.max(y1, sy);
      }
      return new DOMRect(x0, y0, x1 - x0, y1 - y0);
    }
    function placeIsland(): void {
      const r = layer.getBoundingClientRect();
      const boxes = still || r.width < r.height ? [] : (options.avoid?.() ?? []);
      if (!r.width || !r.height) return;
      probe.aspect = r.width / r.height;
      pose(probe, 0);
      const gap = 28;
      const clear = (b: DOMRect) =>
        b.right <= r.width - 16 &&
        boxes.every(
          (t) =>
            b.right <= t.left - gap ||
            b.left >= t.right + gap ||
            b.bottom <= t.top - gap ||
            b.top >= t.bottom + gap,
        );
      // The biggest island that fits: full size first, then smaller (never over the text).
      let best = home;
      let bestR = homeR;
      for (const radius of [homeR, homeR * 0.85, homeR * 0.72, homeR * 0.6]) {
        island.r = radius;
        const maxX = X0 + W - radius - 2;
        const minZ = Math.max(Z0 + radius + 2, home.z - 70);
        let found: { x: number; z: number } | null = null;
        let bestCost = Infinity;
        for (let z = home.z; boxes.length && z >= minZ; z--) {
          // Depth costs more than sideways: it changes the island's size.
          for (let x = home.x; x <= maxX; x++) {
            const cost = x - home.x + (home.z - z) * 1.5;
            if (cost >= bestCost) break;
            if (clear(islandBox(x, z, r.width, r.height))) {
              found = { x, z };
              bestCost = cost;
              break;
            }
          }
        }
        if (found || !boxes.length) {
          best = found ?? home;
          bestR = radius;
          break;
        }
      }
      island.r = bestR;
      propScale = bestR / 7;
      // Exposed for the hero layout test (tests/hero-island.spec.ts).
      const b = islandBox(best.x, best.z, r.width, r.height);
      canvas.dataset['island'] = [b.left, b.top, b.right, b.bottom].map(Math.round).join(',');
      if (best.x === island.x && best.z === island.z && seaUniforms.uIsland.value.z === island.r)
        return;
      island.x = best.x;
      island.z = best.z;
      seaUniforms.uIsland.value.set(island.x, island.z, island.r);
      seaUniforms.uIslandF.value.set(island.x, island.z, island.r);
      mask.set(islandMask(W, D, island.x - X0, island.z - Z0, island.r));
      if (still === 'sea') mask.fill(0);
      syncMask();
    }

    function resize(): void {
      if (!renderer) return;
      const r = layer.getBoundingClientRect();
      if (!r.width || !r.height) return;
      renderer.setSize(r.width, r.height, false);
      composer.setSize(r.width, r.height);
      bloom.resolution.set(r.width / 2, r.height / 2);
      finish.uniforms['uRes']!.value.set(r.width * dpr, r.height * dpr);
      camera.aspect = r.width / r.height;
      placeCamera();
      placeIsland();
    }
    placeCamera();
    placeIsland();
    // Layout can still settle after mount (fonts): place it again once they are in.
    void document.fonts?.ready.then(() => !destroyed && placeIsland());

    // --- stirring: the pointer presses the thick surface where it moves; rings spread and settle
    const ray = new Raycaster();
    const ndc = new Vector2();
    const surface = new Plane(new Vector3(0, 1, 0), -BASE);
    const hit = new Vector3();
    let last: [number, number] | null = null;
    const onPointer = (event: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      parallaxTarget = ((event.clientX - r.left) / Math.max(1, r.width) - 0.5) * 2.2;
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
      liquid.impulse(gx, gz, 3.2, -0.13 - speed * 0.14);
      last = [gx, gz];
      wake();
    };
    addEventListener('pointermove', onPointer, { passive: true });
    cleanups.push(() => removeEventListener('pointermove', onPointer));

    // --- scroll: the camera rises a little through the hero; fast scrolls send a soft wave
    let lastScroll = scrollY;
    const onScroll = () => {
      const delta = scrollY - lastScroll;
      lastScroll = scrollY;
      // Rises through the hero, settles back by the next screen (the horizon stays in frame).
      const y = scrollY / Math.max(1, innerHeight);
      const settle = Math.min(1, Math.max(0, (y - 0.85) / 0.3));
      liftTarget = Math.max(0, Math.min(1, y)) * (1 - settle * settle * (3 - 2 * settle));
      // Waves only while the hero is on screen: further down the sea is seen through bands.
      if (delta && scrollY < innerHeight) {
        const k = 0.01 * (1 - 0.75 * night);
        liquid.pushRow(D - 3, Math.max(-0.7, Math.min(0.7, delta * k)));
      }
      wake();
    };
    addEventListener('scroll', onScroll, { passive: true });
    cleanups.push(() => removeEventListener('scroll', onScroll));

    const observer = new ResizeObserver(resize);
    observer.observe(layer);
    cleanups.push(() => observer.disconnect());

    // --- loop: fixed-step sim, render every frame
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
      // A still is one frozen moment, after the opening wave.
      const t = still ? 6 : (now - t0) / 1000;
      acc += Math.min(0.05, ms / 1000);
      // Opening wave: a crest rolls in from the left over ~2 s, then the sea settles.
      const sweep = (t - 0.2) / 1.9;
      while (acc > STEP) {
        if (sweep > 0 && sweep < 1) liquid.pushColumn(sweep * W * 0.62, 0.5 * (1 - sweep * 0.5));
        liquid.step();
        acc -= STEP;
      }
      // Camera follows scroll and pointer on a soft spring-like ease.
      const ease = Math.min(1, ms / 220);
      const movedCam =
        Math.abs(liftTarget - lift) > 1e-4 || Math.abs(parallaxTarget - parallax) > 1e-4;
      lift += (liftTarget - lift) * ease;
      parallax += (parallaxTarget - parallax) * ease * 0.6;
      if (Math.abs(night - applied) > 1e-3) applyNight();
      else if (movedCam && !still) placeCamera();

      heightTex.needsUpdate = true;
      seaUniforms.uTime.value = t;
      seaUniforms.uTimeF.value = t;
      finish.uniforms['uTime']!.value = still ? 0 : t;
      for (const st of sticks) {
        // The sticks light up as dusk turns to night, with a slow flicker.
        const on = Math.min(1, Math.max(0, (night - 0.55) / 0.35));
        const flicker = on * (0.85 + 0.15 * Math.sin(t * 3 + st.bx));
        (st.core.material as ShaderMaterial).uniforms['uOpacity']!.value = flicker;
        (st.halo.material as ShaderMaterial).uniforms['uOpacity']!.value = flicker;
      }
      props.place(
        island.x + propScale,
        BASE + 2.6 + islandSwell(t),
        island.z - 0.5 * propScale,
        propScale,
      );
      // Software WebGL (tests/CI only): straight to the canvas, no post chain.
      if (soft) renderer.render(scene, camera);
      else composer.render();
      if (first) {
        first = false;
        canvas.classList.add('is-ready');
        resolveFirst();
      }
      if (!paused) frame = requestAnimationFrame(tick);
    }

    /** Palette, sun, sky, bloom, sticks and camera for the current hour. */
    function applyNight(): void {
      applied = night;
      palette = mixPalette(night);
      const sun = sunAt(night);
      const sky = skyAt(night);
      skyUniforms.uSkyTop.value.set(sky.top);
      skyUniforms.uSkyMid.value.set(sky.mid);
      skyUniforms.uHaze.value.set(sky.haze);
      skyUniforms.uSunDir.value.set(...sun.dir);
      seaUniforms.uSunDirV.value.set(...sun.dir);
      skyUniforms.uSunColor.value.setRGB(...sun.color);
      skyUniforms.uSunGlow.value = sun.glow;
      skyUniforms.uNight.value = night;
      seaUniforms.uDeep.value.set(palette.deep);
      seaUniforms.uMid.value.set(palette.mid);
      seaUniforms.uFoam.value.set(palette.foam);
      // The island keeps its own plastic colours at every hour: the light sets the mood.
      seaUniforms.uSand.value.set(DAY.sand);
      seaUniforms.uGrass.value.set(DAY.grass);
      // Haze: by day only right at the horizon (clear air, saturated water); denser at dusk/night.
      const hazy = Math.min(1, night * 2);
      seaUniforms.uFogNear.value = 140 - 85 * hazy;
      seaUniforms.uFogFar.value = 520 - 290 * hazy;
      seaUniforms.uMistK.value = 0.35 + 0.45 * hazy;
      seaUniforms.uNightV.value = Math.min(1, Math.max(0, (night - 0.55) / 0.35));
      seaUniforms.uSunPower.value = sun.power;
      seaUniforms.uAmbient.value
        .copy(skyUniforms.uSkyMid.value)
        .multiplyScalar(0.3 + palette.hemi * 0.3)
        .add(new Color(0.012, 0.01, 0.03).multiplyScalar(night));
      bloom.strength = 0.28 + night * 0.75;
      bloom.threshold = 0.9 - night * 0.05;
      bloom.radius = 0.42 + night * 0.25;
      props.update(sun, skyUniforms.uSkyMid.value, night, performance.now() / 1000);
      for (const st of sticks) st.core.visible = st.halo.visible = night > 0.01;
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
      merged.dispose();
      geometry.dispose();
      material.dispose();
      skyGeometry.dispose();
      farGeometry.dispose();
      horizonGeometry.dispose();
      farMaterial.dispose();
      skyMaterial.dispose();
      stickGeometry.dispose();
      heightTex.dispose();
      maskTex.dispose();
      haloGeometry.dispose();
      for (const st of sticks) {
        (st.core.material as ShaderMaterial).dispose();
        (st.halo.material as ShaderMaterial).dispose();
      }
      composer.dispose();
      props.dispose();
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
