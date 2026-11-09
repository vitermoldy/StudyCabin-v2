import * as THREE from 'three';
import { damp, clamp } from '../core/emitter.js';
import { SPOTS, TRAIL_LOOP, route, FLOOR, FURNITURE as F } from '../sim/layout.js';
import { groundHeight, POND } from './ground.js';

