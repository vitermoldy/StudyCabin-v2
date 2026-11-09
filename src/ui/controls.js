import { formatClock, formatDuration } from '../core/emitter.js';
import { SPEEDS, SPEED_LABELS } from '../core/clock.js';
import { SEASONS, SEASON_ORDER, WEATHERS, WEATHER_ORDER } from '../sim/climate.js';
import { DAY, entryAt } from '../sim/schedule.js';
import { PRESETS } from '../sim/focus.js';
import { LAYERS } from '../audio/ambient.js';
import { VIEWS } from '../scene/views.js';

const $ = (id) => document.getElementById(id);

/** Builds a row of radio chips inside a fieldset. */
function radios(fieldset, name, options, current, onPick) {
