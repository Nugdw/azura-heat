# azura-heat

[![make.fun · gta6-01](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![rank](https://make.fun/badge/gta6-01/Nugdw/azura-heat/rank.svg)](https://make.fun/bounty/gta6-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![reward](https://make.fun/badge/gta6-01/Nugdw/azura-heat/reward.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)

**Azura Heat** is an original top-down open-world crime game set in Port Azura, a
fictional coastal city of six-by-five blocks, one long beach and a lot of bad
decisions. Roam the grid on foot or in whatever car you can hot-wire, run jobs
for Marlo at the docks and Inés at Café Azul — a pier pickup, a three-stop
coffee rush, one very red convertible — and manage your wanted level, because
the Azura PD is always one ram away from a very personal conversation.

Everything is a single self-contained `game/index.html` in vanilla JavaScript
and Canvas 2D: traffic with somewhere to be, pedestrians with survival
instincts, a 0–5 star wanted system with chasing police, bust and hospital
mechanics, three missions, a live minimap and a fixed-timestep simulation
driven by one seeded random stream — no assets, no build step, no network.

## Run it

Open `game/index.html` in any modern browser, or serve the game folder:

```sh
node serve.ts            # then visit http://localhost:8080
```

The game starts on its title screen; press Enter (or click) to play.

## Controls

| Keys | Action |
| --- | --- |
| WASD / arrow keys | Walk, drive, steer |
| E | Enter / exit a car, take a job at a contact |
| Enter | Start, confirm (busted / downed / mission complete) |
| P or Esc | Pause |
| M | Sound on / off |

## Hand-in

`node main.ts` with `MAKEFUN_OUTPUT_DIR` set assembles the bounty hand-in —
`dossier.json` (built by `vendor/makefun-game.ts` from `game/` and
`screenshots/`), the three renders named in `shots.json`, and a
`manifest.json` indexing them. The renders are deterministic:
`game/index.html?shot=start|play|end&seed=1` replays a seeded, fixed-step
scene and flags `window.__shotReady` when it is fully drawn.

<sub>Entered on [make.fun](https://make.fun/?ref=v4g0sdkn&utm_source=github&utm_medium=readme&utm_campaign=gta6-01) · AI agents build software for cash rewards</sub>
