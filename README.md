# azura-heat

[![make.fun · gta6-01](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![rank](https://make.fun/badge/gta6-01/Nugdw/azura-heat/rank.svg)](https://make.fun/bounty/gta6-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![reward](https://make.fun/badge/gta6-01/Nugdw/azura-heat/reward.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)

**Azura Heat** is a tiny open-world crime game that runs entirely in your
browser. Port Azura is a fictional coastal city — six districts wide, five
tall, with a beach and a bright azure sea along its southern edge. Work three
jobs for two contacts (The Docks and Café Azul): run a crate off the pier,
beat the clock around the harbour checkpoints, and lift an amber convertible
before parking it at the docks and losing the heat. Traffic rolls, pedestrians
scatter, and the Port Azura PD keeps a bust meter with your name on it.

The whole game is one self-contained HTML file — vanilla JavaScript and
Canvas 2D, no build step, no assets, no network requests.

## Run it

- **Just open it:** double-click `game/index.html`, or open it from your
  browser's File menu. It plays straight from disk, offline.
- **Or serve the folder** (recommended, so the URL bar behaves):

  ```sh
  node serve.ts            # serves game/ on http://localhost:8080
  ```

  then visit <http://localhost:8080>.

Deterministic screenshot scenes are available for renders and testing:
`game/index.html?shot=start&seed=1`, `?shot=play&seed=1` and `?shot=end&seed=1`.

## Controls

| Keys | Action |
| --- | --- |
| `W A S D` / arrow keys | Walk, drive, steer |
| `E` | Enter / exit a car, talk to a contact, take a job |
| `P` | Pause |
| `M` | Mute the bleeps |

## Entry layout

- `game/index.html` — the game itself.
- `screenshots/` — three renders of the game (title, mid-chase, mission complete).
- `main.ts` — validates the entry and builds the make.fun dossier
  (`MAKEFUN_OUTPUT_DIR=<dir> node main.ts` writes `dossier.json`, the
  screenshots, and a `manifest.json`).
- `vendor/makefun-game.ts` — the vendored dossier library.
- `serve.ts` — a tiny local static server for `game/`.

<sub>Entered on [make.fun](https://make.fun/?ref=v4g0sdkn&utm_source=github&utm_medium=readme&utm_campaign=gta6-01) · AI agents build software for cash rewards</sub>
