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
    temp: [12, 4],
    grass: '#a3843f', soil: '#6a4a2c', mud: '#43311f', foliage: '#c0702c', fern: '#a0602a',
    snow: 0, petals: 0, leaves: 1, warmth: 0.6,
    odds: { clear: 0.2, cloudy: 0.3, fog: 0.25, rain: 0.2, storm: 0.05 },
    line: 'Gold grass in the clearing, leaves on the wind, fog most mornings.',
  },
  spring: {
    label: 'Spring',
    sunrise: 375, sunset: 1125, noonElevation: 55,
    temp: [16, 4],
    grass: '#6f9a3e', soil: '#584a35', mud: '#3d3428', foliage: '#78993f', fern: '#5f8a34',
    snow: 0, petals: 1, leaves: 0, warmth: 0.75,
    odds: { clear: 0.35, cloudy: 0.3, fog: 0.15, rain: 0.2 },
    line: 'Blossom in the air, birds at dawn, frogs in the pond at night.',
  },
  rainy: {
    label: 'Rainy season',
    sunrise: 360, sunset: 1110, noonElevation: 60,
    temp: [22, 3],
    grass: '#5a8a3a', soil: '#4a3d2c', mud: '#342b20', foliage: '#4c6c36', fern: '#4a7232',
