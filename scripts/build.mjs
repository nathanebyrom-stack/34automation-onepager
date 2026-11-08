// Build: copy public/ to dist/ and fill the {{PLACEHOLDERS}} from site.config.json.
// Production (Cloudflare branch "main", or STRICT=1) refuses to build while the company details are missing.
//
// STATIC=1 builds the GitHub Pages stopgap preview instead: no Cloudflare functions there, so the enquiry
// form becomes an email button, every page is noindex, and the missing-details warning is left out.
// BASE_PATH=/repo-name prefixes root-relative URLs for a site served from a sub-path.
import { readFileSync, writeFileSync, rmSync, cpSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const c = JSON.parse(readFileSync("site.config.json", "utf8"));
const isStatic = process.env.STATIC === "1";
const base = (process.env.BASE_PATH || "").replace(/\/$/, "");
const prod = !isStatic && (process.env.CF_PAGES_BRANCH === "main" || process.env.STRICT === "1");
const missing = ["legalName", "address"].filter((k) => !String(c[k] || "").trim());
if (missing.length && prod) {
  console.error(`\n✖ site.config.json is missing: ${missing.join(", ")}. Production build stopped.\n`);
  process.exit(1);
}
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const name = c.legalName || (isStatic ? "34 Automation" : "⚠ COMPANY NAME MISSING");
const addr = c.address || (isStatic ? "" : "⚠ ADDRESS MISSING");
let legal = c.companyNumber
  ? `${name} is registered in ${c.registeredIn || "England and Wales"}, company number ${c.companyNumber}. Registered office: ${addr}.`
  : addr ? `${name}, ${addr}.` : `${name}.`;
if (c.vatNumber) legal += ` VAT number ${c.vatNumber}.`;

// the static preview has nowhere to post the form, so it offers an email instead
const STATIC_FORM = `<div class="rv" style="--i:3"><a class="btn solid" href="mailto:{{PUBLIC_EMAIL}}?subject=Where%20my%20brand%20is%20now">Email {{PUBLIC_EMAIL}} <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M2 8h11M9 4l4 4-4 4"/></svg></a></div>
      <span class="lbl rv" style="--i:4">Replies the same working day</span>`;

const vals = {
  SITE_URL: c.siteUrl.replace(/\/$/, ""),
  PUBLIC_EMAIL: c.publicEmail,
  CLIENTS_URL: c.clientsUrl,
  LEGAL_NAME: name,
  ADDRESS: addr,
  LEGAL_LINE: legal,
  ICO_LINE: c.icoRegistration ? ` ICO registration number: ${c.icoRegistration}.` : "",
  YEAR: String(new Date().getFullYear()),
  UPDATED: c.privacyUpdated,
};

rmSync("dist", { recursive: true, force: true });
cpSync("public", "dist", { recursive: true });
const TEXT = new Set([".html", ".xml", ".txt", ".webmanifest", ".json", ".css"]);
let left = [];
(function walk(dir) {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) { walk(p); continue; }
    if (!TEXT.has(extname(n)) && n !== "_headers" && n !== "_redirects") continue;
    let s = readFileSync(p, "utf8");
    if (isStatic && extname(n) === ".html") {
      s = s.replace(/<!-- enquiry-form -->[\s\S]*?<!-- \/enquiry-form -->/, STATIC_FORM);
      s = s.replace('<meta charset="utf-8">', '<meta charset="utf-8">\n<meta name="robots" content="noindex">');
    }
    s = s.replace(/\{\{([A-Z_]+)\}\}/g, (m, k) => (k in vals ? esc(vals[k]) : m));
    if (base) {
      // root-relative URLs in markup, stylesheets and the manifest; protocol-relative (//) and absolute ones are left alone
      if (extname(n) === ".html") s = s.replace(/\b(href|src|action|content)="\/(?!\/)/g, `$1="${base}/`);
      if (extname(n) === ".css") s = s.replace(/url\(\/(?!\/)/g, `url(${base}/`);
      if (extname(n) === ".webmanifest") s = s.replace(/"\/(?!\/)/g, `"${base}/`);
    }
    const rest = s.match(/\{\{[A-Z_]+\}\}/g);
    if (rest) left.push(`${p}: ${[...new Set(rest)].join(" ")}`);
    writeFileSync(p, s);
  }
})("dist");
if (left.length) { console.error("✖ Unfilled placeholders:\n" + left.join("\n")); process.exit(1); }
console.log(`✓ Built dist/ (${isStatic ? "static preview" + (base ? " at " + base : "") : prod ? "production" : "preview"})${missing.length && !isStatic ? " — company details still missing" : ""}`);
