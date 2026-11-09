import { Emitter } from './emitter.js';
import { load, save } from './store.js';

/** Game minutes that pass per real second, by speed id. */
export const SPEEDS = {
  paused: 0,
  real: 1 / 60,
  normal: 1, // the brief: one game minute every real second
  fast: 10,
};

export const SPEED_LABELS = {
  paused: 'Stopped',
  real: 'Real time',
