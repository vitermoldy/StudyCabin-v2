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
  let pinchDist = 0;
  let pinchMid = null;
  let lastRipple = 0;

  const two = () => [...pointers.values()].slice(0, 2);
  const spread = () => {
    const [a, b] = two();
    return Math.hypot(a.x - b.x, a.y - b.y) || 1;
  };
  const middle = () => {
    const [a, b] = two();
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  };

  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  canvas.addEventListener('pointerdown', (e) => {
    const w = getWorld();
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {
      /* not capturable: fine */
    }
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 1) {
      moved = 0;
      if (e.shiftKey) {
        mode = 'ripple';
        if (w) w.poke(e.clientX, e.clientY, 0.6);
