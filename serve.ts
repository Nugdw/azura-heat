// Azura Heat — Round 4 development server.
//
// A tiny static server for game/ (Node 22, standard library only), so the
// game can be played locally without a build step:
//
//   node serve.ts                 serves game/ on http://localhost:8080
//   node serve.ts --port 9000     a different port
//   PORT=9000 node serve.ts       the environment wins over the default,
//                                 but an explicit --port wins over both
//
// Round-4 additions over the round-3 server:
//   - GET /__version answers a JSON identity card for the game — its
//     name, city, round and headline round-4 features — so scripts and
//     reviewers can confirm which build is being served without
//     downloading the whole game page;
//   - the /__health probe and the startup banner now report round 4.
//
// Round-3 additions over the plain static server:
//   - GET /__health answers a one-line JSON liveness probe (handy for
//     scripts that wait for the server before curling the game page);
//   - every request is logged with its status and size, and the startup
//     banner names the game, its round and the exact URLs to open;
//   - responses carry `x-content-type-options: nosniff` and an ETag, and
//     conditional requests (If-None-Match) get a 304 instead of the file;
//   - paths outside game/ are refused, as before — this is a development
//     convenience, not a web server for the internet.
import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('./game', import.meta.url)));
const args = process.argv.slice(2);
const portIndex = args.indexOf('--port');
const fromFlag = portIndex === -1 ? NaN : Number(args[portIndex + 1]);
const fromEnv = Number(process.env.PORT);
const requested = Number.isInteger(fromFlag) ? fromFlag : fromEnv;
const port = Number.isInteger(requested) && requested > 0 && requested < 65536 ? requested : 8080;

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.bin': 'application/octet-stream',
  '.wasm': 'application/wasm',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.txt': 'text/plain; charset=utf-8',
};

function logRequest(method: string, path: string, status: number, bytes: number | string): void {
  console.log(`[azura-heat] ${method} ${path} → ${status} (${bytes})`);
}

const server = createServer((request, response) => {
  const url = new URL(request.url ?? '/', 'http://localhost');
  let pathname: string;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    response.writeHead(400, { 'x-content-type-options': 'nosniff' }).end('bad request');
    logRequest(request.method ?? '?', request.url ?? '?', 400, '-');
    return;
  }
  // liveness probe for scripts: never touches the filesystem
  if (pathname === '/__health') {
    const body = JSON.stringify({ game: 'Azura Heat', round: 4, status: 'ok' }) + '\n';
    response.writeHead(200, {
      'content-type': 'application/json; charset=utf-8',
      'content-length': Buffer.byteLength(body),
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    }).end(body);
    logRequest(request.method ?? '?', pathname, 200, Buffer.byteLength(body));
    return;
  }
  // identity card for scripts and reviewers: which game, which round,
  // and what that round added — again without touching the filesystem
  if (pathname === '/__version') {
    const body = JSON.stringify({
      game: 'Azura Heat',
      city: 'Port Azura',
      round: 4,
      features: ['pause menu', 'persistent best score', 'Paket Pantai side activity', 'procedural radio', 'unseen heat decay'],
    }) + '\n';
    response.writeHead(200, {
      'content-type': 'application/json; charset=utf-8',
      'content-length': Buffer.byteLength(body),
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    }).end(body);
    logRequest(request.method ?? '?', pathname, 200, Buffer.byteLength(body));
    return;
  }
  if (pathname.endsWith('/')) pathname += 'index.html';
  const file = resolve(join(root, normalize(pathname)));
  if (file !== root && !file.startsWith(root + sep)) {
    response.writeHead(403, { 'x-content-type-options': 'nosniff' }).end('forbidden');
    logRequest(request.method ?? '?', pathname, 403, '-');
    return;
  }
  let size: number;
  let mtimeMs: number;
  try {
    const stats = statSync(file);
    if (!stats.isFile()) throw new Error('not a file');
    size = stats.size;
    mtimeMs = Math.floor(stats.mtimeMs);
  } catch {
    response.writeHead(404, { 'x-content-type-options': 'nosniff' }).end('not found');
    logRequest(request.method ?? '?', pathname, 404, '-');
    return;
  }
  const etag = `"${size.toString(16)}-${mtimeMs.toString(16)}"`;
  if (request.headers['if-none-match'] === etag) {
    response.writeHead(304, { etag, 'x-content-type-options': 'nosniff' }).end();
    logRequest(request.method ?? '?', pathname, 304, 0);
    return;
  }
  response.writeHead(200, {
    'content-type': MIME[extname(file).toLowerCase()] ?? 'application/octet-stream',
    'content-length': size,
    'cache-control': 'no-store',
    etag,
    'x-content-type-options': 'nosniff',
  });
  logRequest(request.method ?? '?', pathname, 200, size);
  if (request.method === 'HEAD') { response.end(); return; }
  createReadStream(file).pipe(response);
}).listen(port, '127.0.0.1', () => {
  console.log(`[azura-heat] Azura Heat round 4 — game/ is on http://localhost:${port}`);
  console.log(`[azura-heat] play:  http://localhost:${port}/`);
  console.log(`[azura-heat] shots: http://localhost:${port}/?shot=start&seed=1 · ?shot=play&seed=1 · ?shot=end&seed=1`);
  console.log(`[azura-heat] probe: http://localhost:${port}/__health · http://localhost:${port}/__version`);
});

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    console.log(`[azura-heat] ${signal} — closing the server`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 500).unref();
  });
}
