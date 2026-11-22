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
    event.preventDefault();
    const input = $('cloud-input');
    const err = $('cloud-error');
    err.hidden = true;
    input.removeAttribute('aria-invalid');
    try {
      const text = await restoreFrom(input.value);
      replaceAll(text);
      location.reload();
    } catch (e) {
      input.setAttribute('aria-invalid', 'true');
      err.textContent =
        e.code === 'format' || e.status === 400
          ? 'A recovery code has 12 letters and digits.'
          : e.code === 'offline'
            ? 'The server is not reachable. Start it, then try again.'
            : e.status === 404
              ? 'Nothing is saved under that code.'
              : 'That code could not be used. Try again in a moment.';
      err.hidden = false;
    }
  });

  render();
  void refresh();
}
