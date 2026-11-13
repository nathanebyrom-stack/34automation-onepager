# Starlight: plan for the third theme on 34automation.co.uk

**From:** Dollar · **To:** Jenny · **Written:** Wed 11 Nov 2026 · **Status:** APPROVED by Jenny on 11 Nov 2026 (Nathan signed off). Plan of record for branch `theme-starlight`. Jenny's rulings are in §16; where they differ from the text above them, the rulings win. This file is not shipped: the build only copies `public/`.
**Preview due to Jenny:** 18:00 UK, Mon 16 Nov 2026.

---

## 1. Summary

Starlight is built as **Night plus a class**, not as a third token set. The stored value is `starlight` (same key, `34-theme`), but on the page it becomes `data-theme="dark"` plus `class="starlight"` on `<html>`. That one decision keeps Turnstile, the OS-follow logic, the Day media query and the inner pages working exactly as they do now, because everything that reads `data-theme` still sees `dark`.

What the visitor gets:

1. **A third button** (four-point star icon) in the `.mode` group, with `aria-pressed`.
2. **A colour skin**: deep midnight-indigo base, five saturated accents plus a brighter gold. Each numbered section takes its own accent. Every text pairing passes WCAG AA (lowest ratio in the set is 5.34:1; most are above 7:1).
3. **Three moving infographics**, each using words already on the page or already approved:
   - **The enquiry line** in the statement band, straight after the hero film.
   - **The eight checks** in the Website report section.
   - **How we work** (audit → vision → overhaul), scroll-driven, just above the enquiry form.
4. **Hero film untouched.** I tested this in a scratch copy: with Starlight tokens applied, the hero below the header is pixel-identical to Night at 0, 20, 50 and 80% of the film, at 1440 and 375 px.

Layers load only when Starlight is on: two extra requests (`css/starlight.css`, `js/starlight.js`), budget 13 KB gzip together. Night and Day visitors get zero extra requests and about 1.2 KB gzip of extra text (see §9 for why it isn't exactly zero).

Estimated build: about 26 hours of session time across Thu 12 to Mon 16 Nov, with a defined cut line if it runs short.

**Five things need Jenny's ruling before the build starts. They're in §15.** The three biggest: the header cannot take a third button without changing what Night and Day visitors see; one hash in the CSP header has to change; and the hero rule means Starlight shows no colour for the first nine to eleven screens of scroll.

---

## 2. What I found in the code (verified at `9488cb6`)

### 2.1 Confirmed as briefed

| Claim | Verified | Where |
|---|---|---|
| Night is the default; Day is a token swap | Yes. Night tokens on `:root`; Day under `:root[data-theme="light"]` and again under `@media (prefers-color-scheme:light){:root:not([data-theme="dark"])}` | `public/css/site.css` lines 11–46 |
| Hero is a 192-frame scroll film on a canvas | Yes. 12 sheets of 16 frames, `video/sheets/d` (4.5 MB) or `/m` (1.8 MB) | `public/js/site.js` lines 84–136 |
| Hero stays night in both themes | Yes, by token "islands": the selector `:root,.night,.hdr:not(.on),.why.scrub .pin` re-declares every Night token on those elements, so theme changes at the root don't reach inside them | `site.css` line 11; `index.html` line 58 (`class="stage night"`) |
| Switch is the `.mode` group, key `34-theme`, applied before first paint | Yes | `index.html` lines 31, 48–51; `site.js` lines 4–13 |
| Build is `node scripts/build.mjs`, `public/` → `dist/` | Yes. It only fills `{{PLACEHOLDERS}}` in `.html .xml .txt .webmanifest .json`, `_headers` and `_redirects`. It does **not** touch `.js` or `.css` | `scripts/build.mjs` lines 88–103 |

### 2.2 Things the brief didn't say, and that shape the plan

1. **The inner pages already have the switch.** `clients/index.html`, `privacy/index.html` and `404.html` each carry the two-button `.mode` group, the same inline head script, and `js/theme.js`. The brief (and my own feature register of 10 Nov) said they had none; that was fixed after `22ac475`. See §8 for what this means.
2. **The inline head script is pinned by hash in the CSP.** `public/_headers` allows exactly one inline script: `sha256-Q+jFi9rTE7oLUKc/2cXP9w2xnNkDl7M6zj/tcks+1EU=`. I computed the hash of the inline script in all four built pages and it matches. The script must change to recognise `starlight`, so **this hash must change in the same commit**, on all four pages, or the browser blocks the script everywhere (no pre-paint theme, and the `film` class is never set, which shortens the hero). Nothing in the build checks this today.
3. **There are two films, not one.** The Why-us section (`.why.scrub .pin`) is a second 192-frame film and is a Night island too. Between them, the hero (709vh desktop, 598vh phone, since 13 Nov) and Why-us (606vh) are most of the page's scroll length, and both stay Night in Starlight.
4. **Turnstile reads `data-theme` directly** (`site.js` line 213). If Starlight were `data-theme="starlight"`, that value would be passed to Turnstile as its theme. Keeping `data-theme="dark"` avoids touching Turnstile at all.
5. **The header is packed to the pixel.** Measured in headless Chrome on the built page (§5.5). A third button overflows at 320, 351–414, 431, 1001 and 1101 px if simply added.
6. **There is no automation graph in this repo.** Jenny's note said "building on the existing automation graph"; that graph belongs to the unreleased `Dollar` 3D build. The nearest thing here is one line of copy: "OP 30 · TRIGGER → FILTER → ACTION → OUTPUT … An enquiry lands, gets checked, gets routed, gets answered." The enquiry infographic is built fresh from that sentence.
7. **The whole stylesheet funnels its accent through five tokens** (`--gold`, `--gold-rgb`, `--gold-fill`, `--gold-hi`, `--gold-ink`). Re-declaring them on a section recolours every gold thing in that section with no new component rules. That is how Starlight gets one accent per section cheaply.
8. **S·04 already has per-key colour tokens** (`--s4-1` … `--s4-5`, `--s4-scr`); Day already sets them to green, red and blue. Starlight sets its own five.
9. **Lenis 1.3.27 drives the scroll**, with a test handle at `window.__pace`. Starlight code must tell it when page height changes.
10. **The global reduced-motion rule only shortens transitions** (`*{transition-duration:.01ms!important}`), not animations. Starlight needs its own animation stop.
11. **Baseline text weight** (built `dist/`, gzip level 9): `index.html` 9,491 B · `css/site.css` 9,614 B · `js/site.js` 9,378 B · `js/lenis.min.js` 5,482 B. No page-speed score has ever been recorded for this site (my register, 10 Nov), so there is no baseline to compare against until we take one.
12. **This sandbox cannot open the live site or any `pages.dev` address** (proxy returns 403; checked 11 Nov). All rendering tests run on a local build. Someone with a normal browser has to open the preview URL.
13. **I could not look at quantumstretch.com in this session** (the fetch needed an approval that didn't come). The benchmark in this plan rests on Nathan's description only.

---

## 3. Design approach

**Night is a machine shop after hours. Day is the drawing sheet. Starlight is the same shop with the coloured work lights on.** The films and photographs keep their gold light; colour comes from the interface, the diagrams and the light behind the sections.

- **Base:** midnight indigo instead of graphite, so saturated colour sits on something that isn't neutral grey.
- **One accent per section**, set by re-declaring the gold tokens on the band:

| Section | Accent | Why |
|---|---|---|
| Statement band | Spectrum (all five) | First colour after the film; holds the enquiry line |
| 01 What we offer | Cyan, with WEB cyan · MKT pink · AUTO violet per column | The three codes already exist on the page |
| 02 Services | S·01 cyan · S·02 blue · S·03 violet · S·04 pink | One colour per sheet; S·04's five keys take the five accents |
| 03 Why us | Night (film) | Untouched |
| 04 Work | Green | "Live" reads as green; In build gold; Concept violet |
| 05 Reviews | Gold | Keeps brand gold present mid-page |
| 06 Website report | Cyan | Holds the eight-checks dial |
| How we work (new, Starlight only) | Cyan → violet → pink → gold along the path | Ends on gold: the new brand |
| 07 Start a conversation | Gold | The primary action stays brand gold in every mode |
| Footer | Spectrum top rule | |

- **Small moving touches (CSS only, all scoped to `.starlight`):** section rules draw in as a spectrum line (they already animate `scaleX`); the header's bottom rule becomes a spectrum line; Offer column top rules draw in one after another; the "Live" pill's dot pulses; card frames take their accent on hover; two soft colour light sources drift slowly behind each non-film band (transform only).
- **No starfield of dots.** Nathan's rule bans faded dot and line grids, and a field of faint dots reads as one. "Starlight" is expressed as light: colour glows and light travelling along the diagrams. At most six hand-placed four-point glints per band, varied in size, near headings. Jenny can strike the glints entirely; nothing depends on them.
- **Photographs are not tinted or filtered.** The `.tex` background images keep `--tex-filter:none` and `--tex-k:1`, as in Night.
- **The gold 34.** The logo is an `<img>` with its gradient baked in (`#EDC762 → #B8862A`), so Starlight uses the Night logo unchanged. Its darkest stop is 6.00:1 on the Starlight base.

Honest expectation: I mocked the skin in a scratch copy. Tokens alone read as "Night with coloured trim". The lift Nathan asked for has to come from the three infographics and the bolder touches above. A 2D SVG and CSS build in three days will not match an immersive 3D site; if that's what quantumstretch.com is, Nathan should judge Starlight on the preview against that knowledge.

---

## 4. Token palette, with contrast ratios

Ratios are WCAG 2.x, computed with a script (`/home/claude/starlight-scratch/contrast.mjs`). AA needs 4.5:1 for body text and 3:1 for large text and interface parts.

### 4.1 Surfaces

| Token | Night (now) | Starlight | Note |
|---|---|---|---|
| `--graphite` (page) | `#0E0F11` | `#0A0B1E` | Seam against the film's `#0E0F11` is 1.01:1, hidden by a 2px spectrum rule on the statement band |
| `--plate` (panels) | `#1A1C20` | `#141633` | |
| `--field-hi` (focused field) | `#202329` | `#1C1F45` | |
| `--edge` (rules) | `#2C2F35` | `#3A3F7D` | Decorative. 2.03:1 on base, against Night's 1.43:1 |
| `--shade` / `--plate-rgb` / `--line` | `14,15,17` / `26,28,32` / `212,216,221` | `10,11,30` / `20,22,51` / `241,242,255` | |

### 4.2 Text and accents

| Token | Hex | On base `#0A0B1E` | On plate `#141633` | On field `#1C1F45` | Dark ink `#0A0B1E` on it (buttons) |
|---|---|---|---|---|---|
| `--silver` (text) | `#F1F2FF` | 17.49 | 15.84 | 14.19 | n/a |
| `--steel` (secondary text) | `#A9AED6` | 9.00 | 8.15 | 7.30 | n/a |
| `--ph` (placeholder) | `#8E93C2` | 6.58 | 5.96 | 5.34 | n/a |
| `--err` | `#FF8F7A` | 8.76 | 7.94 | 7.11 | n/a |
| `--gold` / `--gold-fill` | `#FFC857` | 12.65 | 11.45 | 10.25 | 12.65 |
| `--gold-hi` (button hover) | `#FFDD8A` | 14.79 | 13.39 | 11.99 | 14.79 |
| `--sl-cyan` | `#38D6FF` | 11.33 | 10.26 | 9.19 | 11.33 |
| `--sl-blue` | `#7FB0FF` | 8.85 | 8.02 | 7.18 | 8.85 |
| `--sl-violet` | `#B9A0FF` | 8.83 | 8.00 | 7.16 | 8.83 |
| `--sl-pink` | `#FF7EB6` | 8.26 | 7.47 | 6.69 | 8.26 |
| `--sl-green` | `#45E6A4` | 12.14 | 10.99 | 9.85 | 12.14 |

Also: `--gold-ink:#0A0B1E`; `--gold-rgb:255,200,87`; `--s4-1…5` = cyan, blue, violet, pink, green; `--s4-scr` = `#FFC857`; `--sl-spec` = `linear-gradient(90deg,#38D6FF,#7FB0FF,#B9A0FF,#FF7EB6,#FFC857)`.

### 4.3 Special cases checked

| Case | Result |
|---|---|
| Gradient text (statement `em`: cyan → violet → pink) | Every stop is at least 8.26:1 on the base. Falls back to solid text under `forced-colors` |
| Tinted hover panels (accent at 10% over plate) | Steel text 6.63 to 7.00:1; silver 12.88 to 13.61:1 |
| Tinted panels at 18% (upper limit allowed) | Steel 5.42 to 5.98:1 |
| Pressed Starlight button (cyan → violet → pink fill, dark ink) | 8.26:1 or better at every stop |
| Focus ring (accent, 2px) | Every accent is above 8:1 on base; needs 3:1 |
| Night logo on Starlight base | Gold stops 11.99 / 8.76 / 6.00:1; wordmark stops 17.80 / 12.89 / 7.63:1 |
| Inside the films (Night islands) | Night tokens, unchanged: gold 8.00:1, steel 6.11:1 |

For reference, Night today: silver 13.39:1, steel 6.11:1 (5.44 on plate), gold 8.00:1, placeholder 4.90:1 on plate. Starlight is at or above Night on every pairing.

---

## 5. The switch: changes file by file

### 5.1 How the state is stored and applied

| | Stored in `34-theme` | `data-theme` on `<html>` | Class on `<html>` |
|---|---|---|---|
| Night picked | `dark` | `dark` | none |
| Day picked | `light` | `light` | none |
| Starlight picked | `starlight` | `dark` | `starlight` (only on pages that carry `data-sl`) |
| Nothing picked | (empty) | (none: CSS follows the OS) | none |

**Why the OS can never pick Starlight:** the class is added in only two places, both of which require the literal string `starlight` from storage or from a click on the third button. The OS branch (`matchMedia('(prefers-color-scheme: light)')`) can only ever yield `light` or `dark`. No Starlight CSS sits inside a `prefers-color-scheme` query. The test plan asserts this with an empty store under both OS settings and under a live OS change.

### 5.2 `public/index.html` (four edits, nothing else)

1. `<html lang="en-GB">` becomes `<html lang="en-GB" data-sl>`. This is how a page opts in to Starlight.
2. Line 31, the inline head script. Proposed text (473 characters, was 382):

   ```
   document.documentElement.classList.add('js');try{var t=localStorage.getItem('34-theme'),h=document.documentElement;if(t==='starlight'){t='dark';if(h.hasAttribute('data-sl'))h.classList.add('starlight')}if(t==='light'||t==='dark')h.setAttribute('data-theme',t)}catch(e){}try{var c=navigator.connection||{};if(!matchMedia('(prefers-reduced-motion: reduce)').matches&&!c.saveData&&!/(^|-)2g$/.test(c.effectiveType||''))document.documentElement.classList.add('film')}catch(e){}
   ```

   Its hash is `sha256-awvCXkyEqt65hrNmt31rYvnGOI0jp8Y9nDPyT49+iow=`. If one byte changes, the hash must be recomputed.
3. A third button after `#mDay`, same pattern as the other two:
   `<button type="button" id="mStar" data-mode="starlight" aria-pressed="false" aria-label="Starlight" title="Starlight">` + a 12×12 four-point star (`<path d="M6 .5l1.3 4.2L11.5 6 7.3 7.3 6 11.5 4.7 7.3.5 6l4.2-1.3z"/>`, `fill="currentColor"`) + `<span class="t">Starlight</span>`. Add `title="Night"` and `title="Day"` to the other two so icon-only buttons have a tooltip. Unpressed, the star is steel like the moon and sun: no colour leaks into Night or Day.
4. Three empty, hidden mount points (about 150 bytes in total):
   - after `<p class="sub …">` in the statement band: `<div class="sl-ig" data-ig="line" hidden></div>`
   - after the first paragraph under "What's in it" in `#report .txt`: `<div class="sl-ig" data-ig="dial" hidden></div>`
   - between `#report` and `#contact`: `<section class="band sl-ig sl-proc" data-ig="process" hidden></section>`

### 5.3 `public/clients/index.html`, `public/privacy/index.html`, `public/404.html`

The inline head script line only, byte-identical to the home page, so the CSP still needs just one hash. No third button, no `data-sl`. See §8.

### 5.4 `public/_headers`

One value replaced inside `script-src`: the old `sha256-Q+jF…1EU=` becomes the new hash. No source added, no directive loosened. Everything Starlight loads is same-origin and already covered by `'self'`.

### 5.5 `public/css/site.css` (additions only, appended; no existing rule edited)

**a. Header fit.** Measured on the built page with the third button injected:

| Width | Today (two buttons): gap between logo and nav | Third button simply added |
|---|---|---|
| 320 | fits, 23.7 px gap | overflows 7.3 px |
| 351 | overflows 1.1 px (already) | overflows 26.1 px |
| 360 | fits, 13.9 px gap | overflows 17.1 px |
| 375 | fits, 15.5 px gap | **overflows 17.5 px** |
| 390 | fits, 22.7 px gap | overflows 10.3 px |
| 414 | fits, 29.4 px gap | overflows 3.6 px |
| 431 | fits, 26.0 px gap | overflows 11.0 px |
| 1001 | fits, 32.9 px gap | overflows 12.7 px, nav links wrap onto two lines |
| 1101 | fits, 20.0 px gap (the minimum) | overflows 36.9 px, page gains a horizontal scroll |
| 1440 | fits, 134.7 px gap | fits, 24.4 px gap |

I tested squeezing gaps, padding and letter-spacing while keeping every link. It still overflows at 360 (15.1 px), 375 (1.9 px) and 390 (4.7 px). So something visible has to give. Recommended rules, all scoped to `html[data-sl]` so the inner pages' headers don't change at all:

```
@media (max-width:470px){html[data-sl] .mode button{padding:6px}}                 /* 24×24 buttons up to 470, was 430 */
@media (max-width:430px){html[data-sl] .nav a.ca{display:none}}                   /* "Clients" leaves the phone header, was 350 */
@media (max-width:330px){html[data-sl] .nav .btn{padding:9px 3px}html[data-sl] .hdr .wrap{gap:4px}}
@media (max-width:1239px){html[data-sl] .mode .t{display:none}}                   /* icons only below 1240 */
@media (min-width:821px) and (max-width:1239px){html[data-sl] .mode button{padding:7px 9px}}
@media (min-width:1240px){html[data-sl] .mode button:not([aria-pressed="true"]) .t{display:none}}  /* name of the active mode only */
```

Measured with exactly these rules, at 28 widths from 320 to 1920 px and with each of the three buttons pressed in turn (`hdr3.mjs`): no overflow and no wrapped links anywhere. The gap between logo and nav is 43.5 px at 375 and 4.7 px at 320 (the tightest point). Buttons are 24×24 on phones (the WCAG 2.2 AA minimum target), 28×26 from 471 px and 30×26 from 821 px. From 1240 px the logo keeps 99.8 px of clear space with Starlight active, 131.5 px with Night, 147.3 px with Day.

What this changes for Night and Day visitors on the home page: (1) on phones 351 to 430 px wide, the "Clients" link is in the footer only, as it already is below 351 px; (2) from 821 to 1239 px the switch shows icons without the words; (3) from 1240 px it shows the icons plus the name of the active mode. Alternatives are in §15.

**b. Starlight token block** on `:root.starlight` (the §4 values). It lives in `site.css`, not the lazy file, so the first paint is already Starlight for a returning visitor with no flash of Night.

**c. Mount reservation.** `.starlight .sl-ig{display:block}` plus a fixed height per mount and breakpoint, so the page doesn't jump when the lazy script fills them. Target heights, to be frozen after measuring real content at 320, 375, 820 and 1440: line 260 / 420 px (desktop / phone); dial 300 / 520 px; process section 420 / 620 px. `.sl-fail .sl-ig{display:none}` collapses them if the lazy script fails to load.

**d. Pressed state** of the Starlight button (gradient fill, dark ink).

Target for a+b+c+d: at most 1.8 KB raw, 600 B gzip.

### 5.6 `public/js/site.js`

Only the theme block (lines 4–13) is replaced. Lines 14 onward, including Turnstile and both forms, are not touched.

- `cur()` returns `starlight` if the class is present, otherwise today's logic.
- `set(mode)`: `starlight` → `data-theme="dark"` + add class (only when `<html>` has `data-sl`); anything else → remove class, set `data-theme`.
- On load: accept `light`, `dark` or `starlight` from storage.
- On click: do nothing if the mode is already current; otherwise hold the scroll position (below), `set`, store, repaint.
- **Lazy loader.** When Starlight becomes current for the first time, append `<link rel="stylesheet" href="/css/starlight.css?v=…">` and `<script src="/js/starlight.js?v=…">`. The cache-buster is read from `document.currentScript.src` (captured at the top of `site.js`), because the build doesn't fill placeholders in `.js` files. `onerror` on the script adds `sl-fail` to `<html>`.
- **Holding the scroll position.** Switching into or out of Starlight changes the height of content above the reader (the mounts appear or disappear). Before the change, record the top of the first `.band` still on screen; after it, correct by the difference with `window.__pace.scrollTo(y,{immediate:true,force:true})`, or `scrollBy` when Lenis is off. Inside the hero nothing above moves, so no correction happens there.

Target: at most 600 B raw, 300 B gzip added.

### 5.7 `public/js/theme.js` (inner pages)

Two small changes: treat a stored `starlight` as `dark`; and a click on the already-pressed button writes nothing, so pressing "Night" on the privacy page doesn't silently erase a visitor's Starlight choice.

### 5.8 New files

- `public/css/starlight.css`: everything scoped under `.starlight`. Section accents, glows, infographic styles, its own reduced-motion block.
- `public/js/starlight.js`: fills the three mounts, runs the observers and the one shared scroll handler.

### 5.9 `scripts/build.mjs` (recommended, optional)

Add a ten-line guard: after the build, hash every inline `<script>` in `dist/*.html` (skipping JSON-LD) and stop the build if the hash isn't in `dist/_headers`. It turns finding 2.2-2 from a silent production fault into a failed build. It's Jenny's call because it also runs on `main` after a merge.

### 5.10 Not touched

`functions/**`, `wrangler.toml`, `site.config.json`, `_redirects`, `js/lenis.min.js`, `js/clients.js`, `reviews.json`, fonts, images, both films, `redirect/`, `.github/`, DNS, and every existing CSS rule.

---

## 6. The infographics

**Shared rules.** Labels are real HTML text in the site's own fonts; the drawing is inline SVG marked `aria-hidden`. (SVG text inside a scaled `viewBox` shrinks to about 3 px on a phone, so it can't carry reading text.) Animation uses only `transform`, `opacity` and `stroke-dashoffset`. No canvas, no SVG blur filters on moving parts, no images, no numbers that aren't on the page. Each figure animates only while it's on screen.

### 6.1 The enquiry line

| | |
|---|---|
| **What it shows** | One enquiry moving through four stations without anyone touching it, while a separate "You" lane stays undisturbed. The paragraph above it says nothing waits for you; the diagram shows it |
| **Where** | Statement band, under "…Nothing waits for you to come off the shop floor." First thing after the hero film |
| **Structure** | `<figure>` with a caption, an ordered list of four stations (node, mono tag, label), a track with three "packets", and the "You" lane. Horizontal from 821 px; vertical (track down the left edge) on phones |
| **Colours** | Lands cyan · Checked blue · Routed violet · Answered green · You gold |
| **Animation** | *Arrival (scroll-linked):* the track draws in with scroll using the same progress formula as the S·04 panel (`site.js` line 80); stations switch on at 15, 40, 65 and 90% with one ring pulse each. *Then (loop while on screen):* three packets travel the track on a 4.8 s loop, 1.6 s apart; each station flashes as a packet passes. The "You" dot breathes slowly and never reacts |
| **Reduced motion** | Track fully drawn, all stations on, no packets travelling, one packet resting at "Answered", no breathing |
| **Labels needed** | Caption; four station names; four tags; "You" lane text; a one-line text alternative. See §13 |
| **Source of every claim** | "An enquiry lands, gets checked, gets routed, gets answered" and "TRIGGER → FILTER → ACTION → OUTPUT" (`index.html` line 156); "while you are on the machine" (line 89). No figure used |

### 6.2 The eight checks

| | |
|---|---|
| **What it shows** | The eight things the report scores, named, then the same eight checks run on five competitors. Today that is one dense paragraph |
| **Where** | `#report .txt`, directly under the paragraph that lists the eight things |
| **Structure** | An inspection dial in SVG: eight equal arc segments, a sweep hand, and five thin inner rings. Beside it (below it on phones), the eight names as a numbered list of chips, and a two-item legend. Chip *n* matches segment *n* by number and colour |
| **Animation** | Plays once when 35% visible, and resets if scrolled back above, like S·04. 0–4 s: the hand sweeps once round; segment and chip *n* light as it passes. 4–6.5 s: the five rings draw one after another. Then the hand parks at twelve o'clock and it's still |
| **Reduced motion** | The finished state: eight segments lit, five rings drawn, hand parked |
| **No invented data** | Segments are equal length and rings are complete circles. Nothing has a height, a fill level or a number, so nothing implies a score |
| **Labels needed** | Caption; legend. The eight names are verbatim from the page. See §13 |
| **Source** | "first impression, clarity of offer, technical detail, mobile, speed, enquiry path, trust signals and SEO basics" and "your five closest competitors go through the same checks" (`index.html` lines 258, 265) |

Not a dot matrix: I considered a 6 × 8 grid of ticks and dropped it because a regular grid of marks is too close to the banned dot-grid look.

### 6.3 How we work

| | |
|---|---|
| **What it shows** | The client process in three steps: Audit → Vision → Overhaul |
| **Where** | A new, unnumbered, Starlight-only section between 06 Website report and 07 Start a conversation. The form below it asks "Where's your brand now?", which is step one |
| **Structure** | A section label, then an ordered list of three steps (number, title, one line). Behind them an SVG path: a rising curve left to right from 821 px, a vertical line on phones |
| **Animation** | Scroll-linked in both directions, no pin (the page already has two long pins). The path draws with scroll; steps appear at 12, 45 and 78%; a four-point star rides the head of the line; the stroke runs cyan → violet → pink and ends in gold at step three |
| **Reduced motion** | Fully drawn, all three steps visible, star at the end |
| **Labels needed** | Section label, three titles, three lines. See §13 |
| **Source of "four to five years"** | Nathan's copy interview, 23–24 Oct 2026. The wording is in the Phase 7 copy he approved on 25 Oct and was confirmed by Edie on 29 Oct (`claude/edie/reviews/2026-10-29-social30-w1-34-automation.md`). It is not yet on this site in any mode |

### 6.4 Considered and not chosen

- **Services as an animated map.** The Services grid already carries two animations (the S·02 glass carousel and the S·04 panel), and a map of how the four join up would repeat the enquiry line. Service colour-coding does the job instead. It is the first thing to add if there's time left.
- **Animated stat counters.** There are no real figures to count.

---

## 7. Starlight-only layers: loading and reduced motion

**Loading**

| Visitor | Extra requests | What runs |
|---|---|---|
| Night or Day | 0 | One extra string comparison in the head script |
| Starlight, returning | 2 (`starlight.css`, `starlight.js`), after `site.js`, deferred | Skin paints first from `site.css`; mounts are far below the fold and are filled when the script arrives |
| Switches to Starlight mid-visit | 2, on the click | Skin changes at once; diagrams appear when loaded |
| Switches away | 0 | Class removed; every Starlight rule and animation stops because all of it is scoped to `.starlight`; the scroll handler returns early |

**Reduced motion.** The site reads `prefers-reduced-motion` once at load; Starlight follows the same convention.

- `starlight.css` ends with `@media (prefers-reduced-motion:reduce){.starlight *{animation:none!important}}` and sets each figure's finished state.
- `starlight.js` sets progress to 1 and starts no loops, the way S·04 does (`if(still)p=1`).
- Glows don't drift; glints don't twinkle; the header line doesn't sweep.

---

## 8. Inner pages (client area, privacy, 404)

They already have a two-button switch, so "no switch" isn't an option to preserve. Recommended behaviour, with no new scope:

- A visitor who chose Starlight sees these pages in **Night**, with "Night" shown as pressed.
- Their Starlight choice is kept. Pressing "Night" there changes nothing. Pressing "Day" is a real choice and replaces it.
- No third button, no Starlight CSS or JS loaded.

Cost: the one-line head script in three files (needed anyway for the single CSP hash) and two small changes in `theme.js`. Any inner page can opt in later by adding `data-sl` and the button.

---

## 9. Performance budget and how it's measured

### 9.1 Budget

| | Baseline (gzip) | Allowed change |
|---|---|---|
| `index.html` | 9,491 B | + 350 B |
| `css/site.css` | 9,614 B | + 600 B |
| `js/site.js` | 9,378 B | + 300 B |
| **Night / Day total** | | **+ 1.25 KB or less, 0 new requests** |
| `css/starlight.css` (Starlight only) | new | 4 KB or less |
| `js/starlight.js` (Starlight only) | new | 9 KB or less |
| Images, fonts, video for Starlight | | none |

Runtime, Starlight: no canvas; at most 12 CSS animations running at once; `starlight.js` start-up under 30 ms at 4× CPU slowdown; layout shift 0.02 or less; blocking time no more than 30 ms above Night.

**Why Night and Day aren't exactly zero.** The Starlight tokens sit in `site.css` so a returning Starlight visitor never sees a flash of Night. A script-inserted stylesheet doesn't reliably block the first paint, and `document.write` would break the cache-buster (the build would have to rewrite the inline script on every deploy, changing the CSP hash each time). The price is about 0.6 KB of CSS that Night and Day visitors download and never use.

### 9.2 Measuring

1. **Before any change**, build `main@9488cb6` and record Lighthouse mobile for Night and for Day: five runs each, median, all four categories plus LCP, TBT, CLS and transfer size. This is the baseline that doesn't exist yet.
2. **Harness:** `npx wrangler pages dev dist` (it applies `_headers`, so the real CSP is in force locally). Fallback: a 40-line Node server that reads the `/*` block of `dist/_headers`.
3. **After the build**, same harness, same machine: Night and Day again, then Starlight. Lighthouse clears storage by default, so Starlight is run through Puppeteer with `34-theme` pre-set and `disableStorageReset`. Lighthouse 13.6.0 is reachable from the sandbox through `npx`.
4. **"Night unchanged" means:** no category score lower in the median of five; performance within 2 points (run-to-run noise); LCP, TBT and CLS within 5%; transfer size up by no more than 1.25 KB. Same test for Day.
5. **Bytes:** a script prints gzip sizes of the four text files against the table above and fails if any is over.
6. These are local figures. An edge figure for the preview URL needs someone with a normal browser to run PageSpeed Insights on it (§2.2-12).

---

## 10. Test plan, mapped to the done criteria

Scripts live in `scripts/qa/` on the branch. They are not shipped (the build copies only `public/`). Playwright with the installed Chrome, as used for the measurements in this plan.

| Done criterion | Test | Pass means |
|---|---|---|
| Preview URL builds clean | `STRICT=1 node scripts/build.mjs` locally; then the Cloudflare Pages check on the pushed commit, read through the GitHub API | Build passes; CSP guard passes; the check is green and gives the preview URL |
| Renders at 375 and 1440 in all three modes | Matrix: Night, Day, Starlight × 375×812, 1440×900 × motion on and reduced. Stills at 14 positions each (the positions already in `capture-34.mjs`, plus report and process). Also 320, 360, 390, 430, 431, 820, 821, 1001, 1101, 1240 for the header only | No horizontal scroll at any width; header on one row; no text clipped or overlapping in the stills, checked by eye |
| Switching works both ways | Night → Starlight → Day → Starlight → Night by click and by keyboard (Tab, Enter, Space) | `aria-pressed` right after every step; exactly one button pressed; class and `data-theme` match the table in §5.1 |
| Survives a reload | Reload after each choice, under OS light and OS dark | Same mode returns; correct on the first painted frame (screenshot at `domcontentloaded`) |
| OS never picks Starlight | Empty storage under OS light and OS dark; then flip the OS setting mid-visit | Starlight never applied; with Starlight stored, an OS flip changes nothing |
| Lazy, no cost to Night / Day | Network log in each mode | Night and Day: no request for `starlight.css` or `starlight.js`. Starlight: exactly those two extra |
| Hero unchanged | Screenshot the stage below the header in Night and in Starlight at 0, 20, 50, 80% of the film, both widths | Byte-identical. (Already true in the scratch test with tokens alone; this guards the layers) |
| Reduced-motion check | `reducedMotion:'reduce'` in all three modes | `document.getAnimations()` has nothing running after settling; two stills taken 2 s apart are identical; each infographic is in its finished state |
| No console or CSP errors | Console, `pageerror` and `securitypolicyviolation` listeners through a full scroll in each mode, with the real CSP header in force | Empty. Note: on a `pages.dev` address Turnstile may log a hostname error because the widget is registered for the live domain only (README §4). That is not caused by this work and would be the same on any preview; I could not confirm it from here |
| Contrast | axe-core `color-contrast` in all three modes at both widths; gradient text and the pressed button checked against §4.3 by hand | No violations; table values hold in the built CSS |
| Inner pages | With `starlight` stored, open `/clients/`, `/privacy/`, a 404 | Night; two buttons; pressing Night keeps `starlight` stored; pressing Day stores `light` |
| Scroll position on switch | Switch at five positions down the page, both widths | The element at the top of the screen moves by 2 px or less |
| Lighthouse | §9.2 | Night and Day unchanged by the definition there; Starlight's four scores and metrics reported |
| 20–30 s capture | Two new rows in the existing `capture-34.mjs` (frame-stepped, 30 fps): `V17` phone 390×844 and `V18` desktop. Each is two takes joined: (a) at the statement band in Night, tap the star, hold, scroll to the lit S·04 card, 13 s; (b) report dial → How we work → form, 12 s. Small script changes: `colorScheme` stays `dark` for Starlight; toggle shots learn `#mStar` | A 25 s MP4 made in the sandbox from the local build, plus the updated script ready to run on the Mac against the preview URL |

Report to Jenny: branch, preview URL, commits, the three Lighthouse sets, byte table, the stills, the MP4, and the copy list with Edie's verdicts.

---

## 11. Build steps, in order

| # | Step | Est. |
|---|---|---|
| 0 | Baseline: build `main`, harness up, Lighthouse Night and Day ×5, byte table, header measurements saved | 1.5 h |
| 1 | Switch: head script ×4 pages, new hash in `_headers`, CSP guard in `build.mjs` (if approved), third button, `site.js` theme block, `theme.js`, header rules. **Create `theme-starlight`, push, and confirm Cloudflare builds a preview for it** | 2.5 h |
| 2 | Skin: token block, section accents, S·04 key colours, form chips, pills, spectrum rules, glows | 3 h |
| 3 | Plumbing: mounts and reserved heights, lazy loader, `starlight.js` skeleton, scroll hold on switch, Lenis resize, `sl-fail` | 2 h |
| 4 | Infographic 1, the enquiry line (both layouts, reduced motion) | 3.5 h |
| 5 | Infographic 2, the eight checks | 3.5 h |
| 6 | Infographic 3, How we work | 3 h |
| 7 | Reduced-motion and keyboard pass; contrast run; freeze mount heights | 2 h |
| 8 | Full test matrix, Lighthouse ×3 modes, fixes | 3 h |
| 9 | Capture (V17, V18), report to Jenny | 1.5 h |
| | **Total** | **about 26 h** |

**Suggested days:** Thu 12 Nov steps 0–2 · Fri 13 Nov steps 3–4 · Sat 14 Nov steps 5–6 · Sun 15 Nov steps 7–8 · Mon 16 Nov step 9, report to Jenny by 15:00, three hours clear of the deadline.

**Copy runs in parallel.** The draft list in §13 goes to Jenny on Thu 12 Nov. Edie's verdict is needed by midday Sun 15 Nov so approved wording is in the preview Nathan sees.

**Cut line, in this order, if time runs short:**
1. Drop the glints.
2. Drop the five competitor rings from the dial (keep the eight checks).
3. Drop the eight-checks dial entirely. The preview then has two infographics, the minimum asked for.

Never cut: the switch, the header fit, the CSP hash, reduced motion, the hero test.

---

## 12. Risks

| Risk | Likelihood | Effect | What I'll do |
|---|---|---|---|
| Head script changed without the hash, or the two drift later | Medium without the guard | Theme script blocked on every page in production | Build guard (§5.9); CSP test with the real header locally |
| Cloudflare isn't set to build non-`main` branches | Unknown from the repo | No preview URL | Push right after step 1 on Thursday so we know four days early; fix is a dashboard setting (§14) |
| Nobody in a sandbox can open the preview | Certain (proxy 403) | Edge-only faults go unseen until Nathan looks | Real CSP header in the local harness; someone with a browser opens the URL before it goes to Nathan |
| Starlight looks unchanged at the top of the page | Certain, by the hero rule | Nathan taps the star and sees almost nothing for nine to eleven screens | §15 item 3; the capture starts at the statement band |
| Skin reads as "Night with trim", short of the benchmark | Medium | Nathan underwhelmed | The infographics carry the lift; glow strength and accent fills can go bolder inside the AA numbers in §4.3; benchmark still needs a look by someone who can open it |
| Draft labels not approved in time | Medium | An infographic can't be shown | Infographics 1 and 2 reuse words already on the page; only How we work brings wording new to this site. Any figure whose copy isn't passed stays hidden in the preview |
| Page jumps when switching mid-page (Safari has no scroll anchoring) | Medium | Reader loses their place | Scroll hold in the click handler; tested at five positions. Safari itself can't be tested here: Playwright WebKit as a stand-in, real iPhone check by Nathan |
| Glow layers cost frames on older phones | Low to medium | Jank in Starlight only | Transform-only, paused off screen, two per band at most; drop to static gradients if blocking time passes budget |
| Glints or dial read as a "dot grid" | Low | Breaks Nathan's standing rule | No regular patterns anywhere; glints optional; dial is arcs and rings, not dots |
| "Clients" leaving the phone header annoys a client | Low | Slower route to sign-in on a phone | It's in the footer, and emailed personal links go straight to the Brand Builder; alternative in §15 |
| `starlight.js` fails to load | Low | Empty reserved boxes | `onerror` collapses them (`sl-fail`) |
| How we work exists in Starlight only | Certain | Night and Day visitors never see the process | Accepted for the preview; a still version for Night and Day is a sensible follow-up, outside this job |

---

## 13. DRAFT copy for Edie

Everything below is draft. None of it ships until it has been through humanize, slop-gate and Edie. "Existing" means the words are already live on this page and are only being placed in a diagram.

**Switch**

| # | Where | Text | Status |
|---|---|---|---|
| 1 | Third button: label, `aria-label`, tooltip | Starlight | Name locked by Nathan |
| 2 | Tooltips on the other two | Night · Day | Existing |

**Infographic 1, the enquiry line (statement band)**

| # | Where | Text | Status |
|---|---|---|---|
| 3 | Caption | One enquiry, start to finish | NEW |
| 4 | Station names | Lands · Checked · Routed · Answered | Existing sentence, cut to single words |
| 5 | Station tags | Trigger · Filter · Action · Output | Existing (OP 30 line) |
| 6 | Lower lane | You · On the machine | NEW label; phrase is existing |
| 7 | Text alternative for screen readers | An enquiry lands, is checked, routed and answered. None of it waits for you. | NEW |

**Infographic 2, the eight checks (Website report)**

| # | Where | Text | Status |
|---|---|---|---|
| 8 | Caption | Eight checks. Your site first, then five competitors. | NEW (both numbers are on the page) |
| 9 | Chips | First impression · Clarity of offer · Technical detail · Mobile · Speed · Enquiry path · Trust signals · SEO basics | Existing, verbatim |
| 10 | Legend | Your site · Five closest competitors | Existing words |

**Infographic 3, How we work (new section)**

| # | Where | Text | Status |
|---|---|---|---|
| 11 | Section label | How we work | NEW on this site |
| 12 | Step 1 | 01 Audit. Where your brand is right now. | Approved wording elsewhere ("Where the brand is right now, warts and all"); shortened here |
| 13 | Step 2 | 02 Vision. How you see the business changing with technology over the next four to five years. | Verbatim from the wording Edie confirmed on 29 Oct |
| 14 | Step 3 | 03 Overhaul. A new brand, and the full design overhaul to match. | Verbatim, same source |

Nine new strings in all (rows 3, 6, 7, 8, 11 and the placement of 12–14). No headline, no paragraph, no figure that isn't already published or approved.

---

## 14. Open questions for Nathan

None that stop the build from starting.

One conditional: **if** the first push to `theme-starlight` on Thursday shows no Cloudflare check on the commit within ten minutes, preview builds for non-`main` branches are switched off, and only someone with the Cloudflare login can turn them on (Pages project → Settings → Builds → branch control). Default for a Pages project is on, so this probably won't come up.

His sign-off on the preview before any merge stands as briefed.

---

## 15. For Jenny to decide or push back on

1. **The header has to change for Night and Day visitors too.** Recommended (§5.5): "Clients" drops out of the phone header between 351 and 430 px, and the switch shows icons, with only the active mode named from 1240 px. Alternatives:
   - Phones: keep a client-area link as a 24 px icon. By my arithmetic (not measured) it fits at 360 px with under 2 px to spare, which is fragile, and it adds a new icon to Night and Day.
   - Desktop: all three names from 1240 px. It fits, but leaves 24 px between the logo and the first nav link (134.7 px today).
   - Not available: keeping every link and three buttons at 375 px. I tested it; it overflows.
2. **"The CSP stays as it is" needs one exception:** one `sha256` value in `script-src` is replaced, because the inline script it pins must change. No source is added. Please also say yes or no to the build guard in `build.mjs`.
3. **The hero rule makes Starlight invisible at the top.** Tap the star at the top of the page and only the header changes, for the whole length of the film. Options: (a) accept it, and have the capture and any link to the preview start at the statement band; (b) allow the 2 px progress line at the bottom of the film to take the spectrum. It's stage chrome, not the film's pixels, but it does sit on the stage, so it needs your reading of "around, not over". The plan assumes (a). I'd choose (b).
4. **"No cost to Night and Day" is about 1.2 KB, not zero**, and no extra requests (§9.1). The alternative is a flash of Night before Starlight on every return visit.
5. **Inner pages:** the brief said they have no switch; they do. Please confirm the behaviour in §8.

Also worth knowing:

- I couldn't open quantumstretch.com, so the benchmark is unverified on my side. Someone who can open it should compare before the preview goes to Nathan.
- No starfield of dots, on purpose (§3). If Nathan expects stars from the name, he'll need telling why there aren't any.
- I chose the report's eight checks over the services map from your list (§6.4). Say if you'd rather have the map.
- How we work puts the three-step process on this site for the first time, and only in Starlight.
- Lighthouse "Night unchanged" can only be shown as a like-for-like local comparison. No score for the live site has ever been recorded.

---

## Appendix: evidence kept from planning

In `/home/claude/starlight-scratch/` (outside the repo, not committed):

- `hdr.mjs`, `hdr2.mjs`, `hdr3.mjs`: the header measurements in §5.5 (today, the options tried, and the recommended rules).
- `contrast.mjs`: the ratios in §4.
- `proto.css`, `proto.mjs`: the scratch token skin and the hero pixel test. `proto.css` is a sketch, not the build's CSS.
- `serve.mjs`: the static server used.
- Five stills of the scratch skin: statement band, Offer and Services at 1440; Offer and the hero mid-film at 375.

All of it ran against a throwaway copy of the repo built in `/tmp`. The clone itself was only read.

---

## 16. Jenny's rulings (11 Nov 2026), which override the sections above

**On §15**

1. **Header:** the recommendation stands. Below 1240 px the switch shows icons only; from 1240 px, icons plus the active mode's name. Between 351 and 430 px "Clients" leaves the phone header and stays in the footer. Jenny tells Nathan, because Night and Day visitors see this.
2. **CSP:** replace the one `sha256`. The build guard in `scripts/build.mjs` goes in.
3. **Hero:** option (b). The 2 px progress line under the film takes the spectrum in Starlight. That counts as around the film, not over it. Nothing else on the stage changes.
4. **Cost to Night and Day:** about 1.2 KB gzip is accepted.
5. **Inner pages:** the §8 behaviour is confirmed.

**Changes to the plan**

- **Bolder skin.** "Night with coloured trim" is not enough. Take the skin to the bold end of what §4.3 allows: tinted panels up to the 18% ceiling where the AA numbers hold, stronger glows, accent fills used confidently. Glints stay: hand-placed, varied, no regular pattern.
- **Services map** is the first thing to add if time is left after step 8. The cut line in §11 stays as written.
- **Start now**, not Thursday.

**Process**

- Branch `theme-starlight`. Never merged to `main` without Nathan's sign-off on the preview.
- Push straight after step 1 and confirm Cloudflare builds a preview. If it doesn't, tell Jenny at once; no workaround.
- New strings: nothing ships until Edie passes it. The §13 list goes to Jenny as soon as step 1 is pushed. Until then drafts are used in the preview and marked in code with a `DRAFT-COPY` comment.
- Report to Jenny at each push (commit hash and contents), and as soon as anything threatens the report-in at 15:00 on Mon 16 Nov. The final report covers everything in §10.

---

## 17. Build record (12 Nov 2026)

What was built against this plan, and where it differs. Figures are from the branch build served locally with the real CSP header (`scripts/qa/serve.mjs`); the sandbox cannot open the preview address.

**Built as planned:** the switch (§5), the palette (§4), the three infographics (§6.1 to §6.3), lazy loading and reduced-motion states (§7), inner-page behaviour (§8), the CSP hash and build guard.

**Differences from the plan**

| Plan | Built | Why |
|---|---|---|
| Three empty mounts in `index.html` | Two (enquiry line, How we work). The dial's and the services map's mounts are created by `js/starlight.js` | An empty element between a paragraph and a heading in the report cost Night and Day 14 px of margin. Caught by the pixel comparison against `main` |
| Fixed heights reserved for each diagram (§5.5c) | None reserved. `starlight.css` arrives switched off (`media="not all"`) and is switched on in the same step as the mounts are filled, with the reader's place held across that step | One measured correction instead of guessed heights; holds to within about 1 px in 30 switches at each size |
| Scroll hold in `site.js` (§5.6) | In `js/starlight.js`, exposed as `window.__slHold`; the header switch runs its change through it once it exists | Keeps Night and Day's download inside the budget |
| `--s4-*` and `--sl-spec` tokens in `site.css` | In `starlight.css` | Not needed for the first paint |
| Hero stage untouched (§1, §15.3 option a) | The 2 px progress line takes the spectrum | Jenny's ruling 3 |
| Glints optional, up to six per band | Three to five per band, each placed inside the band's empty top margin (position and size are shares of that margin) | So none can sit behind text at any width |
| Glow strength one value | Capped per colour: violet, pink, blue 0.30; cyan 0.26; green, gold 0.24; work band 0.18 | Keeps secondary text at 5.00:1 or better at a glow's centre |
| Services map not chosen (§6.4) | Built as a fourth infographic, above the four service cards | Jenny: first thing to add with time left |
| Per-file byte split (§9.1) | `site.js` +466 B (planned +300), `starlight.css` 5.7 KB (planned 4) | Totals are inside the budget: Night and Day +1,170 B (limit 1,250); Starlight 11.7 KB (limit 13) |

**Results**

| Check | Result |
|---|---|
| Night and Day against `main` | Pixel-identical below the header: home, client area, privacy; 375 and 1440 px (`scripts/qa/regress.mjs`) |
| Switch | 47 checks pass: OS never picks Starlight, both ways by click and keyboard, reload, lazy requests (0 for Night and Day, 2 for Starlight), inner pages, header one row at 24 widths from 320 to 1920 px in each mode (`switch.mjs`) |
| Render matrix | Three modes x 375 and 1440 x motion and reduced: no sideways scroll, no console or CSP errors, axe no violations (`matrix.mjs`) |
| Reduced motion | Nothing running in any mode; every diagram finished and still |
| Hero stage | Identical to Night at 0, 20, 50, 80% of the film, both sizes, apart from the progress line |
| Contrast | Every pairing at or above 4.5:1, text over glows included (`contrast.mjs`) |
| Lighthouse mobile, median of 5, before then after | Night 95/100/100/100 then 96/100/100/100. Day 93/100/100/100 then 93/100/100/100. Starlight 93/100/100/100 (LCP 2.70 s, CLS 0, 29 requests). Blocking time ranged 150 to 210 ms across all runs in all modes, baseline included |
| Capture | `scripts/qa/capture-starlight.mjs`: 28 s, phone and desktop, from the local build or the preview address |

**Still open**

- Nobody has opened the preview address in a real browser yet. Safari and a real phone are untested.
- Copy: Edie passed it on 12 Nov 2026 with three fixes, all on the services map and all applied: the caption is now "Where each service fits"; S·01 Website Overhaul is a point at Visit with the line "At the visit" (its card promises nothing about search); S·04's line is "From enquiry to order updates". The `DRAFT-COPY` markers are gone. How we work is left as written: Nathan decides on that wording (Edie's advisory: step 03 may read as the only destination).
- Not merged. `main` is untouched. Merge only on Nathan's sign-off of the preview.

