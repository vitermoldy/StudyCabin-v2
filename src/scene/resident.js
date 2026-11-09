import * as THREE from 'three';
import { damp, clamp } from '../core/emitter.js';
import { SPOTS, TRAIL_LOOP, route, FLOOR, FURNITURE as F } from '../sim/layout.js';
import { groundHeight, POND } from './ground.js';

const OUTFIT = {
  summer: '#e4ded2',
  spring: '#9ba78b',
  rainy: '#b8954f',
  autumn: '#a6604a',
  winter: '#4d5154',
};

const SEAT = { sofa: 0.5, armchair: 0.5, dine: 0.52, desk: 0.52, deckChair: 0.46, guitar: 0.52 };

