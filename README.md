[![make.fun · gta6-01](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![rank](https://make.fun/badge/gta6-01/Nugdw/azura-heat/rank.svg)](https://make.fun/bounty/gta6-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![reward](https://make.fun/badge/gta6-01/Nugdw/azura-heat/reward.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)

# Azura Heat — Port Azura

An entry for the **gta6-01** contest on [make.fun](https://make.fun) — see [https://make.fun](https://make.fun).

**Azura Heat** is a single-file, top-down canvas 2D city game set in the sunny
coastal city of **Port Azura**: a road-grid city with buildings, a beach and the
sea, and palm trees. Walk on foot, hop into your car, run errands for your
contacts, collect hidden coins, and keep one eye on the heat.

Round 5 builds on rounds 3 and 4 and adds random tropical rain.

## Features

### City & driving
- Grid road map of Port Azura with buildings, beach + sea, and palm trees.
- Walk on foot (WASD / arrow keys) and enter / exit your car with **E**.
- Simple driving physics, a camera that follows the player, viewport culling.
- Civilian traffic including taxis and vans; horn with **H** (NPCs flee).
- Sprint with **Shift**, with a stamina meter.

### Day & night (4-minute cycle)
- A full day lasts 4 minutes: sunrise, daytime, golden hour, night.
- At night, windows light up, streetlights glow, and cars show headlights and
  taillights. The HUD shows the clock and the current day.

### Missions (4, from contacts)
1. **Hot Food Dash** — Mama Rosa (Rosa Kitchen): pick up food, deliver it to the beach house.
2. **Pier Pickup** — Diego (Pier Kiosk): pick up the passenger, drive him to City Hotel.
3. **Checkpoint Race** — Rafi (Garage): a timed run through 3 checkpoints and back.
4. **Sunset Taxi Run** — Lia (Beach Kiosk): meet Lia at the Beach Kiosk and drive her to Sunset Point.

Each mission is staged, with a world marker and a minimap marker, and pays cash + score.

### Side activity — Paket Pantai
Pick up a beach parcel at a random point and deliver it to another random point
within 75 seconds for **$120 + 120 score**. Repeatable.

### Collectibles, NPCs, wanted system
- **12 hidden coins**: +$25 and +score each.
- **24 NPC citizens** (walkers, joggers, beachgoers) with speech bubbles; they flee from horns.
- **Wanted system, 0–5 stars**: police chase you; heat rises when you are seen
  committing offences and falls slowly when no police see you for more than
  3 seconds within a 340 radius ("OUT OF SIGHT — HEAT FALLING").
- Getting caught = **busted**; a hard crash = **hospital**. Both cost money.

### Score
Score comes from missions, coins, speed, and near-misses. Your best score is
stored in `localStorage` under the key `azura-heat-best-score-v1` and is shown
on the title screen, in the HUD, and on the completion screen (with a
**NEW RECORD** tag when you beat it).

### Pause & radio
- **Pause menu (P / Esc)** freezes the simulation and shows a progress summary panel.
- **Radio (R)** cycles 3 stops — Off, **Azura Wave 98.4** (synthwave), and
  **Pier FM 91.1** (chill) — with procedural WebAudio note patterns. WebAudio
  also provides the engine hum, siren, coin / mission jingles, and crash sounds.

### Minimap
Shows the player (with a heading arrow), mission markers, coins, citizens,
police, a north compass (N), and a clock strip.

### Screens & screenshot mode
- Title screen (click / Start button), completion screen after all 4 missions.
- Screenshot mode: `?shot=start|play|end` with `&seed=<n>` prepares a
  deterministic scene and sets `window.__shotReady = true` when ready.

### NEW in round 5 — tropical RAIN
- Random tropical rain showers lasting **20–40 seconds**.
- Visual rain streaks over the city and darker, wet-looking roads.
- **Roads are more slippery while driving in the rain** (reduced grip / acceleration).
- A **weather icon in the HUD** shows rain vs. clear, plus the remaining shower time.
- Feature marker: `RAIN`.

## Controls

| Key | Action |
| --- | --- |
| WASD / Arrow keys | Walk / drive |
| E | Enter / exit car |
| H | Horn |
| Shift | Sprint (on foot, uses stamina) |
| P / Esc | Pause menu (progress summary) |
| R | Radio — cycle Off / Azura Wave 98.4 / Pier FM 91.1 |
| Enter / Click | Start from the title screen |

## Running

The game itself is one self-contained HTML file — `game/index.html` — with no
external assets. Open it directly in a browser, or serve it:

```bash
node serve.ts            # default port 8077
node serve.ts --port 9000
PORT=9000 node serve.ts
```

`serve.ts` is a dependency-free Node static server:

- `GET /` — serves `game/index.html` (with ETag / 304, HEAD support, `nosniff` header, request logging, path-traversal protection, graceful SIGINT/SIGTERM shutdown).
- `GET /__health` — JSON: `{ "game": "Azura Heat", "round": 5, "status": "ok" }`
- `GET /__version` — JSON: `{ "game": "Azura Heat", "city": "Port Azura", "round": 5, "features": [ ... ] }`

## Generator / validator

```bash
MAKEFUN_OUTPUT_DIR=./out node main.ts
```

`main.ts` (dependency-free Node) reads `game/index.html` and `shots.json` from
the repo directory, validates them (unique shots and the `?shot=` pattern,
feature markers — including the round 4 markers `togglePause`,
`azura-heat-best-score-v1`, `Paket Pantai`, `RADIO_CHANNELS`, `unseenT`, and the
round 5 marker `RAIN` — mission count = 4, and a size warning), then writes
`dossier.json` and `manifest.json` (recording `round: 5` and the feature list)
into `MAKEFUN_OUTPUT_DIR` (default `./out`), copies `screenshots/` across,
logs its duration, and exits non-zero if validation fails.

## Contest

Entry for **gta6-01** on [make.fun](https://make.fun). Round 5.
