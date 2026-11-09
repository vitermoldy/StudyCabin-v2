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
