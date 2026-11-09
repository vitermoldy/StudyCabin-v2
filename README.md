# StudyCabin v2

A study room in a live forest cabin. A cabin in a clearing in the woods keeps its own day (one game
minute every real second, so a day lasts 24 minutes), the weather turns, five seasons change, a
resident lives through the day while you study, and animals pass through the clearing: deer, a fox,
a hare, a squirrel, birds overhead and an owl on the roof at night. With your own YouTube music.

Version 2 of StudyCabin: the same app and interface, moved from the beach into a forest in the
colours of the SongPlay scene.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # static files in dist/, open with any static server
npm run preview    # serves dist/
```

Needs a browser with WebGL 2 (any current Chrome, Edge, Firefox or Safari). Without it the page
shows a still picture and the music, timer and ambient sound still work.

## What is in it

- **The forest.** An oval clearing in a wood of firs and broadleaf trees, thicker and taller the
  further in, with bushes and ferns along the edge and three rings of far trees fading into the
  haze behind. Teal and sage skies, green haze between the rows of trees, a warm low sun, green
  moonlight.
- **The pond.** Still, dark water in front of the cabin that mirrors the sky and the ring of trees,
  with lily pads (flowers in spring and summer), stones on the bank and a path round it. Tap the
  pond to ring it, Shift+drag to draw ripples; raindrops ring it by themselves. It freezes in
  winter and snow settles on the ice.
- **Animals.** A doe (with her fawn in spring and summer) and a buck at dawn and dusk, a fox from
  dusk into the night, a hare round the edges of the day, a squirrel by day. Each comes out of the
  wood on its own trail, stops to graze, drink at the pond, look round or sit up, and goes back in
  on the other side. Rain sends most of them under cover; a storm sends all of them. Flocks of
  birds cross over the trees by day, an owl comes to the roof ridge after dark, fireflies light up
  over the grass on warm nights. The animal in view gets a line in the story at the bottom left.
- **The cabin and the resident.** A sage board cabin with a standing-seam roof, glass front, deck,
  fire bowl and stove; inside a kitchen, table, sofa, armchair, bookcase, bed and a desk by the
  glass. The resident follows a daily routine (sleep, coffee, breakfast, study, a walk round the
  pond, cooking, reading, guitar, journal) and swaps outdoor plans for indoor ones when it rains or
  snows. Lamps, the stove, the porch light and the fire bowl follow the hour and the weather.
- **Clock.** 1 minute every second by default; also stopped, real time and 10 minutes a second.
  Jump to any hour from the Day panel or its timeline.
- **Seasons.** Spring, summer, rainy season, autumn, winter: day length, temperature, grass, fern
  and tree colours, petals, falling leaves, snow on the roof and the ground, ice on the pond.
  Optionally moves on every 7 game days.
- **Weather.** Follows the season, or pick clear, cloudy, fog, rain, storm or snow. Rain streaks,
  storm lightning (soft, at most two flashes a second), snowfall, fog in the trees, wind in the
  grass and the crowns.
- **Sky.** Clouds at every hour, sunrise and sunset colours, moon, a Milky Way band and stars at
  night, and northern lights on clear nights (strongest in winter).
- **Music.** Paste a YouTube or YouTube Music link: a song, a video, an album or a public
  playlist. Links line up in the queue dropdown (reorder, remove, clear); next, previous,
  shuffle, repeat, seek and volume. The queue is kept in the browser.
- **Focus timer.** 25/5 or 50/10 blocks with a long break; the resident studies at the desk while
