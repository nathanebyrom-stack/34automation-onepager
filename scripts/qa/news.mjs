// QA only (not shipped). News build rules, OP-NEWS-01 acceptance tests 1, 9, 10 and 11, run without touching the repo:
// each case copies the site into a temp folder, writes test posts there, runs the real build and reads the result.
// Usage: node scripts/qa/news.mjs [--keep <dir>]   (--keep leaves a built dist with two test posts at <dir>, for screenshots)
import { mkdtempSync, cpSync, writeFileSync, readFileSync, existsSync, rmSync, mkdirSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = resolve(new URL("../..", import.meta.url).pathname);
const keepAt = process.argv.includes("--keep") ? resolve(process.argv[process.argv.indexOf("--keep") + 1]) : null;
let fails = 0; const ok = (c, m) => { if (!c) fails++; console.log((c ? "  ok   " : "  FAIL ") + m); };

const para = "This is a test paragraph for checking the News layout and the build rules. It is not copy and is never published.";
const BODY = ["## A test subheading", para, para, "- First test item", "- Second test item with **bold** and *italic*", "", "1. Numbered one", "2. Numbered two", "",
  "> A test quote, to check the Steel rule.", "", "### A smaller test heading", `${para} Here is [a test link](/#contact).`].join("\n\n").replace(/\n\n(?=- |\d\. )/g, "\n");
function post(o = {}, body = BODY) {
  const fm = { title: "Test post one", slug: "test-post-one", date: "2026-11-30", updated: "2026-11-30", author: "34 Automation", meta_description: "Test meta description.",
    standfirst: "Test standfirst for the layout check. Not for publication.", hero: "", hero_alt: "", status: "approved", approved_by: "Nathan", approved_at: "2026-11-30T11:45", ...o };
  const lines = Object.entries(fm).filter(([, v]) => v !== undefined).map(([k, v]) => `${k}: ${typeof v === "string" && !/^\d{4}-/.test(v) && v !== "approved" && v !== "Nathan" && v !== "true" ? JSON.stringify(v) : v}`);
  return `---\n${lines.join("\n")}\n---\n${body}\n`;
}
function build(posts, config = {}) {
  const dir = mkdtempSync(join(tmpdir(), "news-qa-"));
  for (const d of ["public", "scripts", "templates"]) cpSync(join(ROOT, d), join(dir, d), { recursive: true });
  writeFileSync(join(dir, "site.config.json"), JSON.stringify({ ...JSON.parse(readFileSync(join(ROOT, "site.config.json"), "utf8")), ...config }));
  mkdirSync(join(dir, "content/news"), { recursive: true });
  writeFileSync(join(dir, "content/news/README.md"), "# not a post\n");
  for (const [name, text] of Object.entries(posts)) writeFileSync(join(dir, "content/news", name), text);
  const r = spawnSync(process.execPath, ["scripts/build.mjs"], { cwd: dir, env: { ...process.env, STRICT: "1" }, encoding: "utf8" });
  const read = (p) => (existsSync(join(dir, "dist", p)) ? readFileSync(join(dir, "dist", p), "utf8") : null);
  return { code: r.status, out: (r.stdout || "") + (r.stderr || ""), read, dir };
}
const h1s = (html) => (html.match(/<h1[\s>]/g) || []).length;
const ldOk = (html) => { try { [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].forEach((m) => JSON.parse(m[1])); return true; } catch (e) { return false; } };
const PAGES = ["index.html", "404.html", "privacy/index.html", "clients/index.html", "feedback-request/index.html"];

console.log("1. No posts (and a draft only): News is off everywhere");
for (const [label, posts] of [["empty", {}], ["draft only", { "2026-11-30-test-post-one.md": post({ draft: "true" }) }]]) {
  const b = build(posts);
  ok(b.code === 0, `${label}: build passes (${b.out.trim().split("\n").pop()})`);
  ok(PAGES.every((p) => !/nav-link|href="\/news\//.test(b.read(p))), `${label}: no News link in any header or footer`);
  ok(b.read("news/index.html") === null, `${label}: no /news/ page`);
  ok(!/news/.test(b.read("sitemap.xml")), `${label}: sitemap has no News`);
  ok(!/news-teaser/.test(b.read("index.html")), `${label}: no home teaser`);
  rmSync(b.dir, { recursive: true, force: true });
}

console.log("2. One approved post: News is on");
{
  const b = build({ "2026-11-30-test-post-one.md": post() }); const home = b.read("index.html"), pg = b.read("news/test-post-one/index.html"), idx = b.read("news/index.html"), sm = b.read("sitemap.xml");
  ok(b.code === 0, "build passes: " + b.out.trim().split("\n").pop());
  ok(PAGES.every((p) => b.read(p).includes('<a class="nav-link" href="/news/">News</a><a class="btn" href="/#contact">Contact</a>')), "header: News then Contact on every page");
  ok(PAGES.every((p) => /Website report<\/a><a href="\/news\/">News<\/a><a href="\/?#contact">Contact<\/a>/.test(b.read(p))), 'footer: News after "Website report", before "Contact"');
  ok(/<\/section>\n<section class="band news-teaser"[\s\S]*?<\/section>\n<section class="band sl-ig sl-proc"/.test(home) && home.indexOf("news-teaser") > home.indexOf('id="report"') && home.indexOf("news-teaser") < home.indexOf('id="contact"'), "home teaser sits after 07 and before 08");
  ok(pg && idx, "/news/ and /news/test-post-one/ built");
  ok([home, pg, idx].every((h) => h1s(h) === 1), "exactly one h1 on home, post and index");
  ok(pg.includes('aria-current="true"') && idx.includes('aria-current="page"'), "aria-current: true on the post, page on /news/");
  ok(pg.includes('<link rel="canonical" href="https://34automation.co.uk/news/test-post-one/">') && pg.includes('<meta property="og:url" content="https://34automation.co.uk/news/test-post-one/">'), "canonical and og:url absolute");
  ok(pg.includes("<title>Test post one · 34 Automation</title>") && pg.includes('og:type" content="article"') && pg.includes('twitter:card" content="summary_large_image"'), "title, og:type article, twitter card");
  ok(ldOk(pg) && ldOk(idx) && /"@type":"BlogPosting"/.test(pg) && /"author":\{"@type":"Organization","name":"34 Automation"/.test(pg) && /"@type":"CollectionPage"/.test(idx), "JSON-LD parses: BlogPosting (author Organization), CollectionPage");
  ok(/<loc>https:\/\/34automation.co.uk\/news\/<\/loc>/.test(sm) && /<loc>https:\/\/34automation.co.uk\/news\/test-post-one\/<\/loc>/.test(sm), "sitemap has /news/ and the post");
  ok(/News <b>·<\/b> <time datetime="2026-11-30">30 Nov 2026<\/time> <b>·<\/b> 1 min read/.test(pg), "mono label with date and reading time");
  ok(!/\{\{|<!--NEWS/.test(pg + idx + home), "no unfilled placeholders or markers");
  ok(!/class="np-closer"/.test(pg) && !/news-intro/.test(idx), "empty copy slots (closer, intro) are left out, not filled with placeholder text");
  rmSync(b.dir, { recursive: true, force: true });
}

console.log("3. Limits: at the limit passes, one over fails");
{
  const b1 = build({ "2026-11-30-test-post-one.md": post({ title: "T".repeat(60) }, "x".repeat(7000)) });
  ok(b1.code === 0, "60-character title and 7,000-character body pass"); rmSync(b1.dir, { recursive: true, force: true });
}
const MUST_FAIL = [
  ["body of 7,001 characters", post({}, "x".repeat(7001)), /body is 7001 characters/],
  ["61-character title", post({ title: "T".repeat(61) }), /title is 61 characters/],
  ["156-character meta description", post({ meta_description: "m".repeat(156) }), /meta_description is 156/],
  ["201-character standfirst", post({ standfirst: "s".repeat(201) }), /standfirst is 201/],
  ["missing front-matter field (author)", post({ author: undefined }), /author is missing/],
  ["no front-matter at all", BODY, /no front-matter/],
  ["raw HTML in the body", post({}, para + "\n\n<script>alert(1)</script>"), /raw HTML/],
  ["raw HTML in the title", post({ title: "Test <b>bold</b>" }), /title: raw HTML/],
  ["status not approved", post({ status: "draft" }), /only approved posts/],
  ["approved_by not Nathan", post({ approved_by: "Scott" }), /approved_by must be Nathan/],
  ["unknown field (typo)", post({ titel: "x" }), /unknown front-matter field "titel"/],
  ["javascript: link", post({}, "[x](javascript:alert(1))"), /link "javascript/],
  ["# heading (second h1)", post({}, "# Another h1\n\n" + para), /only ## and ###/],
  ["image in the body", post({}, "![alt](/og.jpg)"), /images in the body/],
  ["hero outside /img/", post({ hero: "/og.jpg", hero_alt: "x" }), /hero: a path under \/img\//],
  ["hero without alt", post({ hero: "/img/05-bead-blast.webp" }), /hero_alt is required/],
  ["hero file missing", post({ hero: "/img/no-such.webp", hero_alt: "x" }), /is not in public/],
  ["file name and slug differ", post({ slug: "other-slug" }), /does not match slug/],
  ["impossible date", post({ date: "2026-02-30", updated: "2026-02-30" }), /date: a real date/],
];
for (const [label, text, want] of MUST_FAIL) {
  const b = build({ "2026-11-30-test-post-one.md": text });
  ok(b.code !== 0 && want.test(b.out) && !existsSync(join(b.dir, "dist/news")), `fails as intended: ${label}`);
  if (b.code === 0 || !want.test(b.out)) console.log(b.out);
  rmSync(b.dir, { recursive: true, force: true });
}
{
  const b = build({ "2026-11-30-test-post-one.md": post(), "2026-12-07-test-post-one.md": post({ date: "2026-12-07", updated: "2026-12-07" }) });
  ok(b.code !== 0 && /also used by/.test(b.out), "fails as intended: duplicate slug"); rmSync(b.dir, { recursive: true, force: true });
}
{
  const b = build({ "2026-11-30-test-post-one.md": post() }, { newsMode: "latest" });
  ok(b.code !== 0 && /newsMode must be/.test(b.out), "fails as intended: unknown newsMode"); rmSync(b.dir, { recursive: true, force: true });
}

console.log("4. The switch, with two test posts");
const TWO = { "2026-11-30-test-post-one.md": post(), "2026-12-07-test-post-two.md": post({ title: "Test post two", slug: "test-post-two", date: "2026-12-07", updated: "2026-12-07" }) };
{
  const b = build(TWO, { newsMode: "archive" }); const idx = b.read("news/index.html"), sm = b.read("sitemap.xml");
  ok(b.code === 0 && b.read("news/test-post-one/index.html") && b.read("news/test-post-two/index.html"), "archive: both posts built");
  ok(idx.indexOf("test-post-two") < idx.indexOf("test-post-one") && /class="nl"[\s\S]*test-post-one/.test(idx), "archive: /news/ leads with the newest, the older one in the dated list");
  ok(/test-post-one/.test(sm) && /test-post-two/.test(sm), "archive: both in the sitemap");
  ok(/test-post-two/.test(b.read("index.html")) && !/test-post-one/.test(b.read("index.html")), "home teaser shows the newest");
  ok(!/news/.test(b.read("_redirects")), "archive: no News redirects");
  if (keepAt) { rmSync(keepAt, { recursive: true, force: true }); cpSync(join(b.dir, "dist"), keepAt, { recursive: true }); console.log("  (kept the archive build at " + keepAt + ")"); }
  rmSync(b.dir, { recursive: true, force: true });
}
{
  const b = build(TWO, { newsMode: "replace" }); const sm = b.read("sitemap.xml"), rd = b.read("_redirects");
  ok(b.code === 0 && b.read("news/test-post-two/index.html") && b.read("news/test-post-one/index.html") === null, "replace: only the newest built");
  ok(rd.includes("/news/test-post-one/ /news/ 301") && rd.includes("/news/test-post-one /news/ 301"), "replace: old slug 301s to /news/");
  ok(!/test-post-one/.test(sm) && /test-post-two/.test(sm), "replace: old slug not in the sitemap");
  ok(!/class="nl"/.test(b.read("news/index.html")), "replace: /news/ has the lead card only");
  rmSync(b.dir, { recursive: true, force: true });
}
console.log(fails ? `\n${fails} FAILED` : "\nall passed"); process.exit(fails ? 1 : 0);
