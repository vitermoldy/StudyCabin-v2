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

// The same uneven oval as pondE() in ground.js.
const POND_GLSL = /* glsl */ `
  float pondE(vec2 p){
    vec2 q = (p - vec2(${POND.x.toFixed(3)}, ${POND.z.toFixed(3)})) / vec2(${POND.rx.toFixed(3)}, ${POND.rz.toFixed(3)});
    float a = atan(q.y, q.x);
    return length(q) / (1.0 + 0.07 * sin(3.0 * a + 0.8) + 0.04 * sin(5.0 * a + 2.1));
  }
`;

const QUAD_VERT = /* glsl */ `
  varying vec2 vUv;
  void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

const DROP_FRAG = /* glsl */ `
  precision highp float;
  uniform sampler2D uTex; uniform vec2 uCenter; uniform float uRadius; uniform float uStrength;
  varying vec2 vUv;
  void main(){
    vec4 info = texture2D(uTex, vUv);
    float d = max(0.0, 1.0 - length(uCenter - vUv) / uRadius);
    d = 0.5 - cos(d * 3.14159265) * 0.5;
    info.r -= d * uStrength;
    gl_FragColor = info;
  }
`;

const UPDATE_FRAG = /* glsl */ `
  precision highp float;
  uniform sampler2D uTex; uniform vec2 uDelta; uniform vec2 uOrigin; uniform float uSize;
  varying vec2 vUv;
  ${POND_GLSL}
  void main(){
    vec4 info = texture2D(uTex, vUv);
    vec2 dx = vec2(uDelta.x, 0.0);
    vec2 dy = vec2(0.0, uDelta.y);
    float average = (texture2D(uTex, vUv - dx).r + texture2D(uTex, vUv - dy).r + texture2D(uTex, vUv + dx).r + texture2D(uTex, vUv + dy).r) * 0.25;
    info.g += (average - info.r) * 2.0;
    info.g *= 0.992;
    info.r += info.g;
    // Rings die out against the bank and at the edges of the simulated patch.
    float wet = smoothstep(1.0, 0.94, pondE(uOrigin + vUv * uSize));
    float edge = smoothstep(0.0, 0.06, vUv.x) * smoothstep(1.0, 0.94, vUv.x) * smoothstep(0.0, 0.06, vUv.y) * smoothstep(1.0, 0.94, vUv.y);
    info.rg *= mix(0.0, 1.0, wet) * mix(0.96, 1.0, edge);
    gl_FragColor = info;
  }
`;

export class Ripples {
  constructor(renderer) {
    this.renderer = renderer;
    this.ok = false;
    const gl = renderer.getContext();
    // three.js is WebGL 2 only now; float targets still need this extension.
    const canFloat = gl.getExtension('EXT_color_buffer_float') || gl.getExtension('EXT_color_buffer_half_float');
    if (!canFloat) return;
    const opts = {
      type: THREE.HalfFloatType,
      format: THREE.RGBAFormat,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      wrapS: THREE.ClampToEdgeWrapping,
      wrapT: THREE.ClampToEdgeWrapping,
      depthBuffer: false,
      stencilBuffer: false,
    };
