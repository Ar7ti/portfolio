/**
 * The Sky Island's props, built from toy bricks: a striped lighthouse (tower, gallery with a
 * rail, glass lantern room with a lens, cap), two brick trees and a few rocks. Glossy plastic
 * (MeshPhysicalMaterial with clearcoat) lit by its own sun / sky / neon lights that follow the
 * hour, so it reads like the sea's bricks but with real material response.
 */
import {
  AmbientLight,
  BoxGeometry,
  Color,
  CylinderGeometry,
  DirectionalLight,
  Group,
  HemisphereLight,
  Mesh,
  MeshPhysicalMaterial,
  PointLight,
  type BufferGeometry,
  type Scene,
} from 'three';
import { NEON } from './palette';

const plastic = (color: number, extra: Partial<MeshPhysicalMaterial> = {}) =>
  new MeshPhysicalMaterial({
    color,
    roughness: 0.32,
    clearcoat: 0.7,
    clearcoatRoughness: 0.18,
    ...extra,
  });

export interface IslandProps {
  group: Group;
  /** Sun direction (towards the sun), colour and power; sky colour; night 0–1. */
  update(
    sun: { dir: [number, number, number]; color: [number, number, number]; power: number },
    sky: Color,
    night: number,
    t: number,
  ): void;
  /** Places the props on the island's grass top (world units). */
  place(x: number, y: number, z: number, scale: number): void;
  dispose(): void;
}

export function createIslandProps(
  soft: boolean,
  scene: Scene,
  sticks: { x: number; z: number; color: number }[],
): IslandProps {
  const group = new Group();
  const geometries: BufferGeometry[] = [];
  const materials: MeshPhysicalMaterial[] = [];
  const add = (
    geometry: BufferGeometry,
    material: MeshPhysicalMaterial,
    x: number,
    y: number,
    z: number,
  ) => {
    geometries.push(geometry);
    if (!materials.includes(material)) materials.push(material);
    const m = new Mesh(geometry, material);
    m.position.set(x, y, z);
    group.add(m);
    return m;
  };

  const white = plastic(0xf2efe8);
  const red = plastic(0xc8261e);
  const dark = plastic(0x2b3340, { roughness: 0.4 });
  const glass = new MeshPhysicalMaterial({
    color: 0xfff1d0,
    emissive: new Color(0xffb35a),
    emissiveIntensity: 0,
    roughness: 0.1,
    transmission: 0,
    clearcoat: 1,
  });
  const lens = new MeshPhysicalMaterial({
    color: 0xffffff,
    emissive: new Color(0xffd28a),
    emissiveIntensity: 0,
    roughness: 0.05,
  });
  const trunk = plastic(0x7a4a2a);
  const leaf = plastic(0x2f8a3e, { clearcoat: 0.15, roughness: 0.55 });
  const leafLight = plastic(0x4fae5a, { clearcoat: 0.15, roughness: 0.55 });
  const rock = plastic(0x8d939b, { roughness: 0.55, clearcoat: 0.2 });

  // Lighthouse: five stacked round bricks, white / red, each with its studs ring implied by a
  // slightly narrower collar (reads as stacked 2×2 round bricks).
  const R = 0.95;
  let y = 0;
  for (let i = 0; i < 5; i++) {
    const h = 0.9;
    add(
      new CylinderGeometry(R - i * 0.04, R - i * 0.04 + 0.03, h, 24),
      i % 2 ? red : white,
      0,
      y + h / 2,
      0,
    );
    add(
      new CylinderGeometry(R - i * 0.04 - 0.08, R - i * 0.04 - 0.08, 0.08, 24),
      i % 2 ? red : white,
      0,
      y + h + 0.04,
      0,
    );
    y += h + 0.08;
  }
  // Gallery: a wide dark platform with a thin rail on posts.
  add(new CylinderGeometry(1.35, 1.35, 0.18, 28), dark, 0, y + 0.09, 0);
  for (let k = 0; k < 10; k++) {
    const a = (k / 10) * Math.PI * 2;
    add(new BoxGeometry(0.07, 0.45, 0.07), dark, Math.cos(a) * 1.25, y + 0.4, Math.sin(a) * 1.25);
  }
  add(new CylinderGeometry(1.27, 1.27, 0.06, 28, 1, true), dark, 0, y + 0.62, 0);
  y += 0.18;
  // Lantern room: glass with a bright lens inside, then a red cap and a stud on top.
  add(new CylinderGeometry(0.72, 0.72, 0.95, 16), glass, 0, y + 0.48, 0);
  add(new CylinderGeometry(0.28, 0.28, 0.5, 12), lens, 0, y + 0.48, 0);
  y += 0.95;
  add(new CylinderGeometry(0.2, 0.95, 0.6, 16), red, 0, y + 0.3, 0);
  add(new CylinderGeometry(0.16, 0.16, 0.25, 10), dark, 0, y + 0.72, 0);
  const lampY = y - 0.48;

  // Trees: brick trunks with stacked leaf blocks (voxel cones).
  const tree = (x: number, z: number, s: number) => {
    add(new BoxGeometry(0.5 * s, 1.2 * s, 0.5 * s), trunk, x, 0.6 * s, z);
    add(new BoxGeometry(1.9 * s, 0.7 * s, 1.9 * s), leaf, x, 1.5 * s, z);
    add(new BoxGeometry(1.3 * s, 0.6 * s, 1.3 * s), leafLight, x, 2.15 * s, z);
    add(new BoxGeometry(0.7 * s, 0.5 * s, 0.7 * s), leaf, x, 2.7 * s, z);
  };
  tree(-2.3, 0.8, 1);
  tree(-1.4, -1.9, 0.8);
  // Rocks at the waterline.
  for (const [x, z, s] of [
    [2.6, 1.6, 0.8],
    [3.1, -0.6, 0.55],
    [-3.2, -0.9, 0.6],
  ] as const) {
    add(new BoxGeometry(s * 1.1, s * 0.6, s * 0.9), rock, x, -1.0 + s * 0.3, z);
  }

  // Lights for the props only (the sea has its own shading).
  const sun = new DirectionalLight(0xffffff, 2);
  const hemi = new HemisphereLight(0xffffff, 0x2a6d8c, 0.8);
  const fill = new AmbientLight(0x404060, 0.06);
  // The sun is behind the island from the camera (it glints on the water); a soft key from the
  // viewer's side keeps the props' colours readable, the sun becomes their rim light.
  const key = new DirectionalLight(0xffffff, 1);
  key.position.set(-20, 30, 60);
  const lamp = new PointLight(0xffb35a, 0, 30, 1.6);
  lamp.position.set(0, lampY, 0);
  group.add(sun, sun.target, key, key.target, hemi, fill, lamp);
  const neon = sticks.map((s) => {
    const l = new PointLight(new Color(NEON[s.color]!), 0, 120, 1.2);
    l.position.set(s.x, 6, s.z);
    scene.add(l);
    return l;
  });
  // Software WebGL (tests/CI): the physical materials would take minutes to compile on the CPU.
  group.visible = !soft;
  scene.add(group);

  return {
    group,
    place(x, py, z, scale) {
      group.position.set(x, py, z);
      group.scale.setScalar(scale);
      for (let i = 0; i < neon.length; i++)
        neon[i]!.position.set(sticks[i]!.x - x, 6 - py, sticks[i]!.z - z).add(group.position);
    },
    update(s, sky, n, t) {
      sun.position.set(s.dir[0] * 50, s.dir[1] * 50, s.dir[2] * 50);
      sun.color.setRGB(...s.color);
      sun.intensity = s.power * 0.9;
      key.color.setRGB(...s.color).lerp(sky, 0.4);
      key.intensity = 1.6 * (1 - 0.85 * n);
      hemi.color.copy(sky);
      hemi.intensity = 0.32 * (1 - 0.6 * n);
      const on = Math.min(1, Math.max(0, (n - 0.55) / 0.35));
      lamp.intensity = on * (18 + 2 * Math.sin(t * 2));
      glass.emissiveIntensity = on * 0.9;
      lens.emissiveIntensity = on * 3.5;
      for (const l of neon) l.intensity = on * 260;
    },
    dispose() {
      for (const g of geometries) g.dispose();
      for (const m of [...materials, glass, lens]) m.dispose();
      for (const l of neon) scene.remove(l);
      scene.remove(group);
    },
  };
}
