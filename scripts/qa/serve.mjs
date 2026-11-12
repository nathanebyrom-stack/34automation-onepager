// QA only (not shipped: the build copies public/). Serves a built folder the way Cloudflare Pages would, as far as the tests need:
// the "/*" block of _headers (so the real CSP is in force), gzip on text, 404.html for unknown paths, and a stub for /api/config.
// Usage: node scripts/qa/serve.mjs dist 8788
import http from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import { join, extname, resolve } from "node:path";
import { gzipSync } from "node:zlib";

const root = resolve(process.argv[2] || "dist"), port = +process.argv[3] || 8788;
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".svg": "image/svg+xml", ".webp": "image/webp", ".woff2": "font/woff2", ".json": "application/json", ".png": "image/png", ".ico": "image/x-icon", ".jpg": "image/jpeg", ".webmanifest": "application/manifest+json", ".xml": "application/xml", ".txt": "text/plain; charset=utf-8" };
const TEXT = new Set([".html", ".css", ".js", ".svg", ".json", ".xml", ".txt", ".webmanifest"]);
const base = {};
if (existsSync(join(root, "_headers"))) {
  let on = false;
  for (const line of readFileSync(join(root, "_headers"), "utf8").split("\n")) {
    if (/^\S/.test(line)) { on = line.trim() === "/*"; continue; }
    const m = on && line.match(/^\s+([^:]+):\s*(.+)$/);
    if (m && m[1] !== "Strict-Transport-Security") base[m[1]] = m[2].trim();
  }
}
const cache = new Map();
http.createServer((req, res) => {
  const path = decodeURIComponent(req.url.split("?")[0]);
  if (path === "/api/config") { res.writeHead(200, { "Content-Type": "application/json" }); res.end('{"turnstileSiteKey":""}'); return; }
  let f = join(root, path), code = 200;
  if (!f.startsWith(root)) { res.writeHead(403); res.end(); return; }
  if (existsSync(f) && statSync(f).isDirectory()) f = join(f, "index.html");
  if (!existsSync(f)) { f = join(root, "404.html"); code = 404; }
  const ext = extname(f), gz = TEXT.has(ext) && /\bgzip\b/.test(req.headers["accept-encoding"] || "");
  const key = f + (gz ? "|gz" : "");
  if (!cache.has(key)) { const b = readFileSync(f); cache.set(key, gz ? gzipSync(b, { level: 9 }) : b); }
  const body = cache.get(key);
  res.writeHead(code, { ...base, "Content-Type": TYPES[ext] || "application/octet-stream", "Content-Length": body.length, ...(gz ? { "Content-Encoding": "gzip" } : {}), "Cache-Control": /\.(webp|woff2|png|jpg)$/.test(f) ? "public, max-age=2592000" : "public, max-age=3600" });
  res.end(body);
}).listen(port, () => console.log("serving", root, "on", port));
