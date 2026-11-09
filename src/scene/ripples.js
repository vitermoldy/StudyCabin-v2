import * as THREE from 'three';
import { POND } from './ground.js';

// A height-field ripple simulation on the GPU, after Evan Wallace's WebGL Water
// (madebyevan.com/webgl-water): every texel keeps a height and a velocity, each
