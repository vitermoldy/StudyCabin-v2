import * as THREE from 'three';
import { rng } from '../core/emitter.js';
import { CLEARING, groundHeight } from './ground.js';

// The far forest: three rings of fir silhouettes round the clearing, each further one paler with
// the haze, and mist pooling at their feet, so the wood reads in depth instead of ending at the
// last 3D tree. After the treeline in SongPlay, bent into rings so the camera can turn all the way
// round. Each fir is a spike whose slope steps out three times, so the outline reads as tiers of
// boughs even far away and in fog. The colours are set every frame from the sky's haze.

const RINGS = [
  { R: 84, seed: 97, tall: 10, spacing: 2.6, hill: 2, far: 0 },
  { R: 114, seed: 41, tall: 12, spacing: 3.4, hill: 4, far: 0.55 },
  { R: 152, seed: 23, tall: 14, spacing: 4.2, hill: 7, far: 1 },
];

function ringGeometry({ R, seed, tall, spacing, hill }) {
  const rand = rng(seed);
  const circ = Math.PI * 2 * R;
  const phases = [rand() * 6, rand() * 6, rand() * 6];
  const wave = (s) => hill * (0.5 + 0.5 * (0.55 * Math.sin(s * 0.03 + phases[0]) + 0.3 * Math.sin(s * 0.071 + phases[1]) + 0.15 * Math.sin(s * 0.17 + phases[2])));
  const trees = [];
  for (let s = 0; s < circ; s += spacing * (0.45 + rand() * 0.8)) {
    const h = tall * (0.55 + rand() * 0.65);
    trees.push({ s, h, w: h * (0.2 + rand() * 0.08) });
  }
  const step = spacing / 6;
  const n = Math.ceil(circ / step);
  const pos = [];
  const tAttr = [];
  let first = 0;
  for (let i = 0; i <= n; i++) {
    const s = (i / n) * circ;
    let top = 0;
    while (first < trees.length && trees[first].s + trees[first].w * 1.2 < s) first++;
    for (let k = first; k < trees.length && trees[k].s - trees[k].w * 1.2 < s; k++) {
      const t = trees[k];
      const out = Math.abs(s - t.s) / t.w;
      if (out >= 1) continue;
      const tiers = (out * 3) % 1;
      top = Math.max(top, t.h * (1 - out) - t.h * 0.09 * tiers);
    }
    // The seam sits behind the long camera views (toward +z), out of sight.
    const a = Math.PI + (s / R);
    const x = CLEARING.x + Math.sin(a) * R;
    const z = CLEARING.z - Math.cos(a) * R;
    const floor = groundHeight(x, z) + wave(s) - 0.5;
    pos.push(x, floor - 8, z, x, floor + top, z);
    tAttr.push(-8 / tall, top / tall);
  }
  const idx = [];
  for (let i = 0; i < n; i++) {
    const a = i * 2;
    idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('aT', new THREE.Float32BufferAttribute(tAttr, 1));
  geo.setIndex(idx);
  geo.computeBoundingSphere();
  return geo;
}

export class Treeline {
  constructor(scene) {
    this.colors = {
      nearTop: new THREE.Color(),
      nearLow: new THREE.Color(),
      farTop: new THREE.Color(),
      farLow: new THREE.Color(),
      fog: new THREE.Color(),
    };
    this.snow = { value: 0 };
    this.flash = { value: 0 };
    this.meshes = RINGS.map((ring) => {
      const material = new THREE.ShaderMaterial({
        side: THREE.DoubleSide,
        uniforms: {
          uNearTop: { value: this.colors.nearTop },
          uNearLow: { value: this.colors.nearLow },
          uFarTop: { value: this.colors.farTop },
          uFarLow: { value: this.colors.farLow },
          uFog: { value: this.colors.fog },
          uMix: { value: ring.far },
          uSnow: this.snow,
          uFlash: this.flash,
        },
        vertexShader: /* glsl */ `
          attribute float aT;
          varying float vT;
          varying vec2 vXZ;
          void main() {
            vT = aT;
            vXZ = position.xz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uNearTop; uniform vec3 uNearLow; uniform vec3 uFarTop; uniform vec3 uFarLow; uniform vec3 uFog;
          uniform float uMix; uniform float uSnow; uniform float uFlash;
          varying float vT; varying vec2 vXZ;
          float h21(vec2 p){ p = fract(p * vec2(234.34, 435.345)); p += dot(p, p + 34.23); return fract(p.x * p.y); }
          float vn(vec2 p){ vec2 i = floor(p); vec2 f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
            return mix(mix(h21(i), h21(i + vec2(1, 0)), u.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), u.x), u.y); }
          void main() {
            vec3 top = mix(uNearTop, uFarTop, uMix);
            vec3 low = mix(uNearLow, uFarLow, uMix);
            vec3 c = mix(low, top, smoothstep(-0.2, 1.1, vT));
            // a faint grain of crowns, so the band is not one flat card
            c *= 0.9 + 0.2 * vn(vec2(atan(vXZ.y - ${CLEARING.z.toFixed(1)}, vXZ.x - ${CLEARING.x.toFixed(1)}) * 160.0, vT * 6.0));
            // snow on the far crowns in winter
            c = mix(c, uFog * 1.12, uSnow * 0.35 * smoothstep(0.2, 1.0, vT));
            // mist pooling at the foot of the trees
            float mist = 1.0 - smoothstep(-0.25, 0.55, vT);
            c = mix(c, uFog, mist * 0.82);
            c += vec3(0.6, 0.66, 0.75) * uFlash * 0.12;
            gl_FragColor = vec4(c, 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }
        `,
      });
      const mesh = new THREE.Mesh(ringGeometry(ring), material);
      mesh.frustumCulled = false;
      mesh.renderOrder = -4;
      scene.add(mesh);
      return mesh;
    });
  }

  /**
   * Colours from the haze: the nearest ring a dark fir green a little lighter than the 3D trees,
   * each further one closer to the haze itself (the ratios come from SongPlay's forest themes).
   */
  update({ fog, snow, flash }) {
    const c = this.colors;
    c.fog.copy(fog);
    c.nearTop.copy(fog).multiply(FIR).multiplyScalar(0.42);
    c.nearLow.copy(fog).multiply(FIR).multiplyScalar(0.78);
    c.farTop.copy(fog).multiply(FIR_FAR).multiplyScalar(0.8);
    c.farLow.copy(fog).multiplyScalar(1.02);
    this.snow.value = snow;
    this.flash.value = flash;
