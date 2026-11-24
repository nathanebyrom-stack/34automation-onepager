// Harness for a drawing-to-3D showcase piece. Renders <piece>/index.html headless, steps every stage through window.__showcase,
// writes PNGs to <piece>/shots/ and a report.json, and prints a short summary. Exit code 1 if any hard check fails.
//
//   node shoot.mjs <piece-folder> [desktop|phone|fallback|reduced]
//
// Needs Playwright with Chromium (already present in Claude cloud sessions; elsewhere: npm i playwright && npx playwright install chromium).
// Three.js r128 is fetched once with `npm pack three@0.128.0` into .cache/ beside this file and served in place of the cdnjs URL,
// so the piece runs with no network. Google Fonts is passed through when reachable and stubbed when not.
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const [pieceArg, only] = process.argv.slice(2);
if (!pieceArg) { console.error("usage: node shoot.mjs <piece-folder> [desktop|phone|fallback|reduced]"); process.exit(2); }
const piece = resolve(pieceArg), file = join(piece, "index.html"), shots = join(piece, "shots");
if (!existsSync(file)) { console.error("no index.html in " + piece); process.exit(2); }
mkdirSync(shots, { recursive: true });

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require("playwright")); } catch { try { ({ chromium } = require("playwright-core")); } catch { console.error("Playwright not found: npm i playwright && npx playwright install chromium"); process.exit(2); } }

// ---- Three.js r128, local
const THREE_URL = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
const cache = join(here, ".cache"), threeFile = join(cache, "three-r128.min.js");
if (!existsSync(threeFile)) {
  mkdirSync(cache, { recursive: true });
  execFileSync("npm", ["pack", "three@0.128.0", "--silent"], { cwd: cache, stdio: ["ignore", "pipe", "inherit"] });
  execFileSync("tar", ["-xzf", "three-0.128.0.tgz", "package/build/three.min.js"], { cwd: cache });
  writeFileSync(threeFile, readFileSync(join(cache, "package/build/three.min.js")));
  rmSync(join(cache, "package"), { recursive: true, force: true }); rmSync(join(cache, "three-0.128.0.tgz"), { force: true });
}

// ---- static checks on the source
const src = readFileSync(file, "utf8"), fails = [], warns = [];
const bytes = Buffer.byteLength(src);
if (bytes > 250 * 1024) fails.push(`file is ${(bytes / 1024).toFixed(0)} KB (ceiling 250 KB)`); else if (bytes > 150 * 1024) warns.push(`file is ${(bytes / 1024).toFixed(0)} KB (target under 150 KB)`);
if (/<!doctype|<html[\s>]|<head[\s>]|<body[\s>]/i.test(src)) fails.push("file must be a fragment: no <!DOCTYPE>, <html>, <head> or <body>");
if (!/^\s*<title>[^<]{3,60}<\/title>/i.test(src)) fails.push("file must start with a short <title>");
const scripts = [...src.matchAll(/<script[^>]*\ssrc=["']([^"']+)["']/gi)].map((m) => m[1]);
for (const s of scripts) if (s !== THREE_URL) fails.push("external script not allowed: " + s);
const stripped = src.replace(/<meta name="claude:viewport-fit-sides"[^>]*>/i, "");
for (const [re, what] of [[/\bclaude\b/i, "the word Claude"], [/\bA\.?I\.?\b/, "the word AI"], [/\bagents?\b/i, "the word agent"], [/\bFrank\b/, "the name Frank"], [/—/, "an em dash"], [/GridHelper/, "GridHelper"]]) if (re.test(stripped)) fails.push("source contains " + what);
if (!/Demo · 34 concept part/i.test(src)) fails.push('the tag "Demo · 34 concept part" is missing');
if (!/NOT FOR MANUFACTURE/i.test(src)) fails.push('the sheet note "NOT FOR MANUFACTURE" is missing');
if (!/34A-\d{4}/.test(src)) fails.push("no drawing number in the form 34A-NNNN");
if (!/aria-pressed/.test(src)) warns.push("no aria-pressed toggle found (dimensions, section cut or similar)");
if (/\.style\.display\s*=/.test(src)) warns.push("uses style.display; the contract asks for el.hidden");

// ---- run
const doc = '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">' + src;
const MODES = {
  desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
  phone: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  fallback: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, noGL: true },
  reduced: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, reducedMotion: "reduce" },
};
const browser = await chromium.launch({ args: ["--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--use-gl=angle", "--use-angle=swiftshader"] });
const report = { piece, bytes, when: new Date().toISOString(), static: { fails: [...fails], warns: [...warns] }, modes: {} };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

for (const [name, m] of Object.entries(MODES)) {
  if (only && only !== name) continue;
  const r = (report.modes[name] = { errors: [], blocked: [], shots: [] });
  const { noGL, ...ctxOpts } = m;
  const ctx = await browser.newContext(ctxOpts), page = await ctx.newPage();
  if (noGL) await page.addInitScript(() => { window.__forceNoWebGL = true; });
  page.on("console", (c) => { if (c.type() === "error") r.errors.push(c.text().slice(0, 300)); });
  page.on("pageerror", (e) => r.errors.push("exception: " + String(e).slice(0, 300)));
  await page.route("**/*", async (route) => {
    const u = route.request().url();
    if (u === "http://showcase.local/") return route.fulfill({ contentType: "text/html; charset=utf-8", body: doc });
    if (u === THREE_URL) return route.fulfill({ contentType: "text/javascript", body: readFileSync(threeFile) });
    if (/^https:\/\/fonts\.(googleapis|gstatic)\.com\//.test(u)) { try { return await route.fulfill({ response: await route.fetch({ timeout: 6000 }) }); } catch { return route.fulfill({ contentType: /gstatic/.test(u) ? "font/woff2" : "text/css", body: "" }); } }
    if (/^(data|blob):/.test(u)) return route.continue();
    r.blocked.push(u.slice(0, 200)); return route.abort();
  });
  await page.goto("http://showcase.local/");
  const shot = async (tag, opts = {}) => { const f = `${name}-${tag}.png`; await page.screenshot({ path: join(shots, f), ...opts }); r.shots.push(f); };
  try { await page.waitForFunction(() => window.__showcase && window.__showcase.ready === true, null, { timeout: 20000 }); }
  catch { r.errors.push("window.__showcase.ready never became true (20 s)"); await shot("not-ready"); await ctx.close(); continue; }
  const hook = await page.evaluate(() => { const s = window.__showcase; return { mode: s.mode, stages: s.stages, fns: ["go", "setDims", "setAngle"].filter((k) => typeof s[k] === "function") }; });
  Object.assign(r, hook);
  if (hook.fns.length < 3) r.errors.push("__showcase is missing go, setDims or setAngle");
  if (!Array.isArray(hook.stages) || hook.stages.length < 3 || hook.stages.length > 4) r.errors.push("__showcase.stages should list three or four stages");
  if (noGL && hook.mode !== "fallback") r.errors.push("with __forceNoWebGL the mode must be 'fallback'");
  if (!noGL && hook.mode !== "webgl") r.errors.push("mode is '" + hook.mode + "' where WebGL was available");
  const n = (hook.stages || []).length;
  if (noGL) { await sleep(400); await shot("page", { fullPage: true }); }
  else {
    for (let i = 0; i < n; i++) { await page.evaluate((i) => window.__showcase.go(i, true), i); await sleep(700); await shot("s" + i); }
    await page.evaluate(() => window.__showcase.setDims(true)); await sleep(700); await shot("dims");
    await page.evaluate(() => window.__showcase.setAngle(150)); await sleep(500); await shot("dims-turned");
    await page.evaluate(() => { window.__showcase.setDims(false); }); await sleep(400); await shot("turned");
    for (const a of [-150, 90, -90]) { await page.evaluate((a) => window.__showcase.setAngle(a), a); await sleep(350); await shot("turned" + a); }
    if (name !== "reduced") { await page.evaluate(() => { window.__showcase.setAngle(0); window.__showcase.go(0, true); }); await sleep(300); await page.evaluate(() => window.__showcase.go(1, false)); await sleep(650); await shot("midtransition"); }
    await page.evaluate((i) => { window.__showcase.setAngle(0); window.__showcase.go(i, true); }, n - 1); await sleep(600);
    if (name === "phone") await shot("fullpage", { fullPage: true });
  }
  // measured on the page as it stands (last stage, or the fallback)
  r.layout = await page.evaluate((isPhone) => {
    const vis = (e) => { const s = getComputedStyle(e), b = e.getBoundingClientRect(); return s.display !== "none" && s.visibility !== "hidden" && +s.opacity > 0.05 && b.width > 0 && b.height > 0 && !e.closest("[hidden]"); };
    const out = { overflowX: document.documentElement.scrollWidth - innerWidth, smallText: [], shortControls: [], tagVisible: false, canvases: document.querySelectorAll("canvas").length };
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const seen = new Set();
    while (walker.nextNode()) { const t = walker.currentNode, e = t.parentElement; if (!e || !t.nodeValue.trim() || e.closest("svg,script,style") || !vis(e)) continue;
      if (/demo\s*·\s*34 concept part/i.test(e.textContent)) out.tagVisible = true;
      const px = parseFloat(getComputedStyle(e).fontSize); if (px < 11) { const k = (e.className || e.tagName) + ":" + px; if (!seen.has(k)) { seen.add(k); out.smallText.push({ el: e.tagName.toLowerCase() + (e.className ? "." + String(e.className).split(" ")[0] : ""), px, text: t.nodeValue.trim().slice(0, 24) }); } } }
    if (isPhone) document.querySelectorAll('button,[role="tab"],input[type="range"],a[href],select').forEach((e) => { if (!vis(e)) return; const h = e.getBoundingClientRect().height; if (h < 44) out.shortControls.push({ el: e.tagName.toLowerCase() + (e.id ? "#" + e.id : e.className ? "." + String(e.className).split(" ")[0] : ""), h: Math.round(h) }); });
    return out;
  }, name === "phone");
  if (r.layout.overflowX > 1) r.errors.push(`page scrolls sideways by ${r.layout.overflowX}px`);
  if (!r.layout.tagVisible) r.errors.push('the tag "Demo · 34 concept part" is not visible');
  if (name === "phone" && r.layout.smallText.length) r.errors.push("text under 11 px on phone: " + r.layout.smallText.map((s) => `${s.el} ${s.px}px`).join(", "));
  if (name === "phone" && r.layout.shortControls.length) r.errors.push("controls under 44 px tall on phone: " + r.layout.shortControls.map((s) => `${s.el} ${s.h}px`).join(", "));
  if (r.blocked.length) r.errors.push("requests to hosts the contract does not allow: " + [...new Set(r.blocked)].join(", "));
  await ctx.close();
}
await browser.close();
writeFileSync(join(piece, "report.json"), JSON.stringify(report, null, 1));

let bad = fails.length;
console.log(`${piece}\n${(bytes / 1024).toFixed(1)} KB`);
for (const f of fails) console.log("  FAIL  source: " + f);
for (const w of warns) console.log("  warn  source: " + w);
for (const [name, r] of Object.entries(report.modes)) {
  bad += r.errors.length;
  console.log(`${name.padEnd(8)} mode=${r.mode || "?"} stages=${(r.stages || []).join(" / ")} shots=${r.shots.length} ${r.errors.length ? "" : "clean"}`);
  for (const e of [...new Set(r.errors)]) console.log("  FAIL  " + e);
}
console.log(bad ? `${bad} problem(s). Shots in ${shots}` : `No problems found by the harness. Now LOOK at the shots in ${shots}: the harness cannot see wrong balloons, cropping or ugly lighting.`);
process.exit(bad ? 1 : 0);
