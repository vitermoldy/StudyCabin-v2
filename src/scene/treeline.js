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
