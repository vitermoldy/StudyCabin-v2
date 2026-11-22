// Link to the app's own server (npm run server). Everything here is optional: with
// the server off, or the site opened as static files, the app works exactly as
// before; events wait in the browser and go out once someone is signed in.
//
// The server knows people by account (username and password). Each account files
// its data under one code. A browser keeps a code of its own too, offered on
// sign-up so what was made before signing up becomes the new account's.

const APP = 'studycabin-v2';
const ID_KEY = `${APP}:cloud-id`;
const OUTBOX_KEY = `${APP}:cloud-outbox`;
const SAVED_KEY = `${APP}:cloud-saved`;
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const OUTBOX_CAP = 500;

const read = (key) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};
const write = (key, value) => {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
};
const remove = (key) => {
  try {
    localStorage.removeItem(key);
  } catch {
    /* blocked storage: nothing was kept either */
  }
};

let code = read(ID_KEY);
if (!code || !/^[A-HJ-NP-Z2-9]{12}$/.test(code)) {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  code = Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('');
  write(ID_KEY, code);
}

// online: the last request reached the server. offline: it did not. unknown: nothing tried yet.
let status = 'unknown';
// checking, signed-in, signed-out, or unavailable (the server or its database cannot be reached).
let auth = 'checking';
let account = null;
let lastSaved = Number(read(SAVED_KEY)) || 0;
let frozen = false;
const listeners = new Set();
const notify = () => listeners.forEach((fn) => fn(cloudState()));
const setStatus = (next) => {
  if (next !== status) {
    status = next;
    notify();
  }
};
const signedIn = () => auth === 'signed-in';

/** Status, last time the save reached the server, events waiting, and who is signed in. */
export function cloudState() {
  return { status, lastSaved, pending: outbox().length, auth, account };
}

export function onCloud(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function api(path, init) {
  const res = await fetch(`/api${path}`, { ...init, headers: { 'Content-Type': 'application/json', ...init?.headers } });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    // The session ran out or was signed out elsewhere: ask for the password again.
    if (res.status === 401 && !path.startsWith('/auth/') && auth === 'signed-in') {
      auth = 'signed-out';
      account = null;
      notify();
    }
    throw new ApiError(body.error || `HTTP ${res.status}`, res.status);
  }
  return body;
}

/** A thrown ApiError means the server answered; anything else means it could not be reached. */
const reached = (err) => err instanceof ApiError;

function outbox() {
  try {
    const list = JSON.parse(read(OUTBOX_KEY) || '[]');
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

const localDay = (t = new Date()) =>
  `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;

/** Records something that happened; it is sent now, or once someone is signed in and the server answers. */
export function logEvent(kind, data) {
  const list = outbox();
  list.push({ kind, at: Date.now(), day: localDay(), data });
  write(OUTBOX_KEY, JSON.stringify(list.slice(-OUTBOX_CAP)));
  notify();
  void flushEvents();
}

let flushing = false;
export async function flushEvents() {
  if (flushing || !signedIn()) return;
  const list = outbox();
  if (list.length === 0) return;
  flushing = true;
  const batch = list.slice(0, 200);
  try {
    await api('/events', { method: 'POST', body: JSON.stringify({ events: batch }) });
    // Only what was sent leaves the queue; anything logged meanwhile stays.
    write(OUTBOX_KEY, JSON.stringify(outbox().slice(batch.length)));
    setStatus('online');
    notify();
  } catch (err) {
    // A 4xx other than 401 and 429 means the batch itself is unusable; drop it rather than retry it forever.
    if (err instanceof ApiError && err.status >= 400 && err.status < 500 && err.status !== 401 && err.status !== 429) {
      write(OUTBOX_KEY, JSON.stringify(outbox().slice(batch.length)));
    }
    setStatus(reached(err) ? 'online' : 'offline');
  } finally {
    flushing = false;
  }
  if (outbox().length > 0 && status === 'online' && signedIn()) void flushEvents();
}

let saveTimer = 0;
let saveText = '';
/** Copies the browser save (its JSON text) to the server, a moment after the last change. */
export function mirrorSave(text) {
  if (!text || frozen) return;
  saveText = text;
  clearTimeout(saveTimer);
  if (signedIn()) saveTimer = setTimeout(() => void pushSave(), 2000);
}

/** `leaving`: the tab is being hidden or closed, so the request must outlive the page (keepalive). */
async function pushSave(leaving = false) {
  if (!saveText || frozen || !signedIn()) return false;
  clearTimeout(saveTimer);
  try {
    await api('/save', { method: 'PUT', body: JSON.stringify({ data: saveText }), keepalive: leaving });
    lastSaved = Date.now();
    write(SAVED_KEY, String(lastSaved));
    setStatus('online');
    notify();
    return true;
  } catch (err) {
    setStatus(reached(err) ? 'online' : 'offline');
    return false;
  }
}

/** This account's totals from the server, or null when nobody is signed in or it cannot be reached. */
export async function fetchStats(days = 14) {
  if (!signedIn()) return null;
  try {
    const stats = await api(`/stats?days=${days}&today=${localDay()}`);
    setStatus('online');
    return stats;
  } catch (err) {
    setStatus(reached(err) ? 'online' : 'offline');
    return null;
  }
}

/**
 * Takes the account the server answered with. Returns the account's save when it
 * should replace this browser's (the browser was holding someone else's data, or
 * none), or null when this browser's own save stays and is sent up as the account's.
 * After a non-null answer nothing is mirrored, so the old save cannot overwrite the
 */
export async function restoreFrom(input) {
  const wanted = String(input).toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!/^[A-HJ-NP-Z2-9]{12}$/.test(wanted)) throw Object.assign(new Error('Kode pemulihan terdiri dari 12 huruf dan angka.'), { code: 'format' });
  const body = await api(`/save/${wanted}`).catch((err) => {
    if (err.status) throw err;
    throw Object.assign(new Error('Server tidak terhubung. Jalankan server dulu, lalu coba lagi.'), { code: 'offline' });
  });
  frozen = true;
  clearTimeout(saveTimer);
  code = wanted;
  write(ID_KEY, code);
  return body.data;
}

addEventListener('online', () => flushEvents());
addEventListener('pagehide', () => {
  if (saveText && !frozen) pushSave(true);
});
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden' && saveText && !frozen) pushSave(true);
  else flushEvents();
});
setInterval(() => {
  if (outbox().length > 0) flushEvents();
}, 60_000);
flushEvents();
