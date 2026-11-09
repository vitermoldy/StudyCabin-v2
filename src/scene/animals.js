import * as THREE from 'three';
import { rng, damp } from '../core/emitter.js';
import { forestDepth, groundHeight } from './ground.js';
import { ROUTES, keenness, owlOut } from '../sim/wildlife.js';
import { CABIN, FLOOR } from '../sim/layout.js';

// The animals that pass through the clearing: a doe (with her fawn in spring and summer), a buck,
