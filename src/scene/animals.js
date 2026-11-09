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
        }
        place(dt);
        pose(dt, time, false);
        return;
      }
      a.neckAim = 0;
      a.headAim = 0;
      a.bodyAim = 0;
      // Hurry when the weather turns or a storm comes in.
      const hurry = ctx.params.storm > 0.4 || ctx.params.rain > 0.5 ? 1.6 : 1;
      const ds = kind.speed * hurry * dt;
      a.s += ds;
      a.step += (ds / kind.stride) * Math.PI * 2;
      a.hop += ds * 7;
      if (a.stops.length && a.s >= a.stops[0].s && hurry === 1) {
        a.stop = a.stops.shift();
        a.state = 'stop';
        a.timer = kind.stopFor[0] + rand() * (kind.stopFor[1] - kind.stopFor[0]);
      } else if (a.stops.length && a.s >= a.stops[0].s) {
        a.stops.shift();
      }
      if (a.s >= a.path.length) {
        leave();
        return;
      }
      place(dt);
      pose(dt, time, true);
    },
    /** The fawn keeps a couple of metres behind its mother and stops when she stops. */
    follow(dt, time, leader, gap) {
      const L = leader.a;
      if (a.state === 'away') return;
      const target = L.state === 'away' ? a.path.length + 1 : L.s - gap;
      const ahead = target - a.s;
      const moving = ahead > 0.05;
      a.stop = L.state === 'stop' && !moving ? L.stop : null;
      if (moving) {
        const ds = Math.min(ahead, kind.speed * (ahead > 1 ? 1.35 : 1) * dt);
        a.s += ds;
        a.step += (ds / kind.stride) * Math.PI * 2;
        a.state = 'move';
        a.neckAim = 0;
        a.headAim = 0;
        a.bodyAim = 0;
      } else {
        a.state = 'stop';
        stopPose(time + 1.3, a.stop?.pose ?? 'graze');
      }
      if (a.s >= a.path.length) {
        leave();
        return;
      }
      place(dt);
      pose(dt, time, moving);
    },
    /** A line about this animal while it is out in the clearing; `withYoung` for the doe. */
    sighting(withYoung = false) {
      if (!model.root.visible) return null;
      const p = model.root.position;
      if (forestDepth(p.x, p.z) > 1.5) return null;
      const key = a.state === 'stop' && a.stop ? a.stop.pose : 'move';
      return LINES[key](withYoung ? 'A doe and her fawn' : kind.label, withYoung);
    },
  };
}

/** The route, direction and stop nearest the middle of the opening view, for the first animal. */
function openingRoute(routes) {
  let best = null;
  for (const route of routes) {
    for (const reverse of [false, true]) {
      const { stops } = buildCurve(route, reverse);
      if (!stops.length) continue;
      const [x, z] = route.pts[stops[0].at];
      const score = Math.abs(x + 1) + Math.abs(z - 13) * 0.4;
      if (!best || score < best.score) best = { route, reverse, score };
    }
  }
  return best;
}

// One bird: a small body and two swept wings that flap round the line of flight.
function wingGeometry(side, span = 0.46) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([0.07, 0, 0, -0.07, 0, 0, -0.13, 0, side * span], 3));
  g.computeVertexNormals();
  return g;
}

function makeBird(material) {
  const root = new THREE.Group();
  root.add(blob(material, [0.13, 0.035, 0.035], [0, 0, 0]));
  root.add(blob(material, [0.04, 0.03, 0.03], [0.12, 0.01, 0]));
  const wings = [-1, 1].map((side) => {
    const wing = new THREE.Mesh(wingGeometry(side), material);
    root.add(wing);
    return { wing, side };
  });
  return { root, wings };
}

// Flocks of two to six cross over the trees, flapping and gliding, every so often by day. None
// set out in rain, fog or after dark; a flock already in the air flies on.
function createFlocks(rand, count) {
  const material = new THREE.MeshBasicMaterial({ color: '#1b2420', side: THREE.DoubleSide });
  const birds = Array.from({ length: count }, () => ({ ...makeBird(material), on: false }));
  const group = new THREE.Group();
  birds.forEach((b) => {
    b.root.visible = false;
    b.root.traverse((o) => { o.castShadow = false; });
    group.add(b.root);
  });
  let wait = 6;

  function launch() {
    const dir = rand() < 0.5 ? 1 : -1;
    const z = -30 + rand() * 50;
    const y = 15 + rand() * 7;
    const speed = 6 + rand() * 2.5;
    const size = 2 + Math.floor(rand() * 5);
    birds.slice(0, size).forEach((b, i) => {
      const row = Math.ceil(i / 2);
      const side = i % 2 ? 1 : -1;
      Object.assign(b, {
        on: true,
        dir,
        x: -dir * (90 + row * 1.6 + rand()),
        y: y + row * 0.3 * side + rand() * 0.3,
        z: z + row * 1.1 * side,
        speed: speed * (0.96 + rand() * 0.08),
        flap: rand() * 6,
        glide: 0,
        bob: rand() * 6,
      });
      b.root.visible = true;
      b.root.rotation.set(0, dir > 0 ? 0 : Math.PI, 0);
      b.root.scale.setScalar(1.3 + rand() * 0.4);
    });
  }

  return {
    group,
    update(dt, time, ctx) {
      wait -= dt;
      if (wait <= 0) {
        const p = ctx.params;
        const fine = ctx.day > 0.6 && p.rain < 0.2 && p.storm < 0.2 && p.fog < 0.7;
        const seasonal = { spring: 1, summer: 0.9, autumn: 0.8, rainy: 0.5, winter: 0.35 }[ctx.season] ?? 0.7;
        if (!birds.some((b) => b.on) && fine && rand() < seasonal) launch();
        wait = 12 + rand() * 20;
      }
      for (const b of birds) {
        if (!b.on) continue;
        b.x += b.dir * b.speed * dt;
        b.glide -= dt;
        if (b.glide < -2.4 - rand() * 2) b.glide = 0.8 + rand() * 1.4;
        const flapping = b.glide <= 0;
        if (flapping) b.flap += dt * 13;
        const angle = flapping ? Math.sin(b.flap) * 0.75 : -0.1;
        for (const { wing, side } of b.wings) wing.rotation.x += (side * angle - wing.rotation.x) * ease(dt, 18);
        b.root.position.set(b.x, b.y + Math.sin(time * 1.3 + b.bob) * 0.08, b.z);
        if (Math.abs(b.x) > 96) {
          b.on = false;
          b.root.visible = false;
        }
      }
    },
  };
}

// The owl: flies in after dark to the roof ridge, sits there turning its head and blinking, and
// flies back into the wood before dawn or when the weather turns.
const RIDGE_TOP = FLOOR + CABIN.ridge + 0.17;
const PERCH = new THREE.Vector3(-3.4, RIDGE_TOP, 0);

function makeOwl() {
  const plumage = coat('#6b5a46');
  const breast = coat('#b8a68a');
  const face = coat('#d6c8ae');
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  body.add(blob(plumage, [0.13, 0.19, 0.12], [0, 0.2, 0]));
  body.add(blob(breast, [0.08, 0.14, 0.09], [0.06, 0.18, 0]));
  const head = new THREE.Group();
  head.position.set(0.01, 0.39, 0);
  body.add(head);
  head.add(blob(plumage, [0.1, 0.09, 0.1], [0, 0, 0]));
  head.add(blob(face, [0.035, 0.07, 0.085], [0.07, -0.005, 0]));
  const lids = [];
  for (const side of [-1, 1]) {
    const e = new THREE.Mesh(ball, eyeMat);
    e.scale.setScalar(0.018);
    e.position.set(0.098, 0.01, side * 0.032);
    head.add(e);
    lids.push(e);
    const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.07, 5), plumage);
    tuft.position.set(-0.01, 0.09, side * 0.05);
    tuft.rotation.x = side * 0.3;
    head.add(tuft);
  }
  const wings = [-1, 1].map((side) => {
    const wing = new THREE.Mesh(wingGeometry(side, 0.52), plumage);
    wing.material = new THREE.MeshStandardMaterial({ color: '#5e4e3c', roughness: 0.9, side: THREE.DoubleSide });
    wing.position.set(0.02, 0.24, 0);
    wing.visible = false;
    body.add(wing);
    return { wing, side };
  });
  root.scale.setScalar(1.25);
  root.visible = false;
  return { root, body, head, lids, wings };
}

function createOwl(rand) {
  const m = makeOwl();
  const o = { state: 'away', t: 0, from: new THREE.Vector3(), to: new THREE.Vector3(), mid: new THREE.Vector3(), wait: 5 + rand() * 30, look: 0, blink: 3, flap: 0 };
  const facing = -Math.PI / 2; // toward the clearing (+z)
  const tmp = new THREE.Vector3();

  function fly(from, to, state) {
    o.from.copy(from);
    o.to.copy(to);
    o.mid.copy(from).lerp(to, 0.5);
    o.mid.y = Math.max(from.y, to.y) + 3;
    o.t = 0;
    o.state = state;
    m.root.visible = true;
    m.wings.forEach(({ wing }) => { wing.visible = true; });
  }
  function perch() {
    o.state = 'perch';
    m.root.position.copy(PERCH);
    m.root.rotation.set(0, facing, 0);
    m.body.rotation.z = 0;
    m.wings.forEach(({ wing }) => { wing.visible = false; });
    m.root.visible = true;
  }
  function gone() {
    o.state = 'away';
    o.wait = 20 + rand() * 40;
    m.root.visible = false;
  }

  return {
    root: m.root,
    get perched() {
      return o.state === 'perch';
    },
    update(dt, time, ctx) {
      const want = owlOut(ctx);
      if (ctx.jumped) {
        if (want) perch();
        else if (o.state !== 'away') gone();
        return;
      }
      if (o.state === 'away') {
        if (!want) return;
        o.wait -= dt;
        if (o.wait <= 0) fly(tmp.set(-46, 15, -32 + rand() * 20), PERCH, 'arrive');
        return;
      }
      if (o.state === 'perch') {
        if (!want) {
          fly(PERCH, tmp.set(48, 14, -36 + rand() * 20), 'leave');
          return;
        }
        // Head turns now and then, blinks every few seconds.
        if (Math.sin(time * 0.23) > 0.6) o.look = Math.sin(time * 0.11) > 0 ? 1.1 : -1.1;
