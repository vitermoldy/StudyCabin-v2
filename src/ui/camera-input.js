/**
 * Moving the camera by hand on the scene canvas.
 * Mouse: drag to turn, right-drag or Ctrl+drag to slide, wheel to zoom,
 * double-click to go back to the view. Touch: one finger turns, two fingers
 * pinch to zoom and slide. A tap on the pond rings the water; Shift+drag
 * draws a trail of ripples.
 */
export function mountCameraInput(canvas, { getWorld, onRender }) {
  const html = document.documentElement;
  const pointers = new Map();
  let mode = null;
  let moved = 0;
