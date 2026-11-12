// QA only. Lighthouse (mobile) for one theme, N runs, median. Each run uses a fresh Chrome profile (cold cache) with the theme pre-set in localStorage.
// Usage: node scripts/qa/lh.mjs http://localhost:8788 dark|light|starlight [runs=5] [out.json]
import puppeteer from "puppeteer-core";
import lighthouse from "lighthouse";
import { writeFileSync } from "node:fs";

const [base = "http://localhost:8788", theme = "dark", runsArg = "5", out] = process.argv.slice(2);
const runs = +runsArg, CHROME = process.env.CHROME_PATH || "/usr/bin/google-chrome";
const med = (a) => { const s = a.slice().sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
const rows = [];
for (let i = 0; i < runs; i++) {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox", "--disable-gpu"] });
  const page = await browser.newPage();
  await page.goto(base + "/robots.txt");
  await page.evaluate((t) => localStorage.setItem("34-theme", t), theme);
  await page.close();
  const r = await lighthouse(base + "/", { port: +new URL(browser.wsEndpoint()).port, disableStorageReset: true, logLevel: "error", output: "json" });
  const l = r.lhr, a = l.audits;
  rows.push({ perf: l.categories.performance.score * 100, a11y: l.categories.accessibility.score * 100, bp: l.categories["best-practices"].score * 100, seo: l.categories.seo.score * 100,
    fcp: a["first-contentful-paint"].numericValue, lcp: a["largest-contentful-paint"].numericValue, tbt: a["total-blocking-time"].numericValue, cls: a["cumulative-layout-shift"].numericValue, si: a["speed-index"].numericValue,
    bytes: a["total-byte-weight"].numericValue, requests: a["network-requests"].details.items.length,
    failed: Object.values(a).filter((x) => x.score !== null && x.score < 1 && ["binary"].includes(x.scoreDisplayMode)).map((x) => x.id) });
  await browser.close();
}
const keys = ["perf", "a11y", "bp", "seo", "fcp", "lcp", "tbt", "cls", "si", "bytes", "requests"];
const m = Object.fromEntries(keys.map((k) => [k, +med(rows.map((r) => r[k])).toFixed(k === "cls" ? 4 : 0)]));
m.failedAudits = [...new Set(rows.flatMap((r) => r.failed))];
console.log(theme.padEnd(9), JSON.stringify(m));
if (out) writeFileSync(out, JSON.stringify({ base, theme, runs, median: m, rows }, null, 1));
