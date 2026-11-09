import { Emitter, clamp } from '../core/emitter.js';
import { load, save } from '../core/store.js';

export const LAYERS = [
  { id: 'leaves', label: 'Leaves and branches' },
  { id: 'rain', label: 'Rain' },
  { id: 'wind', label: 'Wind' },
  { id: 'wildlife', label: 'Birds, crickets, frogs and the owl' },
  { id: 'fire', label: 'Stove fire' },
];

/**
 * Ambient sound, made in the browser from filtered noise and oscillators:
 * no audio files. Nothing is created until the visitor turns sound on.
