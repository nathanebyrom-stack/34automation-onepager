// QA only. The switch: three modes, both ways, reload, OS never picks Starlight, lazy loading, inner pages, header fit, console and CSP.
// Usage: node scripts/qa/switch.mjs [http://localhost:8788]
import { chromium } from "playwright-core";
const BASE = process.argv[2] || "http://localhost:8788", CHROME = process.env.CHROME_PATH || "/usr/bin/google-chrome";
const b = await chromium.launch({ executablePath: CHROME, args: ["--no-sandbox"] });
let fails = 0; const ok = (c, m) => { if (!c) fails++; console.log((c ? "  ok   " : "  FAIL ") + m); };
const state = (p) => p.evaluate(() => ({ theme: document.documentElement.getAttribute("data-theme"), sl: document.documentElement.classList.contains("starlight"), stored: localStorage.getItem("34-theme"),
  pressed: [...document.querySelectorAll('.mode button[aria-pressed="true"]')].map((x) => x.dataset.mode).join(","), n: document.querySelectorAll(".mode button").length, bg: getComputedStyle(document.body).backgroundColor }));
async function ctx(opt = {}) {
  const c = await b.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: "dark", reducedMotion: "reduce", ...opt });
  const p = await c.newPage(); const log = [], reqs = [];
  p.on("console", (m) => { if (["error", "warning"].includes(m.type())) log.push(m.type() + ": " + m.text()); });
  p.on("pageerror", (e) => log.push("pageerror: " + e.message));
  p.on("request", (r) => reqs.push(r.url()));
  p.on("response", (r) => { if (r.status() >= 400) log.push(r.status() + " " + r.url()); });
  await p.addInitScript(() => addEventListener("securitypolicyviolation", (e) => console.error("CSP " + e.violatedDirective + " " + e.blockedURI)));
  return { c, p, log, reqs };
}
const sl = (reqs) => reqs.filter((u) => /starlight\.(css|js)/.test(u)).length;

console.log("1. Fresh visit, OS dark, then OS light: Starlight is never picked");
for (const os of ["dark", "light"]) {
  const { c, p, reqs, log } = await ctx({ colorScheme: os }); await p.goto(BASE + "/", { waitUntil: "networkidle" });
  let s = await state(p);
  ok(!s.sl && s.stored === null && s.pressed === os && s.n === 3, `OS ${os}: pressed=${s.pressed}, not Starlight, three buttons`);
  await p.emulateMedia({ colorScheme: os === "dark" ? "light" : "dark" }); await p.waitForTimeout(100); s = await state(p);
  ok(!s.sl && s.pressed === (os === "dark" ? "light" : "dark"), `OS flips: follows to ${s.pressed}, still not Starlight`);
  ok(sl(reqs) === 0, "no Starlight files requested"); ok(log.length === 0, "console clean " + JSON.stringify(log)); await c.close();
}
console.log("2. Switching both ways, by click and keyboard, with a reload after each");
{
  const { c, p, reqs, log } = await ctx(); await p.goto(BASE + "/", { waitUntil: "networkidle" });
  const want = { dark: ["dark", false], light: ["light", false], starlight: ["dark", true] };
  for (const [m, how] of [["starlight", "click"], ["light", "click"], ["starlight", "key"], ["dark", "key"], ["light", "click"], ["dark", "click"], ["starlight", "click"]]) {
    const sel = `.mode button[data-mode="${m}"]`;
    if (how === "click") await p.click(sel); else { await p.focus(sel); await p.keyboard.press(m === "dark" ? "Space" : "Enter"); }
    await p.waitForTimeout(80); let s = await state(p);
    ok(s.theme === want[m][0] && s.sl === want[m][1] && s.stored === m && s.pressed === m, `${how} ${m}: data-theme=${s.theme} class=${s.sl} stored=${s.stored} pressed=${s.pressed}`);
    await p.reload({ waitUntil: "domcontentloaded" });
    const early = await p.evaluate(() => ({ theme: document.documentElement.getAttribute("data-theme"), sl: document.documentElement.classList.contains("starlight") }));
    await p.waitForLoadState("networkidle"); s = await state(p);
    ok(early.theme === want[m][0] && early.sl === want[m][1] && s.pressed === m, `reload keeps ${m} (set before the body parsed: ${early.theme}/${early.sl})`);
  }
  await p.emulateMedia({ colorScheme: "light" }); await p.waitForTimeout(100); const s = await state(p);
  ok(s.sl && s.pressed === "starlight", "OS flips to light while Starlight is stored: stays Starlight");
  ok(sl(reqs) >= 2, "Starlight files requested once Starlight was on"); ok(log.length === 0, "console clean " + JSON.stringify(log)); await c.close();
}
console.log("3. Lazy loading per mode (fresh profile each)");
for (const m of ["dark", "light", "starlight"]) {
  const { c, p, reqs, log } = await ctx(); await p.addInitScript((t) => { try { localStorage.setItem("34-theme", t); } catch (e) {} }, m);
  await p.goto(BASE + "/", { waitUntil: "networkidle" }); await p.evaluate(() => scrollTo(0, document.body.scrollHeight)); await p.waitForTimeout(600);
  ok(sl(reqs) === (m === "starlight" ? 2 : 0), `${m}: ${sl(reqs)} Starlight request(s)`); ok(log.length === 0, "console clean " + JSON.stringify(log)); await c.close();
}
console.log("4. Inner pages with Starlight stored");
for (const path of ["/clients/", "/privacy/", "/no-such-page"]) {
  const { c, p, reqs, log } = await ctx(); await p.addInitScript(() => { try { if (!sessionStorage.getItem("seeded")) { localStorage.setItem("34-theme", "starlight"); sessionStorage.setItem("seeded", "1"); } } catch (e) {} });
  await p.goto(BASE + path, { waitUntil: "networkidle" }); let s = await state(p);
  ok(s.theme === "dark" && !s.sl && s.pressed === "dark" && s.n === 2 && s.bg === "rgb(14, 15, 17)", `${path}: Night, two buttons, Night pressed`);
  await p.click('.mode button[data-mode="dark"]'); s = await state(p); ok(s.stored === "starlight", "pressing Night keeps the Starlight choice");
  await p.click('.mode button[data-mode="light"]'); s = await state(p); ok(s.stored === "light" && s.theme === "light", "pressing Day stores Day");
  ok(sl(reqs) === 0, "no Starlight files requested");
  const real = log.filter((l) => !(path === "/no-such-page" && /^404 .*no-such-page$/.test(l)) && !/Failed to load resource.*404/.test(l) || path !== "/no-such-page");
  ok(real.length === 0, "console clean " + JSON.stringify(real)); await c.close();
}
console.log("5. Header fit, 320 to 1920, each mode pressed");
{
  const widths = [320, 330, 331, 350, 351, 360, 375, 390, 414, 430, 431, 470, 471, 600, 820, 821, 1000, 1001, 1100, 1101, 1239, 1240, 1440, 1920]; const bad = [];
  for (const m of ["dark", "light", "starlight"]) for (const w of widths) {
    const { c, p } = await ctx({ viewport: { width: w, height: 800 } }); await p.addInitScript((t) => { try { localStorage.setItem("34-theme", t); } catch (e) {} }, m);
    await p.goto(BASE + "/", { waitUntil: "load" }); await p.evaluate(() => document.fonts.ready);
    const r = await p.evaluate(() => { const q = (s) => document.querySelector(s), wrap = q(".hdr .wrap"), cs = getComputedStyle(wrap), nav = q(".hdr .nav").getBoundingClientRect(), logo = q(".hdr .logo").getBoundingClientRect();
      const right = wrap.getBoundingClientRect().right - parseFloat(cs.paddingRight); const hs = [...document.querySelectorAll(".hdr .nav a")].filter((a) => a.offsetHeight).map((a) => a.offsetHeight);
      const bt = [...document.querySelectorAll(".mode button")].map((x) => x.getBoundingClientRect()); return { over: nav.right - right, gap: nav.left - logo.right, doc: document.documentElement.scrollWidth, wrapd: hs.some((h) => h > 46), minBtn: Math.min(...bt.map((x) => Math.min(x.width, x.height))) }; });
    if (r.over > 0.5 || r.doc > w || r.wrapd || r.gap < 4 || r.minBtn < 24) bad.push([m, w, r]);
    await c.close();
  }
  ok(bad.length === 0, `${widths.length} widths x 3 modes: one row, no overflow, buttons at least 24px ` + JSON.stringify(bad));
}
await b.close(); console.log(fails ? `\n${fails} FAILED` : "\nall passed"); process.exit(fails ? 1 : 0);
