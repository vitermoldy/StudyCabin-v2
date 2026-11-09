# StudyCabin v2: design direction

Version 2 keeps the whole interface of v1 (its direction below) and moves the scene into a forest.
The forest direction comes from the owner: the cabin in the middle of a forest, the atmosphere of
the owner's SongPlay v2 scene (a forest clearing in teal, sage and moss under a warm low sun), and
animals that pass now and then: birds, deer, crickets, a fox and others.

v1's direction came from the owner's four reference screenshots (a sage-green board cabin with a
standing-seam roof, fog on the hills behind, a warm lit interior seen through floor-to-ceiling
glass). The words in those screenshots are ignored, at the owner's request; their look is the
direction. The cabin itself is unchanged in v2.

**Design Read.** Reading this as: an ambient study app (software) for people who study or work at a
screen for hours, in a cinematic misty-forest style taken from the owner's SongPlay scene and the
cabin screenshots, dial **ENERGY 3 / RHYTHM 1 / MOTION 3**.

- ENERGY 3: giant type over a full-bleed scene, as in the reference.
- RHYTHM 1: one screen, one scene; every panel uses the same template on purpose, so the scene is
  the only thing that changes.
- MOTION 3: the product is a living place (clock, weather, seasons, a resident, animals passing).
  Interface motion stays small (hover step, panel fade, a word blurring in when the activity
  changes).

## The deal (taste-skill 2.5.1, unchanged from v1)

- Kind: software (page type software, site-kind software). The live scene is the hero and the
  page's one effect; it carries `data-enter="off"` because the scene has its own load motion.
- Palette: the owner's own colours through `start.mjs brand` (mist `#e4e5e1`, ink `#171716`, lamp
  amber `#d9a05b`). Amber is the lamp light in the reference interiors, the one warm note in a
  green-grey scene.
- Type: Instrument Sans (the dealt third pairing), self-hosted (fontsource), one variable file,
  weights 400 to 600.
- Radius: sharp (4 / 6 / 8). The reference bar is an almost square black block.

## v2: the forest, decisions and their reasons (R-31)

| Decision | Reason |
| --- | --- |
| An oval clearing in a wood, the cabin at its back, the trees closing in behind and to the sides | "In the middle of a forest": the wood is on every side, the clearing gives the cabin and the animals room to be seen. |
| A lane kept open in front of the cabin, down the clearing | The long views pull the camera back on narrow screens; the lane keeps trunks out of the shot on a phone held upright. |
| Sky by sun height in SongPlay's forest colours: deep teal at night, teal blue hour, peach sunset horizon, sage haze by day; green-grey cloud cover | The owner asked for SongPlay's atmosphere; its themes are discrete, the cabin's day is continuous, so the colours become the stops of the sky's table. |
| Thicker, green-tinted fog | SongPlay's "air between the rows of trees": each row further back paler, so the wood reads in depth. |
| Three rings of fir silhouettes with mist at their feet | SongPlay's far treeline, bent into rings so the camera can turn all the way round without finding the end of the forest. |
| Firs stay dark green; broadleaf crowns follow the season; bushes and ferns along the edge | Pine and moss greens from SongPlay; the edge planting makes the clearing run into the wood instead of stopping at a wall. |
| A pond in front of the cabin instead of the sea | Keeps v1's water (clear edge, caustics, the ripple simulation the owner asked for) in a forest setting, and gives the deer somewhere to drink. It freezes in winter. |
| Animals on game trails, by the hour, the weather and the season | The owner asked for animals that pass by. Deer at dawn and dusk, the fox at night, the squirrel by day, as they live; rain sends them under cover. Trees keep the trails open. |
| One animal already standing in the clearing when the page opens, if the hour suits it | The first view, and the still frame under reduced motion, shows what v2 is about. |
| The animal in view gets one sentence in the story line | Says what is happening without a new control or panel (RHYTHM 1). |
| The owl on the roof ridge, fireflies, frogs | Night needs life too: something to see (the owl's shape, the fireflies) and to hear (hoots, frogs, crickets). |
| Eyeshine after dark | Animals stay findable at night without lighting them up. |
| Leaves and branches replace the waves in the sound mixer | The forest's own steady sound, following the wind; the other layers stay as in v1. |
| The print above the sofa shows misty fir ridges | The cabin's one picture follows the place it now stands in. |
| A new poster and share image, rendered from the scene (a misty summer morning, the doe and her fawn at the pond) | The poster shows before the scene draws and when WebGL is missing; it has to be the forest. |

## v1 decisions kept (R-31)

| Decision | Reason |
| --- | --- |
| Live WebGL scene (Three.js) instead of photographs | The owner asked for a house where time, weather, seasons and a person change; only a live scene can show that. |
| Giant words: activity top left, "at" on the right, the clock bottom right | The reference's three-word composition, turned into live state: "Coffee at 07:42". |
| Word blurs in letter by letter when the activity changes | The reference shows letters arriving out of blur; here it marks that the resident started something new. |
| Big type switches between light and dark ink | The scene behind it goes from night to bright fog; the page samples the rendered pixels under each word and keeps 3:1 or better. |
| Four thin vertical lines | Taken from the reference; they mark the 4-column grid the words and panels sit on (R-07 purpose). |
| Black dock at the bottom centre | The reference's black "HOME" bar, grown into the app's controls. |
| Small text on dark plates | Text under 24px must hold 4.5:1 over sky, fog and night; a plate guarantees it. |
| Amber accent only on: active state, focus ring, primary button, the playing row | One warm note, like the lamps; never on large areas. |
| Glass blur on the open panel only (R-10) | Keeps the scene readable behind the one open panel; nothing else is frosted. |
| No shadows on UI (R-12) | The scene has real shadows; flat panels keep the two apart. |
| Hand-drawn filled glyphs for transport and tabs (R-04) | Each one names its action (play, pause, next, cloud for weather, timer for focus); real YouTube and YouTube Music marks name where a link comes from. |
| Sentence-case labels, no tracked capitals | taste-skill rule; the reference's tracked caps are dropped, its layout kept. |
| "↳" before "Add music" (R-08) | The reference's own glyph for its one top-right action; used once. |
| Dark ground behind the canvas | The page is a scene that runs through day and night; the ground only shows before the first frame. |
| Lightning is a soft sky brightening, at most one flash every 8 s, off under reduced motion | Storm atmosphere without a flashing hazard. |
| Thick lawn of fine blades, dark at the root, light at the tip, parting round the pointer | The owner's grass reference. In v2 the blades are a little shorter, sparse under the trees, with a touch of gold at the tips as in SongPlay's meadow. |
| Northern lights green to teal with a rose top, galaxy band, two star layers | Asked for by the owner. The reference's violet is left out (taste-skill: never violet); green aurora is the natural colour. |
| Drag, slide and zoom the camera by hand, double-click to reset | Asked for by the owner; the five views stay as starting points. |

## Motion and why

- Scene entrance: the canvas fades over the poster still and the camera settles 6% closer over
  1.6 s (the house arrives).
- Activity word: blur-in per letter, 60 ms apart, about 900 ms (a new activity started).
- Clock digits: a 150 ms cross-fade on the minute digit only (time moved, without flicker).
- Panels: fade with a 6 px rise, 200 ms open, 120 ms close (motion.md tokens).
- Camera views: a 1.4 s eased move between presets (where you are looking changed).
- Animals walk at their own pace and stop for a few seconds at a time; birds cross in about
