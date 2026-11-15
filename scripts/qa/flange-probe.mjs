// One-off probe: open the site in headless Chrome, scroll to the drawing sheet the way a visitor would, and record how the 3D flange moves.
// Usage: node flange-probe.mjs <url> <width> <height> [reduce]
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const [url, W = "1512", H = "900", reduce = ""] = process.argv.slice(2);
const PORT = 9377 + Math.floor(Math.random() * 200);
const dir = mkdtempSync(join(tmpdir(), "flange-probe-"));
const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", [
  "--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${dir}`, `--window-size=${W},${H}`,
  "--no-first-run", "--no-default-browser-check", "--hide-scrollbars", "--mute-audio", "about:blank",
], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function done(code) { try { chrome.kill(); } catch {} await sleep(300); try { rmSync(dir, { recursive: true, force: true }); } catch {} process.exit(code); }

try {
  let list;
  for (let i = 0; i < 50; i++) { try { list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); if (list.length) break; } catch {} await sleep(200); }
  const page = list.find((t) => t.type === "page");
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let id = 0; const wait = new Map();
  ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && wait.has(d.id)) { wait.get(d.id)(d); wait.delete(d.id); } };
  const send = (method, params = {}) => new Promise((r) => { const n = ++id; wait.set(n, r); ws.send(JSON.stringify({ id: n, method, params })); });
  await send("Emulation.setDeviceMetricsOverride", { width: +W, height: +H, deviceScaleFactor: 1, mobile: false });
  if (reduce) await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  await send("Page.enable");
  await send("Page.navigate", { url });
  await sleep(2500);
  const probe = `(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const out = { w: innerWidth, h: innerHeight, reduce: matchMedia('(prefers-reduced-motion: reduce)').matches, lenis: !!window.__pace };
    const sheet = document.getElementById('sheet');
    const samp = () => { const e = document.querySelector('#dwg .g3d ellipse'); return e ? e.getAttribute('rx') + ' ' + (e.getAttribute('transform') || '').replace(/ .*/, ')') : null; };
    // a visitor's scroll: 90px every 16ms (about 5600px a second), until the flange's handle is on screen
    const t0 = performance.now(); let seenAt = null, loadedAt = null, firstMoveAt = null, base = null;
    const flangeBox = () => { const g = document.getElementById('grab'); if (!g) return null; const r = g.getBoundingClientRect(); return { top: Math.round(r.top), w: Math.round(r.width), hidden: g.hidden, visibility: getComputedStyle(g).visibility, focusable: (g.focus(), document.activeElement === g) }; };
    const fl3 = () => { const e = document.querySelector('#dwg .g3d'); if (!e) return null; const r = e.getBoundingClientRect(); return { left: Math.round(r.left), right: Math.round(r.right), top: Math.round(r.top), bottom: Math.round(r.bottom) }; };
    for (let i = 0; i < 4000; i++) {
      if (loadedAt === null && document.getElementById('dwg')) loadedAt = Math.round(performance.now() - t0);
      const f = fl3();
      if (f && f.top < innerHeight - 40 && f.bottom > 0) { seenAt = Math.round(performance.now() - t0); break; }
      if (sheet.getBoundingClientRect().top < -200) break;
      window.scrollBy(0, 90); await sleep(16);
    }
    out.loadedAtMs = loadedAt; out.flangeOnScreenAtMs = seenAt; out.scrollY = Math.round(scrollY);
    out.grab = flangeBox(); out.flange3d = fl3(); out.d3 = document.getElementById('dwg') ? document.getElementById('dwg').classList.contains('d3') : null;
    base = samp(); out.poseWhenFirstSeen = base; out.series = [];
    const s0 = performance.now();
    for (let i = 0; i < 16; i++) { await sleep(250); const s = samp(); const ms = Math.round(performance.now() - s0); if (firstMoveAt === null && s !== base) firstMoveAt = ms; out.series.push(ms + 'ms ' + s); }
    out.firstChangeAfterSeenMs = firstMoveAt;
    return JSON.stringify(out);
  })()`;
  const res = await send("Runtime.evaluate", { expression: probe, awaitPromise: true, returnByValue: true });
  console.log(res.result?.result?.value || JSON.stringify(res));
  await done(0);
} catch (e) { console.error("probe failed:", e && e.message); await done(1); }
