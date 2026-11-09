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
