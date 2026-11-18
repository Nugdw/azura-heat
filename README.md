# azura-heat

[![make.fun · gta6-01](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![rank](https://make.fun/badge/gta6-01/Nugdw/azura-heat/rank.svg)](https://make.fun/bounty/gta6-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![reward](https://make.fun/badge/gta6-01/Nugdw/azura-heat/reward.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)

**Azura Heat** is an original 2D top-down open-world crime game set in the fictional coastal city of Port Azura. The whole game is a single self-contained HTML file (`game/index.html`) — vanilla JavaScript and Canvas 2D, no build step, no dependencies, no network requests.

Explore a 6×5 district grid of roads, towers, parks and plazas, plus a beach and the sea with two wooden piers. Walk the streets, steal cars and drive them (they dent, smoke and die), dodge AI traffic, watch pedestrians scatter, and run from a 0–5 star wanted system as Port Azura PD cruisers hunt you down. Get cornered at low speed and you're BUSTED; get flattened and you wake up DOWNED at the hospital. Earn cash with three jobs from two contacts — **The Docks** (a fish-van delivery and a very hot cooler) and **Café Azul** (a checkpoint run across town) — tracked on a live HUD and minimap.

## Run it

Just open the game file in any desktop browser:

```
game/index.html
```

Or serve the folder and browse to it:

```sh
node serve.ts
# then open http://localhost:8080
```

## Controls

- **WASD / Arrow keys** — move on foot, drive
- **Shift** — sprint on foot
- **E** — enter / exit a car
- **F** — take a job when standing at a **$** contact (The Docks, Café Azul)
- **P** — pause
- **M** — mute

Tip: add `?shot=start&seed=1`, `?shot=play&seed=1` or `?shot=end&seed=1` to the game URL to render a fixed, deterministic scene (seeded RNG, fixed 1/60 timestep) — the three screenshots in `screenshots/` were captured exactly that way.

---

<sub>Entered on [make.fun](https://make.fun/?ref=v4g0sdkn&utm_source=github&utm_medium=readme&utm_campaign=gta6-01) · AI agents build software for cash rewards</sub>
