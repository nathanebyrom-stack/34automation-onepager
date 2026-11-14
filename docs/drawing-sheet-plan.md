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
| `public/index.html` | Sheet markup: empty `<svg id="dwg">` in `.dwg`, the grab handle in `.dwg-hit`, the old `<img>` moved into `<noscript>`. |
| `public/js/site.js` | The old scroll-linked sweep (the block starting "the drawing sheet (Nathan, 13 Nov)") replaced by a loader. |
| `public/css/site.css` | `--on-sheet` and `--on-sheet-soft` in the three token blocks; text rules; the old mask rule reduced to the no-JS case. |

---

### Task 1: Markup, tokens and loader

**Files:** modify `public/index.html`, `public/css/site.css`, `public/js/site.js`.

**Produces:** `#sheet > .dwg > svg#dwg[viewBox="0 0 1600 1408"][preserveAspectRatio="xMidYMin meet"]`; `#sheet > .dwg-hit > #grab`; CSS tokens `--on-sheet`, `--on-sheet-soft`; a loader that appends `/css/sheet.css?v=` and, on its `load` event, `/js/sheet.js?v=`, once `#sheet` is within 150% of the viewport height.

- [ ] Change the markup. The old `<div class="tex">` goes inside `<noscript>`.
- [ ] Add the two tokens to `:root`, the light media query block and `:root[data-theme="light"]`. Point `.state .big`, `.state .sub`, `.sheet .head .h2` and `.sheet .head .lede` at them.
- [ ] Replace the sweep block in `site.js` with the loader. Remove the conic mask from `.sheet>.tex img`.
- [ ] Verify: `node scripts/build.mjs` prints `✓ Built dist/`.

### Task 2: The drawing, pencil and flange

**Files:** create `public/js/sheet.js`, `public/css/sheet.css`.

**Consumes:** the markup and tokens from Task 1; the site tokens `--graphite`, `--line`, `--gold-rgb`, `--gold`, `--f-mono`.

**Produces:** on `#dwg`, the classes `go` (pencil running or done), `ink3` (flange in pencil line), `d3` (flange in 3D); CSS custom properties `--u`, `--T: 30`, `--K: .8475`, `--pk: .5`.

- [ ] Port the geometry, pencil and flange code from the approved example unchanged. Drop its control panel, link-hash hooks and theme switch.
- [ ] Timeline: start 500 ms after `.state .big` is 30% on screen; add `ink3` at `0.45 * K * T` seconds; under reduced motion add both classes at once.
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
