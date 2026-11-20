/**
 * GLSL for the tier-2 sea (sea3d.ts). Everything that moves or is lit runs here: the CPU only
 * uploads the liquid height field (one float per cell) each frame.
 *
 * Look: glossy toy plastic (GGX highlight + Fresnel sky reflection + a lit bevel on each block
 * edge), soft ambient occlusion from the neighbouring columns, foam around the island, faint
 * caustic shimmer on the crests, height-and-distance haze into a real sky with a sun, and neon
 * streaks at night. Output is linear HDR; tone mapping (ACES), bloom, grain and vignette happen
 * in the post chain.
 */

/** Shared by both shaders: the calm swell (must match swell() in sea3d.ts). */
const SWELL = /* glsl */ `
float swell(vec2 p, float t) {
  return sin(p.x * 0.055 + p.y * 0.04 - t * 0.5) * 0.55
       + sin(-p.x * 0.03 + p.y * 0.07 - t * 0.36) * 0.35
       + sin(p.x * 0.12 + p.y * 0.02 - t * 0.7) * 0.08
       + sin(p.x * 0.21 - p.y * 0.17 - t * 1.25) * 0.07
       + sin(-p.x * 0.09 + p.y * 0.26 - t * 1.6) * 0.05;
}
`;

/** Sky colour in a world direction; also the haze colour the sea fades into. */
export const SKY = /* glsl */ `
uniform vec3 uSkyTop;
uniform vec3 uSkyMid;
uniform vec3 uHaze;
uniform vec3 uSunDir;
uniform vec3 uSunColor;
uniform float uSunGlow;
uniform float uNight;

vec3 skyBase(vec3 dir) {
  float y = dir.y;
  vec3 col = mix(uHaze, uSkyMid, smoothstep(0.0, 0.045, y));
  col = mix(col, uSkyTop, smoothstep(0.03, 0.2, y));
  // Below the horizon (reflections of the far water): darker haze.
  col = mix(col, uHaze * 0.82, (1.0 - smoothstep(-0.12, 0.0, y)));
  return col;
}

vec3 skyColor(vec3 dir) {
  vec3 col = skyBase(dir);
  float duskS = 1.0 - abs(uNight - 0.5) * 2.0;
  float toSun = max(dot(normalize(vec3(dir.x, 0.0, dir.z)), normalize(vec3(uSunDir.x, 0.0, uSunDir.z))), 0.0);
  col *= mix(vec3(1.0), mix(vec3(0.78, 0.8, 1.08), vec3(1.12, 0.98, 0.86), toSun), max(duskS, 0.0));
  float sd = max(dot(dir, uSunDir), 0.0);
  // Wide warm glow, tighter halo, the disc itself (HDR, so bloom catches it).
  col += uSunColor * (pow(sd, 5.0) * 0.12 + pow(sd, 80.0) * 0.4) * uSunGlow;
  col += uSunColor * smoothstep(0.9993, 0.9997, sd) * 6.0 * uSunGlow;
  return col;
}
`;

export const SEA_VERTEX = /* glsl */ `
precision highp float;
precision highp sampler2D;

attribute vec2 aCell;

uniform sampler2D uHeight;   // liquid height per cell (R32F)
uniform sampler2D uMask;     // island: 0 water, 1 sand, 2 grass (R32F)
uniform vec4 uGrid;          // X0, Z0, W, D
uniform float uTime;
uniform float uBase;
uniform vec3 uIsland;        // x, z, r (world)
uniform vec3 uDeep;
uniform vec3 uMid;
uniform vec3 uFoam;
uniform vec3 uSand;
uniform vec3 uGrass;
uniform float uNightV;
uniform vec4 uSticks[7];     // base x, top x, neon index, active
uniform vec3 uNeon[3];
uniform float uStickZ;
uniform float uNearZ;
uniform vec3 uSunDirV;

varying vec3 vWorld;
varying vec3 vNormal;
varying vec3 vAlbedo;
varying vec3 vGlow;
varying vec3 vLocal;
varying float vAO;
varying float vFoam;
varying float vWater;
varying float vSlope;
varying float vCrest;
varying float vVar;
varying float vTower;

${SWELL}

float cellH(ivec2 c, float t) {
  c = clamp(c, ivec2(0), ivec2(int(uGrid.z) - 1, int(uGrid.w) - 1));
  vec2 p = vec2(c) + uGrid.xy;
  float m = texelFetch(uMask, c, 0).r;
  if (m > 0.5) {
    float lift = swell(uIsland.xy, t) * 0.7;
    return uBase + (m > 2.5 ? 6.2 : (m > 1.5 ? 2.6 : 1.4)) + lift + (swell(p, t) - swell(uIsland.xy, t)) * 0.35;
  }
  return uBase + clamp(texelFetch(uHeight, c, 0).r, -1.1, 1.4) + swell(p, t);
}

void main() {
  ivec2 c = ivec2(aCell);
  vec2 p = aCell + uGrid.xy;
  float t = uTime;
  float m = texelFetch(uMask, c, 0).r;
  float hi = clamp(texelFetch(uHeight, c, 0).r, -1.1, 1.4);
  float s = swell(p, t);
  float top = cellH(c, t);
  // Edges of the grid sink gently under the far water, so the blocks never end in a line.
  // In the last rows the far water rises to meet them: the blocks settle just under it.
  float inside = min(min(p.x - uGrid.x, uGrid.x + uGrid.z - 1.0 - p.x), p.y - uGrid.y);
  if (m < 0.5) top = mix(top, uBase + s - 1.2, (1.0 - smoothstep(1.0, 6.0, inside)));

  // Far away the studs flatten (their detail would only alias into moire).
  vec3 local = position;
  float camDist = length(vec3(p.x, top, p.y) - cameraPosition);
  if (local.y > 0.001) local.y *= 1.0 - smoothstep(55.0, 110.0, camDist);
  vec3 world = vec3(p.x, top, p.y) + local;
  // Toy plastic is never perfectly uniform: a small per-brick tint and sheen variation.
  float h1 = fract(sin(dot(aCell, vec2(12.9898, 78.233))) * 43758.5453);
  vVar = h1;
  vWorld = world;
  vLocal = position;

  // Smooth surface normal from the neighbours: light glides over the water instead of
  // flickering block by block. Tops lean towards it; sides keep their own normal.
  float hl = cellH(c + ivec2(-1, 0), t), hr = cellH(c + ivec2(1, 0), t);
  float hu = cellH(c + ivec2(0, -1), t), hd = cellH(c + ivec2(0, 1), t);
  vec3 surf = normalize(vec3(hl - hr, 2.0, hu - hd));
  vNormal = normal.y > 0.5 ? normalize(mix(normal, surf, 0.75)) : normal;

  // Ambient occlusion: a column sitting lower than its neighbours is in their shadow; sides
  // darken towards the gaps below the surface.
  float nmax = max(max(hl, hr), max(hu, hd));
  float ao = 1.0 - clamp((nmax - top) * 0.28, 0.0, 0.38);
  if (normal.y < 0.5 && position.y < 0.0) ao *= mix(0.2, 0.7, smoothstep(-2.2, 0.0, position.y));
  vAO = ao;

  vWater = m > 0.5 ? 0.0 : 1.0;
  vTower = 0.0;
  vSlope = 0.0;
  vCrest = 0.7;
  vFoam = 0.0;
  vGlow = vec3(0.0);
  if (m > 0.5) {
    vAlbedo = m > 2.5 ? vec3(0.92, 0.9, 0.86) : (m > 1.5 ? uGrass : uSand);
    vTower = m > 2.5 ? 1.0 : 0.0;
  } else {
    float k = clamp((hi + s * 0.6) * 0.45 + 0.45, 0.22, 1.0);
    vAlbedo = mix(uDeep, uMid, min(1.0, k * 1.4)) * (0.9 + 0.2 * h1) * mix(vec3(1.0), vec3(0.97, 1.0, 1.04), fract(h1 * 7.13));
    // Crest foam (pushed water) and a breaking ring of foam around the island.
    float crest = clamp((hi - 1.2) * 0.5, 0.0, 0.6);
    float d = length(vec2(p.x - uIsland.x, (p.y - uIsland.y) * 1.25)) - uIsland.z;
    float ring = (1.0 - smoothstep(0.2, 2.8, d)) * (0.55 + 0.45 * sin(t * 1.4 - d * 2.6 + p.x * 0.7));
    vFoam = max(crest, ring * (1.0 - uNightV * 0.6));
    // The island casts a soft shadow away from the sun, and darkens the water where it sits.
    vec2 away = -normalize(uSunDirV.xz + vec2(1e-4)) * clamp(2.4 / max(uSunDirV.y, 0.18), 0.0, 9.0);
    float ds = length(vec2(p.x - uIsland.x - away.x, (p.y - uIsland.y - away.y) * 1.25)) - uIsland.z * 0.92;
    float shade = (1.0 - smoothstep(-1.2, 1.6, ds)) * 0.42 * (1.0 - uNightV) + (1.0 - smoothstep(0.0, 1.4, d)) * 0.3;
    vAO *= 1.0 - shade;

    vSlope = (hr - hl) * 1.6;
    vCrest = 0.55 + 0.45 * clamp(hi + s + 0.6, 0.0, 1.0);
  }

  gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
}
`;

export const SEA_FRAGMENT = /* glsl */ `
precision highp float;

uniform vec3 uCam;
uniform float uTimeF;
uniform vec3 uAmbient;
uniform float uSunPower;
uniform float uFogNear;
uniform float uFogFar;
uniform float uMistZ;
uniform vec3 uIslandF;
uniform float uBase;
uniform float uNightV;
uniform vec4 uSticks[7];
uniform vec3 uNeon[3];
uniform float uStickZ;
uniform float uNearZ;
uniform vec3 uSunDirV;

varying vec3 vWorld;
varying vec3 vNormal;
varying vec3 vAlbedo;
varying vec3 vGlow;
varying vec3 vLocal;
varying float vAO;
varying float vFoam;
varying float vWater;
varying float vSlope;
varying float vCrest;
varying float vVar;
varying float vTower;

${SKY}
${SWELL}

float ggx(float nh, float r) {
  float a = r * r;
  float d = nh * nh * (a * a - 1.0) + 1.0;
  return (a * a) / (3.14159 * d * d);
}

void main() {
  vec3 N = normalize(vNormal);
  float farShade = 1.0;
  if (vWater > 1.5) {
    vec2 q = vWorld.xz;
    float e = 0.5;
    float hx = swell(q + vec2(e, 0.0), uTimeF) - swell(q - vec2(e, 0.0), uTimeF);
    float hz = swell(q + vec2(0.0, e), uTimeF) - swell(q - vec2(0.0, e), uTimeF);
    vec2 rip = vec2(sin(q.x * 0.37 + q.y * 0.61 + uTimeF * 0.9) + sin(q.x * 0.83 - q.y * 0.29 - uTimeF * 1.3),
                    sin(q.y * 0.47 - q.x * 0.53 - uTimeF * 1.1) + sin(q.y * 0.91 + q.x * 0.17 + uTimeF * 0.7)) * 0.05;
    vec3 smoothN = normalize(vec3(-hx + rip.x * 0.25, 2.0 * e, -hz + rip.y * 0.25));
    // Faceted like the blocks: one normal per one-unit cell, blended to smooth where a cell gets
    // smaller than a pixel (no aliasing).
    vec2 cc = floor(q) + 0.5;
    float fx = swell(cc + vec2(e, 0.0), uTimeF) - swell(cc - vec2(e, 0.0), uTimeF);
    float fz = swell(cc + vec2(0.0, e), uTimeF) - swell(cc - vec2(0.0, e), uTimeF);
    vec3 facetN = normalize(vec3(-fx, 2.0 * e, -fz));
    float px = fwidth(q.x) + fwidth(q.y);
    N = normalize(mix(facetN, smoothN, smoothstep(0.35, 1.2, px)));
    // Studs continue on the far water (one per world unit), fading out with distance.
    vec2 cell = fract(q) - 0.5;
    float r = length(cell);
    // Fade the pattern out before a stud gets smaller than a few pixels (no moire).
    float fadeS = (1.0 - smoothstep(80.0, 320.0, length(vWorld - uCam))) * (1.0 - smoothstep(0.06, 0.2, fwidth(q.x) + fwidth(q.y)));
    float ring = smoothstep(0.24, 0.29, r) * (1.0 - smoothstep(0.29, 0.34, r));
    N = normalize(N + vec3(cell.x, 0.0, cell.y) * ring * 1.6 * fadeS);
    float gap = smoothstep(0.44, 0.5, max(abs(cell.x), abs(cell.y)));
    farShade = 1.0 - gap * 0.5 * fadeS;
  }
  vec3 V = normalize(uCam - vWorld);
  vec3 L = normalize(uSunDir);
  vec3 H = normalize(L + V);
  float nl = max(dot(N, L), 0.0);
  float nv = max(dot(N, V), 0.0);
  float nh = max(dot(N, H), 0.0);

  vec3 albedo = mix(vAlbedo, vec3(0.95, 0.98, 1.0), clamp(vFoam, 0.0, 1.0) * vWater);
  // The island keeps its own (brighter) plastic colour at night, so the neon can light it.
  if (vWater < 0.5) albedo *= 1.0 + 5.0 * uNightV;
  // Lighthouse: a red band below the lamp; the lamp (top block) glows warm at night.
  vec3 lamp = vec3(0.0);
  if (vTower > 0.5) {
    if (vLocal.y < -1.0 && vLocal.y > -1.9) albedo = vec3(0.6, 0.06, 0.05) * (1.0 + 2.0 * uNightV);
    if (vLocal.y > -0.8) lamp = vec3(1.0, 0.62, 0.3) * 3.0 * uNightV;
  }
  bool topFace = vNormal.y > 0.45 && vLocal.y > -0.01;

  // Toy plastic: a lit bevel along the block's top edge (the light catches the rounded rim).
  float edge = max(abs(vLocal.x), abs(vLocal.z));
  float bevel = topFace && vLocal.y < 0.02 ? smoothstep(0.40, 0.475, edge) : 0.0;
  // Stud: a soft contact shadow ring where it meets the block.
  float studBase = vLocal.y > 0.0 && vLocal.y < 0.06 ? 0.82 : 1.0;

  float ao = vAO * studBase * farShade;
  vec3 diffuse = albedo * (uAmbient * (0.55 + 0.45 * N.y) + uSunColor * uSunPower * nl) * ao;

  // Glossy clear-coat: GGX highlight and Fresnel reflection of the sky.
  float duskR = max(0.0, 1.0 - abs(uNight - 0.5) * 3.0);
  float rough = mix(mix(0.32, 0.16, uNight), 0.45, vFoam) + (vVar - 0.5) * 0.08 + duskR * 0.16;
  float F = 0.04 + 0.96 * pow(1.0 - nv, 5.0);
  // Highlights roll off at grazing angles (no milky hot spot towards the frame edge).
  vec3 spec = uSunColor * uSunPower * min(ggx(nh, rough), 8.0) * F * nl * 0.55 * smoothstep(0.03, 0.25, nv);
  spec = min(spec, vec3(3.0));
  vec3 refl = skyBase(reflect(-V, N)) * min(F, 0.6) * 0.42 * ao * (topFace || vWater > 1.5 ? 1.0 : 0.12);
  float near = 1.0 - smoothstep(25.0, 80.0, length(vWorld - uCam));
  vec3 rim = uSunColor * uSunPower * bevel * (0.05 + 0.3 * pow(nh, 8.0)) * (1.0 - uNight * 0.7) * near;

  // Caustic shimmer on the water tops (day only): two drifting interference patterns.
  float caus = 0.0;
  if (vWater > 0.5 && topFace) {
    vec2 q = vWorld.xz * 0.9;
    float a = sin(q.x * 1.7 + uTimeF * 1.1 + sin(q.y * 1.3 + uTimeF * 0.7));
    float b = sin(q.y * 1.9 - uTimeF * 0.9 + sin(q.x * 1.1 - uTimeF * 0.6));
    caus = pow(max(0.0, a * b), 3.0) * 0.22 * (1.0 - uNight);
  }

  // Neon streaks at night, per pixel: each stick throws a reflection towards the viewer, bent
  // by the local slope and broken up by the swell.
  vec3 glow = vec3(0.0);
  if (uNightV > 0.01 && vWater > 0.5 && vWorld.z > uStickZ) {
    float tt = clamp((vWorld.z - uStickZ) / (uNearZ - uStickZ), 0.0, 1.0);
    float wob = sin(vWorld.z * 0.9 + uTimeF * 2.2) * 0.35;
    float width = 1.1 + tt * 3.0;
    float bend = vWater > 1.5 ? (N.x * 3.0) : vSlope;
    for (int i = 0; i < 7; i++) {
      vec4 st = uSticks[i];
      if (st.w < 0.5) continue;
      float cx = st.x + (st.y - st.x) * tt * 0.55 + wob;
      float dx = vWorld.x - cx - bend * 3.2;
      float inten = exp(-dx * dx / width) * vCrest * mix(2.2, 0.35, sqrt(tt)) * uNightV;
      float pool = exp(-(dx * dx + pow(vWorld.z - uStickZ, 2.0) * 0.08) / 6.0) * 3.5 * uNightV;
      inten += pool;
      int ni = int(st.z);
      vec3 neon = ni == 0 ? uNeon[0] : (ni == 1 ? uNeon[1] : uNeon[2]);
      glow += neon * inten * (topFace ? 1.0 : 0.45) * smoothstep(0.5, 2.5, length(vec2(vWorld.x - uIslandF.x, (vWorld.z - uIslandF.y) * 1.25)) - uIslandF.z);
    }
  }
  // The lighthouse beam sweeps round: a bright wedge on the water around the island.
  if (uNightV > 0.01 && vWater > 0.5) {
    vec2 rel = vWorld.xz - uIslandF.xy;
    float ang = atan(rel.y, rel.x) - uTimeF * 0.6;
    float wedge = pow(max(cos(ang), 0.0), 40.0);
    float reach = exp(-length(rel) / 28.0);
    glow += vec3(1.0, 0.72, 0.4) * wedge * reach * 1.4 * uNightV;
  }
  // At dusk the streaks run warm (sunset light), turning neon as night falls.
  glow *= mix(vec3(0.95, 0.62, 0.42), vec3(1.0), smoothstep(0.45, 0.9, uNight));
  // Night: deep navy instead of a black void, and a cool rim so shapes (the island) still read.
  vec3 nightFloor = vec3(0.004, 0.008, 0.02) * uNight * (0.6 + 0.4 * N.y);
  vec3 rimN = vec3(0.12, 0.1, 0.32) * pow(1.0 - nv, 3.0) * uNight * (vWater > 0.5 ? 0.35 : 1.6);
  // The island keeps a soft cool fill after dusk, so it never turns into a black blob.
  if (vWater < 0.5) rimN += albedo * vec3(0.22, 0.2, 0.36) * smoothstep(0.35, 0.8, uNight) * (0.6 + 0.4 * N.y);
  // The pillars light the island's faces that look their way.
  if (vWater < 0.5 && uNightV > 0.01) {
    for (int i = 0; i < 7; i++) {
      vec4 st = uSticks[i];
      if (st.w < 0.5) continue;
      vec3 toL = vec3(st.x, uBase + 6.0, uStickZ) - vWorld;
      float dl = length(toL);
      int ni = int(st.z);
      vec3 neon = ni == 0 ? uNeon[0] : (ni == 1 ? uNeon[1] : uNeon[2]);
      glow += albedo * neon * max(dot(N, toL / dl), 0.0) * 2600.0 / (dl * dl + 200.0) * uNightV;
    }
  }
  vec3 col = diffuse + spec + refl + rim + albedo * caus + glow + vGlow + lamp + nightFloor + rimN;
  // Never let a degenerate normal (NaN) or an extreme value through to the bloom.
  if (any(isnan(col)) || any(isinf(col))) col = albedo * uAmbient;
  col = min(col, vec3(24.0));

  // Atmospheric haze: distance fog into the sky colour along the view ray.
  float dist = length(vWorld - uCam);
  // Atmospheric perspective: exponential haze, so distance (and the end of the blocks) melts away.
  float f = clamp(1.0 - exp(-max(dist - uFogNear, 0.0) / uFogFar), 0.0, 1.0);
  // A bank of sea mist where the blocks end (and beyond): both surfaces meet in the same haze.
  // Thinner at dusk, so the sunset sky and the sun path stay visible.
  float duskK = 1.0 - abs(uNight - 0.5) * 2.0;
  f = max(f, (0.8 - 0.35 * max(duskK, 0.0)) * (1.0 - smoothstep(uMistZ + 4.0, uMistZ + 70.0, vWorld.z)));
  col = mix(col, skyBase(normalize(vec3(-V.x, max(-V.y, 0.0) * 0.2, -V.z))), f);

  gl_FragColor = vec4(col, 1.0);
}
`;

/**
 * Far water: one big plane beyond (and under) the block grid, so the sea runs to a real
 * horizon. Same lighting as the blocks (SEA_FRAGMENT); its normal comes from the analytic swell
 * plus a fine ripple, so the sun lays a glitter path on it.
 */
export const FAR_VERTEX = /* glsl */ `
precision highp float;
uniform float uTime;
uniform vec3 uDeep;
uniform vec3 uMid;
uniform vec4 uGrid;
uniform float uBase;
varying vec3 vWorld;
varying vec3 vNormal;
varying vec3 vAlbedo;
varying vec3 vGlow;
varying vec3 vLocal;
varying float vAO;
varying float vFoam;
varying float vWater;
varying float vSlope;
varying float vCrest;
varying float vVar;
varying float vTower;
${SWELL}
void main() {
  vec3 w = (modelMatrix * vec4(position, 1.0)).xyz;
  // Follows the swell at the same height as the block tops, so the bricks continue into it.
  // Under the block grid it drops away (a pushed-down block must never reveal it), rising only
  // in the last few rows before the grid ends.
  vec2 lo = uGrid.xy, hi = uGrid.xy + uGrid.zw;
  float inside = min(min(w.x - lo.x, hi.x - w.x), min(w.z - lo.y, hi.y - w.z));
  float under = smoothstep(1.0, 7.0, inside);
  float s = swell(w.xz, uTime) * (1.0 - smoothstep(300.0, 700.0, length(w.xz)));
  w.y = mix(uBase + s - 0.25, uBase - 7.0, under);
  vWorld = w;
  vNormal = vec3(0.0, 1.0, 0.0);
  vAlbedo = mix(uDeep, uMid, 0.78);
  vGlow = vec3(0.0);
  vLocal = vec3(0.0, -1.0, 0.0);
  vAO = 1.0;
  vFoam = 0.0;
  vWater = 2.0;
  vSlope = 0.0;
  vCrest = 0.75;
  vVar = 0.5;
  vTower = 0.0;
  gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.0);
}
`;

export const SKY_VERTEX = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = normalize((modelMatrix * vec4(position, 0.0)).xyz);
  vec4 pos = projectionMatrix * viewMatrix * vec4(position + cameraPosition, 1.0);
  gl_Position = pos.xyww;
}
`;

export const SKY_FRAGMENT = /* glsl */ `
precision highp float;
varying vec3 vDir;
${SKY}
void main() {
  vec3 dir = normalize(vDir);
  vec3 col = skyColor(dir);
  // A few faint stars at night, high in the sky.
  if (uNight > 0.3 && dir.y > 0.08) {
    vec3 q = dir * 90.0;
    vec3 cell = floor(q);
    float h = fract(sin(dot(cell, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
    float d = length(fract(q) - 0.5);
    col += vec3(0.85, 0.85, 1.0) * step(0.985, h) * (1.0 - smoothstep(0.05, 0.16, d)) * (uNight - 0.3) * 1.6;
  }
  gl_FragColor = vec4(col, 1.0);
}
`;

/** Final pass after tone mapping: far blur near the horizon, vignette, film grain. */
export const FINISH_FRAGMENT = /* glsl */ `
precision highp float;
uniform sampler2D tDiffuse;
uniform vec2 uRes;
uniform float uTime;
uniform float uHorizon;   // horizon height in uv (0 bottom, 1 top)
uniform float uGrain;
varying vec2 vUv;

void main() {
  vec2 uv = vUv;
  // Depth-of-field stand-in: the far sea lies just below the horizon line; blur it softly.
  float far = smoothstep(uHorizon - 0.28, uHorizon - 0.02, uv.y) * (1.0 - smoothstep(uHorizon + 0.02, uHorizon + 0.2, uv.y));
  vec3 col = texture2D(tDiffuse, uv).rgb;
  if (far > 0.01) {
    vec2 px = 1.0 / uRes * (1.0 + far * 2.5);
    vec3 b = col * 0.2;
    b += texture2D(tDiffuse, uv + vec2(px.x, 0.0)).rgb * 0.15;
    b += texture2D(tDiffuse, uv - vec2(px.x, 0.0)).rgb * 0.15;
    b += texture2D(tDiffuse, uv + vec2(0.0, px.y)).rgb * 0.15;
    b += texture2D(tDiffuse, uv - vec2(0.0, px.y)).rgb * 0.15;
    b += texture2D(tDiffuse, uv + px).rgb * 0.05;
    b += texture2D(tDiffuse, uv - px).rgb * 0.05;
    b += texture2D(tDiffuse, uv + vec2(px.x, -px.y)).rgb * 0.05;
    b += texture2D(tDiffuse, uv + vec2(-px.x, px.y)).rgb * 0.05;
    col = mix(col, b, far * 0.85);
  }
  // Near foreground (bottom of the frame, behind the hero buttons): slightly soft and calmer.
  float nearB = 1.0 - smoothstep(0.0, 0.3, uv.y);
  if (nearB > 0.01) {
    vec2 q = 1.5 / uRes;
    vec3 nb = (texture2D(tDiffuse, uv + vec2(q.x, q.y)).rgb + texture2D(tDiffuse, uv - vec2(q.x, q.y)).rgb
      + texture2D(tDiffuse, uv + vec2(q.x, -q.y)).rgb + texture2D(tDiffuse, uv + vec2(-q.x, q.y)).rgb) * 0.25;
    col = mix(col, nb, nearB * 0.7);
    col = mix(col, vec3(dot(col, vec3(0.333))), nearB * 0.12);
  }
  // Soft vignette, a touch of grain (moves every frame, so it reads as film, not dirt).
  vec2 d = uv - 0.5;
  col *= 1.0 - dot(d, d) * 0.32;
  float n = fract(sin(dot(uv * uRes + uTime * 61.0, vec2(12.9898, 78.233))) * 43758.5453);
  col += (n - 0.5) * uGrain;
  gl_FragColor = vec4(col, 1.0);
}
`;

/** Neon light sticks: a bright core and a soft halo, both fading out towards the top. */
export const BEAM_VERTEX = /* glsl */ `
varying float vUp;
varying vec3 vN;
varying vec3 vV;
void main() {
  vUp = position.y / 30.0;
  vec4 w = modelMatrix * vec4(position, 1.0);
  vN = normalize(mat3(modelMatrix) * normal);
  vV = normalize(cameraPosition - w.xyz);
  gl_Position = projectionMatrix * viewMatrix * w;
}
`;

export const BEAM_FRAGMENT = /* glsl */ `
uniform vec3 uColor;
uniform float uOpacity;
uniform float uHalo;
varying float vUp;
varying vec3 vN;
varying vec3 vV;
void main() {
  float facing = abs(dot(normalize(vN), normalize(vV)));
  float shape = uHalo > 0.5 ? pow(facing, 3.0) * 0.32 : 0.6 + 0.4 * facing;
  float fade = (1.0 - smoothstep(0.35, 0.95, vUp)) * smoothstep(0.0, 0.05, vUp);
  gl_FragColor = vec4(uColor * shape * fade * uOpacity, 1.0);
}
`;
