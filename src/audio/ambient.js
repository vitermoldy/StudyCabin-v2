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
 */
export class Ambient extends Emitter {
  constructor() {
    super();
    const saved = load('ambient', {});
    this.enabled = saved.on === true;
    this.volume = Number.isFinite(saved.volume) ? clamp(saved.volume, 0, 1) : 0.6;
    this.mix = { leaves: 0.8, rain: 0.8, wind: 0.6, wildlife: 0.7, fire: 0.8, ...(saved.mix || {}) };
    this.duckWhenMusic = saved.duck !== false;
    this.musicPlaying = false;
    this.ctx = null;
    this._t = 0;
    this._nextBird = 0;
    this._nextCrackle = 0;
    this._cricketGate = 0;
    this._nextFrog = 0;
    this._nextHoot = 4;
    this._nextDrum = 30;
    this._nextBark = 20;
    this.env = null;
  }

  get supported() {
    return typeof window.AudioContext === 'function' || typeof window.webkitAudioContext === 'function';
  }

  _ensure() {
    if (this.ctx) return true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    const ctx = new AC();
    this.ctx = ctx;
    const len = ctx.sampleRate * 4;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    // Pinkish noise (Paul Kellet's filter) so the base is softer than white.
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < len; i++) {
