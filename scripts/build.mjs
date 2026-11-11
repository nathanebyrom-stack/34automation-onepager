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
  REPORT_EMAIL: c.reportEmail || c.publicEmail,
};

// Published reviews: public/reviews.json, rendered into the home page at build time (no layout shift, works without JS).
// A malformed entry stops the build, so a bad edit never goes live.
const reviews = (() => {
  let list;
  try { list = JSON.parse(readFileSync("public/reviews.json", "utf8")); } catch (e) { console.error(`\n✖ public/reviews.json is not valid JSON: ${e.message}\n`); process.exit(1); }
  if (!Array.isArray(list)) { console.error("\n✖ public/reviews.json must be a list: [ ... ]\n"); process.exit(1); }
  const bad = [];
  list.forEach((r, i) => {
    const why = [];
    if (!r || typeof r !== "object") why.push("not an object");
    else {
      if (typeof r.business !== "string" || !r.business.trim() || r.business.trim().length > 80) why.push("business: 1 to 80 characters");
      if (!Number.isInteger(r.rating) || r.rating < 1 || r.rating > 5) why.push("rating: a whole number 1 to 5");
      if (r.comment != null && (typeof r.comment !== "string" || r.comment.length > 280)) why.push("comment: text up to 280 characters");
      if (typeof r.date !== "string" || !/^\d{4}-(0[1-9]|1[0-2])(-\d{2})?$/.test(r.date)) why.push('date: "YYYY-MM-DD"');
    }
    if (why.length) bad.push(`  #${i + 1}: ${why.join("; ")}`);
  });
  if (bad.length) { console.error("\n✖ public/reviews.json has entries that can't be published:\n" + bad.join("\n") + "\n"); process.exit(1); }
  return list.slice().sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
})();
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function reviewsHtml() {
  if (!reviews.length)
    return `<div class="empty"><span class="lbl">Published reviews</span><p>No reviews yet. The site's new, so there's nothing to show. Yours can be the first, good or bad.</p></div>`;
  const meter = (n) => `<i class="m" aria-hidden="true">${[1, 2, 3, 4, 5].map((k) => `<i${k <= n ? ' class="on"' : ""}></i>`).join("")}</i>`;
  let out = "";
  if (c.reviewsSummary !== false) {
    const avg = reviews.reduce((t, r) => t + r.rating, 0) / reviews.length;
    const a1 = (Math.round(avg * 10) / 10).toFixed(1).replace(/\.0$/, "");
    out += `<div class="rsum"><span>Published</span><span>${reviews.length} review${reviews.length === 1 ? "" : "s"}</span><span>Average</span><span>${a1} out of 5</span></div>`;
  }
  out += `<div class="revs">` + reviews.map((r) => {
    const [y, m] = r.date.split("-");
    const comment = (r.comment || "").trim();
    return `<article class="rev"><div class="rh"><h3 class="h3">${esc(r.business.trim())}</h3><span class="score" role="img" aria-label="Rated ${r.rating} out of 5"><b>${r.rating}</b>/5${meter(r.rating)}</span></div>` +
      (comment ? `<p>${esc(comment)}</p>` : "") + `<span class="lbl">${MONTHS[+m - 1]} ${y}</span></article>`;
  }).join("") + `</div>`;
  return out;
}

rmSync("dist", { recursive: true, force: true });
cpSync("public", "dist", { recursive: true });
const TEXT = new Set([".html", ".xml", ".txt", ".webmanifest", ".json"]);
let left = [];
(function walk(dir) {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) { walk(p); continue; }
    if (!TEXT.has(extname(n)) && n !== "_headers" && n !== "_redirects") continue;
    if (n === "reviews.json") continue; // visitors' words: never run them through the placeholders
    let s = readFileSync(p, "utf8");
    s = s.replace(/\{\{([A-Z_]+)\}\}/g, (m, k) => (k in vals ? esc(vals[k]) : m));
    const rest = s.match(/\{\{[A-Z_]+\}\}/g);
    if (rest) left.push(`${p}: ${[...new Set(rest)].join(" ")}`);
    if (s.includes("<!--REVIEWS-->")) s = s.replace("<!--REVIEWS-->", reviewsHtml()); // after the placeholders, so a review can't inject one
    writeFileSync(p, s);
  }
})("dist");
if (left.length) { console.error("✖ Unfilled placeholders:\n" + left.join("\n")); process.exit(1); }
console.log(`✓ Built dist/ (${prod ? "production" : "preview"})${missing.length ? " — company details still missing" : ""} · ${reviews.length} published review${reviews.length === 1 ? "" : "s"}`);
