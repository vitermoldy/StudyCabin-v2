import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { rng } from '../core/emitter.js';
import { WORLD, weathered } from './materials.js';
import { CLEARING, forestDepth, groundHeight, onCabin, pondE } from './ground.js';
import { allTrails } from '../sim/wildlife.js';

// The forest round the clearing: dark firs that keep their colour (and hold snow in winter) and
// broadleaf trees whose crowns follow the season, with low bushes along the edge so the clearing
// runs into the wood instead of stopping at a wall. Trees stand thicker and taller the deeper into
// the wood; the animals' trails stay open. All of them sway a little with the wind, more toward
// the top. Only the trees near the cabin cast shadows (the sun's shadow map covers no more).

const flat = (g) => (g.index ? g.toNonIndexed() : g);

function paint(geo, r, g, b, vary = 0) {
  const n = geo.attributes.position.count;
  const col = new Float32Array(n * 3);
  const pos = geo.attributes.position;
  for (let i = 0; i < n; i++) {
    const y = pos.getY(i);
    const k = 1 + vary * (y - 0.5);
    col[i * 3] = r * k;
    col[i * 3 + 1] = g * k;
    col[i * 3 + 2] = b * k;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
