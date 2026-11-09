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
