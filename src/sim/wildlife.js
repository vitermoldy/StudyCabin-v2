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
