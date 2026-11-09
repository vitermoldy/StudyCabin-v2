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
