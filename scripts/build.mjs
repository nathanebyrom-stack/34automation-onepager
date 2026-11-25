// Build: copy public/ to dist/ and fill the {{PLACEHOLDERS}} from site.config.json.
// Production (Cloudflare branch "main", or STRICT=1) refuses to build while the company details are missing.
import { readFileSync, writeFileSync, rmSync, cpSync, readdirSync, statSync, mkdirSync, appendFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, extname } from "node:path";
import { readPosts, longDate, ld, ORG } from "./news.mjs";

const c = JSON.parse(readFileSync("site.config.json", "utf8"));
const prod = process.env.CF_PAGES_BRANCH === "main" || process.env.STRICT === "1";
const missing = ["legalName", "address"].filter((k) => !String(c[k] || "").trim());
if (missing.length && prod) {
  console.error(`\n✖ site.config.json is missing: ${missing.join(", ")}. Production build stopped.\n`);
  process.exit(1);
}
// social profile links (every footer, JSON-LD sameAs): a handle change is a one-line edit in site.config.json
const badSocial = ["linkedinUrl", "instagramUrl"].filter((k) => !/^https:\/\/[^\s"<>]+$/.test(String(c[k] || "")));
if (badSocial.length) {
  console.error(`\n${prod ? "✖" : "⚠"} site.config.json: ${badSocial.join(", ")} must be a full https:// address.${prod ? " Production build stopped." : ""}\n`);
  if (prod) process.exit(1);
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
  LINKEDIN_URL: c.linkedinUrl || "",
  INSTAGRAM_URL: c.instagramUrl || "",
  LEGAL_NAME: name,
  ADDRESS: addr,
  LEGAL_LINE: legal,
  ICO_LINE: c.icoRegistration ? ` ICO registration number: ${c.icoRegistration}.` : "",
  YEAR: String(new Date().getFullYear()),
  BUILD: Date.now().toString(36), // cache-buster on css/js links: a new value every build, so a deploy never pairs new HTML with an hour-old stylesheet
  UPDATED: c.privacyUpdated,
  REPORT_EMAIL: c.reportEmail || c.publicEmail,
  SIGNIN_API: c.signInApi,
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
      if (r.reviewer !== "client" && r.reviewer !== "visitor") why.push('reviewer: "client" or "visitor"');
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
      (comment ? `<p>${esc(comment)}</p>` : "") + `<span class="lbl">${r.reviewer === "client" ? "Client" : "Site visitor"} <b>·</b> ${MONTHS[+m - 1]} ${y}</span></article>`;
  }).join("") + `</div>`;
  return out;
}

// News (ticket OP-NEWS-01, docs in content/news/README.md). On by itself once content/news/ holds an approved post; off while it holds none.
// Any post that breaks a rule stops the build, preview or production, so a bad post never goes live and the current one stays up.
const NEWS_MODE = c.newsMode || "archive";
if (NEWS_MODE !== "archive" && NEWS_MODE !== "replace") { console.error(`\n✖ site.config.json: newsMode must be "archive" or "replace", not "${NEWS_MODE}".\n`); process.exit(1); }
const news = readPosts("content/news");
if (news.errors.length) { console.error("\n✖ content/news/ has posts that can't be published:\n" + news.errors.join("\n") + "\n"); process.exit(1); }
const NEWS_ENABLED = news.posts.length > 0;
const live = NEWS_MODE === "replace" ? news.posts.slice(0, 1) : news.posts; // posts that get a page, newest first
const retired = NEWS_MODE === "replace" ? news.posts.slice(1) : [];
const SITE = c.siteUrl.replace(/\/$/, "");
const postUrl = (p) => `/news/${p.slug}/`;
const arrow = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M2 8h11M9 4l4 4-4 4"/></svg>`;
const card = (p, tag, cls, hid) => `<${tag} class="${cls}"><p class="lbl">News · <time datetime="${p.date}">${longDate(p.date)}</time> · ${p.minutes} min read</p>` +
  `<h2 class="h3"${hid ? ` id="${hid}"` : ""}><a href="${postUrl(p)}">${esc(p.title)}</a></h2><p class="nc-stand">${esc(p.standfirst)}</p>` +
  `<a class="nc-more" href="${postUrl(p)}" aria-label="Read: ${esc(p.title)}">Read ${arrow}</a></${tag}>`;
const NEWS_HTML = {
  NAV: NEWS_ENABLED ? `<a class="nav-link" href="/news/">News</a>` : "",
  FOOT: NEWS_ENABLED ? `<a href="/news/">News</a>` : "",
  TEASER: NEWS_ENABLED ? `<section class="band news-teaser" aria-labelledby="nt-h"><div class="wrap">${card(live[0], "div", "nc", "nt-h")}</div></section>` : "",
  SITEMAP: NEWS_ENABLED ? [`  <url><loc>${SITE}/news/</loc><lastmod>${live[0].updated}</lastmod></url>`, ...live.map((p) => `  <url><loc>${SITE}${postUrl(p)}</loc><lastmod>${p.updated}</lastmod></url>`)].join("\n") : "",
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
    if (n === "reviews.json") continue; // visitors' words: never run them through the placeholders
    let s = readFileSync(p, "utf8");
    s = s.replace(/\{\{([A-Z_]+)\}\}/g, (m, k) => (k in vals ? esc(vals[k]) : m));
    const rest = s.match(/\{\{[A-Z_]+\}\}/g);
    if (rest) left.push(`${p}: ${[...new Set(rest)].join(" ")}`);
    if (s.includes("<!--REVIEWS-->")) s = s.replace("<!--REVIEWS-->", reviewsHtml()); // after the placeholders, so a review can't inject one
    s = s.replace(/<!--NEWS_SITEMAP-->\n?/g, () => (NEWS_HTML.SITEMAP ? NEWS_HTML.SITEMAP + "\n" : "")).replace(/<!--NEWS_(NAV|FOOT|TEASER)-->/g, (m, k) => NEWS_HTML[k]); // also after the placeholders
    writeFileSync(p, s);
  }
})("dist");
if (left.length) { console.error("✖ Unfilled placeholders:\n" + left.join("\n")); process.exit(1); }

// News pages, from templates/news/. The template's {{PLACEHOLDERS}} are filled first, then the post goes in, so a post can't inject one.
if (NEWS_ENABLED) {
  const fill = (file, parts) => {
    let s = readFileSync(file, "utf8").replace(/\{\{([A-Z_]+)\}\}/g, (m, k) => (k in vals ? esc(vals[k]) : m));
    const rest = s.match(/\{\{[A-Z_]+\}\}/g);
    if (rest) { console.error(`✖ Unfilled placeholders in ${file}: ${[...new Set(rest)].join(" ")}`); process.exit(1); }
    s = s.replace(/<!--NEWS:([A-Z]+)-->/g, (m, k) => { if (!(k in parts)) { console.error(`✖ ${file}: no value for ${m}`); process.exit(1); } return parts[k]; });
    return s;
  };
  const org = { "@type": "Organization", name: ORG, url: `${SITE}/`, logo: { "@type": "ImageObject", url: `${SITE}/icon-512.png` } };
  const closer = String(c.newsCloser || "").trim();
  for (const p of live) {
    const url = `${SITE}${postUrl(p)}`, image = `${SITE}${p.hero || "/og.jpg"}`;
    const author = p.author === ORG ? { "@type": "Organization", name: ORG, url: `${SITE}/` } : { "@type": "Person", name: p.author };
    const schema = { "@context": "https://schema.org", "@type": "BlogPosting", headline: p.title, description: p.meta_description, datePublished: p.date, dateModified: p.updated,
      author, publisher: org, image, url, mainEntityOfPage: { "@type": "WebPage", "@id": url }, inLanguage: "en-GB" };
    const html = fill("templates/news/post.html", {
      TITLE: esc(p.title), DESCRIPTION: esc(p.meta_description), STANDFIRST: esc(p.standfirst), URL: esc(url), IMAGE: esc(image),
      DATE: p.date, UPDATED: p.updated, LONGDATE: longDate(p.date), LONGUPDATED: longDate(p.updated), MINUTES: String(p.minutes), AUTHOR: esc(p.author),
      SCHEMA: ld(schema), BODY: p.html,
      HERO: p.hero ? `    <figure class="np-hero"><img src="${esc(p.hero)}" alt="${esc(p.hero_alt)}" width="1600" height="900" loading="lazy" decoding="async"></figure>` : "",
      CLOSER: closer ? `      <p class="np-closer"><a href="/#contact">${esc(closer)}</a></p>` : "",
    });
    mkdirSync(`dist/news/${p.slug}`, { recursive: true });
    writeFileSync(`dist/news/${p.slug}/index.html`, html);
  }
  const intro = String(c.newsIndexIntro || "").trim(), desc = String(c.newsIndexDescription || "").trim() || live[0].standfirst;
  const schema = { "@context": "https://schema.org", "@type": "CollectionPage", name: "News", url: `${SITE}/news/`, description: desc, inLanguage: "en-GB",
    isPartOf: { "@type": "WebSite", name: ORG, url: `${SITE}/` }, publisher: org,
    mainEntity: { "@type": "ItemList", itemListElement: live.map((p, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE}${postUrl(p)}`, name: p.title })) } };
  const rest = live.slice(1);
  writeFileSync("dist/news/index.html", fill("templates/news/index.html", {
    DESCRIPTION: esc(desc), URL: `${SITE}/news/`, IMAGE: `${SITE}/og.jpg`, SCHEMA: ld(schema),
    INTRO: intro ? `    <p class="lede news-intro">${esc(intro)}</p>` : "",
    LEAD: "    " + card(live[0], "article", "nc nc-lead"),
    LIST: rest.length ? `    <ol class="nl" aria-label="Earlier posts">${rest.map((p) => `<li><time datetime="${p.date}">${longDate(p.date)}</time><a href="${postUrl(p)}">${esc(p.title)}</a></li>`).join("")}</ol>` : "",
  }));
  // replace mode: each older post's address moves to /news/ (301), so links to it still land somewhere useful
  if (retired.length) appendFileSync("dist/_redirects", "\n# News, replace mode: older posts move to /news/\n" + retired.map((p) => `/news/${p.slug}/ /news/ 301\n/news/${p.slug} /news/ 301`).join("\n") + "\n");
}
// CSP guard: every inline <script> must have its sha256 in _headers, or the browser blocks it on the live site
// (no pre-paint theme, no film class). A change to an inline script without the matching hash stops the build.
{
  const csp = readFileSync("dist/_headers", "utf8"), bad = [];
  (function scan(dir) {
    for (const n of readdirSync(dir)) {
      const p = join(dir, n);
      if (statSync(p).isDirectory()) { scan(p); continue; }
      if (extname(n) !== ".html") continue;
      for (const m of readFileSync(p, "utf8").matchAll(/<script(?![^>]*\bsrc=)(?![^>]*application\/(?:ld\+)?json)[^>]*>([\s\S]*?)<\/script>/g)) {
        const h = "sha256-" + createHash("sha256").update(m[1], "utf8").digest("base64");
        if (!csp.includes(`'${h}'`)) bad.push(`${p}: '${h}'`);
      }
    }
  })("dist");
  if (bad.length) { console.error("✖ Inline script not allowed by the CSP in public/_headers. Add its hash to script-src:\n" + [...new Set(bad)].join("\n")); process.exit(1); }
}
const newsLine = NEWS_ENABLED ? `News on, ${NEWS_MODE}: ${live.length} post${live.length === 1 ? "" : "s"} built${retired.length ? `, ${retired.length} redirected to /news/` : ""}` : "News off (no approved posts)";
console.log(`✓ Built dist/ (${prod ? "production" : "preview"})${missing.length ? " — company details still missing" : ""} · ${reviews.length} published review${reviews.length === 1 ? "" : "s"} · ${newsLine}${news.drafts ? ` · ${news.drafts} draft${news.drafts === 1 ? "" : "s"} skipped` : ""}`);
