import * as THREE from 'three';
import { clamp, damp, lerp } from '../core/emitter.js';

import { VIEWS } from './views.js';
import { WATER_Y, groundHeight } from './ground.js';

export { VIEWS };

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export class CameraRig {
  constructor(camera) {
    this.camera = camera;
    this.view = 'clearing';
    this.pos = new THREE.Vector3();
    this.target = new THREE.Vector3();
    this.from = { pos: new THREE.Vector3(), target: new THREE.Vector3() };
    this.travel = 1; // 0..1 progress of a move between views
    this.travelTime = 1.4;
    this.pointer = new THREE.Vector2();
    this.pointerSmooth = new THREE.Vector2();
    this.followTarget = new THREE.Vector3();
    this.entrance = 1; // 1 = start pulled back, eases to 0
    this.reduced = false;
