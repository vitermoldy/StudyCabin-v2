import * as THREE from 'three';
import { rng } from '../core/emitter.js';
import { CLEARING, forestDepth, groundHeight, pondE } from './ground.js';

// Particles driven entirely on the GPU from a time uniform: nothing is
// rewritten per frame. Each drop, flake or leaf has a seed and wraps inside a
// box that follows the camera, so the weather is always around the viewer.

const WRAP = /* glsl */ `
  vec3 wrapBox(vec3 p, vec3 center, vec3 box){ return center + mod(p - center + box * 0.5, box) - box * 0.5; }
  float insideCabin(vec3 p){
    // the roof and walls keep the weather out
    vec3 lo = vec3(-7.7, -1.0, -3.8);
    vec3 hi = vec3(7.7, 6.0, 3.75);
    vec3 a = step(lo, p) * step(p, hi);
    return a.x * a.y * a.z;
  }
`;

function seeds(count, perItem, seed) {
  const r = rng(seed);
  const s = new Float32Array(count * perItem * 3);
  const id = new Float32Array(count * perItem);
  const end = new Float32Array(count * perItem);
  for (let i = 0; i < count; i++) {
    const a = r();
    const b = r();
    const c = r();
    const order = r();
    for (let k = 0; k < perItem; k++) {
      const o = i * perItem + k;
      s[o * 3] = a;
      s[o * 3 + 1] = b;
      s[o * 3 + 2] = c;
      id[o] = order;
      end[o] = k;
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(count * perItem * 3), 3));
  geo.setAttribute('aSeed', new THREE.Float32BufferAttribute(s, 3));
  geo.setAttribute('aId', new THREE.Float32BufferAttribute(id, 1));
  geo.setAttribute('aEnd', new THREE.Float32BufferAttribute(end, 1));
  return geo;
}

export class WeatherFX {
  constructor(scene, flueTop) {
    this.common = {
      uTime: { value: 0 },
      uWind: { value: 0.3 },
      uCenter: { value: new THREE.Vector3(0, 8, 10) },
      uLight: { value: 1 },
      uScale: { value: 400 },
    };

    // Rain: short streaks.
    this.rainU = { ...this.common, uAmount: { value: 0 }, uBox: { value: new THREE.Vector3(56, 24, 52) } };
    const rain = new THREE.LineSegments(
      seeds(7000, 2, 3),
      new THREE.ShaderMaterial({
        uniforms: this.rainU,
        transparent: true,
        depthWrite: false,
        vertexShader: /* glsl */ `
          uniform float uTime; uniform float uWind; uniform float uAmount; uniform vec3 uCenter; uniform vec3 uBox;
          attribute vec3 aSeed; attribute float aId; attribute float aEnd;
          varying float vA;
          ${WRAP}
          void main(){
            vec3 vel = vec3(uWind * 6.0, -14.0 - aSeed.z * 4.0, -uWind * 1.5);
            vec3 p = aSeed * uBox + vel * uTime;
            p = wrapBox(p, uCenter, uBox);
            p -= normalize(vel) * aEnd * (0.32 + uAmount * 0.3);
            float on = step(aId, uAmount) * (1.0 - insideCabin(p)) * step(-0.2, p.y);
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            float far = smoothstep(42.0, 18.0, -mv.z);
            vA = on * far * (1.0 - aEnd * 0.7);
            gl_Position = projectionMatrix * mv;
          }`,
        fragmentShader: /* glsl */ `
          uniform float uLight; uniform float uAmount; varying float vA;
          void main(){
            if (vA < 0.01) discard;
            gl_FragColor = vec4(vec3(0.72, 0.76, 0.8) * (0.35 + uLight * 0.65), vA * (0.26 + uAmount * 0.22));
            #include <colorspace_fragment>
          }`,
      }),
    );

    // Snow: soft discs drifting down.
    this.snowU = { ...this.common, uAmount: { value: 0 }, uBox: { value: new THREE.Vector3(50, 22, 46) } };
