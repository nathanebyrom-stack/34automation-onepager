// Starlight screen capture: about 25 s, phone (V17) or desktop (V18). Frame-stepped like capture-34.mjs: one still per output frame, then ffmpeg,
// so the scroll is smooth and CSS animations are slowed to match the capture rate (a 4 s sweep lasts 4 s on film).
// Two takes joined with a cut: (a) at the statement band in Night, tap the star, then the enquiry line, the offer, the services map and the lit S·04 card; (b) the report dial, How we work, the form.
// The enquiry form is never touched.
//
// Sandbox:  node scripts/qa/capture-starlight.mjs phone http://localhost:8788 /tmp/out
// Mac:      npm i playwright-core   (uses your installed Chrome)
//           node capture-starlight.mjs phone https://theme-starlight.34automation-onepager.pages.dev ~/34-capture/out
//           node capture-starlight.mjs desk  https://theme-starlight.34automation-onepager.pages.dev ~/34-capture/out
// Options (env): FPS=30  QUICK=1 (short, low-fps test)  CHROME_PATH=/path/to/chrome
import { chromium } from "playwright-core";
import { mkdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { spawnSync } from "node:child_process";

const [vp = "phone", baseArg = "http://localhost:8788", outArg = join(homedir(), "34-capture", "out")] = process.argv.slice(2);
const BASE = baseArg.replace(/\/$/, ""), OUT = outArg.replace(/^~/, homedir()), QUICK = process.env.QUICK === "1", FPS = +(process.env.FPS || (QUICK ? 10 : 30)), K = QUICK ? 0.35 : 1;
const VP = { desk: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1.5 }, phone: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } }[vp];
const CHROME = process.env.CHROME_PATH || (existsSync("/usr/bin/google-chrome") ? "/usr/bin/google-chrome" : undefined);
const browser = await chromium.launch(CHROME ? { executablePath: CHROME, args: ["--no-sandbox"] } : { channel: "chrome" });
const dir = join(OUT, "_frames_" + vp); rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true });
let k = 0; const ease = (t) => 0.5 - Math.cos(Math.PI * t) / 2;

async function open(theme) {
  const ctx = await browser.newContext({ ...VP, colorScheme: "dark", reducedMotion: "no-preference", locale: "en-GB" });
  await ctx.addInitScript((t) => {
    try { if (!sessionStorage.getItem("cap")) { localStorage.setItem("34-theme", t); sessionStorage.setItem("cap", "1"); } } catch (e) {}
    addEventListener("DOMContentLoaded", () => { // a visible pointer: headless stills have no cursor
      const c = document.createElement("div"); c.id = "__cur";
      c.style.cssText = "position:fixed;left:-60px;top:-60px;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:50%;background:rgba(255,255,255,.85);box-shadow:0 0 0 2px rgba(14,15,17,.9),0 2px 10px rgba(0,0,0,.4);z-index:99999;pointer-events:none;transition:transform .12s";
      document.body.appendChild(c);
    });
  }, theme);
  const page = await ctx.newPage();
  // warm the cache with a full pass, so no half-loaded film frame or photo shows in the take
  await page.goto(BASE + "/", { waitUntil: "networkidle" }); await page.evaluate(() => document.fonts.ready);
  const H = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y <= H; y += 700) { await page.evaluate((y) => scrollTo({ top: y, behavior: "instant" }), y); await page.waitForTimeout(40); }
  await page.waitForLoadState("networkidle"); await page.reload({ waitUntil: "networkidle" }); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(800);
  return { ctx, page };
}
const to = (page, y) => page.evaluate((y) => { if (window.__pace) window.__pace.scrollTo(y, { immediate: true, force: true }); else scrollTo({ top: y, behavior: "instant" }); }, y);
const raf2 = (page) => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
const snap = async (page) => { await raf2(page); await page.screenshot({ path: join(dir, "f" + String(k++).padStart(5, "0") + ".jpg"), type: "jpeg", quality: 92 }); };
const hold = async (page, s) => { for (let i = 0; i < Math.round(FPS * s * K); i++) await snap(page); };
const scroll = async (page, a, b, s) => { const n = Math.max(2, Math.round(FPS * s * K)); for (let i = 0; i < n; i++) { await to(page, a + (b - a) * ease(i / (n - 1))); await snap(page); } };
const cur = (page, x, y, on = true) => page.evaluate(([x, y, on]) => { const c = document.getElementById("__cur"); if (c) { c.style.left = x + "px"; c.style.top = y + "px"; c.style.display = on ? "block" : "none"; } }, [x, y, on]);
async function sync(page) { // slow CSS animations and transitions to the capture rate
  const t0 = Date.now(); for (let i = 0; i < 5; i++) await page.screenshot({ path: join(dir, "_probe.jpg"), type: "jpeg", quality: 92 });
  const per = (Date.now() - t0) / 5, rate = Math.min(1, 1000 / FPS / per);
  const cdp = await page.context().newCDPSession(page); await cdp.send("Animation.enable"); await cdp.send("Animation.setPlaybackRate", { playbackRate: rate });
  rmSync(join(dir, "_probe.jpg"), { force: true }); return rate;
}
const top = (page, sel, off = 0) => page.evaluate(([s, off]) => { const e = document.querySelector(s); return Math.max(0, e.getBoundingClientRect().top + scrollY + off); }, [sel, off]);
const HV = VP.viewport.height;

// take (a): Night at the statement band, tap the star, scroll to the lit S·04 card
{
  const { ctx, page } = await open("dark");
  const y0 = await top(page, ".band.state", -90); await to(page, y0); await page.waitForTimeout(1500); await sync(page);
  await hold(page, 0.9);
  const b = await page.locator("#mStar").boundingBox(), dest = { x: b.x + b.width / 2, y: b.y + b.height / 2 }, from = { x: VP.viewport.width * 0.6, y: HV * 0.55 };
  const n = Math.round(FPS * 0.7 * K); for (let i = 1; i <= n; i++) { const t = ease(i / n); await cur(page, from.x + (dest.x - from.x) * t, from.y + (dest.y - from.y) * t); await snap(page); }
  await page.evaluate(() => { document.getElementById("__cur").style.transform = "scale(.7)"; }); await snap(page);
  await page.click("#mStar"); await page.waitForLoadState("networkidle"); await page.evaluate(() => { document.getElementById("__cur").style.transform = ""; });
  await hold(page, 1.5); await cur(page, 0, 0, false);
  const y1 = await top(page, ".band.state", -90), yLine = await top(page, '.sl-ig[data-ig="line"]', -HV * 0.42), yOffer = await top(page, ".cols", -HV * 0.3), ySvc = await top(page, ".svc .grid", vp === "phone" ? 3 * HV * 0.62 : -HV * 0.16);
  const yMap = await top(page, '.sl-ig[data-ig="map"]', -HV * 0.3);
  await scroll(page, y1, yLine, 2.0); await hold(page, 1.8);
  await scroll(page, yLine, yOffer, 2.0); await hold(page, 0.3);
  await scroll(page, yOffer, yMap, 1.8); await hold(page, 2.4);
  await scroll(page, yMap, ySvc, 1.6); await hold(page, 1.2);
  await ctx.close();
}
// take (b): Starlight at the website report: the dial runs, then How we work draws with the scroll, then the form
{
  const { ctx, page } = await open("starlight");
  const yA = await top(page, "#report", -40), yDial = await top(page, '.sl-ig[data-ig="dial"]', -HV * 0.2), yProc = await top(page, ".sl-proc", -HV * 0.05), yForm = await top(page, "#contact", vp === "phone" ? HV * 0.2 : -72);
  await to(page, yA); await page.waitForTimeout(1500); await sync(page);
  await hold(page, 0.4); await scroll(page, yA, yDial, 1.3); await hold(page, 4.6);
  await scroll(page, yDial, yProc, 3.0); await hold(page, 0.8); await scroll(page, yProc, yForm, 1.5); await hold(page, 0.7);
  await ctx.close();
}
await browser.close();
const file = join(OUT, (vp === "phone" ? "V17_starlight_phone" : "V18_starlight_desk") + ".mp4");
const r = spawnSync("ffmpeg", ["-loglevel", "error", "-y", "-framerate", String(FPS), "-i", join(dir, "f%05d.jpg"), "-vf", "pad=ceil(iw/2)*2:ceil(ih/2)*2", "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p", "-movflags", "+faststart", file], { stdio: "inherit" });
if (r.status) throw new Error("ffmpeg failed"); rmSync(dir, { recursive: true, force: true });
console.log("✓", file, `${k} frames, ${(k / FPS).toFixed(1)} s`);
