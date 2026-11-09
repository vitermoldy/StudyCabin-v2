import * as THREE from 'three';
import { POND } from './ground.js';

// A height-field ripple simulation on the GPU, after Evan Wallace's WebGL Water
// (madebyevan.com/webgl-water): every texel keeps a height and a velocity, each
// step pulls it toward the average of its neighbours, and drops push it down.
// It covers the pond; the pond shader reads it for normals, so pointer taps and
// raindrops leave rings on the surface, and the rings die out against the bank.

const SIZE = Math.max(POND.rx, POND.rz) * 2.5;
export const RIPPLE_AREA = { x0: POND.x - SIZE / 2, z0: POND.z - SIZE / 2, size: SIZE };
const RES = 256;

