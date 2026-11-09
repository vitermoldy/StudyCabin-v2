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
}

// The lane in front of the cabin that stays clear of trees, out to where the camera stands on a
// phone held upright (it pulls back further on narrow screens).
const laneHalf = (z) => 7 + (z - 16) * 0.32;
function laneEdge(x, z) {
  return Math.abs(x + 0.3) - laneHalf(z) + Math.max(0, z - 64) * 2;
}

/** 0..1: how far a point sits inside the open lane. */
export function inLane(x, z) {
  if (z < 16 || z > 72) return 0;
  return smooth(3, -3, laneEdge(x, z));
}

/**
 * How far a point lies inside the forest, in metres: 0 or less is the open clearing. Trees are
 * planted by it, and the ground darkens under the canopy with it.
 */
export function forestDepth(x, z) {
  const u = (x - CLEARING.x) / CLEARING.rx;
  const v = (z - CLEARING.z) / CLEARING.rz;
  const a = Math.atan2(v, u);
  const w = 1 + 0.08 * Math.sin(a * 5 + 1.7) + 0.05 * Math.sin(a * 9 + 0.4) + 0.03 * Math.sin(x * 0.35 + z * 0.2);
  let d = (Math.hypot(u, v) / w - 1) * 16;
  if (z > 16 && z < 72) d = Math.min(d, laneEdge(x, z));
  return d;
}

/** Height of the ground. */
export function groundHeight(x, z) {
  let y = 0;
  const e = pondE(x, z);
  if (e < 1) y -= 1.25 * Math.pow(1 - e * e, 0.75);
  else y += 0.05 * smooth(1, 1.12, e) * smooth(1.5, 1.2, e);
  const fd = forestDepth(x, z);
  const yard = smooth(15, 5, Math.hypot(x * 0.8, z - 2.5));
  const pondNear = smooth(1.7, 1.15, e);
  // The meadow rolls a little, away from the cabin and the pond.
  y += (1 - yard) * (1 - pondNear) * fbm(x * 0.06 + 5.2, z * 0.06 + 1.3, 3) * 0.55;
  // The forest floor rises and humps under the trees.
  y += smooth(-3, 26, fd) * (0.5 + fbm(x * 0.035, z * 0.035, 4) * 2.6);
  // Hills round the whole wood, kept low down the camera's lane.
  const r = Math.hypot(x - CLEARING.x, z - CLEARING.z);
