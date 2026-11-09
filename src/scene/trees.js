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
  return geo;
}

/** A pine 1 unit tall: trunk plus four stacked cones. */
function pineGeometry() {
  const parts = [];
  const trunk = new THREE.CylinderGeometry(0.018, 0.03, 0.3, 6);
  trunk.translate(0, 0.15, 0);
  parts.push(paint(trunk, 0.36, 0.27, 0.2));
  const tiers = [[0.2, 0.2, 0.42], [0.36, 0.16, 0.34], [0.52, 0.12, 0.28], [0.68, 0.08, 0.26]];
  tiers.forEach(([y, r, h], i) => {
    const cone = new THREE.ConeGeometry(r, h, 8, 1);
    cone.translate(0, y + h / 2, 0);
    const shade = 0.8 + i * 0.07;
    parts.push(paint(cone, 0.62 * shade, 0.8 * shade, 0.62 * shade, 0.2));
  });
  const g = mergeGeometries(parts);
  g.computeVertexNormals();
  return g;
}

/** A broadleaf tree 1 unit tall: trunk, two limbs and a cloud of crown lumps. */
