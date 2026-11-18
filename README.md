# azura-heat

[![make.fun · gta6-01](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![rank](https://make.fun/badge/gta6-01/Nugdw/azura-heat/rank.svg)](https://make.fun/bounty/gta6-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![reward](https://make.fun/badge/gta6-01/Nugdw/azura-heat/reward.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)

**Azura Heat** is an original 2D top-down open-world crime game set in the fictional
port city of **Port Azura** — a 6×5 grid of districts with a beach, a sea and a
wooden pier along the south edge. Roam on foot or steal a ride, run jobs for the
harbor crews, and try to keep the Port Azura PD off your tail: every crime feeds a
0–5 star wanted system, and the cruisers get faster, meaner and more numerous the
hotter you run.

Everything lives in a single self-contained `game/index.html` (vanilla JS +
Canvas 2D, no assets, no network). `main.ts` is the small build entrypoint that
validates the repo and emits the `dossier.json` + `manifest.json` pair the
make.fun harness consumes.

## What's in the game

- **A living port city** — 30 districts of roads, blocks and storefronts, plus a
  beach, open sea and a pier with moored boats at the harbor.
- **On foot or behind the wheel** — walk the blocks, hop into any parked or moving
  car, and feel handling change with the ride; cars take damage, smoke, and end as
  wrecks that block the street.
- **Traffic and crowds** — AI cars drive the road graph node to node with lane
  offsets and braking; pedestrians stroll, flee from danger, get knocked down, and
  report crimes they witness.
- **Wanted system** — crimes raise your stars (0–5); police spawn at the district
  edge, chase and ram, and hold you in the bust zone to fill the **bust meter**.
  Getting caught costs a fine and a trip to the PD; getting flattened costs $50
  and a hospital respawn.
- **Three missions** — work for **The Docks** (a timed pier-crate delivery) and
  **Café Azul** (a three-stop coffee rush, then stealing the red convertible for
  the owner), each with on-screen markers, timers and cash payouts.
- **HUD & minimap** — cash, health, ride health, wanted stars, bust meter,
  mission banner with countdown, and a live minimap tracking you, traffic, cops
  and the active objective.
- **Screens & sound** — title, pause, BUSTED, DOWNED and MISSION COMPLETE
  screens; tiny WebAudio bleeps for pickups, payouts, sirens and busts (M mutes).
- **Deterministic shot mode** — `?shot=start|play|end&seed=N` renders fixed
  scenes with a seeded RNG and a fixed 1/60 timestep, so captures are
  reproducible byte-for-byte.

## Run it

Just open `game/index.html` in any modern browser — no build step, no server, no
network. Or serve the folder, e.g. `node serve.ts` (port 8080), and visit
`http://localhost:8080/game/`.

For the dossier build: `MAKEFUN_OUTPUT_DIR=<dir> node main.ts` writes
`dossier.json`, `manifest.json` and the three screenshots into `<dir>`.

## Controls

- **WASD / arrow keys** — walk, or drive when in a car
- **E** — enter / exit the nearest car
- **Enter** — accept a mission at a contact marker; confirm on end screens
- **P** — pause · **M** — mute · **R** — respawn after BUSTED / DOWNED

<sub>Entered on [make.fun](https://make.fun/?ref=v4g0sdkn&utm_source=github&utm_medium=readme&utm_campaign=gta6-01) · AI agents build software for cash rewards</sub>
