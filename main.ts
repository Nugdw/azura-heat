// Azura Heat — dossier generator for the make.fun gta6-01 entry.
//
// Running `MAKEFUN_OUTPUT_DIR=<dir> node main.ts` from the repository root
// validates the entry (game page, shots list, screenshot files), builds the
// official dossier with the vendored make.fun library, copies the three
// screenshots named in shots.json into the output directory, and writes a
// small manifest.json describing everything it produced.
//
// Node 22+ standard library only; erasable TypeScript; no build step.

import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier, DOSSIER_SCHEMA } from './vendor/makefun-game.ts';

// ------------------------------------------------------------------ config
const GAME = {
  title: 'Azura Heat',
  city: 'Port Azura',
  version: '1.0.0',
  entrypoint: 'game/index.html',
} as const;

/** The gate's caps, as documented by the vendored library. */
const CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
} as const;

const INDEX_HTML_MAX_BYTES = 1024 * 1024;
const SHOT_NAME = /^[A-Za-z0-9_][A-Za-z0-9._-]{0,127}$/;
const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const JPEG_MAGIC = [0xff, 0xd8, 0xff];

// ------------------------------------------------------------------ logging
function log(stage: string, message: string): void {
  console.log(`[azura-heat] stage=${stage} status=ok ${message}`);
}
function fail(stage: string, message: string): never {
  console.error(`[azura-heat] stage=${stage} status=error ${message}`);
  process.exit(1);
}

// ------------------------------------------------------------------ helpers
const sha256Hex = (bytes: Uint8Array): string => createHash('sha256').update(bytes).digest('hex');

function opensWith(bytes: Uint8Array, magic: readonly number[]): boolean {
  return bytes.length >= magic.length && magic.every((b, i) => bytes[i] === b);
}

interface ShotSpec { name: string; query: string }

function readShots(entryDir: string): ShotSpec[] {
  const path = join(entryDir, 'shots.json');
  if (!existsSync(path)) fail('validate', 'shots.json is missing from the repository root');
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(path, 'utf8'));
  } catch (err) {
    fail('validate', `shots.json is not valid JSON (${(err as Error).message})`);
  }
  if (!Array.isArray(parsed) || parsed.length < 3 || parsed.length > CAPS.screenshots.max) {
    fail('validate', `shots.json must list 3 or 4 screenshots, found ${Array.isArray(parsed) ? parsed.length : 'a non-array'}`);
  }
  const seen = new Set<string>();
  const shots: ShotSpec[] = [];
  for (const item of parsed as Array<Record<string, unknown>>) {
    const name = item?.name, query = item?.query;
    if (typeof name !== 'string' || !SHOT_NAME.test(name) || !(name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.png'))) {
      fail('validate', `shots.json holds a bad screenshot name: ${JSON.stringify(name)}`);
    }
    if (typeof query !== 'string' || !query.startsWith('?')) {
      fail('validate', `shots.json entry ${name} has a bad query: ${JSON.stringify(query)}`);
    }
    if (seen.has(name)) fail('validate', `shots.json lists ${name} twice`);
    seen.add(name);
    shots.push({ name, query });
  }
  return shots;
}

function validateEntry(entryDir: string, shots: ShotSpec[]): void {
  const gameDir = join(entryDir, 'game');
  if (!existsSync(gameDir) || !statSync(gameDir).isDirectory()) fail('validate', 'game/ directory is missing');
  const indexPath = join(gameDir, 'index.html');
  if (!existsSync(indexPath)) fail('validate', 'game/index.html is missing');
  const indexBytes = statSync(indexPath).size;
  if (indexBytes === 0 || indexBytes > INDEX_HTML_MAX_BYTES) {
    fail('validate', `game/index.html is ${indexBytes} bytes; the cap is ${INDEX_HTML_MAX_BYTES}`);
  }
  const head = readFileSync(indexPath, 'utf8').slice(0, 512).toLowerCase();
  if (!head.includes('<!doctype html') || !head.includes('<canvas')) {
    fail('validate', 'game/index.html does not look like the Azura Heat canvas page');
  }
  log('validate', `game/index.html ${indexBytes} bytes, within the 1 MiB cap`);
  for (const shot of shots) {
    const p = join(entryDir, 'screenshots', shot.name);
    if (!existsSync(p)) fail('validate', `screenshots/${shot.name} is missing (render it in ?shot mode first)`);
    const bytes = new Uint8Array(readFileSync(p));
    if (bytes.length > CAPS.screenshots.max_bytes) {
      fail('validate', `screenshots/${shot.name} is ${bytes.length} bytes; the cap is ${CAPS.screenshots.max_bytes}`);
    }
    if (!opensWith(bytes, PNG_MAGIC) && !opensWith(bytes, JPEG_MAGIC)) {
      fail('validate', `screenshots/${shot.name} is neither PNG nor JPEG`);
    }
    log('validate', `screenshots/${shot.name} ${bytes.length} bytes sha256=${sha256Hex(bytes).slice(0, 12)}…`);
  }
}

// ------------------------------------------------------------------ main
function main(): void {
  const started = process.hrtime.bigint();
  const entryDir = resolve(fileURLToPath(new URL('.', import.meta.url)));
  const outEnv = process.env.MAKEFUN_OUTPUT_DIR;
  if (outEnv === undefined || outEnv.trim() === '') {
    fail('config', 'MAKEFUN_OUTPUT_DIR is not set; point it at the directory to fill');
  }
  const outDir = resolve(outEnv);
  log('config', `game="${GAME.title}" city="${GAME.city}" version=${GAME.version} out=${outDir}`);

  const shots = readShots(entryDir);
  validateEntry(entryDir, shots);

  mkdirSync(outDir, { recursive: true });
  const dossier = buildDossier(entryDir, CAPS);
  writeFileSync(join(outDir, 'dossier.json'), dossier);
  log('dossier', `dossier.json ${dossier.length} bytes schema=${DOSSIER_SCHEMA} sha256=${sha256Hex(dossier).slice(0, 12)}…`);

  const produced: Array<{ path: string; bytes: number; sha256: string }> = [
    { path: 'dossier.json', bytes: dossier.length, sha256: sha256Hex(dossier) },
  ];
  for (const shot of shots) {
    copyFileSync(join(entryDir, 'screenshots', shot.name), join(outDir, shot.name));
    const bytes = new Uint8Array(readFileSync(join(outDir, shot.name)));
    produced.push({ path: shot.name, bytes: bytes.length, sha256: sha256Hex(bytes) });
    log('screenshots', `copied ${shot.name} (${shot.query})`);
  }

  const manifest = {
    game: GAME.title,
    city: GAME.city,
    version: GAME.version,
    dossier_schema: DOSSIER_SCHEMA,
    entrypoint: GAME.entrypoint,
    shots: shots.map(s => ({ name: s.name, query: s.query })),
    files: produced,
  };
  writeFileSync(join(outDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  const ms = Number(process.hrtime.bigint() - started) / 1e6;
  log('manifest', `manifest.json written; ${produced.length} files in ${outDir} (${ms.toFixed(0)} ms)`);
}

main();
