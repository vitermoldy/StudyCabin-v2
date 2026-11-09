/**
 * Camera views. `width` is how many metres across must fit on screen, so the
 * framing holds on a phone held upright as well as on a wide monitor. The
 * clearing and pond views look back at the cabin down the open lane, so a
 * camera pulled back on a narrow screen stays clear of the trees.
 */
export const VIEWS = {
  clearing: { label: 'Clearing', pos: [0, 6.2, 36], target: [-0.6, 3.6, -2], width: 36 },
