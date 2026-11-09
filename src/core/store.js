// Small persistence helper. Every read and write is wrapped: private windows,
// blocked storage or a full quota must never break the app.
// Its own key, so the beach cabin (v1) and this forest cabin never share settings on one origin.
const KEY = 'studycabin:v2';

let cache = null;

function readAll() {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? JSON.parse(raw) : {};
    if (!cache || typeof cache !== 'object') cache = {};
  } catch {
    cache = {};
  }
  return cache;
}

let timer = 0;
function flush() {
  timer = 0;
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    /* storage unavailable: settings live for this visit only */
  }
