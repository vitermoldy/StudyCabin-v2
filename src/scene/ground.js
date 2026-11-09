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
