// Shared floor plan, in metres. x runs left to right along the cabin front,
// z points from the back wall out into the clearing, y is up. The cabin front
// glass sits at z = 3, the deck runs to z = 6.6, the pond starts near z = 10.

import { trailLoop } from '../scene/ground.js';

export const FLOOR = 0.5; // interior floor and deck top
export const CABIN = { x0: -7, x1: 7, z0: -3, z1: 3, wall: 3.05, ridge: 5.35 };
export const DECK = { x0: -10.6, x1: 9.6, z0: 3, z1: 6.6 };
export const DOOR = { x0: -0.95, x1: 0.95 };
