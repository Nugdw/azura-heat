// Azura Heat — static server (round 5). Node, no external dependencies.
// Serves game/index.html at /, /__health and /__version JSON endpoints,
// ETag + 304, HEAD support, nosniff, request logging, path-traversal guard,
// graceful shutdown on SIGINT/SIGTERM. Port: --port or env PORT, default 8077.
import * as fs from "node:fs";
import * as http from "node:http";
import * as path from "node:path";
import * as crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const GAME = "Azura Heat";
const CITY = "Port Azura";
const ROUND = 5;
const FEATURES: string[] = [
  "grid-city", "day-night-cycle", "missions-4", "side-job-paket-pantai",
  "coins-12", "npcs-24", "traffic", "wanted-system", "pause",
  "best-score-localstorage", "radio-3-stops", "minimap",
  "RAIN", "tropical-rain-showers", "slippery-roads-when-wet", "hud-weather-icon",
];

function parsePort(): number {
  const idx = process.argv.indexOf("--port");
  if (idx >= 0 && process.argv[idx + 1]) return parseInt(process.argv[idx + 1], 10) || 8077;
  return parseInt(process.env.PORT || "8077", 10) || 8077;
}
const PORT = parsePort();
const indexPath = path.join(root, "game", "index.html");
const gameRoot = path.resolve(path.join(root, "game"));

function sendJson(res: http.ServerResponse, code: number, obj: unknown): void {
  const body = JSON.stringify(obj);
  res.writeHead(code, { "Content-Type": "application/json; charset=utf-8", "X-Content-Type-Options": "nosniff" });
  res.end(body);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url || "/", "http://localhost");
  console.log(`[azura-heat] ${req.method} ${url.pathname}`);
  const headOnly = req.method === "HEAD";
  if (req.method !== "GET" && !headOnly) { sendJson(res, 405, { error: "method not allowed" }); return; }

  if (url.pathname === "/__health") {
    if (headOnly) { res.writeHead(200, { "Content-Type": "application/json", "X-Content-Type-Options": "nosniff" }); res.end(); return; }
    sendJson(res, 200, { game: GAME, round: ROUND, status: "ok" }); return;
  }
  if (url.pathname === "/__version") {
    if (headOnly) { res.writeHead(200, { "Content-Type": "application/json", "X-Content-Type-Options": "nosniff" }); res.end(); return; }
    sendJson(res, 200, { game: GAME, city: CITY, round: ROUND, features: FEATURES }); return;
  }

  // Static: only / maps to the game; any other path is resolved inside game/
  // and rejected on traversal outside it.
  const rel = url.pathname === "/" ? "index.html" : url.pathname.replace(/^\/+/, "");
  const filePath = path.resolve(path.join(gameRoot, rel));
  if (!filePath.startsWith(gameRoot + path.sep) && filePath !== gameRoot) {
    sendJson(res, 403, { error: "forbidden" }); return;
  }
  const target = url.pathname === "/" ? indexPath : filePath;
  if (!fs.existsSync(target) || !fs.statSync(target).isFile()) { sendJson(res, 404, { error: "not found" }); return; }

  const body = fs.readFileSync(target);
  const etag = '"' + crypto.createHash("sha256").update(body).digest("hex").slice(0, 32) + '"';
  const headers: Record<string, string> = {
    "Content-Type": target.endsWith(".html") ? "text/html; charset=utf-8" : "application/octet-stream",
    "X-Content-Type-Options": "nosniff", "ETag": etag, "Content-Length": String(body.length),
  };
  if (req.headers["if-none-match"] === etag) { res.writeHead(304, headers); res.end(); return; }
  res.writeHead(200, headers);
  if (headOnly) res.end(); else res.end(body);
});

server.listen(PORT, () => console.log(`[azura-heat] ${GAME} round ${ROUND} serving on http://localhost:${PORT}`));

function shutdown(sig: string): void {
  console.log(`[azura-heat] ${sig} received — shutting down gracefully`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 3000).unref();
}
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
