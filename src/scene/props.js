import * as THREE from 'three';
import { rng } from '../core/emitter.js';
import { weathered } from './materials.js';
import { groundHeight, pondPoint } from './ground.js';

// Small things on the forest floor that say where you are: mossy stones round the pond, a fallen
// trunk at the edge of the clearing and a stump beside it. Snow settles on their tops in winter
// and rain darkens them, like the cabin's own outdoor surfaces.

/** A lumpy stone, one unit across, grey with moss on the faces that look up. */
function stoneGeometry(seed) {
  const r = rng(seed);
