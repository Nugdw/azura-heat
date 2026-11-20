# azura-heat

[![make.fun · gta6-01](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![rank](https://make.fun/badge/gta6-01/Nugdw/azura-heat/rank.svg)](https://make.fun/bounty/gta6-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![reward](https://make.fun/badge/gta6-01/Nugdw/azura-heat/reward.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)

**Azura Heat** is an original top-down open-world crime game set in Port Azura, a
fictional coastal city of six-by-five blocks, one long beach and a lot of bad
decisions. Roam the grid on foot or in whatever car you can hot-wire, run jobs
for Marlo at the docks, Inés at Café Azul and — new in round 3 — Lia at the
Beach Kiosk, collect the cash stashes hidden around town, deliver beach
parcels on the side, and manage your wanted level, because the Azura PD
is always one ram away from a very personal conversation.

Everything is a single self-contained `game/index.html` in vanilla JavaScript
and Canvas 2D: traffic with somewhere to be, pedestrians with survival
instincts and opinions, a 0–5 star wanted system with chasing police, bust
and hospital mechanics, four missions plus a repeatable parcel hustle, a
living day-night cycle, a live minimap and a fixed-timestep simulation
driven by one seeded random stream — no assets, no build step, no network.

## What's new in round 4

- **A real pause menu.** Press **P** or **Esc** and the simulation
  actually stops — no clock, no traffic, no timers — while a summary
  panel shows missions completed, coins found, Paket Pantai deliveries,
  cash, score, your best score, wanted stars, the radio station and the
  mission clock you are on. Press P or Esc again to roll.
- **A best score that sticks.** Your record score is saved in
  `localStorage` and shown on the title screen, in the HUD, in the
  pause menu and on the mission-complete screen (with a ★ when the run
  you just finished set a new record).
- **Paket Pantai — a repeatable side hustle.** A parcel pickup glows
  teal somewhere on the beachfront or in town. Touch it and a magenta
  drop-off lights up across the city: deliver within 75 seconds for
  $120 cash and 120 score. Let the timer die and the parcel is soggy
  and worthless — either way, a fresh run with fresh random points
  follows a few seconds later. It runs alongside the story jobs, not
  instead of them.
- **A three-stop radio.** Press **R** to cycle the dial: off →
  *Azura Wave 98.4* (a driving synthwave bassline) → *Pier FM 91.1*
  (a lazy chill arpeggio) → off again. Both stations are procedural
  WebAudio note patterns; there are still no audio files in this game.
- **Heat that rewards breaking line of sight.** Wanted stars already
  faded long after your last crime; now they also bleed away slowly
  whenever no police unit has eyes on you for more than three seconds,
  and the HUD says `OUT OF SIGHT — HEAT FALLING` while it happens.
  Hiding is a plan now, not just a pause between chases.
- **Server identity card.** `serve.ts` now answers `GET /__version`
  with a JSON card naming the game, its city, round 4 and the headline
  features of the round, next to the existing `/__health` probe.

## What's new in round 3

- **A living day-night city.** A full 4-minute day cycle: sunrise, noon,
  a golden dusk, then night with glowing windows, streetlight halos at
  every intersection, car headlights and taillights, and gentler traffic
  after dark. The HUD and minimap both carry a clock and the day counter.
- **A fourth mission — Sunset Taxi Run.** Lia at the new Beach Kiosk
  contact needs her cousin picked up on the beachfront and delivered to
  St. Azura General. $350, 140 seconds, one passenger with opinions.
- **12 collectible cash stashes.** Glowing `$` coins hidden in parks, on
  the pier, along the beach and in quiet corners. Each pays $25 and 50
  score, on foot or by car, and the HUD tracks your count.
- **More citizens.** 24 pedestrians now (up from 16): sidewalk walkers,
  fast joggers with headbands, and beachgoers wandering the sand. They
  flee traffic, dive out of the way, occasionally say something, and
  startle when you lean on the horn.
- **Taxis and vans in traffic.** Traffic now mixes sedans with yellow
  taxis (roof sign and all) and longer, slower vans.
- **Sprint and stamina.** Hold Shift on foot to sprint; the stamina bar
  in the HUD drains and refills. Fast driving also earns score now,
  including a near-miss bonus for threading past traffic at speed.
- **Sound, properly.** WebAudio v2: a procedural engine hum that follows
  your speed, distant two-tone sirens while you are wanted, a two-tone
  horn (H), coin and mission jingles, and impact thuds. M still mutes.
- **A bigger minimap.** Coins, citizens, all three contacts, police,
  your heading as an arrow, a north marker and a clock strip.
- **Performance.** The renderer now culls everything off-screen —
  buildings, parks, cars, pedestrians, sea dressing, streetlights —
  so a bigger city costs the same as round 2 to draw.

## Run it

Open `game/index.html` in any modern browser, or serve the game folder:

```sh
node serve.ts            # then visit http://localhost:8080
```

`serve.ts` also answers `GET /__health` with a small JSON probe and
`GET /__version` with the game's round-4 identity card, logs every
request, and honours `--port <n>` / `PORT=<n>`. The game starts
on its title screen; press Enter (or click) to play.

## Controls

| Keys | Action |
| --- | --- |
| WASD / arrow keys | Walk, drive, steer |
| Shift | Sprint (on foot, drains stamina) |
| E | Enter / exit a car, take a job at a contact |
| H | Horn (startles nearby pedestrians) |
| R | Radio: cycle off → synthwave → chill *(new in round 4)* |
| Enter | Start, confirm (busted / downed / mission complete) |
| P or Esc | Pause menu — freezes the game, shows your progress summary *(round 4)* |
| M | Sound on / off |

## The jobs

| Mission | Contact | Pay | The gist |
| --- | --- | --- | --- |
| Harbor Cargo | Marlo, The Docks | $300 | Fetch the crate from the end of the pier, deliver it to the north depot. |
| Azul Coffee Rush | Inés, Café Azul | $250 | Three coffee stops across town against the clock. |
| The Convertible Job | Marlo, The Docks | $400 | Steal the red convertible mid-town, bring it to the docks garage. Stealing it is worth 2 stars by itself. |
| Sunset Taxi Run | Lia, Beach Kiosk | $350 | Pick up a passenger on the beachfront, drop them at St. Azura General. *(new in round 3)* |

Plus the informal economy: 12 cash stashes at $25 each, score for
fast, close driving — and, new in round 4, **Paket Pantai**: timed
beach-parcel deliveries between random pickup and drop-off points,
$120 a run, repeatable forever and independent of the four jobs above.
Getting busted costs 15% of your cash; waking up at St. Azura General
costs $50.

## Under the hood

One file, no dependencies: the simulation steps at a fixed 1/60s from a
single seeded mulberry32 stream, which is what makes the screenshot
scenes byte-for-byte reproducible. The day-night look is computed, not
baked — sun elevation is `-cos(timeOfDay · 2π)`, and darkness, window
glow, streetlights and headlights all derive from it. Audio is
synthesised with WebAudio oscillators (engine, sirens, horn, jingles —
and, since round 4, two radio stations that are nothing but note
patterns on a beat clock); there are no sound files. Rendering culls
against the camera viewport before drawing, and the wanted system,
bust meter, mission state machine and the Paket Pantai parcel state
are plain data the HUD reads each frame. The best score is the game's
only persistent state: one `localStorage` key, read defensively at
boot so blocked storage can never break the game.

## Hand-in

`node main.ts` with `MAKEFUN_OUTPUT_DIR` set assembles the bounty hand-in —
`dossier.json` (built by `vendor/makefun-game.ts` from `game/` and
`screenshots/`), the three renders named in `shots.json`, and a
`manifest.json` indexing them. The round-4 generator also verifies the
page still carries the full feature set — the round-3 base (day-night
cycle, the taxi mission, the beach kiosk, the coins, the engine sound,
the shot-mode hook) plus the round-4 markers (pause menu, the
localStorage best-score key, Paket Pantai, the radio channels, the
unseen-heat timer) — counts the missions defined in the page, and
records both the checklist and a dedicated `round4Features` list in
the manifest. The renders are deterministic:
`game/index.html?shot=start|play|end&seed=1` replays a seeded, fixed-step
scene and flags `window.__shotReady` when it is fully drawn. Round 3's
scenes are timed for the light: morning for the title, golden hour for
the chase, dusk over Café Azul for the mission-complete screen.

<sub>Entered on [make.fun](https://make.fun/?ref=v4g0sdkn&utm_source=github&utm_medium=readme&utm_campaign=gta6-01) · AI agents build software for cash rewards</sub>
