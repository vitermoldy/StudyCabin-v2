// The "History" block in the focus panel (focus blocks kept on the server), the
// account rows under it, and the sign-in screen. While the server runs, the cabin
// asks for an account first; when it cannot be reached the cabin still works and
// keeps everything in this browser, as it did before accounts.
import { ApiError, checkAccount, cloudState, fetchStats, onCloud, signIn, signOut, signUp } from '../core/cloud.js';
import { forget, replaceAll, saveAll } from '../core/store.js';
import { toast } from './panels.js';

const $ = (id) => document.getElementById(id);
const minutes = (m) => (m >= 60 ? `${Math.floor(m / 60)} h ${Math.round(m % 60)} min` : `${Math.round(m)} min`);
const clock = (t) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const joined = (iso) => new Date(iso).toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' });
const WELCOME_KEY = 'studycabin:welcome';

export function mountCloud() {
  let stats = null;

  function render(state = cloudState()) {
    const waiting = state.pending > 0 ? ` ${state.pending} focus ${state.pending === 1 ? 'block waits' : 'blocks wait'} to be sent.` : '';
    $('cloud-status').textContent =
      state.auth === 'signed-in' && state.status !== 'offline'
        ? `Connected to the server.${state.lastSaved ? ` Settings last saved at ${clock(state.lastSaved)}.` : ''}${waiting}`
        : state.status === 'offline' || state.auth === 'unavailable'
          ? `The server is not reachable. Everything stays in this browser.${waiting}`
          : state.auth === 'checking'
            ? 'Checking the server…'
            : `Sign in to keep your focus history.${waiting}`;
    const signedIn = state.auth === 'signed-in' && state.account;
    $('account-in').hidden = !signedIn;
    $('account-out-of').hidden = Boolean(signedIn);
    if (signedIn) {
      $('account-name').textContent = state.account.username;
      $('account-since').textContent = joined(state.account.createdAt);
    }
    const days = $('cloud-days');
    const summary = $('cloud-summary');
    if (!stats || !signedIn) {
      days.hidden = true;
      summary.textContent = signedIn ? 'Focus blocks you finish appear here, day by day.' : '';
      return;
    }
    const max = Math.max(1, ...stats.perDay.map((d) => d.minutes));
    days.hidden = false;
    days.setAttribute('aria-label', `Minutes of focus over the last ${stats.perDay.length} days: ${stats.perDay.map((d) => `${d.day.slice(5)} ${d.minutes}`).join(', ')}`);
    days.replaceChildren(
      ...stats.perDay.map((d) => {
        const bar = document.createElement('span');
        bar.className = 'days__bar';
        bar.style.setProperty('--h', String(d.minutes / max));
        if (d.minutes === 0) bar.classList.add('is-empty');
        bar.title = `${new Date(`${d.day}T12:00`).toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' })}: ${minutes(d.minutes)}`;
        return bar;
      }),
    );
    const fortnight = stats.perDay.reduce((a, d) => a + d.minutes, 0);
    summary.textContent = `Last ${stats.perDay.length} days: ${minutes(fortnight)} of focus. ${stats.sessions} ${stats.sessions === 1 ? 'block' : 'blocks'} in all on the server${stats.streak > 1 ? `, ${stats.streak} days in a row` : ''}.`;
  }

  async function refresh() {
    stats = await fetchStats(14);
    render();
  }

  onCloud((state) => render(state));
  // Opening the focus panel fetches the latest history.
  document.querySelector('[data-panel="focus"]')?.addEventListener('click', () => void refresh());

  $('account-leave').addEventListener('click', async () => {
    const button = $('account-leave');
    const err = $('account-error');
    err.hidden = true;
    button.disabled = true;
    button.textContent = 'Signing out…';
    try {
      saveAll();
      await signOut();
      forget();
      location.reload();
    } catch (e) {
      err.textContent = e instanceof Error ? e.message : 'Could not sign out. Try again.';
      err.hidden = false;
      button.disabled = false;
      button.textContent = 'Sign out';
    }
  });

  mountGate();
  render();
}

/** Puts the account's save in place of this browser's, then reloads into it. */
function applySave(text, welcome) {
  replaceAll(text);
  try {
    sessionStorage.setItem(WELCOME_KEY, welcome);
  } catch {
    /* no session storage: the reload still shows the cabin */
  }
  location.reload();
}

function mountGate() {
  const gate = $('auth-gate');
  const form = $('gate-form');
  const user = $('gate-user');
  const pass = $('gate-pass');
  const submit = $('gate-submit');
  const error = $('gate-error');
  let mode = 'in';
  let busy = false;
  // "Use without an account" holds until the page reloads or the visitor asks to sign in.
  let skipped = false;
  let shown = null;

  const label = () => (mode === 'in' ? 'Sign in' : 'Create account');
  function showError(text) {
    error.textContent = text;
    error.hidden = !text;
  }

  function setMode(next) {
    mode = next;
    $('gate-h').textContent = next === 'in' ? 'Sign in to StudyCabin' : 'Create a StudyCabin account';
    submit.textContent = label();
    pass.autocomplete = next === 'in' ? 'current-password' : 'new-password';
    $('gate-pass-hint').hidden = next === 'in';
    $('gate-switch-text').textContent = next === 'in' ? 'No account yet?' : 'Already have an account?';
    $('gate-switch').textContent = next === 'in' ? 'Create one' : 'Sign in';
    $('gate-lead').textContent =
      next === 'in'
        ? 'Your settings, music queue and focus history are kept with your account, on any browser.'
        : 'The settings and music queue already in this browser move into your new account.';
    showError('');
    user.removeAttribute('aria-invalid');
    pass.removeAttribute('aria-invalid');
  }

  function render(state = cloudState()) {
    const offline = state.auth === 'unavailable';
    // The first check is not shown: a signed-in visitor should not see the screen flash by.
    const wanted = state.auth === 'signed-out' || (offline && !skipped) || (state.auth === 'checking' && gate.open);
    $('gate-checking').hidden = state.auth !== 'checking';
    form.hidden = state.auth !== 'signed-out';
    $('gate-switch-line').hidden = state.auth !== 'signed-out';
    $('gate-offline').hidden = !offline;
    $('gate-lead').hidden = state.auth !== 'signed-out';
    if (wanted && !gate.open) gate.showModal();
    else if (!wanted && gate.open) gate.close();
    // Focus moves only when what the screen asks for changes, never on every update.
    if (gate.open && shown !== state.auth) {
      if (state.auth === 'signed-out') user.focus();
      else if (offline) $('gate-retry').focus();
    }
    shown = gate.open ? state.auth : null;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (busy) return;
    showError('');
    const name = user.value.trim();
    const password = pass.value;
    user.toggleAttribute('aria-invalid', !name);
    pass.toggleAttribute('aria-invalid', !password);
    if (!name || !password) {
      showError(!name ? 'Enter your username.' : 'Enter your password.');
      (!name ? user : pass).focus();
      return;
    }
    busy = true;
    submit.disabled = true;
    submit.textContent = mode === 'in' ? 'Checking…' : 'Creating account…';
    try {
      const save = mode === 'in' ? await signIn(name, password) : await signUp(name, password);
      const welcome = mode === 'in' ? `Signed in as ${cloudState().account?.username}.` : `Account ${name} created. Welcome.`;
      if (save) {
        applySave(save, welcome);
        return;
      }
      saveAll();
      pass.value = '';
      toast(welcome);
    } catch (e) {
      showError(e instanceof Error ? e.message : 'Could not sign in. Try again.');
      if (e instanceof ApiError && e.status === 401) pass.select();
      pass.setAttribute('aria-invalid', 'true');
    } finally {
      busy = false;
      submit.disabled = false;
      submit.textContent = label();
    }
  });

  $('gate-switch').addEventListener('click', () => {
    setMode(mode === 'in' ? 'up' : 'in');
    user.focus();
  });

  // A required sign-in has no "close": Escape does nothing while the server waits for
  // a password, and means "Use without an account" when the server is down.
  gate.addEventListener('cancel', (event) => {
    event.preventDefault();
    if (cloudState().auth === 'unavailable') skip();
  });

  function skip() {
    skipped = true;
    render();
    toast('Everything stays in this browser until you sign in.');
  }
  $('gate-skip').addEventListener('click', skip);

  async function check() {
    const save = await checkAccount();
    if (save) applySave(save, `Signed in as ${cloudState().account?.username}.`);
  }
  $('gate-retry').addEventListener('click', () => void check());
  $('account-enter').addEventListener('click', () => {
    skipped = false;
    void check();
  });

  try {
    const welcome = sessionStorage.getItem(WELCOME_KEY);
    if (welcome) {
  render();
  void refresh();
}
