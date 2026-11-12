// QA only. Night and Day must look the same as on main: stills of two builds side by side, compared pixel for pixel below the header
// (the header itself changes by design: a third button). Reduced motion, so every still is deterministic.
// Usage: node scripts/qa/regress.mjs <base-main> <base-branch>
import { chromium } from "playwright-core";
import { createHash } from "node:crypto";
const [A, B] = process.argv.slice(2), md5 = (x) => createHash("md5").update(x).digest("hex");
const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome", args: ["--no-sandbox"] });
let fails = 0;
async function stills(base, mode, w, h, path) {
  const c = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, colorScheme: mode === "light" ? "light" : "dark", reducedMotion: "reduce" });
  await c.addInitScript((t) => { try { localStorage.setItem("34-theme", t); } catch (e) {} }, mode);
  const p = await c.newPage(); await p.goto(base + path, { waitUntil: "networkidle" }); await p.evaluate(() => document.fonts.ready);
  await p.evaluate(() => document.querySelectorAll("img[loading=lazy]").forEach((i) => (i.loading = "eager"))); await p.waitForLoadState("networkidle"); await p.waitForTimeout(500);
  const H = await p.evaluate(() => document.documentElement.scrollHeight), out = [];
  for (let y = 0; y < H; y += h - 80) { await p.evaluate((y) => scrollTo(0, y), y); await p.waitForTimeout(250); out.push(md5(await p.screenshot({ clip: { x: 0, y: 76, width: w, height: h - 76 } }))); }
  await c.close(); return { H, out };
}
for (const path of ["/", "/clients/", "/privacy/"]) for (const mode of ["dark", "light"]) for (const [w, h] of [[375, 812], [1440, 900]]) {
  const x = await stills(A, mode, w, h, path), y = await stills(B, mode, w, h, path);
  const same = x.H === y.H && x.out.length === y.out.length && x.out.every((v, i) => v === y.out[i]);
  if (!same) fails++;
  console.log((same ? "  ok   " : "  FAIL ") + `${path} ${mode === "dark" ? "Night" : "Day"} ${w}: ${x.out.length} stills, page height ${x.H} / ${y.H}` + (same ? "" : " differ at " + x.out.map((v, i) => (v === y.out[i] ? null : i)).filter((v) => v !== null).join(",")));
}
await b.close(); console.log(fails ? `\n${fails} FAILED` : "\nNight and Day are pixel-identical to main below the header"); process.exit(fails ? 1 : 0);
