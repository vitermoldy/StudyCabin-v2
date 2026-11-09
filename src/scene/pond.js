import * as THREE from 'three';
import { rng } from '../core/emitter.js';
import { POND, WATER_Y, groundHeight, pondE } from './ground.js';

// The pond in front of the cabin: still, dark water that mirrors the sky and the ring of trees
// round it, clear enough at the edge to see the floor and its caustics, ringed by the ripple
// simulation (pointer taps and raindrops). In winter it freezes over and snow settles on the ice.

const VERT = /* glsl */ `
  attribute float aGround;
  varying vec3 vWorld; varying float vDepth;
  #include <fog_pars_vertex>
  void main(){
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vDepth = wp.y - aGround;
    vWorld = wp.xyz;
    vec4 mvPosition = viewMatrix * wp;
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`;

const FRAG = /* glsl */ `
  uniform vec3 uDeep; uniform vec3 uShallow; uniform vec3 uZenith; uniform vec3 uHorizon;
  uniform vec3 uSunDir; uniform vec3 uSunColor; uniform float uSunVis; uniform float uTime;
  uniform float uChop; uniform float uRain; uniform float uLight; uniform vec3 uMoonDir; uniform float uMoonVis;
  uniform sampler2D uRipple; uniform vec4 uRippleArea; uniform vec3 uLand;
  uniform float uIce; uniform float uSnow;
  varying vec3 vWorld; varying float vDepth;
  #include <fog_pars_fragment>

  // slope of one sine train a*sin(k dot(d,p) + w t)
  vec2 wgrad(vec2 p, vec2 d, float len, float a, float spd, float t){
    float k = 6.2831 / len;
    return d * (a * k * cos(k * dot(d, p) + t * spd));
  }
  float h21(vec2 p){ p = fract(p * vec2(234.34, 435.345)); p += dot(p, p + 34.23); return fract(p.x * p.y); }
  float vn(vec2 p){ vec2 i = floor(p); vec2 f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(h21(i), h21(i + vec2(1, 0)), u.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), u.x), u.y); }

  void main(){
    if (vDepth < -0.02) discard;
    vec3 V = normalize(cameraPosition - vWorld);
    vec2 p = vWorld.xz;
    float t = uTime;
    float water = 1.0 - uIce;
    // Cat's-paws from the wind and rain on an otherwise still surface.
    vec2 g = vec2(0.0);
    g += wgrad(p, vec2(0.15, -0.99), 2.6, 0.012, 0.9, t);
    g += wgrad(p, vec2(-0.42, -0.9), 1.7, 0.008, 1.2, t);
    g += wgrad(p, vec2(0.62, -0.78), 1.1, 0.005, 1.5, t);
    g += wgrad(p, vec2(-0.85, -0.52), 0.7, 0.003, 1.9, t);
    float gust = 0.55 + 0.45 * vn(p * 0.35 + vec2(t * 0.15, -t * 0.08));
    g *= (0.12 + uChop * 0.9 * gust + uRain * 0.45) * exp(-length(cameraPosition - vWorld) / 60.0) * water;
    // Rings from the ripple simulation.
    vec2 ruv = (p - uRippleArea.xy) / uRippleArea.z;
    if (uRippleArea.w > 0.5 && ruv.x > 0.0 && ruv.y > 0.0 && ruv.x < 1.0 && ruv.y < 1.0) {
      float e = 1.0 / 256.0;
      float hL = texture2D(uRipple, ruv - vec2(e, 0.0)).r;
      float hR = texture2D(uRipple, ruv + vec2(e, 0.0)).r;
      float hD = texture2D(uRipple, ruv - vec2(0.0, e)).r;
      float hU = texture2D(uRipple, ruv + vec2(0.0, e)).r;
      g += vec2(hR - hL, hU - hD) * 3.0 * water;
    }
    vec3 N = normalize(vec3(-g.x * 1.3, 1.0, -g.y * 1.3));

    float ndv = max(dot(N, V), 0.0);
    float fres = (0.04 + 0.96 * pow(1.0 - ndv, 5.0)) * 0.9;
    vec3 R = reflect(-V, N);
    R.y = abs(R.y);
    vec3 sky = mix(uHorizon, uZenith, pow(clamp(R.y, 0.0, 1.0), 0.6));
    // The wood stands all round the pond: low reflections are trees, dark under the sky.
    float az = atan(R.x, R.z);
    float treeTop = 0.3 + 0.12 * vn(vec2(az * 9.0, 1.0)) + 0.06 * vn(vec2(az * 31.0, 3.0));
    float trees = 1.0 - smoothstep(treeTop - 0.04, treeTop + 0.02, R.y);
    sky = mix(sky, uLand, trees);
    float sd = max(dot(R, uSunDir), 0.0);
    sky += uSunColor * pow(sd, 5.0) * 0.25 * uSunVis * (1.0 - trees);

    // Clear over the floor at the edge, peat-dark in the middle.
    float depth = max(vDepth, 0.0);
    float absorb = 1.0 - exp(-depth * 2.4);
    vec3 body = mix(uShallow, uDeep, smoothstep(0.05, 0.9, depth)) * uLight;
    float spec = pow(sd, mix(600.0, 140.0, clamp(uRain + uChop * 0.5, 0.0, 1.0))) * 1.3 + pow(sd, 40.0) * 0.12;
    float mspec = pow(max(dot(R, uMoonDir), 0.0), 220.0) * 1.1;
    vec3 glint = (uSunColor * spec * uSunVis + vec3(0.6, 0.7, 0.68) * mspec * uMoonVis * 0.8) * (1.0 - trees * 0.9) * water;

    // Premultiplied mix so the shallows stay see-through while reflections stay bright.
    vec3 col = body * absorb * (1.0 - fres) + sky * fres + glint;
    float alpha = absorb * (1.0 - fres) + fres + min(1.0, dot(glint, vec3(0.33)));

    // Ice: grey-green and a little milky, white where snow has settled on it.
    float frost = vn(p * 1.4) * 0.5 + vn(p * 5.0) * 0.25;
    vec3 ice = mix(vec3(0.5, 0.6, 0.6), vec3(0.88, 0.91, 0.93), clamp(uSnow * 0.75 + frost * 0.35, 0.0, 1.0));
    ice = ice * (0.22 + uLight * 0.78) + sky * 0.12;
    col = mix(col, ice, uIce);
    alpha = mix(alpha, 0.97, uIce);

    alpha = clamp(alpha, 0.0, 1.0) * smoothstep(-0.01, 0.03, vDepth);
    gl_FragColor = vec4(col / max(alpha, 0.001), alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    #include <fog_fragment>
  }`;

function buildGeometry() {
  const x0 = POND.x - POND.rx * 1.2;
  const x1 = POND.x + POND.rx * 1.2;
  const z0 = POND.z - POND.rz * 1.2;
  const z1 = POND.z + POND.rz * 1.2;
  const NX = 96;
  const NZ = 64;
  const pos = [];
  const ground = [];
  for (let j = 0; j <= NZ; j++) {
    const z = z0 + ((z1 - z0) * j) / NZ;
    for (let i = 0; i <= NX; i++) {
      const x = x0 + ((x1 - x0) * i) / NX;
      pos.push(x, WATER_Y, z);
      ground.push(groundHeight(x, z));
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
  geo.setAttribute('aGround', new THREE.Float32BufferAttribute(ground, 1));
  geo.setIndex(idx);
  geo.computeBoundingSphere();
  return geo;
}

/** Lily pads with a notch, in loose drifts near the edge; a few flowers in the warm months. */
function lilies(scene) {
  const r = rng(19);
  const pads = [];
  for (let i = 0; i < 400 && pads.length < 22; i++) {
    const a = r() * Math.PI * 2;
    const e = 0.55 + r() * 0.33;
    // most of them on the far side, out of the way of the rings near the path
    if (Math.sin(a) < -0.35 && r() < 0.8) continue;
    const u = Math.cos(a) * e;
    const v = Math.sin(a) * e;
    const x = POND.x + u * POND.rx;
    const z = POND.z + v * POND.rz;
    if (pondE(x, z) > 0.9) continue;
    pads.push({ x, z, s: 0.12 + r() * 0.12, yaw: r() * Math.PI * 2 });
  }
  const padGeo = new THREE.CircleGeometry(1, 18, 0.35, Math.PI * 2 - 0.45);
  padGeo.rotateX(-Math.PI / 2);
  const padMat = new THREE.MeshStandardMaterial({ color: '#4f6e2e', roughness: 0.55, metalness: 0 });
  const padMesh = new THREE.InstancedMesh(padGeo, padMat, pads.length);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const Y = new THREE.Vector3(0, 1, 0);
  pads.forEach((p, i) => {
    q.setFromAxisAngle(Y, p.yaw);
    m.compose(new THREE.Vector3(p.x, WATER_Y + 0.006, p.z), q, new THREE.Vector3(p.s, 1, p.s));
    padMesh.setMatrixAt(i, m);
  });
  padMesh.receiveShadow = true;
  scene.add(padMesh);

