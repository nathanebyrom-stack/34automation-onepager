# Drawing sheet with pencil pass and 3D flange: implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the stretched bitmap behind "Imagine you never missed a call" and "01 What we offer" with a fine vector engineering drawing that a pencil goes over once, plus a flange view that turns in 3D.

**Architecture:** The drawing is built in the browser as inline SVG by one new script, styled by one new stylesheet. Both are fetched only when the sheet is near the screen, the same way the Starlight layers are, so the home page's first load does not grow. The pencil is a CSS animation on the clock; the flange is a few ellipses redrawn each frame.

**Tech stack:** Plain HTML, CSS and JavaScript as the rest of the site. No libraries. Built by `scripts/build.mjs`, served by Cloudflare Pages.

**Spec:** Nathan's instructions in the session of 14 Nov 2026 and the approved example at https://claude.ai/artifact/H2Nz61McCCSvafijgDrXjU (version 6). This file is not shipped: the build copies `public/` only.

## What Nathan asked for (his words, 14 Nov 2026)

1. "a really nice looking engineering drawing to sit as a backdrop ... with dimensions, annotations etc. It should be clear but not a distraction", "more fine than it appears here".
2. "sketched over in a darker pencil over a 20-30 second time line".
3. "if the viewer scrolls past the drawing should still continue until sketched darker and then stop".
4. After the first example: "I would like to see more of it drawn in ... like a full drawing". Then: "Pencil dimensions too" (lines and arrowheads; figures and notes stay light).
5. "animate the flange that sits on the right hand side so it becomes 3d and able to rotate", then "slowly rotating right from the start".
6. "change the font colour to a bright white so it doesnt get lost against the drawing".
7. "Yes, build it."

## Global constraints

- Night, Day and Starlight must all work. Starlight is Night plus `.starlight` on `<html>`.
- The CSP in `public/_headers` is not changed. No inline script is added or edited (the build stops if an inline script's hash is missing). Scripts and styles come from `'self'`.
- Night and Day visitors must not download the drawing code before the sheet is near: `js/site.js` and `css/site.css` may only gain a loader and a few colour tokens.
- Reduced motion: the finished drawing, no animation, the flange still but turnable by hand.
- Without JavaScript: the old bitmap, whole and still, as now.
- The pencil runs once for 30 seconds on the clock. It never follows the scroll, loops or rewinds.
- Only text stays light in the drawing: figures, notes, title block and border lettering.
- Page text over the drawing is `#FFFFFF` in Night and Starlight. Day keeps `#16181C` and `#4E545C`. Starlight's gradient heading is left alone.
- No page scrolls sideways at any width. The grab handle must not cover any link, button or field.

## Review focus

1. Theme switched while the pencil is mid-sketch: lines must change colour at once and the sketch must carry on, not restart.
2. The sheet scrolled off screen mid-sketch: the pencil finishes anyway; the flange stops redrawing until it is back.
3. Phone width (375): the flange view is cropped off the right edge. Its grab handle must be off screen too and must not block vertical scrolling.
4. `css/sheet.css` slow or failed: no unstyled black SVG shapes may flash. The script is only added after the stylesheet has loaded.
5. A class name in the drawing matching one the site already uses (`.fr`, `.on`, `.sl`): every drawing rule is scoped under `#dwg`.

## Files

| File | Change |
|---|---|
| `public/js/sheet.js` | New. Builds the SVG drawing, the pencil strokes and timeline, the 3D flange and its drag handling. |
| `public/css/sheet.css` | New. Drawing, pencil, flange and grab-handle styles, and the drawing's own colour tokens per theme. |
| `public/index.html` | The old `<img>` moved into `<noscript>`. Nothing else: `sheet.js` builds `.dwg > svg#dwg` and `.dwg-hit > #grab` itself, so a visitor without the script gets no empty tab stop. |
| `public/js/site.js` | The old scroll-linked sweep (the block starting "the drawing sheet (Nathan, 13 Nov)") replaced by a loader. |
| `public/css/site.css` | `--on-sheet` and `--on-sheet-soft` in the three token blocks; text rules; the old mask rule reduced to the no-JS case. |

---

### Task 1: Markup, tokens and loader

**Files:** modify `public/index.html`, `public/css/site.css`, `public/js/site.js`.

**Produces:** CSS tokens `--on-sheet`, `--on-sheet-soft`; a loader that appends `/css/sheet.css?v=` and, on its `load` event, `/js/sheet.js?v=`, once `#sheet` is within 150% of the viewport height.

- [ ] Change the markup: the old `<div class="tex">` goes inside `<noscript>`. (`sheet.js` creates `#sheet > .dwg > svg#dwg[viewBox="0 0 1600 1408"][preserveAspectRatio="xMidYMin meet"]` and `#sheet > .dwg-hit > #grab`.)
- [ ] Add the two tokens to `:root`, the light media query block and `:root[data-theme="light"]`. Point `.state .big`, `.state .sub`, `.sheet .head .h2` and `.sheet .head .lede` at them.
- [ ] Replace the sweep block in `site.js` with the loader. Remove the conic mask from `.sheet>.tex img`.
- [ ] Verify: `node scripts/build.mjs` prints `✓ Built dist/`.

### Task 2: The drawing, pencil and flange

**Files:** create `public/js/sheet.js`, `public/css/sheet.css`.

**Consumes:** the markup and tokens from Task 1; the site tokens `--graphite`, `--line`, `--gold-rgb`, `--gold`, `--f-mono`.

**Produces:** on `#dwg`, the classes `go` (pencil running or done), `ink3` (flange in pencil line), `d3` (flange in 3D); CSS custom properties `--u`, `--T: 30`, `--K: .8475`, `--pk: .5`.

- [ ] Port the geometry, pencil and flange code from the approved example unchanged. Drop its control panel, link-hash hooks and theme switch.
- [ ] Timeline: start 500 ms after `#sheet` reaches the middle half of the screen (so a reader who lands on `#offer` still gets the pencil); add `ink3` at `0.45 * K * T` seconds; under reduced motion add both classes at once.
- [ ] Port the styles with every selector scoped under `#dwg`, keyframes renamed `sh-draw` and `sh-ink`, and the drawing's tokens (`--pencil-rgb`, `--a-fine`, `--a-hatch`, `--a-note`, `--a-text`, `--a-cl`) set on `.sheet` for Night, Day (both selectors) and Starlight.
- [ ] Verify: `node --check public/js/sheet.js`; build passes.

### Task 3: Checks on the built site

Serve with the real headers: `node scripts/qa/serve.mjs dist 8790`.

- [ ] Night, Day and Starlight at 1512 wide: drawing present, no console or CSP errors, text colours as in the constraints.
- [ ] Pencil: strokes animate once the words arrive; with the sheet scrolled away, strokes keep finishing; last stroke ends by 30 s; one iteration.
- [ ] Flange: turning before the pencil starts; drag and arrow keys change its pose; handle centred on it and on top; it takes the pencil line at about 11 s.
- [ ] Review focus items 1 to 5.
- [ ] 375 wide: `scrollWidth === innerWidth`; handle off screen.
- [ ] Reduced motion: finished drawing, nothing running.
- [ ] `node scripts/qa/contrast.mjs` still passes. `node scripts/qa/bytes.mjs dist` reported (it was already over budget on `main` before this work).

### Task 4: Hand over

- [ ] Commit on branch `drawing-sheet-pencil`. Push and open a pull request so Cloudflare builds a preview. Nothing merges to `main` without Nathan's say-so.

## 01 sits within the drawing (15 Nov 2026)

**What Nathan asked for (his words):** "all of 01 needs to sit together, so those cards need to be within the drawing", "I don't think we have the drawing going through them. We just have them sitting within the drawing", and "if you could do those as screenshots first rather than just build it". He saw mock screenshots (made by re-drawing the frame in the live page, nothing built) and said "Yes, build it".

**Why it was not so before:** the svg had a fixed sheet of 1600 x 1408 units fitted by width. The page's own sheet (the statement band plus 01) is a different shape, so on anything narrower than about 1760 px the border ended above the cards' feet, and the part's lower flange and the title block ran behind the cards.

**What changed:**

- `public/js/sheet.js`
  - The sheet (border, zone ticks and letters, revision table, title block) is drawn by `border(I,O,k)` to the size of the page's sheet, and drawn again when that changes. Its tables are sized in screen pixels, like the lettering. On a sheet narrower than 900 px there is no revision table and the title block has two rows.
  - The part and all that belongs to it (hatching, centre lines, outline, pencil, dimensions, the 3D flange and its gold dimensions) are one group, `gPart`, set in the middle of the sheet.
  - `layout()` replaces `fit()`. From 960 px up the whole drawing fits across; narrower than that it is drawn as for an 1100 px sheet and its sides crop (as before). It is never larger than leaves its lowest line, 1222 units down, 22 px above the cards. The frame's inset follows the page's side gutter (14 px inside the cards' edge, at least 8 px, at most 56 units). It runs straight from a ResizeObserver on the sheet, so the drawing is never painted at an old size.
  - The flange view (with its labels, gold dimensions and drag handle) and the notes are shown only where they sit wholly inside the frame; the revision table gives way where it would touch the part's top dimension. Their widths are worked out from the fixed-pitch lettering, not measured: a measurement taken before the page's font has settled comes out short.
  - The frame's pencil strokes are in their own group, `gFp`. When the frame is drawn again its `--O` is set to the seconds the pencil has already run, so it stays in step (the stylesheet already took `--O` off every delay).
- `public/css/sheet.css`: the svg is exactly the sheet's box.
- `public/css/site.css`: `.sheet>.offer` has 52 px more room at its foot, for the title block under the cards; `.col` is solid (its hover, which only made it solid, is gone; the Play ring still fills on hover).

**Claude's calls, not confirmed by Nathan beyond the mock:** the valve is smaller than it was (about 9% at 1512 wide, about 22% at 1920) and no longer grows with a wide screen; 52 px of extra height; the compact title block on phones and upright tablets; no revision table there.

**What shows at which width (after an independent review, which found the revision table running into the part's top dimension at about 1300 to 1390 px, and the notes and flange cut by the new border on tablets):**

| Window | Part | Revision table | Notes | Flange view |
|---|---|---|---|---|
| 1440 and wider | whole, centred | shown | shown | shown, turns, can be dragged |
| about 1300 to 1390 (a 1366 laptop) | whole | left out | left out at 1366 | shown |
| 1150 to 1290 | whole | left out | shown | shown |
| 960 to 1140 | whole | left out | left out | shown |
| under 960 (upright tablet, phone) | middle shown, sides crop | left out | left out | left out |

In Starlight the cards sit lower, so the part is drawn larger there (about 10% at 1512 wide). That follows the same rule.

**Checks:** `node scripts/qa/sheet-probe.mjs <url> <w> <h> <tag> [still|pencil|resize|themes]`. Run at 2560, 1920, 1512, 1440, 1366, 1280, 1150, 1024, 960, 959, 820, 700, 390 and 320 wide: cards inside the frame, part clear of the cards, title block clear of the cards, revision table clear of the dimension, notes and flange inside the frame or left out (never cut), the handle over the flange, nothing sideways. The pencil pass: none of the frame's strokes down at 6 s, 17 of 47 at 23.5 s, all at 34 s, the same after the window is narrowed 10 s in. Night, Day, Starlight. The flange still turns from the start (`scripts/qa/flange-probe.mjs`) and 05 In motion is unaffected. Not checked: Safari, a real phone.
