import { Emitter } from '../core/emitter.js';
import { load, save } from '../core/store.js';

export const PRESETS = {
  short: { label: '25 min focus, 5 min break', focus: 25, short: 5, long: 15, rounds: 4 },
