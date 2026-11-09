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
let sampleIn = 0.3;
let audioIn = 0;
let uiIn = 0;
let jumped = true;

function conditions() {
  const cold = climate.season === 'winter' || climate.temperature() < 9;
  return { badWeather: climate.badWeather, cold };
}

function refreshActivity({ teleport = false } = {}) {
  const next = activityAt(clock.minutes, conditions(), focus.residentPhase);
  if (next.key !== activity.key || teleport) {
    activity = next;
    if (world) world.resident.setActivity(activity, { teleport });
  }
  overlay.setWord(activity.word);
}

function storyText() {
  const s = SEASONS[climate.season].label;
  // An animal in the clearing gets its own sentence, after the resident and the weather.
  const seen = world?.animals.sighting();
  const line = `${activity.line}. ${climate.describe()}.${seen ? ` ${seen}.` : ''}`;
  const meta = `Day ${clock.day} · ${s} · ${SPEED_LABELS[clock.speed].toLowerCase()}`;
  return { line, meta };
}

function jumpTo(minutes, sameDay) {
  clock.jumpTo(minutes, { sameDay });
}
clock.on('jump', () => {
  jumped = true;
});

// ------------------------------------------------------------ UI
const updateDay = mountDay({ clock, onJump: jumpTo });
const updateWeather = mountWeather({ climate });
mountSound({ ambient });
const renderFocus = mountFocus({ focus });
mountMusic(music, panels, { onPlayingChange: (on) => ambient.setMusicPlaying(on) });

const pauseBtn = document.getElementById('scene-pause');
function setScenePaused(on, { announce = false } = {}) {
  scenePaused = on;
  pauseBtn.setAttribute('aria-pressed', String(on));
  pauseBtn.setAttribute('aria-label', on ? 'Move the scene' : 'Pause the scene');
  pauseBtn.querySelector('use').setAttribute('href', on ? '#i-play' : '#i-pause');
  if (announce) toast(on ? 'Scene paused. The clock stops with it.' : 'Scene moving again.');
  lastFrame = performance.now();
}
pauseBtn.addEventListener('click', () => setScenePaused(!scenePaused, { announce: true }));
setScenePaused(scenePaused);
if (reduced) setTimeout(() => toast('The scene is still because your system asks for less motion. Press play at the top right to start it.', 7000), 1200);

function setWords(on) {
  wordsShown = on;
  html.classList.toggle('is-clear', !on);
  save('view', { ...load('view', {}), words: on });
}

let viewApi = null;
function toggleFullscreen() {
  if (!document.fullscreenEnabled) return;
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  else document.documentElement.requestFullscreen().catch(() => toast('Full screen is not available here.'));
}

focus.on('finished', (phase) => {
  ambient.chime();
  toast(phase === 'focus' ? 'Focus block done. Time for a break.' : 'Break over. Back to the desk.');
  refreshActivity();
});
focus.on('change', () => refreshActivity());
climate.on('season', (id) => {
  if (world) world.resident.setSeason(id);
});
climate.on('season', (id) => {
  if (climate.autoSeason) toast(`${SEASONS[id].label} has come to the cabin.`);
});
climate.on('weather', () => refreshActivity());
// Words follow a change at once, not on the next scene frame.
const refreshWords = () => {
  const s = storyText();
  overlay.setStory(s.line, s.meta);
  updateWeather();
};
for (const ev of ['season', 'weather', 'weather-mode']) climate.on(ev, refreshWords);
clock.on('speed', refreshWords);
clock.on('jump', () => {
  overlay.setTime(clock.minutes);
  updateDay();
});

// Hand-moved camera and ripples on the pond (madebyevan.com/webgl-water).
let needsStill = false;
mountCameraInput(document.getElementById('scene'), {
  getWorld: () => world,
  onRender: () => { needsStill = true; },
});

// Pointer for the camera's small answer to the mouse.
addEventListener('pointermove', (e) => {
  if (!world || e.pointerType !== 'mouse') return;
  world.rig.setPointer((e.clientX / innerWidth) * 2 - 1, -((e.clientY / innerHeight) * 2 - 1));
  world.setPointer(e.clientX, e.clientY, e.target === document.getElementById('scene'));
}, { passive: true });
document.addEventListener('pointerleave', () => world && world.setPointer(0, 0, false));

// Audio needs a gesture before it may start.
const wake = () => ambient.resumeIfWanted();
addEventListener('pointerdown', wake, { once: true });
addEventListener('keydown', wake, { once: true });

// Keyboard shortcuts (never while typing).
addEventListener('keydown', (e) => {
  const t = e.target;
  if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
  if (t instanceof HTMLElement && (t.closest('input, textarea, select') || t.isContentEditable)) return;
  const k = e.key.toLowerCase();
  if (k === ' ' && !(t instanceof HTMLButtonElement)) {
    e.preventDefault();
    music.toggle();
  } else if (k === 'h') {
    setWords(!wordsShown);
    viewApi?.sync();
  } else if (k === 'p') {
    setScenePaused(!scenePaused, { announce: true });
  } else if (k === 'f') {
    toggleFullscreen();
  } else if (world && ['arrowleft', 'arrowright', 'arrowup', 'arrowdown'].includes(k) && !(t instanceof HTMLElement && t.closest('[role="dialog"], .dock'))) {
    e.preventDefault();
    const step = 28;
    if (k === 'arrowleft') world.rig.orbit(-step, 0);
    if (k === 'arrowright') world.rig.orbit(step, 0);
    if (k === 'arrowup') world.rig.orbit(0, -step);
    if (k === 'arrowdown') world.rig.orbit(0, step);
    needsStill = true;
  } else if (world && (k === '+' || k === '=' || k === '-' || k === '_')) {
    world.rig.zoomBy(k === '+' || k === '=' ? 0.85 : 1.18);
    needsStill = true;
  } else if (world && k === 'r') {
    world.rig.resetUser();
    needsStill = true;
  } else if (['1', '2', '3', '4', '5'].includes(k) && world) {
    const id = VIEW_IDS[Number(k) - 1];
    world.rig.setView(id);
    viewApi?.setView(id);
    save('view', { ...load('view', {}), view: id });
  }
});

// ------------------------------------------------------------ loop
function frame(now) {
  requestAnimationFrame(frame);
  // Up to one game day of catch-up after the tab was hidden.
  const realDt = Math.min(1440, Math.max(0, (now - lastFrame) / 1000));
  lastFrame = now;
  focus.tick();
  if (scenePaused) {
    // The scene stands still, but a hand-moved camera still redraws it.
    if (world && (needsStill || world.rig.settling)) {
      needsStill = false;
      world.rig.update(Math.min(realDt, 0.1), elapsed, world.resident.head);
      world.render(16);
      if (wordsShown) overlay.applyInk(world.sampleLuminance(overlay.rects()));
    }
    return;
  }
  const dt = Math.min(realDt, 0.1);
  elapsed += dt;

  // The clock runs on real elapsed time, so a hidden tab catches up on return.
  const gameDt = clock.tick(realDt);
  if (gameDt > 30) jumped = true;
  climate.update(dt, gameDt);
  refreshActivity({ teleport: jumped });
  const timeJumped = jumped;
  jumped = false;
  overlay.setTime(clock.minutes);

  uiIn -= realDt;
  if (uiIn <= 0) {
    uiIn = 0.25;
    const s = storyText();
    overlay.setStory(s.line, s.meta);
    if (panels.current === 'day') updateDay();
    if (panels.current === 'weather') updateWeather();
    if (panels.current === 'focus' || focus.running) renderFocus();
  }

  if (world) {
    const speedUp = clock.rate >= 10 ? 2.2 : 1;
    world.update(dt, elapsed, {
      minutes: clock.minutes,
      climate,
      activity,
      follow: world.rig.view === 'follow',
      jumped: timeJumped,
      residentOptions: { speedUp },
    });
    world.render(realDt * 1000);
    sampleIn -= realDt;
    if (sampleIn <= 0 && wordsShown) {
      sampleIn = 0.8;
      overlay.applyInk(world.sampleLuminance(overlay.rects()));
    }
  }

  audioIn -= dt;
  if (audioIn <= 0) {
    audioIn = 0.1;
    const p = climate.params;
    const atmo = world?.atmo;
    const m = clock.minutes;
    const heard = world ? world.animals.audible : { owl: 0, fox: 0 };
    ambient.update(0.1, {
      rain: p.rain,
      wind: p.wind,
      storm: p.storm,
      day: atmo ? atmo.dayFactor : smoothstep(330, 480, m) * (1 - smoothstep(1080, 1200, m)),
      night: atmo ? atmo.night : 1 - smoothstep(300, 420, m) + smoothstep(1140, 1260, m),
      morning: m > 300 && m < 660,
      season: climate.season,
      fire: world ? world.cabin.state.stove * (isOutside(world.resident.spot) ? 0.35 : 1) : 0,
      frogs: frogs({ minutes: m, params: p, season: climate.season, iced: world ? world.pond.ice : climate.look.snow }),
      owl: heard.owl,
      fox: heard.fox,
    });
  }
}

// ------------------------------------------------------------ boot
overlay.setWord(activity.word);
overlay.setTime(clock.minutes);
{
  const s = storyText();
  overlay.setStory(s.line, s.meta);
}

