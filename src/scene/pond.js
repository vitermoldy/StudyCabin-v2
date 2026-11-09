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
