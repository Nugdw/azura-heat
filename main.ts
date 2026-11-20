// Azura Heat — Round 3 dossier generator.
//
// Running `MAKEFUN_OUTPUT_DIR=<dir> node main.ts` from the repository root
// assembles the make.fun hand-in for the game in game/:
//
//   <dir>/dossier.json    the canonical makefun/dossier/v1 document, built
//                         by the vendored library from game/ + screenshots/
//   <dir>/1-start.jpg     the three renders named by shots.json, copied
//   <dir>/2-play.jpg      verbatim from screenshots/
//   <dir>/3-end.jpg
//   <dir>/manifest.json   this generator's own index of what it wrote
//                         (names, byte counts, sha256, plus the round-3
//                         feature checklist it verified in the game page)
//
// The dossier itself is produced by vendor/makefun-game.ts, the same code
// the bounty scores with, so what is written here is byte-identical to
// what the scorer computes from the same tree.
//
// Round 3 changes to this generator (the dossier format is untouched):
//   - the manifest now records the round, the game's feature markers and
//     the coin/mission counts it found in game/index.html, so a hand-in
//     can be sanity-checked without opening a browser;
//   - input validation also checks the game page carries the shot-mode
//     hook (`window.__shotReady`) the renders depend on, and warns when
//     the page is within 10% of the single-file size limit.

import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier, INDEX_HTML_MAX_BYTES } from './vendor/makefun-game.ts';

// ---------------------------------------------------------------- config
const GAME = {
  title: 'Azura Heat',
  city: 'Port Azura',
  round: 3,
  entry: 'game/index.html',
  shotsFile: 'shots.json',
  shotsDir: 'screenshots',
} as const;

// The caps the dossier is built under: the whole game source fits in the
// text budget, screenshots are capped at the hand-in limit of 256 KiB.
const DOSSIER_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
} as const;

// Feature markers the round-3 page must contain. Each entry is a plain
// substring of game/index.html; if one disappears, the hand-in is not
// the round-3 game anymore and the generator says so before writing.
const FEATURE_MARKERS: ReadonlyArray<{ marker: string; label: string }> = [
  { marker: 'DAY_SECONDS', label: 'day-night cycle' },
  { marker: 'Sunset Taxi Run', label: 'fourth mission (Sunset Taxi Run)' },
  { marker: 'BEACH KIOSK', label: 'beach kiosk contact' },
  { marker: 'TOTAL_COINS', label: 'collectible cash coins' },
  { marker: 'engineSound', label: 'WebAudio engine sound' },
  { marker: 'drawMinimap', label: 'minimap' },
  { marker: '__shotReady', label: 'shot-mode render hook' },
];

// ---------------------------------------------------------------- logging
function log(stage: string, message: string): void {
  console.log(`[azura-heat] ${stage} — ${message}`);
}
function warn(stage: string, message: string): void {
  console.warn(`[azura-heat] ${stage} — WARNING: ${message}`);
}
function fail(stage: string, message: string): never {
  console.error(`[azura-heat] ${stage} — ERROR: ${message}`);
  process.exit(1);
}

function sha256(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex');
}

// ---------------------------------------------------------------- inputs
interface ShotSpec { name: string; query: string }

function readShots(entryDir: string): ShotSpec[] {
  const path = join(entryDir, GAME.shotsFile);
  if (!existsSync(path)) fail('validate', `${GAME.shotsFile} is missing — it names the renders to hand in`);
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(path, 'utf8'));
  } catch (err) {
    fail('validate', `${GAME.shotsFile} is not valid JSON: ${(err as Error).message}`);
  }
  if (!Array.isArray(parsed) || parsed.length < 3 || parsed.length > 4) {
    fail('validate', `${GAME.shotsFile} must list 3 or 4 shots, found ${Array.isArray(parsed) ? parsed.length : 'a non-array'}`);
  }
  const shots: ShotSpec[] = [];
  const seen = new Set<string>();
  for (const raw of parsed as Array<Record<string, unknown>>) {
    const name = raw?.name, query = raw?.query;
    if (typeof name !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(name) || !/\.(jpg|jpeg|png)$/i.test(name)) {
      fail('validate', `shots.json: bad screenshot name ${JSON.stringify(name)}`);
    }
    if (seen.has(name)) fail('validate', `shots.json: duplicate screenshot name ${JSON.stringify(name)}`);
    seen.add(name);
    if (typeof query !== 'string' || !query.startsWith('?')) {
      fail('validate', `shots.json: shot ${name} needs a query starting with '?', found ${JSON.stringify(query)}`);
    }
    if (!/[?&]shot=(start|play|end)\b/.test(query)) {
      fail('validate', `shots.json: shot ${name} query ${JSON.stringify(query)} does not name a shot scene (start|play|end)`);
    }
    shots.push({ name, query });
  }
  return shots;
}

// ------------------------------------------------------- game inspection
interface GameFacts {
  bytes: number;
  features: string[];
  missions: number;
}

function inspectGame(entryDir: string): GameFacts {
  const indexPath = join(entryDir, GAME.entry);
  if (!existsSync(indexPath)) fail('validate', `${GAME.entry} is missing — there is no game to hand in`);
  const bytes = statSync(indexPath).size;
  if (bytes > INDEX_HTML_MAX_BYTES) {
    fail('validate', `${GAME.entry} is ${bytes} bytes, over the ${INDEX_HTML_MAX_BYTES}-byte limit for a single-file game`);
  }
  if (bytes > INDEX_HTML_MAX_BYTES * 0.9) {
    warn('validate', `${GAME.entry} is ${bytes} bytes — within 10% of the ${INDEX_HTML_MAX_BYTES}-byte limit`);
  }
  log('validate', `${GAME.entry} present (${bytes} bytes, limit ${INDEX_HTML_MAX_BYTES})`);
  const html = readFileSync(indexPath, 'utf8');
  const features: string[] = [];
  for (const { marker, label } of FEATURE_MARKERS) {
    if (!html.includes(marker)) fail('validate', `${GAME.entry} is missing the round-3 feature "${label}" (marker ${JSON.stringify(marker)} not found)`);
    features.push(label);
  }
  const missions = (html.match(/\{ id: '[a-z]+', contact:/g) || []).length;
  if (missions < 4) fail('validate', `${GAME.entry} should define at least 4 missions, found ${missions}`);
  log('validate', `round-3 features present: ${features.join('; ')}`);
  log('validate', `missions defined in page: ${missions}`);
  return { bytes, features, missions };
}

function checkShots(entryDir: string, shots: ShotSpec[]): void {
  for (const shot of shots) {
    const p = join(entryDir, GAME.shotsDir, shot.name);
    if (!existsSync(p)) fail('validate', `${GAME.shotsDir}/${shot.name} is missing — capture it before generating the dossier`);
    const size = statSync(p).size;
    if (size > DOSSIER_CAPS.screenshots.max_bytes) {
      fail('validate', `${GAME.shotsDir}/${shot.name} is ${size} bytes, over the ${DOSSIER_CAPS.screenshots.max_bytes}-byte screenshot cap`);
    }
    log('validate', `${GAME.shotsDir}/${shot.name} present (${size} bytes)`);
  }
}

// ---------------------------------------------------------------- main
function main(): void {
  const startedAt = Date.now();
  const entryDir = dirname(fileURLToPath(import.meta.url));
  const outEnv = process.env.MAKEFUN_OUTPUT_DIR;
  const outDir = outEnv ? resolve(outEnv) : entryDir;
  log('start', `${GAME.title} round ${GAME.round} — assembling the hand-in from ${entryDir}`);
  log('start', `output directory: ${outDir}${outEnv ? '' : ' (MAKEFUN_OUTPUT_DIR unset, writing beside the game)'}`);
  mkdirSync(outDir, { recursive: true });

  const shots = readShots(entryDir);
  const facts = inspectGame(entryDir);
  checkShots(entryDir, shots);

  // The dossier: canonical bytes straight from the vendored builder.
  let dossier: Uint8Array;
  try {
    dossier = buildDossier(entryDir, DOSSIER_CAPS);
  } catch (err) {
    fail('dossier', `the vendored builder refused this tree: ${(err as Error).message}`);
  }
  writeFileSync(join(outDir, 'dossier.json'), dossier);
  log('dossier', `dossier.json written (${dossier.length} bytes, sha256 ${sha256(dossier)})`);

  // The renders named by shots.json, copied byte for byte.
  const manifestShots = shots.map((shot) => {
    const from = join(entryDir, GAME.shotsDir, shot.name);
    const bytes = readFileSync(from);
    copyFileSync(from, join(outDir, shot.name));
    log('copy', `${shot.name} copied (${bytes.length} bytes, sha256 ${sha256(bytes)})`);
    return { name: shot.name, query: shot.query, bytes: bytes.length, sha256: sha256(bytes) };
  });

  // Our own manifest next to the dossier.
  const manifest = {
    game: GAME.title,
    city: GAME.city,
    round: GAME.round,
    entry: GAME.entry,
    entryBytes: facts.bytes,
    missions: facts.missions,
    features: facts.features,
    generator: 'main.ts — Azura Heat round-3 dossier generator',
    dossier: { file: 'dossier.json', bytes: dossier.length, sha256: sha256(dossier) },
    screenshots: manifestShots,
  };
  writeFileSync(join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  log('manifest', 'manifest.json written');
  log('done', `${GAME.title} round ${GAME.round} hand-in ready in ${outDir} (${Date.now() - startedAt} ms)`);
}

main();
