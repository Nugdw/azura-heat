// main.ts — Azura Heat dossier generator.
//
// Azura Heat is an original 2D top-down open-world crime game set in the
// fictional port city of Port Azura. The game itself is one self-contained
// HTML file (game/index.html, vanilla JS + Canvas 2D, zero network). This
// entrypoint is the build step the make.fun harness runs: it validates the
// repository, assembles dossier.json from shots.json, copies the three
// screenshots next to it, and writes a manifest.json describing exactly
// what was emitted so a reviewer can verify the output byte for byte.
//
// Run it with:
//   MAKEFUN_OUTPUT_DIR=<dir> node main.ts
//
// Everything here is deterministic: the same repo state always produces
// the same dossier.json and manifest.json.

import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { buildDossier } from "./vendor/makefun-game.ts";

// ---------------------------------------------------------------------------
// Game configuration — the single source of truth for this entry.
// ---------------------------------------------------------------------------

const GAME = {
  title: "Azura Heat",
  city: "Port Azura",
  tagline: "An original 2D top-down open-world crime game in a fictional port city.",
  indexPath: "game/index.html",
  shotsPath: "shots.json",
  // Hard limits from the bounty rules, enforced before anything is written.
  indexMaxBytes: 1024 * 1024, // game/index.html must stay within 1 MiB
  shotMaxBytes: 256 * 1024, // each screenshot must stay within 256 KiB
} as const;

// ---------------------------------------------------------------------------
// Small helpers: structured progress logging + fail-fast validation.
// ---------------------------------------------------------------------------

function log(stage: string, message: string): void {
  console.log(`[azura-heat] ${stage} — ${message}`);
}

function fail(message: string): never {
  throw new Error(`[azura-heat] ${message}`);
}

function sha256Hex(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function requireFile(path: string, what: string): number {
  if (!existsSync(path)) fail(`missing ${what}: ${path}`);
  const size = statSync(path).size;
  if (size === 0) fail(`empty ${what}: ${path}`);
  return size;
}

interface ShotSpec {
  file: string;
  mode: string;
  seed: number;
}

// ---------------------------------------------------------------------------
// Main build.
// ---------------------------------------------------------------------------

function main(): void {
  const repoRoot = dirname(fileURLToPath(import.meta.url));
  const outDir = process.env.MAKEFUN_OUTPUT_DIR;
  if (!outDir) fail("MAKEFUN_OUTPUT_DIR is not set — point it at the output directory");

  log("config", `${GAME.title} — ${GAME.tagline}`);
  log("paths", `repo ${repoRoot} → output ${outDir}`);

  // -- Validate the game file against the size cap before doing any work.
  const indexPath = join(repoRoot, GAME.indexPath);
  const indexSize = requireFile(indexPath, "game index");
  if (indexSize > GAME.indexMaxBytes) {
    fail(`game index is ${indexSize} bytes, over the ${GAME.indexMaxBytes}-byte cap`);
  }
  log("validate", `${GAME.indexPath} present (${indexSize} bytes, within the 1 MiB cap)`);

  // -- Load and sanity-check the screenshot specification.
  const shotsPath = join(repoRoot, GAME.shotsPath);
  requireFile(shotsPath, "shots spec");
  const shots = JSON.parse(readFileSync(shotsPath, "utf8")) as ShotSpec[];
  if (!Array.isArray(shots) || shots.length === 0) fail("shots.json must list at least one screenshot");
  for (const shot of shots) {
    if (typeof shot?.file !== "string" || typeof shot?.mode !== "string" || typeof shot?.seed !== "number") {
      fail(`malformed shot entry in shots.json: ${JSON.stringify(shot)}`);
    }
  }
  log("validate", `shots.json lists ${shots.length} screenshot(s): ${shots.map((s) => s.file).join(", ")}`);

  // -- Check every screenshot exists and respects the per-file cap.
  for (const shot of shots) {
    const size = requireFile(join(repoRoot, shot.file), `screenshot ${shot.file}`);
    if (size > GAME.shotMaxBytes) {
      fail(`screenshot ${shot.file} is ${size} bytes, over the ${GAME.shotMaxBytes}-byte cap`);
    }
  }
  log("validate", "all screenshots present and within the 256 KiB cap");

  // -- Build the dossier with the vendored helper and copy the shots over.
  mkdirSync(outDir, { recursive: true });
  const dossier = buildDossier({ root: repoRoot });
  const dossierJson = `${JSON.stringify(dossier, null, 2)}\n`;
  writeFileSync(join(outDir, "dossier.json"), dossierJson);
  log("emit", `dossier.json written (${Buffer.byteLength(dossierJson)} bytes)`);

  const manifestShots: { file: string; mode: string; seed: number; bytes: number; sha256: string }[] = [];
  for (const shot of shots) {
    const bytes = readFileSync(join(repoRoot, shot.file));
    copyFileSync(join(repoRoot, shot.file), join(outDir, shot.file));
    manifestShots.push({ file: shot.file, mode: shot.mode, seed: shot.seed, bytes: bytes.length, sha256: sha256Hex(bytes) });
    log("emit", `${shot.file} copied (${bytes.length} bytes, mode=${shot.mode}, seed=${shot.seed})`);
  }

  // -- Write the manifest: a deterministic, reviewable record of the build.
  const indexBytes = readFileSync(indexPath);
  const manifest = {
    game: GAME.title,
    city: GAME.city,
    index: { path: GAME.indexPath, bytes: indexBytes.length, sha256: sha256Hex(indexBytes) },
    dossier: { file: "dossier.json", bytes: Buffer.byteLength(dossierJson), sha256: sha256Hex(Buffer.from(dossierJson)) },
    screenshots: manifestShots,
  };
  const manifestJson = `${JSON.stringify(manifest, null, 2)}\n`;
  writeFileSync(join(outDir, "manifest.json"), manifestJson);
  log("emit", `manifest.json written (${Buffer.byteLength(manifestJson)} bytes)`);
  log("done", `${GAME.title} dossier build complete`);
}

main();
