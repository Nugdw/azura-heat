// Azura Heat — make.fun gta6-01 generator / validator (round 5)
// Node, no external dependencies. Validates game/index.html + shots.json,
// writes dossier.json + manifest.json to MAKEFUN_OUTPUT_DIR (default ./out),
// copies screenshots/. Exits non-zero on validation failure.
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const startedAt = Date.now();
const root = path.dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR || path.join(root, "out");
const ROUND = 5;
const GAME = "Azura Heat";
const CITY = "Port Azura";

const FEATURES: string[] = [
  "grid-city-port-azura",
  "day-night-cycle-4min",
  "missions-4",
  "side-job-paket-pantai",
  "coins-12",
  "npcs-24",
  "traffic-taxi-van",
  "wanted-0-5-stars",
  "togglePause",
  "azura-heat-best-score-v1",
  "RADIO_CHANNELS",
  "unseenT",
  "RAIN",
  "tropical-rain-showers",
  "slippery-roads-when-wet",
  "hud-weather-icon",
  "minimap",
  "screenshot-mode",
];

const REQUIRED_MARKERS: string[] = [
  "togglePause",
  "azura-heat-best-score-v1",
  "Paket Pantai",
  "RADIO_CHANNELS",
  "unseenT",
  "RAIN",
  "Port Azura",
  "__shotReady",
  "Sunset Taxi Run",
  "Beach Kiosk",
  "Lia",
];

function fail(msg: string): never {
  console.error(`[azura-heat] VALIDATION FAILED: ${msg}`);
  process.exit(1);
}

function readText(p: string): string {
  if (!fs.existsSync(p)) fail(`missing file: ${p}`);
  return fs.readFileSync(p, "utf8");
}

function main(): void {
  const htmlPath = path.join(root, "game", "index.html");
  const shotsPath = path.join(root, "shots.json");
  const html = readText(htmlPath);
  const shotsRaw = readText(shotsPath);

  // --- shots.json validation: unique names + shot= pattern ---
  let shots: Array<{ name: string; query: string }>;
  try { shots = JSON.parse(shotsRaw); } catch { fail("shots.json is not valid JSON"); }
  if (!Array.isArray(shots) || shots.length === 0) fail("shots.json must be a non-empty array");
  const seen = new Set<string>();
  for (const s of shots) {
    if (!s || typeof s.name !== "string" || typeof s.query !== "string") fail("each shot needs name + query strings");
    if (seen.has(s.name)) fail(`duplicate shot name: ${s.name}`);
    seen.add(s.name);
    if (!/^\?shot=(start|play|end)(&seed=\d+)?$/.test(s.query)) fail(`bad shot query pattern: ${s.query}`);
  }
  console.log(`[azura-heat] shots ok: ${shots.length} unique shots`);

  // --- feature markers ---
  for (const m of REQUIRED_MARKERS) {
    if (!html.includes(m)) fail(`missing feature marker in game/index.html: ${m}`);
  }
  console.log(`[azura-heat] feature markers ok: ${REQUIRED_MARKERS.length}`);

  // --- mission count must be exactly 4 ---
  const missionIds = html.match(/\{id:\s*\d+,name:/g) || [];
  if (missionIds.length !== 4) fail(`mission count must be 4, found ${missionIds.length}`);
  for (const name of ["Hot Food Dash", "Pier Pickup", "Checkpoint Race", "Sunset Taxi Run"]) {
    if (!html.includes(name)) fail(`missing mission name: ${name}`);
  }
  console.log("[azura-heat] missions ok: 4");

  // --- size warning ---
  const bytes = Buffer.byteLength(html, "utf8");
  if (bytes > 200_000) console.warn(`[azura-heat] WARNING: game/index.html is large: ${bytes} bytes`);
  if (bytes < 5_000) fail(`game/index.html suspiciously small: ${bytes} bytes`);
  console.log(`[azura-heat] size ok: ${bytes} bytes`);

  // --- outputs ---
  fs.mkdirSync(outDir, { recursive: true });
  const dossier = {
    game: GAME, city: CITY, round: ROUND, contest: "gta6-01",
    title: "Azura Heat", missions: 4, coins: 12, npcs: 24,
    features: FEATURES, shots,
    weather: { feature: "RAIN", kind: "tropical showers", durationSec: [20, 40], effect: "slippery driving + HUD weather icon" },
    generatedAt: new Date().toISOString(),
  };
  const manifest = {
    game: GAME, city: CITY, round: ROUND, contest: "gta6-01",
    features: FEATURES, entry: "game/index.html", shots: shots.map((s) => s.name),
    generatedAt: new Date().toISOString(),
  };
  fs.writeFileSync(path.join(outDir, "dossier.json"), JSON.stringify(dossier, null, 2) + "\n");
  fs.writeFileSync(path.join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");

  const shotsDir = path.join(root, "screenshots");
  if (fs.existsSync(shotsDir)) {
    const dest = path.join(outDir, "screenshots");
    fs.mkdirSync(dest, { recursive: true });
    for (const f of fs.readdirSync(shotsDir)) fs.copyFileSync(path.join(shotsDir, f), path.join(dest, f));
    console.log("[azura-heat] screenshots copied");
  } else {
    console.warn("[azura-heat] WARNING: no screenshots/ directory found");
  }

  const ms = Date.now() - startedAt;
  console.log(`[azura-heat] done round ${ROUND} in ${ms}ms -> ${outDir}`);
}

main();
