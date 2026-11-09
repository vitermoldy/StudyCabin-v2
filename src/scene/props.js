import * as THREE from 'three';
import { rng } from '../core/emitter.js';
import { weathered } from './materials.js';
import { groundHeight, pondPoint } from './ground.js';

// Small things on the forest floor that say where you are: mossy stones round the pond, a fallen
// trunk at the edge of the clearing and a stump beside it. Snow settles on their tops in winter
// and rain darkens them, like the cabin's own outdoor surfaces.

/** A lumpy stone, one unit across, grey with moss on the faces that look up. */
function stoneGeometry(seed) {
  const r = rng(seed);
  const geo = new THREE.IcosahedronGeometry(0.5, 1);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const k = 0.8 + r() * 0.35;
    pos.setXYZ(i, pos.getX(i) * k, Math.max(-0.12, pos.getY(i) * k * 0.6), pos.getZ(i) * k);
  }
  geo.computeVertexNormals();
  const nor = geo.attributes.normal;
  const col = new Float32Array(pos.count * 3);
  const grey = new THREE.Color('#77786f');
  const moss = new THREE.Color('#5b6b34');
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    c.copy(grey).lerp(moss, THREE.MathUtils.smoothstep(nor.getY(i), 0.35, 0.85) * 0.8);
    col.set([c.r, c.g, c.b], i * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return geo;
}

export class Props {
  constructor(scene) {
    const r = rng(83);
    const stoneMat = weathered(new THREE.MeshStandardMaterial({ color: '#ffffff', vertexColors: true, roughness: 0.9 }), { snow: 1, wet: 0.8 });
    const geos = [stoneGeometry(1), stoneGeometry(2), stoneGeometry(3)];
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    // Stones on the bank, in small groups, none across the path.
    const spots = [];
    // (Angles round the pond keep clear of the deer's drinking place and the fox's trail.)
    for (const [a0, n] of [[0.35, 3], [1.2, 2], [2.6, 3], [3.6, 2], [5.75, 2]]) {
      for (let i = 0; i < n; i++) {
