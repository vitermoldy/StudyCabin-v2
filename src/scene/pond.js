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
