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
  const NZ = 260;
  const pos = [];
  const mix = [];
  const shade = [];
  for (let j = 0; j <= NZ; j++) {
    const z = CLEARING.z + warp((j / NZ) * 2 - 1) * 480;
    for (let i = 0; i <= NX; i++) {
      const x = CLEARING.x + warp((i / NX) * 2 - 1) * 520;
      pos.push(x, groundHeight(x, z), z);
      mix.push(bareEarth(x, z), grassCover(x, z), vnoise(x * 0.35, z * 0.35));
      shade.push(canopy(x, z));
    }
  }
  const idx = [];
  for (let j = 0; j < NZ; j++) {
    for (let i = 0; i < NX; i++) {
      const a = j * (NX + 1) + i;
      const b = a + 1;
      const c = a + NX + 1;
      const d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('aMix', new THREE.Float32BufferAttribute(mix, 3));
  geo.setAttribute('aShade', new THREE.Float32BufferAttribute(shade, 1));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

// Caustics: the bright net light draws on the pond's floor where the sun reaches it (the
// water-turbulence pattern, a few warped sine iterations).
const CAUSTIC = /* glsl */ `
  float caustic(vec2 p, float t){
    vec2 i = p;
    float c = 1.0;
    float inten = 0.005;
    for (int n = 0; n < 4; n++) {
      float tt = t * (1.0 - (3.5 / float(n + 1)));
      i = p + vec2(cos(tt - i.x) + sin(tt + i.y), sin(tt - i.y) + cos(tt + i.x));
      c += 1.0 / length(vec2(p.x / (sin(i.x + tt) / inten), p.y / (cos(i.y + tt) / inten)));
    }
    c /= 4.0;
    c = 1.17 - pow(c, 1.4);
    return clamp(pow(abs(c), 8.0), 0.0, 1.0);
  }
`;

/** Sway shared by the grass and the ferns: a gust front rolling across, plus a fine flutter. */
const WIND_GLSL = /* glsl */ `
  vec3 ip = (instanceMatrix * vec4(position, 1.0)).xyz;
  vec2 wdir = normalize(vec2(1.0, -0.35));
  float roll = sin(dot(ip.xz, wdir) * 0.3 - uTime * 1.6);
  float gust = pow(roll * 0.5 + 0.5, 2.0);
  float flutter = sin(uTime * 3.7 + ip.x * 1.9 + ip.z * 2.3) * 0.1;
  float s = (0.25 + gust * 0.9 + flutter) * (0.2 + uWind * 1.05);
`;

export class Terrain {
  constructor(scene, { lowPower = false } = {}) {
    this.uniforms = {
      uSoil: { value: new THREE.Color('#5b4a33') },
      uMud: { value: new THREE.Color('#3f3527') },
      uVeg: { value: new THREE.Color('#76893a') },
      uCaustic: { value: 0.5 },
    };
    const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.97, metalness: 0 });
    mat.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, this.uniforms, { uSnow: WORLD.uSnow, uWet: WORLD.uWet, uTime: WORLD.uTime });
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nattribute vec3 aMix; attribute float aShade; varying vec3 vMix; varying float vShade; varying float vUp; varying vec3 vWorldG;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\n vMix = aMix; vShade = aShade;\n vWorldG = (modelMatrix * vec4(position, 1.0)).xyz;')
        .replace('#include <defaultnormal_vertex>', '#include <defaultnormal_vertex>\n vUp = inverseTransformDirection(transformedNormal, viewMatrix).y;');
      shader.fragmentShader = shader.fragmentShader
        .replace(
          '#include <common>',
          `#include <common>
          varying vec3 vMix; varying float vShade; varying float vUp; varying vec3 vWorldG;
          uniform vec3 uSoil; uniform vec3 uMud; uniform vec3 uVeg; uniform float uSnow; uniform float uWet;
          uniform float uTime; uniform float uCaustic;
          ${CAUSTIC}`,
        )
        .replace(
          '#include <map_fragment>',
          `#include <map_fragment>
          // The forest floor: loam, darker under the canopy, with moss where it stays damp.
          vec3 soil = uSoil * (0.85 + vMix.z * 0.3);
          soil = mix(soil, soil * 0.6, vShade);
          float moss = smoothstep(0.42, 0.72, vMix.z) * vShade;
          soil = mix(soil, uVeg * 0.4, moss * 0.65);
          vec3 earth = mix(soil, uMud, clamp(vMix.x + uWet * 0.3, 0.0, 1.0));
          vec3 veg = mix(earth, uVeg * (0.38 + vMix.z * 0.16) * (1.0 - vShade * 0.35), smoothstep(0.0, 0.6, vMix.y));
          float snowAmt = uSnow * smoothstep(0.55, 0.85, vUp) * (1.0 - vShade * 0.4);
          diffuseColor.rgb = mix(veg, vec3(0.9, 0.92, 0.94), snowAmt * 0.92);
          // Under the pond: the floor goes dark green with depth and catches caustics.
          float under = ${WATER_Y.toFixed(3)} - vWorldG.y;
          if (under > 0.0) {
            diffuseColor.rgb *= mix(vec3(0.8, 0.88, 0.78), vec3(0.32, 0.42, 0.34), smoothstep(0.0, 1.0, under));
            float cz = caustic(mod(vWorldG.xz * 2.6, 6.28318) - 250.0, uTime * 0.6);
            float fade = smoothstep(0.0, 0.12, under) * exp(-under * 1.4);
            diffuseColor.rgb += vec3(0.75, 0.9, 0.7) * cz * fade * uCaustic * 0.8;
          }`,
        )
        .replace(
          '#include <roughnessmap_fragment>',
          `#include <roughnessmap_fragment>
          float bank = smoothstep(0.1, -0.02, vWorldG.y) * vMix.x;
          roughnessFactor = mix(roughnessFactor, 0.4, clamp(uWet * 0.45 + bank * 0.5, 0.0, 1.0) * (1.0 - snowAmt));`,
        );
    };
    this.ground = new THREE.Mesh(buildGround(), mat);
    this.ground.receiveShadow = true;
    scene.add(this.ground);

    this.grassPush = { value: new THREE.Vector3(0, 0, 0) };
    this.grass = this._buildGrass(lowPower);
    scene.add(this.grass);
    this.ferns = this._buildFerns(lowPower);
    scene.add(this.ferns);
  }

  /**
   * The clearing's grass: patches of many thin curved blades, laid on a jittered grid so the
   * cover reads as one soft field, sparse and darker under the trees.
   */
  _buildGrass(lowPower) {
    const rand = rng(7);
    const pos = [];
    const col = [];
    const nrm = [];
    const blades = lowPower ? 34 : 64;
    for (let b = 0; b < blades; b++) {
      const bx = (rand() - 0.5) * 1.12;
      const bz = (rand() - 0.5) * 1.12;
      const ang = rand() * Math.PI * 2;
      const lean = 0.1 + rand() * 0.36;
      const h = 0.24 + Math.pow(rand(), 0.7) * 0.4;
      const w = 0.012 + rand() * 0.01;
      const dx = Math.cos(ang);
      const dz = Math.sin(ang);
      const px = -dz * w;
      const pz = dx * w;
      const at = (f, side) => {
        const bend = lean * f * f;
        const width = (1 - f * 0.8) * side;
        return [bx + dx * bend + px * width, h * f * (1 - lean * 0.25 * f), bz + dz * bend + pz * width];
      };
      const tip = [bx + dx * lean, h * (1 - lean * 0.25), bz + dz * lean];
      const push = (v, f) => {
        pos.push(...v);
        const c = 0.12 + Math.pow(f, 0.8) * 0.95;
        col.push(c * 1.03, c, c * (0.84 - f * 0.14));
        nrm.push(dx * 0.3, 1, dz * 0.3);
      };
      const l0 = at(0, -1), r0 = at(0, 1), l1 = at(0.55, -1), r1 = at(0.55, 1);
      push(l0, 0); push(r0, 0); push(l1, 0.55);
      push(r0, 0); push(r1, 0.55); push(l1, 0.55);
      push(l1, 0.55); push(r1, 0.55); push(tip, 1);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
    geo.computeBoundingSphere();

    const mat = new THREE.MeshLambertMaterial({ color: 0x76893a, vertexColors: true, side: THREE.DoubleSide });
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = WORLD.uTime;
      shader.uniforms.uWind = WORLD.uWind;
      shader.uniforms.uSnow = WORLD.uSnow;
      shader.uniforms.uPush = this.grassPush;
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nuniform float uTime; uniform float uWind; uniform vec3 uPush; varying float vTip;')
        .replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>
          float hh = position.y;
          vTip = clamp(hh / 0.5, 0.0, 1.0);
          #ifdef USE_INSTANCING
            ${WIND_GLSL}
            float h2 = hh * hh;
            vec3 windW = vec3(wdir.x, 0.0, wdir.y) * s * h2 * 0.85 - vec3(0.0, s * h2 * 0.22, 0.0);
            // the blades part round the pointer
            vec2 away = ip.xz - uPush.xy;
            float dd = length(away);
            float near = uPush.z * smoothstep(2.4, 0.2, dd);
            windW.xz += (away / max(dd, 0.001)) * near * h2 * 1.6;
            windW.y -= near * h2 * 0.5;
            mat3 imx = mat3(instanceMatrix);
            transformed += (transpose(imx) * windW) / max(dot(imx[0], imx[0]), 0.0001);
          #endif`,
        );
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform float uSnow; varying float vTip;')
        .replace(
          '#include <color_fragment>',
          `#include <color_fragment>
          // seed heads catch a little gold toward the tips, as in a forest meadow
          diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(1.25, 1.05, 0.55), pow(vTip, 3.0) * 0.35);
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.88, 0.9, 0.92), uSnow * 0.55 * vTip);`,
        );
    };

    const r = rng(99);
    const spots = [];
