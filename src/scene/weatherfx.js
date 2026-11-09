import * as THREE from 'three';
import { rng } from '../core/emitter.js';
import { CLEARING, forestDepth, groundHeight, pondE } from './ground.js';

// Particles driven entirely on the GPU from a time uniform: nothing is
