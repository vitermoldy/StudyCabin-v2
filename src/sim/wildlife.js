// Who lives round the clearing, when they come out and which ways they walk. Plain data, so the
// trees can keep these game trails open and the scene can walk the animals along them.
//
// Each route runs from inside the wood on one side, across the clearing, back into the wood on
// the other. `stops` name a waypoint where the animal stands for a while (graze, drink, look, sit);
// `face` is a point it turns toward while it stands. Routes are walked either way round.

import { POND } from '../scene/ground.js';

const POND_C = [POND.x, POND.z];
const CABIN_C = [0, 1];
const FIRE_C = [-7.4, 5.25];

export const ROUTES = {
  deer: [
    {
      pts: [[-36, 16], [-22, 15], [-12, 13], [-3, 14.4], [1.75, 14.1], [3.7, 19.9], [9, 20.8], [16, 19], [22, 13], [40, 10]],
      stops: [{ at: 2, pose: 'graze' }, { at: 4, pose: 'drink', face: POND_C }],
    },
    {
      pts: [[34, 2], [20, 4.5], [14, 8.6], [8, 9.3], [-2, 9.8], [-12, 11], [-20, 8], [-34, 4]],
      stops: [{ at: 3, pose: 'look', face: CABIN_C }, { at: 5, pose: 'graze' }],
    },
    {
      pts: [[-31, 26], [-12, 22], [-4, 25], [8, 26], [20, 24], [33, 29]],
      stops: [{ at: 1, pose: 'graze' }, { at: 3, pose: 'graze' }],
    },
  ],
  fox: [
    {
      pts: [[36, 18], [18, 21.5], [10, 21.2], [0, 19], [-6, 17], [-18, 19], [-34, 21]],
      stops: [{ at: 2, pose: 'look', face: CABIN_C }, { at: 4, pose: 'sit' }],
    },
    {
      pts: [[-34, 3], [-18, 9], [-11.8, 9.4], [-6, 9.8], [1, 10], [6, 9.6], [11.5, 9.3], [18, 7.2], [34, 1]],
      stops: [{ at: 2, pose: 'look', face: FIRE_C }, { at: 5, pose: 'look', face: POND_C }],
    },
  ],
  hare: [
    {
      pts: [[-34, 12], [-20, 12], [-10, 16], [-6, 20], [-20, 24], [-32, 26]],
      stops: [{ at: 1, pose: 'sit' }, { at: 2, pose: 'sit' }, { at: 3, pose: 'sit' }],
    },
    {
      pts: [[32, 20], [18, 18.6], [16.5, 12], [24, 6], [34, 4]],
      stops: [{ at: 1, pose: 'sit' }, { at: 2, pose: 'sit' }],
    },
  ],
  squirrel: [
    {
      pts: [[-31, 3], [-17, 7], [-12.6, 6.2], [-19, 0.5], [-33, -4]],
      stops: [{ at: 1, pose: 'sit' }, { at: 2, pose: 'look', face: [-7, 4] }],
    },
    {
      pts: [[36, 16], [19.5, 13.2], [15.6, 8.2], [22, 2], [33, -1]],
      stops: [{ at: 1, pose: 'sit' }, { at: 2, pose: 'sit' }],
    },
  ],
};

/** Every route as a list of [x, z] points, for keeping the trails clear of trees. */
export function allTrails() {
  return Object.values(ROUTES).flat().map((r) => r.pts);
}

const h = (hh, mm = 0) => hh * 60 + mm;

/** 1 inside [a, b] (game minutes, may wrap past midnight), easing out over `fade` minutes. */
function band(m, a, b, fade = 40) {
  const inside = a <= b ? m >= a && m <= b : m >= a || m <= b;
  if (inside) return 1;
  const gap = Math.min(Math.abs(m - a), Math.abs(m - b), 1440 - Math.abs(m - a), 1440 - Math.abs(m - b));
  return Math.max(0, 1 - gap / fade);
}

// How keen each kind is to come out, by the hour: deer at dawn and dusk, the fox from dusk into
// the night, the hare round the edges of the day, the squirrel by day.
const HOURS = {
  deer: (m) => Math.max(band(m, h(4, 30), h(10)), band(m, h(16), h(21, 30)), 0.3),
  fox: (m) => Math.max(band(m, h(17, 30), h(7)), 0.12),
  hare: (m) => Math.max(band(m, h(5), h(9, 30)), band(m, h(17), h(21)), band(m, h(9, 30), h(17)) * 0.4, 0.12),
  squirrel: (m) => band(m, h(7), h(17, 30)),
};

// Rain sends most of them under cover; a storm sends all of them.
const WEATHER = {
  deer: { rain: 0.3, snow: 0.8 },
  fox: { rain: 0.4, snow: 0.8 },
  hare: { rain: 0.1, snow: 0.5 },
  squirrel: { rain: 0.05, snow: 0.3 },
};

const SEASON = {
  deer: {},
  fox: {},
  hare: { winter: 0.7 },
  squirrel: { winter: 0.5 },
};

/**
 * 0..1: how likely an animal of this kind is to come out now.
 * @param {'deer'|'fox'|'hare'|'squirrel'} kind
 * @param {{minutes:number, params:{rain:number, snow:number, storm:number}, season:string}} env
 */
export function keenness(kind, { minutes, params, season }) {
  if (params.storm > 0.4) return 0;
