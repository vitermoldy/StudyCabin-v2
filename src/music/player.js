import { Emitter, clamp } from '../core/emitter.js';
import { load, save } from '../core/store.js';
import { parseLink, loadYouTubeApi, fetchDetails, ERROR_TEXT, LinkError } from './links.js';

let uid = 0;
const newId = () => `q${Date.now().toString(36)}${(uid++).toString(36)}`;

/**
 * The music queue and the YouTube embed that plays it.
 * status: idle | loading-api | loading | playing | paused | buffering | ended | api-error
 */
export class MusicPlayer extends Emitter {
  constructor(host) {
    super();
    this.host = host;
    const saved = load('music', {});
    this.queue = Array.isArray(saved.queue) ? saved.queue.filter((q) => q && (q.videoId || q.listId)).map((q) => ({ ...q, status: q.status === 'error' ? 'error' : 'ready' })) : [];
    this.current = Number.isInteger(saved.current) && saved.current < this.queue.length ? saved.current : -1;
    this.volume = Number.isFinite(saved.volume) ? clamp(saved.volume, 0, 100) : 70;
    this.loop = saved.loop === true;
    this.shuffle = saved.shuffle === true;
    this.status = 'idle';
    this.nowTitle = '';
    this.apiError = '';
    this.player = null;
    this._ready = false;
    this._pending = null;
    this._seekToVideo = null;
  }

  get item() {
    return this.queue[this.current] || null;
  }

  get isPlaying() {
    return this.status === 'playing' || this.status === 'buffering';
  }

  // ------------------------------------------------------------ queue
  /** Adds a link. Returns the new item or throws LinkError. */
  add(raw, { playNow = false } = {}) {
    const parsed = parseLink(raw);
    const dup = this.queue.findIndex((q) => q.videoId === parsed.videoId && q.listId === parsed.listId);
