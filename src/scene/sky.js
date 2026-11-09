import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../core/emitter.js';

const NOISE = /* glsl */ `
  float hash2(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float hash3(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
  float vnoise(vec2 p){
    vec2 i = floor(p); vec2 f = fract(p);
    float a = hash2(i), b = hash2(i + vec2(1.0, 0.0)), c = hash2(i + vec2(0.0, 1.0)), d = hash2(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }
  float fbm(vec2 p){ float v = 0.0; float a = 0.5; for (int i = 0; i < 5; i++){ v += a * vnoise(p); p = p * 2.03 + 17.1; a *= 0.5; } return v; }
`;

const VERT = /* glsl */ `
  varying vec3 vDir;
  void main(){
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vDir = wp.xyz - cameraPosition;
    gl_Position = projectionMatrix * viewMatrix * wp;
    gl_Position.z = gl_Position.w;
  }
`;

const FRAG = /* glsl */ `
  uniform vec3 uZenith; uniform vec3 uHorizon; uniform vec3 uGround;
  uniform vec3 uSunDir; uniform vec3 uSunColor; uniform vec3 uMoonDir;
  uniform vec3 uCloudLit; uniform vec3 uCloudDark;
  uniform float uSunVis; uniform float uMoonVis; uniform float uStars; uniform float uCloud;
  uniform float uTime; uniform float uWind; uniform float uFlash; uniform float uGlow; uniform float uFogAmt;
  uniform float uAurora;
  varying vec3 vDir;
  ${NOISE}

  // Northern lights: three curtains with a bright lower edge and soft rays.
  vec3 aurora(vec3 d, float t){
    if (d.y < 0.015) return vec3(0.0);
    float az = atan(d.x, -d.z);
    vec3 col = vec3(0.0);
    for (int i = 0; i < 3; i++) {
      float fi = float(i);
      float edge = 0.075 + fi * 0.06 + sin(az * (1.6 + fi * 0.5) + t * 0.035 + fi * 2.1) * 0.045
        + (vnoise(vec2(az * 3.0 + fi * 7.0, t * 0.03)) - 0.5) * 0.06;
      float hgt = d.y - edge;
      float curtain = smoothstep(-0.006, 0.012, hgt) * exp(-max(hgt, 0.0) * (7.0 - fi));
      float rays = 0.35 + 0.65 * pow(vnoise(vec2(az * 55.0 + fi * 19.0, t * 0.12 + fi)), 1.6);
      vec3 c = mix(vec3(0.12, 1.0, 0.55), vec3(0.1, 0.78, 0.82), smoothstep(0.0, 0.14, hgt));
      c = mix(c, vec3(0.95, 0.42, 0.55), smoothstep(0.08, 0.3, hgt) * 0.4);
      col += c * curtain * rays * (0.55 - fi * 0.13);
    }
    // they hang over the hills behind the cabin, fading toward the viewer's back
    return col * smoothstep(-0.35, 0.45, -d.z) * smoothstep(0.015, 0.08, d.y);
  }

