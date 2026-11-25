# content/news/

Approved News posts, one Markdown file each. The build (`node scripts/build.mjs`) turns them into `/news/` and `/news/<slug>/`.
This README is not a post: the build skips it.

## News switches itself on and off

There is no on/off flag to remember. **While this folder holds no approved post, News is off:** no News link in the header or footer, no `/news/` page (it returns the 404 page), no home-page teaser and nothing in `sitemap.xml`. The first approved post turns all of it on in the same deploy.

`site.config.json` holds the other settings:

| Key | What it does |
|---|---|
| `newsMode` | `"archive"` (default): every approved post is built and listed at `/news/`, newest first. `"replace"`: only the newest is built; each older slug gets a 301 to `/news/` in `_redirects` and leaves the sitemap. Older files stay here as the record. |
| `newsIndexIntro` | The line under the News heading at `/news/`. Left out while empty. |
| `newsIndexDescription` | The meta description of `/news/`. The newest post's standfirst while empty. |
| `newsCloser` | One closing line at the end of every post, linked to `/#contact`. Left out while empty. |

## File name and front-matter

File name: `YYYY-MM-DD-<slug>.md`, matching `date` and `slug` below.

```
---
title: "…"            # max 60 characters (the page's h1; <title> adds " · 34 Automation")
slug: "…"             # lower-case-hyphens, unique, max 60
date: 2026-11-30      # datePublished
updated: 2026-11-30   # dateModified, not before date
author: "34 Automation"   # "34 Automation" gives Organization in the schema; any other name gives Person
meta_description: "…" # max 155
standfirst: "…"       # max 200; also the home teaser and og:description
hero: ""              # optional, a path under /img/ (file in public/img/); empty uses /og.jpg for sharing
hero_alt: ""          # required if hero is set, max 125
status: approved
approved_by: Nathan
approved_at: 2026-11-30T11:45
---
```

Optional `draft: true` keeps a file here without building it, in every build. Anything else fails the build.

## Body

Target 6,000 characters including spaces; **hard max 7,000** (the body as written, not counting front-matter, title or standfirst).
Allowed: `##` and `###` headings, paragraphs, `-` and `1.` lists (one line per item), `**bold**`, `*italic*`, `[links](https://…)` (also `http://`, `mailto:`, `/…` and `#…`), and `>` quotes.
Not allowed, and the build stops on them: raw HTML, `#` headings, `####` and below, code, images in the body, tables, indented or nested lists, horizontal rules.

## The build stops (and the current post stays up) when

a post is over a limit, has a missing, duplicated or unknown front-matter field, has `status` other than `approved`, `approved_by` other than `Nathan`, a bad date, a file name that doesn't match, a missing hero file or alt text, or anything outside the Markdown above.

QA: `node scripts/qa/news.mjs` runs all of this against test posts it writes outside the repo.
