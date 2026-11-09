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
// making it glow.
function coat(hex) {
  return new THREE.MeshStandardMaterial({ color: hex, emissive: hex, emissiveIntensity: 0.05, roughness: 0.92, metalness: 0 });
}

function blob(material, [sx, sy, sz], [x, y, z], tilt = 0) {
  const mesh = new THREE.Mesh(ball, material);
  mesh.scale.set(sx, sy, sz);
  mesh.position.set(x, y, z);
  mesh.rotation.z = tilt;
  mesh.castShadow = true;
  return mesh;
}

function eyes(head, x, y, z, r) {
  for (const side of [-1, 1]) {
    const e = new THREE.Mesh(ball, eyeMat);
    e.scale.setScalar(r);
    e.position.set(x, y, side * z);
    head.add(e);
  }
}

// A leg hanging from its pivot at the hip or shoulder; swinging the pivot walks it.
function leg(material, length, top, bottom, [x, y, z]) {
  const geometry = new THREE.CylinderGeometry(top, bottom, length, 6);
  geometry.translate(0, -length / 2, 0);
  const pivot = new THREE.Group();
  pivot.position.set(x, y, z);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  pivot.add(mesh);
  return pivot;
}

function stick(material, length, radius, [x, y, z], tiltZ, tiltX = 0) {
  const geometry = new THREE.CylinderGeometry(radius * 0.6, radius, length, 5);
  geometry.translate(0, length / 2, 0);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.rotation.set(tiltX, 0, tiltZ);
  return mesh;
}

function makeDeer({ buck = false, fawn = false } = {}) {
  const hide = coat(buck ? '#8f5e34' : fawn ? '#b98a52' : '#a87240');
  const dark = coat('#3a2618');
  const pale = coat('#eadfcc');
  const root = new THREE.Group();
