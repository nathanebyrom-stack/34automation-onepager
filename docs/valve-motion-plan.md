# 05 In motion (the valve, built from its drawing, then exploded): implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A new pinned section between 04 The work and Reviews in which the 34A-0107 valve rises out of its drawing, is built in 3D, comes apart into a ballooned parts list as the visitor scrolls, and ends on an invitation to get in touch.

**Architecture:** Markup in `public/index.html`, all of the section's styles in `public/css/motion.css` (linked just before the section, so it also styles the no-script version), the 3D in `public/js/motion.js` (an ES module, fetched by a block in `public/js/site.js` only when the section is near and only when it will run). Three.js r186 is a tree-shaken copy in `public/js/vendor/three-r186/`, made by `scripts/vendor-three.mjs`.

**Tech stack:** Three.js 0.186.1 (WebGL), plain CSS and JS, no build step beyond `scripts/build.mjs`.

**Spec:** Nathan's choices of 15 Nov 2026 (below) and the approved example at https://claude.ai/artifact/A7Aa1cgLhvPxQ19TR2GM5b (version 3). This file is not shipped: the build copies `public/` only.

## What Nathan asked for (his words and choices)

1. "showcase a machine either being dismantled to core parts or built up out of an engineering drawing".
2. From the options offered: a **new section**; the visitor should think **"They could animate mine"**; the machine is **"The valve on our drawing"**; the story is **"Build, then explode"**; built as **"Real-time 3D"**.
3. On how the call to action should work with no file upload on the form: "unsure" (so the interest box below is Claude's call).
4. On the example: "keep your product in motion but change the sub to" **"What if this were your product?"** then "Imagine your customers exploring your design from every angle, watching it come together and discovering the engineering behind it".
5. "Yes, build it".

## Decisions (Claude's, not confirmed by Nathan unless marked)

- Placement: after 04 The work. Reviews, Website report and Start a conversation become 06, 07, 08. No nav link.
- Copy: kick "05 In motion"; heading "Your product, in motion." (confirmed); sub as item 4 (his words, a closing full stop added); tag "Demo · 34 concept part" ("Concept part" on phones); close "Tell us about your product. We'll make it move." with a "Start a conversation" button.
- The button goes to `#contact` and ticks a new **"Product animation"** interest box (after Automation). `functions/api/enquiry.js` accepts it.
- Parts list, 34A-0100 valve assy: 01 body, 02 ball, 03 seat ring ×4, 04 stem, 05 gland packing, 06 gland nut, 07 lever handle, 08 flange bolt M8 ×16, 09 bonnet, 10 bonnet bolt M8 ×4. Items 02 to 10 are invented. The body is top-entry with a bonnet so that every part leaves by a path it really could.
- Scroll: about four screens (`.motion.scrub .track{height:400vh}`).
- Always Night, in Night, Day and Starlight (the section carries `.night`).

## Global constraints

- CSP is `script-src 'self'` plus hashes for inline scripts: no inline script is added, and Three.js is served from the site.
- Dimensions are the drawing's (`public/js/sheet.js`, 4 drawing units = 1 mm): bore Ø50, flange Ø120 × 14 with a 2 mm raised face, neck Ø80, hub Ø102.5, face to face 244, ball SØ76, 4× Ø9 on PCD 100.
- Nothing for this section is fetched until it is within a screen and a half, except its small stylesheet.
- Section JavaScript at most 160 KB gzip (Three.js copy plus `motion.js`).
- Render only when something changed; nothing runs while the section is off screen.
- Names: `.motion`, `.v-*`, ids `motion`, `vTrack`, `vPin`, `vCan`, `vLead`, `vBal`, `vBom`, `vRows`, `vCap`, `vGrab`, `vBar`, `vOps`, `vGo`.
- Nothing is merged or pushed to `main` without Nathan saying so: `main` deploys live.

## Review focus

1. No WebGL 2, reduced motion, Save-Data or 2G, a short window (under 520 px, or 600 px on a phone), or no script: the section is a plain band with the still, the whole parts list and the button. Covered by Task 5.
2. The 3D fails (the script does not arrive, stalls, throws, or the context is lost and does not come back): the section goes back to the plain band, and a reader in it or below it keeps their place. A context that comes back (a phone switching apps) carries on. Covered by Task 5.
3. A phone: nothing overflows sideways, the sub clears the drawing, vertical swipes over the valve still scroll. Covered by Task 5.
4. Lenis: inside the track the scroll keeps its true speed. Covered by Task 4.
5. The form: an enquiry with "Product animation" ticked reaches the email with it. Covered by Task 4.

---

### Task 1: section markup, styles and renumbering

**Files:** modify `public/index.html`; create `public/css/motion.css`.

**Interfaces, produced:** the ids and classes listed under Global constraints. States, all on `#motion` unless said: none (plain band: still, full list, button); `.scrub` (pinned, 3D look; set and unset by `site.js`); `.v3d` (the scene is built; set by `motion.js`); on `#vPin`: `.live` (canvas showing), `.go` (p > .05), `.ex` (p > .62), `.end` (p > .86).

- [ ] Add `<link rel="stylesheet" href="/css/motion.css?v={{BUILD}}">` and the section after `#work`; renumber the three later kicks.
- [ ] Write `motion.css`: plain band as a grid (copy, still, list; stacked on phones), the pinned layout under `.scrub`.
- [ ] Check: `node scripts/build.mjs` passes; with scripts off the section shows copy, still, ten rows and the button.

### Task 2: the 3D

**Files:** create `public/js/motion.js`.

**Interfaces, consumed:** Task 1's ids; it draws only while `#motion` has `.scrub`. **Produced:** `.v3d` on `#motion` once the scene is built; a `valve-lost` event on `#motion` when it cannot run; `window.__valve.bare(on)` (hides the sheet and shadow, for the still capture).

- [ ] Port the example's module: model, drawing, sheet, `pose(p)`, labels, drag and arrow keys. Import Three.js from `./vendor/three-r186/three.min.js`. Drop the example's dock, hash links and reduced-motion branch.
- [ ] Check with Task 5's probe.

### Task 3: the Three.js copy

**Files:** create `scripts/vendor-three.mjs`, `public/js/vendor/three-r186/three.min.js`, `public/js/vendor/three-r186/LICENSE.txt`.

- [ ] `node scripts/vendor-three.mjs`: `npm pack three@0.186.1` (the npm cache has it), find every `THREE.X` in `motion.js`, bundle only those with esbuild (resolved from `../dollar/tools`), write the two files, stamp the bundle's hash into `motion.js`'s import line (`?h=…`), print sizes.
- [ ] Check: the printed gzip size plus `motion.js` is at most 160 KB.

### Task 4: loader, scroll pace, form

**Files:** modify `public/js/site.js`, `functions/api/enquiry.js`, `public/index.html` (the chip).

- [ ] `site.js`, new block after the drawing-sheet block: tick the box on `#vGo`; stop there for reduced motion, Save-Data, 2G or no WebGL 2; otherwise pin (`.scrub`) while the window is tall enough (520 px, 600 px on a phone; looked at again on every resize), holding back the still's `src` while pinned; fetch `motion.js` as a module once the section is within a screen and a half (not for a reader who lands just below it); on `valve-lost`, a script error, or no `.v3d` once the script has loaded or 10 s have passed, un-pin for the rest of the visit. Every pin and un-pin keeps the reader's place.
- [ ] `site.js`, `inFilm()`: also true inside `#vTrack` while `#motion` has `.scrub`.
- [ ] `enquiry.js`: `INTERESTS` gains `"Product animation"`.
- [ ] Check: a POST to the local function with that interest keeps it; Starlight's chip colours (`nth-child(1)` to `(3)`) are unchanged.

### Task 5: the still, and the checks

**Files:** create `scripts/qa/valve-probe.mjs`, `public/img/19-valve-exploded.webp`.

- [ ] `valve-probe.mjs <url> <w> <h> <tag> [ps] [reduce|nogl|nojs|drag|pace|rotate|lose|block|below|still]`: opens the built site in headless Chrome, steps the scroll, saves screenshots, reports console errors; the flags are described at the top of the file; `still` writes the transparent exploded view with its balloons.
- [ ] Capture the still, convert to WebP, set the `<img>` width and height.
- [ ] Run at 1512×900, 1366×650, 1180×820, 820×1180, 390×664, 375×812 and 375×553; every flag; Night, Day, Starlight.
- [ ] Not covered here: Safari and a real iPhone; Lighthouse (`scripts/qa/lh.mjs` needs packages that are not installed).

## After the independent review (15 Nov 2026)

A fresh reviewer read the branch before it was committed. What changed as a result:

- **The steel's reflections were never drawn** (the capture's far plane stopped short of the room, here and in the approved example, so the parts read near-black). Now drawn, and the lighting re-balanced for it: a dim room, a gold work light on the left, a cool rim on the right. This is a visible change from the example Nathan approved; he has been told and shown.
- The pin can no longer be left empty: a stalled, failed or throwing script, or a lost context that does not return, puts the plain band back. The `.scrub.lost` look was dropped: one fallback, not two.
- A lost WebGL context that comes back (a phone switching apps) is picked up again.
- Pinned or not is looked at again on resize, with the reader's place kept; phones need 600 px.
- Short desktop windows (under 760 px): the sub fades at the end so the closing line has room. Windows 1100 to 1330 px wide: long part names wrap inside the parts list.
- Phones: the valve's box follows the scroll (under the sub at first, then up to the heading, then clear of the closing line).
- WebGL 2 is required (this Three.js has no WebGL 1), the shaders are compiled up front, only left and right arrow keys turn the valve, the parts list stays readable by screen readers under 1100 px, Starlight no longer recolours the demo tag, a reader who lands on `#reviews` does not fetch the 3D, and the ball's ports are closed and lipped.
