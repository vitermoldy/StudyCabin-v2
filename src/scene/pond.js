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
