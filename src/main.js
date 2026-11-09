import './style.css';
import { Clock, SPEED_LABELS } from './core/clock.js';
import { load, save } from './core/store.js';
import { prefersReducedMotion, smoothstep } from './core/emitter.js';
import { Climate, SEASONS } from './sim/climate.js';
import { activityAt, isOutside } from './sim/schedule.js';
import { frogs } from './sim/wildlife.js';
import { FocusTimer } from './sim/focus.js';
