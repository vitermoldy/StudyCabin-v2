import * as THREE from 'three';
import { clamp, smoothstep } from '../core/emitter.js';
import { WORLD } from './materials.js';
import { Atmosphere } from './sky.js';
import { Terrain } from './terrain.js';
import { Pond } from './pond.js';
import { Cabin } from './cabin.js';
import { Resident } from './resident.js';
import { WeatherFX } from './weatherfx.js';
import { CameraRig } from './camera.js';
import { Ripples, RIPPLE_AREA } from './ripples.js';
import { Trees } from './trees.js';
import { Treeline } from './treeline.js';
import { Animals } from './animals.js';
import { Props } from './props.js';
import { POND, WATER_Y, groundHeight, pondE } from './ground.js';
import { fireflies } from '../sim/wildlife.js';

export function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGL2RenderingContext && c.getContext('webgl2'));
  } catch {
    return false;
  }
}

export class World {
  constructor(canvas, { reducedMotion = false } = {}) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    // A GPU that rejects a shader would leave a black canvas: fall back to the still picture.
    this.onShaderFail = null;
    this.renderer.debug.onShaderError = (gl, program, vs, fs) => {
      console.warn('StudyCabin: a shader did not compile; showing the still picture.', gl.getProgramInfoLog(program) || '');
      if (this.onShaderFail) this.onShaderFail();
    };
    this.maxDpr = Math.min(window.devicePixelRatio || 1, 1.5);
    this.dpr = this.maxDpr;
    this.renderer.setPixelRatio(this.dpr);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 2600);
    this.rig = new CameraRig(this.camera);
    this.rig.reduced = reducedMotion;
