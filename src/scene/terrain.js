import * as THREE from 'three';
import { rng } from '../core/emitter.js';
import { WORLD } from './materials.js';
import {
  CLEARING, WATER_Y, bareEarth, canopy, fbm, forestDepth, grassCover, groundHeight, smooth, vnoise,
} from './ground.js';

export { groundHeight, WATER_Y };

function warp(u) {
  const a = Math.abs(u);
  return Math.sign(u) * (0.1 * a + 0.9 * a * a);
}

/** One sheet of ground out to the hills, finest round the clearing. */
function buildGround() {
  const NX = 280;
  const NZ = 260;
  const pos = [];
  const mix = [];
  const shade = [];
  for (let j = 0; j <= NZ; j++) {
    const z = CLEARING.z + warp((j / NZ) * 2 - 1) * 480;
    for (let i = 0; i <= NX; i++) {
      const x = CLEARING.x + warp((i / NX) * 2 - 1) * 520;
      pos.push(x, groundHeight(x, z), z);
      mix.push(bareEarth(x, z), grassCover(x, z), vnoise(x * 0.35, z * 0.35));
      shade.push(canopy(x, z));
    }
