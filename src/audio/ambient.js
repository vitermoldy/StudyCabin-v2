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
      const w = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + w * 0.0555179;
      b1 = 0.99332 * b1 + w * 0.0750759;
      b2 = 0.969 * b2 + w * 0.153852;
      b3 = 0.8665 * b3 + w * 0.3104856;
      b4 = 0.55 * b4 + w * 0.5329522;
      b5 = -0.7616 * b5 - w * 0.016898;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
      b6 = w * 0.115926;
    }
    this.noise = buf;

    this.master = ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(ctx.destination);

    const src = (offset) => {
      const s = ctx.createBufferSource();
