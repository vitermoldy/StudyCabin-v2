// Shared floor plan, in metres. x runs left to right along the cabin front,
// z points from the back wall out into the clearing, y is up. The cabin front
// glass sits at z = 3, the deck runs to z = 6.6, the pond starts near z = 10.

import { trailLoop } from '../scene/ground.js';

export const FLOOR = 0.5; // interior floor and deck top
export const CABIN = { x0: -7, x1: 7, z0: -3, z1: 3, wall: 3.05, ridge: 5.35 };
export const DECK = { x0: -10.6, x1: 9.6, z0: 3, z1: 6.6 };
export const DOOR = { x0: -0.95, x1: 0.95 };
export const ANNEX = { x0: -10.4, x1: -7.12, z0: -2.4, z1: 1.9, h: 2.75 };
export const SPINE_Z = 2.3; // free strip inside the glass
export const DECK_Z = 3.75; // free strip on the deck

// Furniture, shared by the cabin builder and the resident's routes.
export const FURNITURE = {
  counter: { x: -5.35, z: -2.72, w: 3.1, d: 0.62 },
