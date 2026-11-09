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
    grass: '#76893a', soil: '#5b4a33', mud: '#3f3527', foliage: '#56713a', fern: '#4f6e2e',
    snow: 0, petals: 0, leaves: 0, warmth: 1,
    odds: { clear: 0.5, cloudy: 0.27, fog: 0.06, rain: 0.11, storm: 0.06 },
    line: 'Long days, warm evenings, fireflies over the grass after dark.',
  },
  autumn: {
    label: 'Autumn',
    sunrise: 405, sunset: 1080, noonElevation: 40,
