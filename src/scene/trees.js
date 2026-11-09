import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { rng } from '../core/emitter.js';
import { WORLD, weathered } from './materials.js';
import { CLEARING, forestDepth, groundHeight, onCabin, pondE } from './ground.js';
import { allTrails } from '../sim/wildlife.js';

// The forest round the clearing: dark firs that keep their colour (and hold snow in winter) and
// broadleaf trees whose crowns follow the season, with low bushes along the edge so the clearing
