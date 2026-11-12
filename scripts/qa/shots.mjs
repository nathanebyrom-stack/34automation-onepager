// QA only. Stills of one mode at one size, at named positions down the home page.
// Usage: node scripts/qa/shots.mjs <base> <dark|light|starlight> <width> <height> <outdir> [reduce] [positions,comma,separated]
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";
const [base, mode, w, h, out, rm, only] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome", args: ["--no-sandbox"] });
const c = await b.newContext({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1, colorScheme: mode === "light" ? "light" : "dark", reducedMotion: rm === "reduce" ? "reduce" : "no-preference" });
await c.addInitScript((t) => { try { localStorage.setItem("34-theme", t); } catch (e) {} }, mode);
const p = await c.newPage(); const log = [];
p.on("console", (m) => { if (["error", "warning"].includes(m.type())) log.push(m.text()); }); p.on("pageerror", (e) => log.push("pageerror " + e.message));
await p.goto(base + "/", { waitUntil: "networkidle" }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(600);
const POS = { top: "#hero", state: ".band.state", line: '.sl-ig[data-ig="line"]', offer: "#offer", cols: ".cols", services: "#services", grid: ".svc .grid", work: "#work", rows: ".rows", reviews: "#reviews", report: "#report", dial: '.sl-ig[data-ig="dial"]', process: ".sl-proc", contact: "#contact", form: "#enq", footer: ".ft" };
for (const [name, sel] of Object.entries(POS)) {
  if (only && !only.split(",").includes(name)) continue;
  const y = await p.evaluate((s) => { const e = document.querySelector(s); if (!e || !e.getClientRects().length) return null; return Math.max(0, e.getBoundingClientRect().top + scrollY - 90); }, sel);
  if (y === null) continue;
  // approach from above in steps so scroll-linked pieces run as they would for a reader
  const y0 = Math.max(0, y - +h); await p.evaluate((y) => { if (window.__pace) window.__pace.scrollTo(y, { immediate: true, force: true }); else scrollTo(0, y); }, y0); await p.waitForTimeout(250);
  for (let i = 1; i <= 6; i++) { await p.evaluate((y) => { if (window.__pace) window.__pace.scrollTo(y, { immediate: true, force: true }); else scrollTo(0, y); }, y0 + ((y - y0) * i) / 6); await p.waitForTimeout(120); }
  await p.waitForTimeout(name === "dial" ? 7200 : 1500);
  await p.screenshot({ path: `${out}/${mode}_${w}_${rm === "reduce" ? "still_" : ""}${name}.png` });
}
const ov = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
console.log(mode, w, rm || "motion", "overflow", ov, "console", JSON.stringify(log));
await b.close();
