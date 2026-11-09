import { Emitter, clamp } from '../core/emitter.js';
import { load, save } from '../core/store.js';

export const LAYERS = [
  { id: 'leaves', label: 'Leaves and branches' },
  { id: 'rain', label: 'Rain' },
  { id: 'wind', label: 'Wind' },
