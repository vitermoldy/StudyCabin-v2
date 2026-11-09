import * as THREE from 'three';
import { clamp, damp, lerp } from '../core/emitter.js';

import { VIEWS } from './views.js';
import { WATER_Y, groundHeight } from './ground.js';

export { VIEWS };

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export class CameraRig {
  constructor(camera) {
