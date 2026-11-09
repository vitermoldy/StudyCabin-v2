import './style.css';
import { Clock, SPEED_LABELS } from './core/clock.js';
import { load, save } from './core/store.js';
import { prefersReducedMotion, smoothstep } from './core/emitter.js';
import { Climate, SEASONS } from './sim/climate.js';
import { activityAt, isOutside } from './sim/schedule.js';
import { frogs } from './sim/wildlife.js';
import { FocusTimer } from './sim/focus.js';
import { Ambient } from './audio/ambient.js';
import { MusicPlayer } from './music/player.js';
import { Overlay } from './ui/overlay.js';
import { Panels, toast } from './ui/panels.js';
import { mountMusic } from './ui/music-ui.js';
import { mountDay, mountWeather, mountSound, mountFocus, mountView } from './ui/controls.js';
import { mountCameraInput } from './ui/camera-input.js';
import { VIEWS, VIEW_IDS } from './scene/views.js';

const html = document.documentElement;
const reduced = prefersReducedMotion();
const FIRST_VIEW = 'clearing';

// ------------------------------------------------------------ simulation
const clock = new Clock();
const climate = new Climate(clock);
const focus = new FocusTimer();
const ambient = new Ambient();
const music = new MusicPlayer(document.getElementById('yt-host'));
const overlay = new Overlay({ reducedMotion: reduced });
const panels = new Panels();

const prefs = load('view', { view: FIRST_VIEW, words: true });
let wordsShown = prefs.words !== false;
html.classList.toggle('is-clear', !wordsShown);

// ------------------------------------------------------------ the scene
let world = null;
async function startWorld() {
  const { World, webglAvailable } = await import('./scene/world.js');
  if (!webglAvailable()) throw new Error('no webgl');
  const canvas = document.getElementById('scene');
  const w = new World(canvas, { reducedMotion: reduced });
  w.onShaderFail = () => {
    world = null;
    showStill();
  };
  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    showStill();
  });
  return w;
}

function showStill() {
  html.classList.remove('is-live');
  document.getElementById('nogl').hidden = false;
  inkFromPoster();
}

/**
 * Without the live scene, the words sit on the poster: pick their ink from the picture under
 * them, as the scene does from its rendered pixels, so they keep 3:1 over a bright misty sky.
 */
function inkFromPoster() {
  const img = document.getElementById('poster');
  const lin = (v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  const apply = () => {
    try {
      const W = innerWidth;
      const H = innerHeight;
      const c = document.createElement('canvas');
      c.width = W;
      c.height = H;
      const ctx = c.getContext('2d', { willReadFrequently: true });
      // The poster is object-fit: cover, centred.
      const s = Math.max(W / img.naturalWidth, H / img.naturalHeight);
      const w = img.naturalWidth * s;
      const h = img.naturalHeight * s;
      ctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
      const samples = overlay.rects().map((r) => {
        let sum = 0;
        let max = 0;
        let min = 1;
        let n = 0;
        for (let gy = 0; gy < 4; gy++) {
          for (let gx = 0; gx < 8; gx++) {
            const x = Math.min(W - 1, Math.max(0, Math.round(r.x + (r.w * (gx + 0.5)) / 8)));
            const y = Math.min(H - 1, Math.max(0, Math.round(r.y + (r.h * (gy + 0.5)) / 4)));
            const [R, G, B] = ctx.getImageData(x, y, 1, 1).data;
            const l = 0.2126 * lin(R) + 0.7152 * lin(G) + 0.0722 * lin(B);
            sum += l;
            max = Math.max(max, l);
            min = Math.min(min, l);
            n++;
          }
        }
        return { mean: sum / n, max, min };
      });
      overlay.applyInk(samples);
    } catch {
      /* the poster could not be read: keep the default ink */
    }
  };
  if (img.complete && img.naturalWidth) apply();
  else img.addEventListener('load', apply, { once: true });
  addEventListener('resize', apply);
}

// ------------------------------------------------------------ state per frame
let activity = activityAt(clock.minutes, conditions(), focus.residentPhase);
let scenePaused = reduced; // under reduced motion the scene waits for a press
let lastFrame = performance.now();
let elapsed = 0;
