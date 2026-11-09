import * as THREE from 'three';
import { rng } from '../core/emitter.js';
import { WORLD } from './materials.js';
import {
  CLEARING, WATER_Y, bareEarth, canopy, fbm, forestDepth, grassCover, groundHeight, smooth, vnoise,
} from './ground.js';

export { groundHeight, WATER_Y };

function warp(u) {
