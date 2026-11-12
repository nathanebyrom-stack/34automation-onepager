// QA only. The render matrix: three modes x 375 and 1440 x motion and reduced motion.
// Checks: no sideways scroll, console and CSP clean, nothing running under reduced motion, the hero stage identical to Night,
// the reader's place held when switching, and axe (all rules, colour contrast included).
// Usage: node scripts/qa/matrix.mjs [http://localhost:8788]
import { chromium } from "playwright-core";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
const BASE = process.argv[2] || "http://localhost:8788";
const AXE = readFileSync(new URL("../../node_modules/axe-core/axe.min.js", import.meta.url), "utf8");
const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome", args: ["--no-sandbox"] });
let fails = 0; const ok = (c, m) => { if (!c) fails++; console.log((c ? "  ok   " : "  FAIL ") + m); };
const SIZES = [[375, 812], [1440, 900]], MODES = ["dark", "light", "starlight"];
const ONLY = (process.env.ONLY || "1,2,3,4").split(",");
const md5 = (buf) => createHash("md5").update(buf).digest("hex");
const go = (p, y) => p.evaluate((y) => { if (window.__pace) window.__pace.scrollTo(y, { immediate: true, force: true }); else scrollTo(0, y); }, y);
async function open(mode, w, h, rm) {
  const c = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, colorScheme: mode === "light" ? "light" : "dark", reducedMotion: rm ? "reduce" : "no-preference" });
  await c.addInitScript((t) => { try { if (!sessionStorage.getItem("qa")) { localStorage.setItem("34-theme", t); sessionStorage.setItem("qa", "1"); } } catch (e) {} addEventListener("securitypolicyviolation", (e) => console.error("CSP " + e.violatedDirective + " " + e.blockedURI)); }, mode);
  const p = await c.newPage(); const log = [];
  p.on("console", (m) => { if (["error", "warning"].includes(m.type())) log.push(m.type() + ": " + m.text()); });
  p.on("pageerror", (e) => log.push("pageerror: " + e.message)); p.on("response", (r) => { if (r.status() >= 400) log.push(r.status() + " " + r.url()); });
  await p.goto(BASE + "/", { waitUntil: "networkidle" }); await p.evaluate(() => document.fonts.ready);
  return { c, p, log };
}
async function sweep(p, h) { const H = await p.evaluate(() => document.documentElement.scrollHeight); for (let y = 0; y < H; y += Math.round(h * 0.8)) { await go(p, y); await p.waitForTimeout(70); } }

console.log("1. Every mode, both sizes, motion and reduced: overflow, console, CSP, axe");
if (ONLY.includes("1")) for (const [w, h] of SIZES) for (const mode of MODES) for (const rm of [false, true]) {
  const { c, p, log } = await open(mode, w, h, rm);
  await sweep(p, h); await p.waitForTimeout(rm ? 300 : 7000); // lets the dial finish its 6.5s run
  const over = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  let line = `${mode.padEnd(9)} ${w} ${rm ? "reduced" : "motion "}: overflow ${over}, console ${log.length}`;
  if (rm) {
    const run = await p.evaluate(() => document.getAnimations().filter((a) => a.playState === "running" && !(a.effect && a.effect.getComputedTiming().duration < 1)).map((a) => (a.animationName || a.transitionProperty || "?") + "@" + ((a.effect.target && a.effect.target.className) || "")));
    line += `, running animations ${run.length}`; ok(run.length === 0, line + " " + JSON.stringify(run.slice(0, 4)));
  } else {
    await p.evaluate(AXE);
    const r = await p.evaluate(async () => { const x = await axe.run(document, { resultTypes: ["violations", "incomplete"] }); return { v: x.violations.map((v) => v.id + " x" + v.nodes.length + " " + v.nodes.slice(0, 2).map((n) => n.target.join(" ")).join(" | ")), cc: (x.incomplete.find((i) => i.id === "color-contrast") || { nodes: [] }).nodes.length }; });
    line += `, axe violations ${r.v.length} (contrast it could not judge: ${r.cc} nodes)`; ok(over <= 0 && log.length === 0 && r.v.length === 0, line + " " + JSON.stringify(r.v) + " " + JSON.stringify(log.slice(0, 3)));
  }
  if (rm) ok(over <= 0 && log.length === 0, `${mode} ${w} reduced: overflow and console ` + JSON.stringify(log.slice(0, 3)));
  await c.close();
}

console.log("2. Reduced motion: the diagrams are finished and still (two stills 2 s apart)");
if (ONLY.includes("2")) for (const [w, h] of SIZES) {
  const { c, p } = await open("starlight", w, h, true);
  for (const sel of ['.sl-ig[data-ig="line"]', '.sl-ig[data-ig="dial"]', ".sl-proc"]) {
    const y = await p.evaluate((s) => document.querySelector(s).getBoundingClientRect().top + scrollY - 100, sel); await go(p, y); await p.waitForTimeout(500);
    const a = md5(await p.screenshot()); await p.waitForTimeout(2000); const z = md5(await p.screenshot());
    const st = await p.evaluate((s) => { const m = document.querySelector(s); return { line: m.querySelectorAll(".sl-line li.on").length, dial: !!m.querySelector(".sl-dial.play"), ring: m.querySelector(".ring") ? getComputedStyle([...m.querySelectorAll(".ring")].pop()).strokeDashoffset : "", proc: m.querySelectorAll("li.on").length, p: getComputedStyle(m).getPropertyValue("--p") || (m.querySelector(".sl-line") ? m.querySelector(".sl-line").style.getPropertyValue("--p") : "") }; }, sel);
    const done = sel.includes("line") ? st.line === 4 : sel.includes("dial") ? st.dial && parseFloat(st.ring) === 0 : st.proc === 3;
    ok(a === z && done, `${w} ${sel}: still ${a === z}, finished ${done} ${JSON.stringify(st)}`);
  }
  await c.close();
}

console.log("3. Hero stage: Starlight against Night, below the header (the 2px progress line excluded: it takes the spectrum by Jenny's ruling)");
if (ONLY.includes("3")) for (const [w, h] of SIZES) {
  const shots = {};
  for (const mode of ["dark", "starlight"]) {
    const { c, p } = await open(mode, w, h, false); await p.waitForTimeout(2500); shots[mode] = [];
    for (const f of [0, 0.2, 0.5, 0.8]) {
      const y = await p.evaluate((f) => Math.round((document.getElementById("hero").offsetHeight - innerHeight) * f), f); await go(p, y); await p.waitForTimeout(1800);
      shots[mode].push(md5(await p.screenshot({ clip: { x: 0, y: 73, width: w, height: h - 73 - 2 } })));
    }
    if (mode === "starlight") { const bar = await p.evaluate(() => getComputedStyle(document.querySelector(".stage .bar i")).backgroundImage); ok(/gradient/.test(bar), `${w}: progress line is the spectrum in Starlight`); }
    await c.close();
  }
  ok(shots.dark.every((x, i) => x === shots.starlight[i]), `${w}: identical at 0, 20, 50, 80% of the film ` + JSON.stringify(shots.dark.map((x, i) => x === shots.starlight[i])));
}

console.log("4. The reader's place is held when switching (first switch loads the layers; later ones are instant)");
if (ONLY.includes("4")) for (const [w, h] of SIZES) {
  const { c, p } = await open("dark", w, h, false); const worst = [];
  const h0 = await p.evaluate(() => document.documentElement.scrollHeight);
  for (const sel of ["#offer", "#services", "#work", "#report .ask", "#contact", ".ft"]) {
    const y = await p.evaluate((s) => document.querySelector(s).getBoundingClientRect().top + scrollY - 200, sel); await go(p, y); await p.waitForTimeout(1500); // reveals settle
    for (const m of ["starlight", "dark", "light", "starlight", "dark"]) {
      const before = await p.evaluate((s) => document.querySelector(s).getBoundingClientRect().top, sel);
      await p.click(`.mode button[data-mode="${m}"]`); await p.waitForLoadState("networkidle"); await p.waitForTimeout(350);
      const after = await p.evaluate((s) => document.querySelector(s).getBoundingClientRect().top, sel);
      worst.push([sel, m, +(after - before).toFixed(1)]);
    }
  }
  const bad = worst.filter((x) => Math.abs(x[2]) > 2);
  const h1 = await p.evaluate(() => document.documentElement.scrollHeight);
  ok(h0 === h1, `${w}: back in Night after Starlight, the page is the same height as before (${h0} / ${h1})`);
  ok(bad.length === 0, `${w}: ${worst.length} switches, largest move ${Math.max(...worst.map((x) => Math.abs(x[2])))}px ` + JSON.stringify(bad));
  await c.close();
}
await b.close(); console.log(fails ? `\n${fails} FAILED` : "\nall passed"); process.exit(fails ? 1 : 0);
