// Build: copy public/ to dist/ and fill the {{PLACEHOLDERS}} from site.config.json.
// Production (Cloudflare branch "main", or STRICT=1) refuses to build while the company details are missing.
import { readFileSync, writeFileSync, rmSync, cpSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const c = JSON.parse(readFileSync("site.config.json", "utf8"));
const prod = process.env.CF_PAGES_BRANCH === "main" || process.env.STRICT === "1";
const missing = ["legalName", "address"].filter((k) => !String(c[k] || "").trim());
if (missing.length && prod) {
  console.error(`\n✖ site.config.json is missing: ${missing.join(", ")}. Production build stopped.\n`);
  process.exit(1);
}
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const name = c.legalName || "⚠ COMPANY NAME MISSING";
const addr = c.address || "⚠ ADDRESS MISSING";
let legal = c.companyNumber
  ? `${name} is registered in ${c.registeredIn || "England and Wales"}, company number ${c.companyNumber}. Registered office: ${addr}.`
  : `${name}, ${addr}.`;
if (c.vatNumber) legal += ` VAT number ${c.vatNumber}.`;

const vals = {
  SITE_URL: c.siteUrl.replace(/\/$/, ""),
  PUBLIC_EMAIL: c.publicEmail,
  CLIENTS_URL: c.clientsUrl,
  LEGAL_NAME: name,
  ADDRESS: addr,
  LEGAL_LINE: legal,
  ICO_LINE: c.icoRegistration ? ` ICO registration number: ${c.icoRegistration}.` : "",
  YEAR: String(new Date().getFullYear()),
  BUILD: Date.now().toString(36), // cache-buster on css/js links: a new value every build, so a deploy never pairs new HTML with an hour-old stylesheet
  UPDATED: c.privacyUpdated,
};

rmSync("dist", { recursive: true, force: true });
cpSync("public", "dist", { recursive: true });
const TEXT = new Set([".html", ".xml", ".txt", ".webmanifest", ".json"]);
let left = [];
(function walk(dir) {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) { walk(p); continue; }
    if (!TEXT.has(extname(n)) && n !== "_headers" && n !== "_redirects") continue;
    let s = readFileSync(p, "utf8");
    s = s.replace(/\{\{([A-Z_]+)\}\}/g, (m, k) => (k in vals ? esc(vals[k]) : m));
    const rest = s.match(/\{\{[A-Z_]+\}\}/g);
    if (rest) left.push(`${p}: ${[...new Set(rest)].join(" ")}`);
    writeFileSync(p, s);
  }
})("dist");
if (left.length) { console.error("✖ Unfilled placeholders:\n" + left.join("\n")); process.exit(1); }
console.log(`✓ Built dist/ (${prod ? "production" : "preview"})${missing.length ? " — company details still missing" : ""}`);
