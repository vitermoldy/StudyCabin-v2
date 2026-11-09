import * as THREE from 'three';
import { rng } from '../core/emitter.js';
import { CLEARING, groundHeight } from './ground.js';

// The far forest: three rings of fir silhouettes round the clearing, each further one paler with
// the haze, and mist pooling at their feet, so the wood reads in depth instead of ending at the
// last 3D tree. After the treeline in SongPlay, bent into rings so the camera can turn all the way
// round. Each fir is a spike whose slope steps out three times, so the outline reads as tiers of
// boughs even far away and in fog. The colours are set every frame from the sky's haze.

