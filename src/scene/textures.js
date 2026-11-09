import * as THREE from 'three';
import { rng } from '../core/emitter.js';

// Procedural textures drawn on canvases, so the scene ships without image files.
// Every texture tiles; UVs in the cabin are in metres, so `repeat` sets the size.

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')];
}

function finish(c, { repeat = [1, 1], srgb = true } = {}) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat[0], repeat[1]);
  t.anisotropy = 4;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function grain(ctx, w, h, rand, amount, alpha = 0.06) {
  for (let i = 0; i < amount; i++) {
    const x = rand() * w;
    const y = rand() * h;
    const l = rand() > 0.5 ? 255 : 0;
    ctx.fillStyle = `rgba(${l},${l},${l},${alpha * rand()})`;
