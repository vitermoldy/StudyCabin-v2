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
  neck.position.set(0.1, 0.18, 0);
  body.add(neck);
  const head = new THREE.Group();
  head.position.set(0.04, 0.05, 0);
  neck.add(head);
  head.add(blob(fur, [0.075, 0.068, 0.065], [0, 0, 0]));
  eyes(head, 0.04, 0.02, 0.05, 0.011);
  const ears = new THREE.Group();
  ears.position.set(-0.02, 0.05, 0);
  head.add(ears);
  for (const side of [-1, 1]) ears.add(blob(fur, [0.022, 0.095, 0.014], [0, 0.08, side * 0.03], 0.15));
  // A big hare, so it still shows over the clearing's grass.
  root.scale.setScalar(1.7);
  return { root, body, neck, head, legs: [], tail: null, ears };
}

function makeSquirrel() {
  const fur = coat('#8c4a22');
  const pale = coat('#e8d6bc');
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  body.add(blob(fur, [0.1, 0.075, 0.065], [0, 0.1, 0], 0.35));
  body.add(blob(pale, [0.05, 0.05, 0.045], [0.05, 0.08, 0]));
  const neck = new THREE.Group();
  neck.position.set(0.08, 0.15, 0);
  body.add(neck);
  const head = new THREE.Group();
  head.position.set(0.02, 0.03, 0);
  neck.add(head);
  head.add(blob(fur, [0.05, 0.045, 0.042], [0, 0, 0]));
  eyes(head, 0.03, 0.015, 0.032, 0.008);
  for (const side of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.014, 0.04, 5), fur);
    ear.position.set(-0.01, 0.045, side * 0.022);
    head.add(ear);
  }
  // The tail curls up over the back.
  const tail = new THREE.Group();
  tail.position.set(-0.09, 0.09, 0);
  body.add(tail);
  [[-0.05, 0.05, 0.05], [-0.07, 0.13, 0.055], [-0.04, 0.21, 0.05], [0.01, 0.25, 0.042]].forEach(([x, y, r]) => tail.add(blob(fur, [r, r * 1.2, r * 0.8], [x, y, 0])));
  root.scale.setScalar(1.6);
  return { root, body, neck, head, legs: [], tail, ears: null };
}

// Kinds of walker. `routes` names the trails in ROUTES; `stopFor` is how long a stop lasts (s).
const KINDS = {
  doe: { make: () => makeDeer(), routes: 'deer', speed: 1.05, stride: 1.6, swing: 0.36, stopFor: [7, 14], away: [25, 70], label: 'A doe' },
  buck: { make: () => makeDeer({ buck: true }), routes: 'deer', speed: 0.95, stride: 1.7, swing: 0.34, stopFor: [6, 12], away: [60, 140], label: 'A buck' },
  fawn: { make: () => makeDeer({ fawn: true }), routes: 'deer', speed: 1.05, stride: 1.0, swing: 0.42, stopFor: [0, 0], away: [0, 0], label: 'A fawn', follows: 'doe' },
  fox: { make: makeFox, routes: 'fox', speed: 1.6, stride: 0.75, swing: 0.55, stopFor: [3, 7], away: [30, 80], label: 'A fox' },
  hare: { make: makeHare, routes: 'hare', speed: 1.5, stride: 0.7, swing: 0, stopFor: [3, 8], away: [20, 60], hops: true, label: 'A hare' },
  squirrel: { make: makeSquirrel, routes: 'squirrel', speed: 2.1, stride: 0.4, swing: 0, stopFor: [2, 5], away: [15, 45], hops: true, label: 'A squirrel' },
};

const KEEN = { doe: 'deer', buck: 'deer', fawn: 'deer', fox: 'fox', hare: 'hare', squirrel: 'squirrel' };

const LINES = {
  graze: (who, two) => `${who} ${two ? 'are' : 'is'} grazing in the clearing`,
  drink: (who, two) => `${who} ${two ? 'are' : 'is'} drinking at the pond`,
  look: (who, two) => `${who} ${two ? 'stop' : 'stops'} to look round`,
  sit: (who) => `${who} sits up in the grass`,
  move: (who, two) => `${who} ${two ? 'are' : 'is'} crossing the clearing`,
};

function buildCurve(route, reverse) {
  const pts = reverse ? [...route.pts].reverse() : route.pts;
  const n = pts.length;
  const curve = new THREE.CatmullRomCurve3(pts.map(([x, z]) => new THREE.Vector3(x, 0, z)));
  curve.arcLengthDivisions = (n - 1) * 24;
  const lengths = curve.getLengths(curve.arcLengthDivisions);
  const length = lengths[lengths.length - 1];
  const stops = route.stops
    .map((s) => ({ ...s, at: reverse ? n - 1 - s.at : s.at }))
    .map((s) => ({ ...s, s: lengths[s.at * 24] }))
    .sort((a, b) => a.s - b.s);
  return { curve, length, stops };
}

function createWalker(name, rand, inUse) {
  const kind = KINDS[name];
  const model = kind.make();
  model.root.visible = false;
  const a = {
    state: 'away',
    timer: 4 + rand() * 20,
    path: null,
    route: null,
    s: 0,
    stops: [],
    stop: null,
    step: 0,
    hop: 0,
    yaw: 0,
    neckAim: 0,
    headAim: 0,
    bodyAim: 0,
    lookAim: 0,
    wave: rand() * 6,
    since: 0,
  };
  const pos = new THREE.Vector3();
  const tan = new THREE.Vector3();

  function plan(route, reverse, { atStop = false } = {}) {
    a.route = route;
    a.path = buildCurve(route, reverse);
    a.s = 0;
    a.stops = [...a.path.stops];
    a.state = 'move';
    a.since = 0;
    if (atStop && a.stops.length) {
      const first = a.stops.shift();
      a.s = first.s;
      a.state = 'stop';
      a.stop = first;
      a.timer = kind.stopFor[1];
    }
    inUse.add(route);
    model.root.visible = true;
    place(0);
  }

  function leave() {
    a.state = 'away';
    a.timer = kind.away[0] + rand() * (kind.away[1] - kind.away[0]);
    model.root.visible = false;
    // The fawn walks its mother's route; only she frees it.
    if (a.route && !kind.follows) inUse.delete(a.route);
    a.route = null;
  }

  function place(dt) {
    const u = Math.min(1, Math.max(0, a.s / a.path.length));
    a.path.curve.getPointAt(u, pos);
    a.path.curve.getTangentAt(u, tan);
    let want = Math.atan2(-tan.z, tan.x);
    if (a.state === 'stop' && a.stop?.face) want = Math.atan2(-(a.stop.face[1] - pos.z), a.stop.face[0] - pos.x);
    // Turn the short way round.
    const turn = THREE.MathUtils.euclideanModulo(want - a.yaw + Math.PI, Math.PI * 2) - Math.PI;
    a.yaw = dt > 0 ? a.yaw + turn * ease(dt, a.state === 'stop' ? 1.6 : 4) : want;
    model.root.position.set(pos.x, groundHeight(pos.x, pos.z) - 0.02, pos.z);
    model.root.rotation.y = a.yaw;
  }

  function pose(dt, time, moving) {
    const k = dt > 0 ? ease(dt, 3) : 1;
    const swing = moving ? kind.swing : 0;
    model.legs.forEach((l, i) => {
      const phase = a.step + (i === 0 || i === 3 ? 0 : Math.PI);
      l.rotation.z = moving ? Math.sin(phase) * swing : l.rotation.z * (1 - k);
    });
    if (kind.hops) {
      const air = moving ? Math.max(0, Math.sin(a.hop)) : 0;
      model.body.position.y = air * 0.16;
      a.bodyAim = moving ? -0.25 * Math.cos(a.hop) : a.stop?.pose === 'sit' ? 0.55 : 0.2;
    } else {
      model.body.position.y = moving ? Math.abs(Math.sin(a.step)) * 0.018 : 0;
    }
    model.body.rotation.z += (a.bodyAim - model.body.rotation.z) * k;
    model.neck.rotation.z += (a.neckAim + (moving ? 0.05 * Math.sin(a.step * 2) : 0) - model.neck.rotation.z) * k;
    model.head.rotation.z += (a.headAim - model.head.rotation.z) * k;
    model.head.rotation.y += (a.lookAim - model.head.rotation.y) * k;
    if (model.tail) model.tail.rotation.z = 0.12 * Math.sin(time * 2.1 + a.wave);
    if (model.ears) model.ears.rotation.z = Math.sin(time * 1.7 + a.wave) > 0.93 ? -0.35 : 0;
  }

  function stopPose(time, poseName) {
    if (poseName === 'graze' || poseName === 'drink') {
      // Head down, up now and then to look round (less often while drinking).
      const look = Math.sin(time * 0.45 + a.wave) > (poseName === 'drink' ? 0.75 : 0.35);
      a.neckAim = look ? 0 : poseName === 'drink' ? -1.95 : -1.8;
      a.headAim = look ? 0 : 0.9;
      a.bodyAim = look ? 0 : -0.08;
      a.lookAim = look ? 0.5 * Math.sin(time * 0.3) : 0;
    } else if (poseName === 'look') {
      a.neckAim = 0.15;
      a.headAim = 0;
      a.lookAim = 0.9 * Math.sin(time * 0.6 + a.wave);
    } else {
      a.neckAim = kind.hops ? -0.55 : 0.1;
      a.headAim = 0;
      a.lookAim = 0.4 * Math.sin(time * 0.8 + a.wave);
    }
  }

  return {
    name,
    kind,
    a,
    root: model.root,
    plan,
    leave,
    get visible() {
      return model.root.visible;
    },
    get position() {
      return model.root.position;
    },
    update(dt, time, ctx) {
      if (a.state === 'away') {
        if (kind.follows) return;
        a.timer -= dt;
        if (a.timer > 0) return;
        if (rand() < keenness(KEEN[name], ctx)) {
          const free = ROUTES[kind.routes].filter((r) => !inUse.has(r));
          if (free.length) {
            plan(free[Math.floor(rand() * free.length)], rand() < 0.5);
            ctx.onPlan?.(this);
            return;
          }
        }
        a.timer = 6 + rand() * 12;
        return;
      }
      a.since += dt;
      if (a.state === 'stop') {
        a.timer -= dt;
        stopPose(time, a.stop.pose);
        if (a.timer <= 0) {
          a.state = 'move';
          a.stop = null;
          a.lookAim = 0;
