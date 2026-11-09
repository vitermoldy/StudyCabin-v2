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

// Joint names; every pose fills these.
const JOINTS = ['hipY', 'spineX', 'spineZ', 'headX', 'headY', 'shLx', 'shLz', 'elL', 'shRx', 'shRz', 'elR', 'thL', 'knL', 'thR', 'knR', 'lie'];

function base(o = {}) {
  return {
    hipY: 0.93, spineX: 0, spineZ: 0, headX: 0, headY: 0,
    shLx: 0.05, shLz: 0.09, elL: -0.18, shRx: 0.05, shRz: -0.09, elR: -0.18,
    thL: 0, knL: 0.02, thR: 0, knR: 0.02, lie: 0, ...o,
  };
}

function sitBase(seat, o = {}) {
  return base({ hipY: seat + 0.02, thL: -1.5, knL: 1.48, thR: -1.45, knR: 1.42, shLx: -0.3, elL: -0.9, shRx: -0.3, elR: -0.9, spineX: 0.04, ...o });
}

/** Pose functions: (t, seat) -> joint targets. t is real seconds. */
const POSES = {
  stand: (t) => base({ spineX: 0.015 * Math.sin(t * 1.4), headY: 0.15 * Math.sin(t * 0.21) }),
  walk: () => base(),
