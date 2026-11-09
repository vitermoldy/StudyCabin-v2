import * as THREE from 'three';
import { rng, damp } from '../core/emitter.js';
import { forestDepth, groundHeight } from './ground.js';
import { ROUTES, keenness, owlOut } from '../sim/wildlife.js';
import { CABIN, FLOOR } from '../sim/layout.js';

// The animals that pass through the clearing: a doe (with her fawn in spring and summer), a buck,
// a fox, a hare and a squirrel walk the game trails in `sim/wildlife.js` at their own hours;
// flocks of birds cross over the trees by day; an owl comes to the roof ridge at night. After the
// animals in SongPlay: each is a few soft shapes lit by the scene's own lights, coming out of the
// wood on one side, stopping once or twice (graze, drink, look round, sit up) and going back in on
// the other. Every model faces +x with its feet at y = 0.

const ball = new THREE.SphereGeometry(1, 14, 10);
const ease = (dt, rate) => 1 - Math.exp(-dt * rate);

// Eyes catch the light after dark (eyeshine): one material for every animal, brightened at night.
const eyeMat = new THREE.MeshBasicMaterial({ color: '#141210' });
const EYE_DARK = new THREE.Color('#141210');
const EYE_SHINE = new THREE.Color('#e9f2b8');

// A touch of the coat's own colour as emissive keeps an animal readable in low light without
