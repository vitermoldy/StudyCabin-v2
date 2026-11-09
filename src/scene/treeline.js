import * as THREE from 'three';
import { rng } from '../core/emitter.js';
import { CLEARING, groundHeight } from './ground.js';

// The far forest: three rings of fir silhouettes round the clearing, each further one paler with
// the haze, and mist pooling at their feet, so the wood reads in depth instead of ending at the
// last 3D tree. After the treeline in SongPlay, bent into rings so the camera can turn all the way
// round. Each fir is a spike whose slope steps out three times, so the outline reads as tiers of
// boughs even far away and in fog. The colours are set every frame from the sky's haze.

const RINGS = [
  { R: 84, seed: 97, tall: 10, spacing: 2.6, hill: 2, far: 0 },
  { R: 114, seed: 41, tall: 12, spacing: 3.4, hill: 4, far: 0.55 },
  { R: 152, seed: 23, tall: 14, spacing: 4.2, hill: 7, far: 1 },
];

function ringGeometry({ R, seed, tall, spacing, hill }) {
  const rand = rng(seed);
  const circ = Math.PI * 2 * R;
  const phases = [rand() * 6, rand() * 6, rand() * 6];
  const wave = (s) => hill * (0.5 + 0.5 * (0.55 * Math.sin(s * 0.03 + phases[0]) + 0.3 * Math.sin(s * 0.071 + phases[1]) + 0.15 * Math.sin(s * 0.17 + phases[2])));
  const trees = [];
  for (let s = 0; s < circ; s += spacing * (0.45 + rand() * 0.8)) {
    const h = tall * (0.55 + rand() * 0.65);
    trees.push({ s, h, w: h * (0.2 + rand() * 0.08) });
  }
  const step = spacing / 6;
  const n = Math.ceil(circ / step);
  const pos = [];
  const tAttr = [];
  let first = 0;
  for (let i = 0; i <= n; i++) {
    const s = (i / n) * circ;
    let top = 0;
    while (first < trees.length && trees[first].s + trees[first].w * 1.2 < s) first++;
    for (let k = first; k < trees.length && trees[k].s - trees[k].w * 1.2 < s; k++) {
      const t = trees[k];
      const out = Math.abs(s - t.s) / t.w;
      if (out >= 1) continue;
      const tiers = (out * 3) % 1;
      top = Math.max(top, t.h * (1 - out) - t.h * 0.09 * tiers);
    }
    // The seam sits behind the long camera views (toward +z), out of sight.
    const a = Math.PI + (s / R);
    const x = CLEARING.x + Math.sin(a) * R;
    const z = CLEARING.z - Math.cos(a) * R;
    const floor = groundHeight(x, z) + wave(s) - 0.5;
    pos.push(x, floor - 8, z, x, floor + top, z);
    tAttr.push(-8 / tall, top / tall);
  }
  const idx = [];
  for (let i = 0; i < n; i++) {
    const a = i * 2;
    idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('aT', new THREE.Float32BufferAttribute(tAttr, 1));
  geo.setIndex(idx);
