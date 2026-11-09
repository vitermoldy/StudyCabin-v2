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
    // The visitor's own turn, tilt, zoom and slide on top of the chosen view.
    this.user = { yaw: 0, tilt: 0, zoom: 1, panX: 0, panZ: 0 };
    this.userS = { ...this.user };
    this._resolve(this.view, this.pos, this.target);
  }

  /** Base position and target for a view at the current aspect. */
  _resolve(id, outPos, outTarget, follow = null) {
    const v = VIEWS[id];
    const cam = this.camera;
    outTarget.set(...v.target);
    outPos.set(...v.pos);
    if (id === 'window' && follow && follow.z < 7.5) {
      const fx = clamp(follow.x, -4.4, 4.4);
      outPos.x += fx - outTarget.x;
      outTarget.x = fx;
    }
    if (id === 'follow' && follow) {
      outTarget.copy(follow);
      outTarget.y -= 0.25;
      const inside = follow.z < 3.2;
