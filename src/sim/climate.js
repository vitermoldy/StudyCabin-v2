import { Emitter, clamp, damp, lerp } from '../core/emitter.js';
import { load, save } from '../core/store.js';

export const SEASON_ORDER = ['spring', 'summer', 'rainy', 'autumn', 'winter'];

// Colours are sRGB: the clearing's grass, the forest floor (soil), the bare earth of the path and
// the pond's bank (mud), the broadleaf crowns (foliage) and the ferns under the trees.
export const SEASONS = {
  summer: {
    label: 'Summer',
    sunrise: 330, sunset: 1185, noonElevation: 68,
    temp: [25, 4],
