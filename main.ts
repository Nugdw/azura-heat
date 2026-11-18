// Azura Heat — gta6-01 dossier generator (Node 22, standard library only).
//
// The game lives in this directory's game/ folder: one self-contained HTML file
// (game/index.html, vanilla JS + Canvas 2D, no network requests) plus the three
// JPEG screenshots in screenshots/ named by shots.json. This program validates
// the entry, copies game/ and screenshots/ into the output directory, writes
// dossier.json with the vendored make.fun library, and drops a manifest.json
// beside it describing exactly what was handed in.
//
// Serve the game locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

// ---------------------------------------------------------------------------
// Azura Heat — entry configuration
// ---------------------------------------------------------------------------
const GAME = {
  name: 'Azura Heat',
  slug: 'azura-heat',
  competition: 'gta6-01',
  city: 'Port Azura',
  entrypoint: 'index.html',
  indexMaxBytes: 1024 * 1024, // the scorer's cap for a single-file game
  dossierCaps: {
    // The scorer's own caps (reference/gate.json): only text_max_bytes shapes
    // the bytes; the others refuse an entry the scorer would refuse (more than
    // 4 screenshots or one over 256 KiB; more than 993 files in game/ or 48 MiB
    // of game files in all, or a path under game/ over 1000 bytes).
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  },
} as const;

// Structured, greppable progress logging: one line per stage, always the same
// shape, so a grader log can be scanned without parsing prose.
function log(stage: string, status: 'start' | 'ok' | 'fail', detail = ''): void {
  console.log(`[${GAME.slug}] stage=${stage} status=${status}${detail ? ` ${detail}` : ''}`);
}

function fail(stage: string, message: string): never {
  log(stage, 'fail', `error="${message}"`);
  throw new Error(`${GAME.name}: ${message}`);
}

// ---------------------------------------------------------------------------
// Input validation — refuse early, with a named reason, anything the scorer
// would refuse later anyway.
// ---------------------------------------------------------------------------
interface ShotSpec { name: string; query: string }

function validateInputs(here: string): { shots: ShotSpec[]; indexBytes: number } {
  const stage = 'validate';
  log(stage, 'start');

  const gameDir = join(here, 'game');
  const indexPath = join(gameDir, GAME.entrypoint);
  if (!existsSync(gameDir)) fail(stage, `missing game/ directory beside ${GAME.entrypoint} generator`);
  if (!existsSync(indexPath)) fail(stage, `missing game/${GAME.entrypoint}`);

  const indexBytes = statSync(indexPath).size;
  if (indexBytes === 0) fail(stage, `game/${GAME.entrypoint} is empty`);
  if (indexBytes > GAME.indexMaxBytes) {
    fail(stage, `game/${GAME.entrypoint} is ${indexBytes} bytes, over the ${GAME.indexMaxBytes}-byte cap`);
  }

  const shotsPath = join(here, 'shots.json');
  if (!existsSync(shotsPath)) fail(stage, 'missing shots.json');
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(shotsPath, 'utf8'));
  } catch {
    fail(stage, 'shots.json is not valid JSON');
  }
  if (!Array.isArray(parsed) || parsed.length === 0) fail(stage, 'shots.json must be a non-empty array');
  if (parsed.length > GAME.dossierCaps.screenshots.max) {
    fail(stage, `shots.json names ${parsed.length} screenshots, over the cap of ${GAME.dossierCaps.screenshots.max}`);
  }

  const shots: ShotSpec[] = parsed.map((entry: unknown, i: number) => {
    if (typeof entry !== 'object' || entry === null) fail(stage, `shots.json[${i}] is not an object`);
    const { name, query } = entry as { name?: unknown; query?: unknown };
    if (typeof name !== 'string' || !name) fail(stage, `shots.json[${i}].name must be a non-empty string`);
    if (typeof query !== 'string' || !query.startsWith('?')) fail(stage, `shots.json[${i}].query must start with "?"`);
    const file = join(here, 'screenshots', name);
    if (!existsSync(file)) fail(stage, `screenshots/${name} named by shots.json does not exist`);
    const bytes = statSync(file).size;
    if (bytes > GAME.dossierCaps.screenshots.max_bytes) {
      fail(stage, `screenshots/${name} is ${bytes} bytes, over the ${GAME.dossierCaps.screenshots.max_bytes}-byte cap`);
    }
    return { name, query };
  });

  log(stage, 'ok', `index_bytes=${indexBytes} screenshots=${shots.length}`);
  return { shots, indexBytes };
}

// ---------------------------------------------------------------------------
// Manifest — a deterministic, human-readable summary written next to the
// dossier. No timestamps: the same entry always produces the same manifest.
// ---------------------------------------------------------------------------
function listFiles(dir: string): { path: string; bytes: number }[] {
  const out: { path: string; bytes: number }[] = [];
  const walk = (d: string, prefix: string): void => {
    for (const name of readdirSync(d).sort()) {
      const full = join(d, name);
      if (statSync(full).isDirectory()) walk(full, `${prefix}${name}/`);
      else out.push({ path: `${prefix}${name}`, bytes: statSync(full).size });
    }
  };
  walk(dir, '');
  return out;
}

function writeManifest(outDir: string, shots: ShotSpec[]): void {
  const stage = 'manifest';
  log(stage, 'start');
  const manifest = {
    game: GAME.name,
    slug: GAME.slug,
    competition: GAME.competition,
    city: GAME.city,
    entrypoint: `game/${GAME.entrypoint}`,
    files: listFiles(join(outDir, 'game')),
    screenshots: shots.map((s) => {
      const file = join(outDir, 'screenshots', s.name);
      return { name: s.name, query: s.query, bytes: statSync(file).size };
    }),
    dossier: 'dossier.json',
  };
  writeFileSync(join(outDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  log(stage, 'ok', `files=${manifest.files.length} screenshots=${manifest.screenshots.length}`);
}

// ---------------------------------------------------------------------------
// Main pipeline: validate -> copy -> dossier -> manifest.
// ---------------------------------------------------------------------------
function main(): void {
  const here = fileURLToPath(new URL('.', import.meta.url));
  const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
  log('config', 'ok', `game="${GAME.name}" out="${out}"`);

  const { shots } = validateInputs(here);

  log('copy', 'start');
  mkdirSync(out, { recursive: true });
  cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
  mkdirSync(join(out, 'screenshots'), { recursive: true });
  if (existsSync(join(here, 'screenshots'))) {
    cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
  }
  log('copy', 'ok');

  log('dossier', 'start');
  writeFileSync(join(out, 'dossier.json'), buildDossier(out, GAME.dossierCaps));
  log('dossier', 'ok');

  writeManifest(out, shots);
  log('done', 'ok', `game="${GAME.name}" handed in`);
}

main();
