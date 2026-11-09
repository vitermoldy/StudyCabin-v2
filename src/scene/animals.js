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
  const body = new THREE.Group();
  root.add(body);
  body.add(blob(hide, [0.46, 0.22, 0.19], [0, 0.93, 0]));
  body.add(blob(hide, [0.24, 0.23, 0.18], [-0.27, 0.95, 0]));
  body.add(blob(hide, [0.22, 0.25, 0.18], [0.28, 0.94, 0]));
  body.add(blob(pale, [0.06, 0.09, 0.05], [-0.5, 1.03, 0], 0.5));
  if (fawn) {
    // white spots along the back
    for (let i = 0; i < 9; i++) {
      const x = -0.32 + (i % 5) * 0.15;
      const side = i < 5 ? 1 : -1;
      body.add(blob(pale, [0.03, 0.022, 0.012], [x, 1.08 - (i % 2) * 0.04, side * 0.16]));
    }
  }
  const neck = new THREE.Group();
  neck.position.set(0.36, 0.98, 0);
  body.add(neck);
  neck.add(blob(hide, [0.09, 0.28, 0.08], [0.1, 0.22, 0], -0.45));
  const head = new THREE.Group();
  head.position.set(0.21, 0.48, 0);
  neck.add(head);
  head.add(blob(hide, [0.15, 0.085, 0.075], [0.07, 0, 0], -0.35));
  head.add(blob(dark, [0.03, 0.03, 0.03], [0.21, -0.05, 0]));
  eyes(head, 0.08, 0.035, 0.058, 0.014);
  for (const side of [-1, 1]) {
    head.add(blob(hide, [0.03, 0.08, 0.02], [-0.03, 0.08, side * 0.06], 0.6));
    if (buck) {
      head.add(stick(dark, 0.34, 0.016, [0, 0.07, side * 0.035], 0.55, -side * 0.35));
      head.add(stick(dark, 0.16, 0.012, [-0.06, 0.2, side * 0.07], -0.2, -side * 0.3));
      head.add(stick(dark, 0.14, 0.011, [-0.15, 0.3, side * 0.1], 0.3, -side * 0.2));
    }
  }
  const legs = [[0.3, 0.08], [0.3, -0.08], [-0.3, 0.08], [-0.3, -0.08]].map(([x, z]) => leg(hide, 0.86, 0.042, 0.022, [x, 0.88, z]));
  legs.forEach((l) => root.add(l));
  if (fawn) root.scale.setScalar(0.6);
  return { root, body, neck, head, legs, tail: null, ears: null };
}

function makeFox() {
  const fur = coat('#c8642a');
  const dark = coat('#2a1a12');
  const pale = coat('#f0e6d8');
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  body.add(blob(fur, [0.3, 0.12, 0.1], [0, 0.37, 0]));
  body.add(blob(pale, [0.1, 0.1, 0.08], [0.2, 0.34, 0]));
  const neck = new THREE.Group();
  neck.position.set(0.25, 0.43, 0);
  body.add(neck);
  const head = new THREE.Group();
  head.position.set(0.05, 0.04, 0);
  neck.add(head);
  head.add(blob(fur, [0.1, 0.08, 0.075], [0.03, 0, 0]));
  head.add(blob(pale, [0.09, 0.035, 0.04], [0.12, -0.025, 0]));
  head.add(blob(dark, [0.018, 0.018, 0.018], [0.21, -0.02, 0]));
  eyes(head, 0.1, 0.03, 0.045, 0.012);
  for (const side of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.09, 6), fur);
    ear.position.set(-0.01, 0.1, side * 0.04);
    head.add(ear);
  }
  const tail = new THREE.Group();
  tail.position.set(-0.28, 0.4, 0);
  body.add(tail);
  tail.add(blob(fur, [0.24, 0.075, 0.075], [-0.2, -0.05, 0], 0.3));
  tail.add(blob(pale, [0.07, 0.05, 0.05], [-0.42, -0.13, 0], 0.3));
  const legs = [[0.18, 0.06], [0.18, -0.06], [-0.18, 0.06], [-0.18, -0.06]].map(([x, z]) => leg(dark, 0.33, 0.026, 0.018, [x, 0.34, z]));
  legs.forEach((l) => root.add(l));
  return { root, body, neck, head, legs, tail, ears: null };
}

function makeHare() {
  const fur = coat('#a8865e');
  const pale = coat('#eee6da');
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  body.add(blob(fur, [0.15, 0.12, 0.11], [0, 0.13, 0], 0.25));
  for (const side of [-1, 1]) body.add(blob(fur, [0.08, 0.07, 0.04], [-0.06, 0.08, side * 0.08]));
  body.add(blob(pale, [0.045, 0.045, 0.045], [-0.15, 0.15, 0]));
  const neck = new THREE.Group();
