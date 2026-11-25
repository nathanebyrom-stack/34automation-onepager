// News (ticket OP-NEWS-01): approved posts in content/news/ become /news/ and /news/<slug>/ at build time.
// Fails closed: a post over a limit, with missing or unknown front-matter, raw HTML or Markdown outside the small subset stops the build,
// so nothing half-checked goes live. With no approved post, News is switched off everywhere (no header or footer link, no /news/,
// no home teaser, nothing in the sitemap). Nothing to switch by hand: the first approved post turns it on.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

export const LIMITS = { title: 60, slug: 60, meta_description: 155, standfirst: 200, hero_alt: 125, body: 7000 };
const REQUIRED = ["title", "slug", "date", "updated", "author", "meta_description", "standfirst", "status", "approved_by", "approved_at"];
const OPTIONAL = ["hero", "hero_alt", "draft"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const ORG = "34 Automation";

export const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const len = (s) => [...String(s)].length; // characters as a person counts them (an emoji or a £ is one)
const isDate = (s) => /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(s) && !isNaN(Date.parse(s + "T00:00:00Z")) && new Date(s + "T00:00:00Z").toISOString().slice(0, 10) === s;
export const longDate = (s) => { const [y, m, d] = s.split("-"); return `${+d} ${MONTHS[+m - 1]} ${y}`; };

// Front-matter: one "key: value" per line between --- fences. Values may be "double" or 'single' quoted; a trailing "# comment" is ignored.
function frontMatter(src, why) {
  const m = src.match(/^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/);
  if (!m) { why.push("no front-matter: the file must start with a --- block"); return { fm: {}, body: src }; }
  const fm = {};
  m[1].split(/\r?\n/).forEach((line, i) => {
    if (!line.trim() || /^\s*#/.test(line)) return;
    const kv = line.match(/^([a-z_]+):[ \t]*(.*)$/);
    if (!kv) { why.push(`front-matter line ${i + 2} is not "key: value": ${line.trim().slice(0, 40)}`); return; }
    let [, k, v] = kv;
    v = v.trim();
    if (v.startsWith('"')) {
      const q = v.match(/^"((?:[^"\\]|\\.)*)"\s*(?:#.*)?$/);
      if (!q) { why.push(`${k}: unclosed "quote"`); return; }
      v = q[1].replace(/\\(["\\])/g, "$1");
    } else if (v.startsWith("'")) {
      const q = v.match(/^'((?:[^']|'')*)'\s*(?:#.*)?$/);
      if (!q) { why.push(`${k}: unclosed 'quote'`); return; }
      v = q[1].replace(/''/g, "'");
    } else v = v.replace(/\s+#.*$/, "").trim();
    if (k in fm) why.push(`${k} appears twice`);
    fm[k] = v;
  });
  return { fm, body: src.slice(m[0].length) };
}

// The Markdown subset: ## and ### headings, paragraphs, "-" and "1." lists, **bold**, *italic*, [links](url), > quotes. Everything else fails.
function inline(s, why, where) {
  const out = [], re = /\[([^\]\n]+)\]\(([^)\s]+)\)/g;
  let last = 0, m;
  const em = (t) => esc(t).replace(/\*\*([^*\n]+?)\*\*/g, "<strong>$1</strong>").replace(/\*([^*\n]+?)\*/g, "<em>$1</em>");
  while ((m = re.exec(s))) {
    out.push(em(s.slice(last, m.index)));
    const url = m[2];
    if (!/^(https:\/\/|http:\/\/|mailto:|\/(?!\/)|#)/.test(url)) why.push(`${where}: link "${url.slice(0, 50)}" must start https://, http://, mailto:, / or #`);
    out.push(`<a href="${esc(url)}">${em(m[1])}</a>`);
    last = m.index + m[0].length;
  }
  out.push(em(s.slice(last)));
  return out.join("");
}
export function markdown(body, why) {
  const lines = body.replace(/\r\n?/g, "\n").split("\n"), html = [];
  let i = 0;
  const bad = (n, what) => why.push(`body line ${n}: ${what}`);
  lines.forEach((l, n) => {
    if (/<[A-Za-z!/?]/.test(l)) bad(n + 1, "raw HTML is not allowed");
    if (/^\s*(```|~~~)/.test(l)) bad(n + 1, "code blocks are not supported");
    if (/`/.test(l)) bad(n + 1, "`code` is not supported");
    if (/!\[/.test(l)) bad(n + 1, "images in the body are not supported (use hero in the front-matter)");
    if (/^#(?!#)/.test(l) || /^#{4,}/.test(l)) bad(n + 1, "only ## and ### headings (the title is the page's h1)");
    if (/^\s*\|/.test(l)) bad(n + 1, "tables are not supported");
    if (/^(\s{2,}|\t)\S/.test(l)) bad(n + 1, "indented lines are not supported (nested lists, code)");
    if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(l)) bad(n + 1, "horizontal rules are not supported");
    if (/^\s*[*+]\s/.test(l)) bad(n + 1, 'lists use "- " or "1. "');
  });
  while (i < lines.length) {
    const l = lines[i];
    if (!l.trim()) { i++; continue; }
    let h = l.match(/^(##|###)\s+(.+?)\s*#*\s*$/);
    if (h) { html.push(`<h${h[1].length}>${inline(h[2], why, `line ${i + 1}`)}</h${h[1].length}>`); i++; continue; }
    if (/^-\s+/.test(l) || /^\d+\.\s+/.test(l)) {
      const ol = /^\d/.test(l), re = ol ? /^\d+\.\s+(.*)$/ : /^-\s+(.*)$/, items = [];
      while (i < lines.length && re.test(lines[i])) { items.push(`<li>${inline(lines[i].match(re)[1], why, `line ${i + 1}`)}</li>`); i++; }
      html.push(`<${ol ? "ol" : "ul"}>${items.join("")}</${ol ? "ol" : "ul"}>`);
      continue;
    }
    if (/^>/.test(l)) {
      const paras = [[]];
      while (i < lines.length && /^>/.test(lines[i])) { const t = lines[i].replace(/^>\s?/, ""); if (t.trim()) paras[paras.length - 1].push(t.trim()); else if (paras[paras.length - 1].length) paras.push([]); i++; }
      html.push(`<blockquote>${paras.filter((p) => p.length).map((p) => `<p>${inline(p.join(" "), why, `line ${i}`)}</p>`).join("")}</blockquote>`);
      continue;
    }
    const para = [];
    while (i < lines.length && lines[i].trim() && !/^(##|###)\s/.test(lines[i]) && !/^-\s+/.test(lines[i]) && !/^\d+\.\s+/.test(lines[i]) && !/^>/.test(lines[i])) { para.push(lines[i].trim()); i++; }
    html.push(`<p>${inline(para.join(" "), why, `line ${i}`)}</p>`);
  }
  return html.join("\n");
}
const words = (body) => body.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/[#>*]/g, " ").split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;

// Reads every post. Returns { posts (approved, newest first), errors }. Drafts (draft: true) are skipped and never built.
export function readPosts(dir, publicDir = "public") {
  const errors = [], posts = [], slugs = new Map();
  if (!existsSync(dir)) return { posts, errors, drafts: 0 };
  let drafts = 0;
  for (const f of readdirSync(dir).sort()) {
    if (f === "README.md" || f.startsWith(".")) continue;
    const why = [];
    if (!/\.md$/.test(f)) { errors.push(`  ${f}: only .md posts belong in content/news/`); continue; }
    const fn = f.match(/^(\d{4}-\d{2}-\d{2})-([a-z0-9]+(?:-[a-z0-9]+)*)\.md$/);
    if (!fn) why.push('file name must be "YYYY-MM-DD-<slug>.md" (lower-case letters, numbers and hyphens)');
    const { fm, body } = frontMatter(readFileSync(join(dir, f), "utf8"), why);
    if (fm.draft !== undefined && fm.draft !== "true" && fm.draft !== "false") why.push('draft: true or false');
    if (fm.draft === "true") { drafts++; continue; }
    for (const k of Object.keys(fm)) if (!REQUIRED.includes(k) && !OPTIONAL.includes(k)) why.push(`unknown front-matter field "${k}"`);
    for (const k of REQUIRED) if (!String(fm[k] ?? "").trim()) why.push(`${k} is missing`);
    for (const k of ["title", "slug", "meta_description", "standfirst", "hero_alt"]) if (fm[k] && len(fm[k]) > LIMITS[k]) why.push(`${k} is ${len(fm[k])} characters, max ${LIMITS[k]}`);
    for (const k of ["title", "meta_description", "standfirst", "hero_alt", "author"]) if (fm[k] && /<[A-Za-z!/?]/.test(fm[k])) why.push(`${k}: raw HTML is not allowed`);
    if (fm.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(fm.slug)) why.push("slug: lower-case letters, numbers and single hyphens only");
    if (fm.date && !isDate(fm.date)) why.push("date: a real date, YYYY-MM-DD");
    if (fm.updated && !isDate(fm.updated)) why.push("updated: a real date, YYYY-MM-DD");
    if (isDate(fm.date || "") && isDate(fm.updated || "") && fm.updated < fm.date) why.push("updated is before date");
    if (fn && fm.date && fn[1] !== fm.date) why.push(`file name date ${fn[1]} does not match date ${fm.date}`);
    if (fn && fm.slug && fn[2] !== fm.slug) why.push(`file name slug "${fn[2]}" does not match slug "${fm.slug}"`);
    if (fm.status && fm.status !== "approved") why.push(`status is "${fm.status}": only approved posts can be in content/news/ (or mark it draft: true)`);
    if (fm.approved_by && fm.approved_by !== "Nathan") why.push(`approved_by must be Nathan`);
    if (fm.approved_at && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(fm.approved_at)) why.push("approved_at: YYYY-MM-DDTHH:MM");
    if (fm.hero) {
      if (!/^\/img\/[A-Za-z0-9._\/-]+\.(webp|jpg|jpeg|png)$/.test(fm.hero) || fm.hero.includes("..")) why.push("hero: a path under /img/ ending .webp, .jpg or .png");
      else if (!existsSync(join(publicDir, fm.hero))) why.push(`hero: ${fm.hero} is not in ${publicDir}/`);
      if (!String(fm.hero_alt || "").trim()) why.push("hero_alt is required when hero is set");
    } else if (fm.hero_alt) why.push("hero_alt is set but hero is empty");
    const text = body.trim();
    if (!text) why.push("the body is empty");
    if (len(text) > LIMITS.body) why.push(`body is ${len(text)} characters, max ${LIMITS.body}`);
    const html = markdown(text, why);
    if (fm.slug) { if (slugs.has(fm.slug)) why.push(`slug "${fm.slug}" is also used by ${slugs.get(fm.slug)}`); else slugs.set(fm.slug, f); }
    if (why.length) { errors.push(`  ${f}:\n` + why.map((w) => `    - ${w}`).join("\n")); continue; }
    posts.push({ file: f, ...fm, html, chars: len(text), minutes: Math.max(1, Math.ceil(words(text) / 200)) });
  }
  posts.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.file < b.file ? 1 : -1));
  return { posts, errors, drafts };
}

// JSON inside <script type="application/ld+json">: no "<" (so no </script>), and no {{ for the placeholder pass.
export const ld = (o) => JSON.stringify(o).replace(/</g, "\\u003c").replace(/\{\{/g, "{\\u007b");
