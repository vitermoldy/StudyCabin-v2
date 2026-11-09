import * as THREE from 'three';
import { rng } from '../core/emitter.js';
import { CLEARING, forestDepth, groundHeight, pondE } from './ground.js';

// Particles driven entirely on the GPU from a time uniform: nothing is
// rewritten per frame. Each drop, flake or leaf has a seed and wraps inside a
// box that follows the camera, so the weather is always around the viewer.

