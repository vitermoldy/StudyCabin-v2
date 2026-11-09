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
