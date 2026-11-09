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
