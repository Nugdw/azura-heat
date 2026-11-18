// Azura Heat — dossier generator.
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
//                         (names, byte counts, sha256) — a convenience for
//                         anyone checking the hand-in by hand.
//
// The dossier itself is produced by vendor/makefun-game.ts, the same code
// the bounty scores with, so what is written here is byte-identical to
// what the scorer computes from the same tree.

import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier, INDEX_HTML_MAX_BYTES } from './vendor/makefun-game.ts';

// ---------------------------------------------------------------- config
const GAME = {
  title: 'Azura Heat',
  city: 'Port Azura',
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

// ---------------------------------------------------------------- logging
function log(stage: string, message: string): void {
  console.log(`[azura-heat] ${stage} — ${message}`);
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
  for (const raw of parsed as Array<Record<string, unknown>>) {
    const name = raw?.name, query = raw?.query;
    if (typeof name !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(name) || !/\.(jpg|jpeg|png)$/i.test(name)) {
      fail('validate', `shots.json: bad screenshot name ${JSON.stringify(name)}`);
    }
    if (typeof query !== 'string' || !query.startsWith('?')) {
      fail('validate', `shots.json: shot ${name} needs a query starting with '?', found ${JSON.stringify(query)}`);
    }
    shots.push({ name, query });
  }
  return shots;
}

function checkInputs(entryDir: string, shots: ShotSpec[]): void {
  const indexPath = join(entryDir, GAME.entry);
  if (!existsSync(indexPath)) fail('validate', `${GAME.entry} is missing — there is no game to hand in`);
  const indexBytes = statSync(indexPath).size;
  if (indexBytes > INDEX_HTML_MAX_BYTES) {
    fail('validate', `${GAME.entry} is ${indexBytes} bytes, over the ${INDEX_HTML_MAX_BYTES}-byte limit for a single-file game`);
  }
  log('validate', `${GAME.entry} present (${indexBytes} bytes, limit ${INDEX_HTML_MAX_BYTES})`);
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
  const entryDir = dirname(fileURLToPath(import.meta.url));
  const outEnv = process.env.MAKEFUN_OUTPUT_DIR;
  const outDir = outEnv ? resolve(outEnv) : entryDir;
  log('start', `${GAME.title} — assembling the hand-in from ${entryDir}`);
  log('start', `output directory: ${outDir}${outEnv ? '' : ' (MAKEFUN_OUTPUT_DIR unset, writing beside the game)'}`);
  mkdirSync(outDir, { recursive: true });

  const shots = readShots(entryDir);
  checkInputs(entryDir, shots);

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
    entry: GAME.entry,
    generator: 'main.ts — Azura Heat dossier generator',
    dossier: { file: 'dossier.json', bytes: dossier.length, sha256: sha256(dossier) },
    screenshots: manifestShots,
  };
  writeFileSync(join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  log('manifest', 'manifest.json written');
  log('done', `${GAME.title} hand-in ready in ${outDir}`);
}

main();
