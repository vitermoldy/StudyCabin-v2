// The shape of the land in plain numbers (no three.js), so the ground mesh, the grass, the trees,
// the animals' routes and the resident's walk all agree on it. Metres; x runs along the cabin
// front, z points out of the front glass toward the clearing, y is up.
//
// The cabin stands at the back of an oval clearing in a forest. A small pond lies to the front
// right, a trodden path runs from the deck steps round it, and a lane stays open in front of the
// cabin so the long camera views look down the clearing instead of into trunks.

export const smooth = (a, b, v) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

function hash(x, y) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

export function vnoise(x, y) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi);
  const b = hash(xi + 1, yi);
  const c = hash(xi, yi + 1);
  const d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

export function fbm(x, y, oct = 4) {
  let v = 0;
  let a = 0.5;
  for (let i = 0; i < oct; i++) {
    v += a * vnoise(x, y);
    x = x * 2.02 + 13.7;
    y = y * 2.02 + 7.3;
    a *= 0.5;
  }
  return v;
}

/** The pond's surface height. */
export const WATER_Y = -0.04;
export const POND = { x: 8.5, z: 14, rx: 6.2, rz: 4.0 };
export const CLEARING = { x: 1, z: 9, rx: 27, rz: 21 };

/** The pond is an oval with a slightly uneven bank. */
export function pondWobble(a) {
  return 1 + 0.07 * Math.sin(3 * a + 0.8) + 0.04 * Math.sin(5 * a + 2.1);
}

/** 0 in the middle of the pond, 1 on its waterline, more than 1 outside it. */
export function pondE(x, z) {
  const u = (x - POND.x) / POND.rx;
  const v = (z - POND.z) / POND.rz;
  return Math.hypot(u, v) / pondWobble(Math.atan2(v, u));
}

/** The point on ring `e` round the pond at angle `a` (radians, in the oval's own frame). */
export function pondPoint(e, a) {
  const w = pondWobble(a) * e;
  return { x: POND.x + Math.cos(a) * w * POND.rx, z: POND.z + Math.sin(a) * w * POND.rz };
}

// The path round the pond and the short spur that joins it to the deck steps.
export const TRAIL_E = 1.32;
export const TRAIL_START = Math.atan2((7.65 - POND.z) / POND.rz, (0 - POND.x) / POND.rx);
const SPUR_A = { x: 0, z: 7.6 };
const SPUR_B = pondPoint(TRAIL_E, TRAIL_START);

function segmentDistance(px, pz, ax, az, bx, bz) {
  const dx = bx - ax;
  const dz = bz - az;
  const t = Math.min(1, Math.max(0, ((px - ax) * dx + (pz - az) * dz) / (dx * dx + dz * dz)));
  return Math.hypot(px - (ax + dx * t), pz - (az + dz * t));
}

/** Rough distance in metres from the trodden path. */
export function trailDistance(x, z) {
  const ring = Math.abs(pondE(x, z) - TRAIL_E) * Math.min(POND.rx, POND.rz) * 1.15;
  return Math.min(ring, segmentDistance(x, z, SPUR_A.x, SPUR_A.z, SPUR_B.x, SPUR_B.z));
}

/** Points along the path round the pond, for the resident's walk. */
export function trailLoop(count = 10) {
  const pts = [];
  for (let i = 0; i < count; i++) {
    const p = pondPoint(TRAIL_E, TRAIL_START + (i / count) * Math.PI * 2);
    pts.push({ x: p.x, y: groundHeight(p.x, p.z), z: p.z });
  }
  return pts;
