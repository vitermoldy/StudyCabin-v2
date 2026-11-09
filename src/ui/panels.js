import { Emitter } from '../core/emitter.js';

const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), [href], select, textarea, [tabindex]:not([tabindex="-1"])';

/** The dock and its panels: one open at a time, Escape closes, focus returns. */
export class Panels extends Emitter {
  constructor() {
    super();
