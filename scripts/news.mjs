// News (Nathan, 25 Nov 2026): Scott's weekly articles. One Markdown file per post in content/news/, built into
// /news/ (the list), /news/<file-name>/ (each post, its own address so Google can rank it), a "Latest" strip of the three
// newest on the home page, and sitemap entries. How to write a post: docs/news-guide.md.
// A post with a mistake in its header stops the build, so a broken post never goes live. Drafts (draft: true) are never published.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const DIR = "content/news";
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
export const longDate = (d) => { const [y, m, day] = d.split("-"); return `${+day} ${MONTHS[+m - 1]} ${y}`; };

// Front matter: simple "key: value" lines between two "---" lines.
function parse(file, text) {
  const m = text.replace(/^\uFEFF/, "").match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { error: "must start with a --- header block (see docs/news-guide.md)" };
  const meta = {};
  for (const line of m[1].split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const kv = line.match(/^([a-zA-Z]+)\s*:\s*(.*)$/);
    if (!kv) return { error: `header line not understood: "${line}"` };
    meta[kv[1].toLowerCase()] = kv[2].trim().replace(/^(["'])(.*)\1$/, "$2");
  }
  return { meta, body: m[2] };
}

export function loadPosts() {
  if (!existsSync(DIR)) return [];
  const posts = [], bad = [], seen = new Set();
  for (const f of readdirSync(DIR).sort()) {
    if (!f.endsWith(".md") || f.startsWith("_")) continue; // _template.md and other _files are never published
    const slug = f.slice(0, -3);
    const why = [];
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) why.push("file name: lower-case letters, numbers and hyphens only, e.g. choosing-a-cnc-subcontractor.md");
    const p = parse(f, readFileSync(join(DIR, f), "utf8"));
    if (p.error) { bad.push(`  ${f}: ${p.error}`); continue; }
    const { meta, body } = p;
    if (meta.draft === "true") continue;
    if (!meta.title || meta.title.length > 110) why.push("title: 1 to 110 characters");
    if (!/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(meta.date || "")) why.push('date: "YYYY-MM-DD"');
    if (!meta.summary || meta.summary.length > 200) why.push("summary: 1 to 200 characters (shows on the list and in Google)");
    if (!meta.author) why.push("author: who wrote it");
    if (!body.trim()) why.push("the post has no text under the header");
    if (seen.has(slug)) why.push("two posts share this file name");
    seen.add(slug);
    if (why.length) { bad.push(`  ${f}: ${why.join("; ")}`); continue; }
    posts.push({ slug, title: meta.title, date: meta.date, summary: meta.summary, author: meta.author, html: md(body) });
  }
  if (bad.length) { console.error("\n✖ content/news has posts that can't be published:\n" + bad.join("\n") + "\n"); process.exit(1); }
  return posts.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.slug < b.slug ? -1 : 1));
}

// Markdown, the parts a blog post needs: ## headings, paragraphs, lists, quotes, **bold**, *italic*, `code`, [links](url), ![images](url).
// Everything is escaped first, so a post can't carry raw HTML or scripts onto the site.
function inline(s) {
  const safe = (u) => (/^(https?:\/\/|\/|#|mailto:)/i.test(u) ? u : "#");
  return esc(s)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (m, alt, u) => `<img src="${safe(u)}" alt="${alt}" loading="lazy">`)
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, t, u) => { const ext = /^https?:\/\//i.test(u) && !u.includes("34automation.co.uk"); return `<a href="${safe(u)}"${ext ? ' rel="noopener"' : ""}>${t}</a>`; })
    .replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>")
    .replace(/(^|[^*])\*([^*\s][^*]*)\*/g, "$1<em>$2</em>");
}
export function md(src) {
  const lines = src.replace(/\r/g, "").split("\n"), out = [];
  let para = [], list = null;
  const flushP = () => { if (para.length) { out.push(`<p>${inline(para.join(" "))}</p>`); para = []; } };
  const flushL = () => { if (list) { out.push(`<${list.t}>${list.items.map((i) => `<li>${inline(i)}</li>`).join("")}</${list.t}>`); list = null; } };
  for (const raw of lines) {
    const line = raw.trimEnd();
    let m;
    if (!line.trim()) { flushP(); flushL(); continue; }
    if ((m = line.match(/^(#{1,4})\s+(.*)$/))) { flushP(); flushL(); const lv = Math.min(Math.max(m[1].length, 2), 3); out.push(`<h${lv} class="h3">${inline(m[2])}</h${lv}>`); continue; }
    if ((m = line.match(/^\s*[-*]\s+(.*)$/)) || (m = line.match(/^\s*\d+[.)]\s+(.*)$/))) {
      const t = /^\s*\d/.test(line) ? "ol" : "ul";
      flushP(); if (list && list.t !== t) flushL(); if (!list) list = { t, items: [] };
      list.items.push(m[1]); continue;
    }
    if ((m = line.match(/^>\s?(.*)$/))) { flushP(); flushL(); out.push(`<blockquote><p>${inline(m[1])}</p></blockquote>`); continue; }
    if (list && /^\s{2,}\S/.test(raw)) { list.items[list.items.length - 1] += " " + line.trim(); continue; }
    flushL(); para.push(line.trim());
  }
  flushP(); flushL();
  return out.join("\n").replace(/<\/blockquote>\n<blockquote>/g, "\n");
}

const card = (p, h = "h3", rv = " rv") => `<article class="ncard${rv}"><span class="lbl">${esc(longDate(p.date))} <b>·</b> ${esc(p.author)}</span><${h} class="h3"><a href="/news/${p.slug}/">${esc(p.title)}</a></${h}><p>${esc(p.summary)}</p><span class="more" aria-hidden="true">Read it</span></article>`;

// Home page strip: the three newest. Nothing at all while there are no posts.
export function homeStrip(posts) {
  if (!posts.length) return "";
  return `<section class="band news-strip" id="news" aria-labelledby="news-h">
  <div class="wrap">
    <div class="head">
      <div class="row">
        <div class="rv"><span class="kick"><i>N</i><span>News</span></span>
          <h2 id="news-h" class="h2" style="margin-top:14px">Latest from<br><em>the workshop.</em></h2></div>
        <a class="btn rv" style="--i:1" href="/news/">All news <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M2 8h11M9 4l4 4-4 4"/></svg></a>
      </div>
      <div class="rule"></div>
    </div>
    <div class="ngrid">${posts.slice(0, 3).map((p) => card(p)).join("")}</div>
  </div>
</section>`;
}

export function listPage(posts, site) {
  const body = `    <span class="lbl">News <b>/</b> Weekly</span>
    <h1 class="h2">News</h1>
    <p class="lede">Articles for UK engineering firms on websites, marketing and winning more of the right work. A new one every week.</p>
    ${posts.length ? `<div class="ngrid list">${posts.map((p) => card(p, "h2", "")).join("")}</div>` : `<div class="empty"><span class="lbl">First post</span><p>The first article is on its way. Check back soon.</p></div>`}`;
  const ld = { "@context": "https://schema.org", "@type": "Blog", name: "34 Automation News", url: `${site}/news/`, publisher: { "@type": "Organization", name: "34 Automation", url: `${site}/` } };
  return {
    title: "News | 34 Automation",
    desc: "Weekly articles from 34 Automation for UK engineering firms: websites, marketing and winning more of the right work.",
    path: "/news/",
    head: og("News | 34 Automation", "Weekly articles for UK engineering firms.", `${site}/news/`, site, "website") + jsonld(ld),
    body,
  };
}

export function postPage(p, posts, site) {
  const i = posts.indexOf(p), newer = posts[i - 1], older = posts[i + 1];
  const url = `${site}/news/${p.slug}/`;
  const body = `    <nav class="crumb" aria-label="Breadcrumb"><a href="/news/">News</a></nav>
    <article class="post">
      <span class="lbl"><time datetime="${p.date}">${esc(longDate(p.date))}</time> <b>·</b> ${esc(p.author)}</span>
      <h1 class="h2">${esc(p.title)}</h1>
      <p class="lede">${esc(p.summary)}</p>
      <div class="prose">
${p.html}
      </div>
    </article>
    <div class="post-end">
      <p>Want this working for your firm? <a href="/#contact">Start a conversation</a>.</p>
      <nav class="pn" aria-label="More news">${older ? `<a href="/news/${older.slug}/"><span class="lbl">Older</span>${esc(older.title)}</a>` : "<span></span>"}${newer ? `<a class="nx" href="/news/${newer.slug}/"><span class="lbl">Newer</span>${esc(newer.title)}</a>` : ""}</nav>
    </div>`;
  const ld = { "@context": "https://schema.org", "@type": "BlogPosting", headline: p.title, description: p.summary, datePublished: p.date, url, mainEntityOfPage: url, author: { "@type": "Person", name: p.author }, publisher: { "@type": "Organization", name: "34 Automation", logo: { "@type": "ImageObject", url: `${site}/icon-512.png` } }, image: `${site}/og.jpg` };
  return { title: `${p.title} | 34 Automation`, desc: p.summary, path: `/news/${p.slug}/`, head: og(p.title, p.summary, url, site, "article") + jsonld(ld), body };
}

function og(t, d, url, site, type) {
  return `<meta property="og:type" content="${type}">
<meta property="og:locale" content="en_GB">
<meta property="og:site_name" content="34 Automation">
<meta property="og:url" content="${esc(url)}">
<meta property="og:title" content="${esc(t)}">
<meta property="og:description" content="${esc(d)}">
<meta property="og:image" content="${esc(site)}/og.jpg">
<meta name="twitter:card" content="summary_large_image">
`;
}
const jsonld = (o) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, "\\u003c")}</script>`;

export function fill(tpl, pg) {
  return tpl
    .replace("<!--N_TITLE-->", () => esc(pg.title))
    .replace("<!--N_DESC-->", () => esc(pg.desc))
    .replace("<!--N_PATH-->", () => pg.path)
    .replace("<!--N_HEAD-->", () => pg.head)
    .replace("<!--N_BODY-->", () => pg.body);
}
