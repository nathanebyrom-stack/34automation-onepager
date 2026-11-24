# Models and more (a fourth row in 04 The work, and /models/): plan of record

**Goal (Nathan, 24 Nov 2026):** "another section within work that says '3D models and more'" with a write-up along the lines of "These are models designed by 34 Automation to inspire you on how we can present your products, have a play around with the dimensions tab and the drag feature to see different angles", "a little hyperlink saying models and more", and "inside we place the 4 of the 3D drawings for clients to play with".

**What was built.** Not shipped: the build copies `public/` only.

- `public/index.html`: a fourth `.row2` in 04 The work, pill "Demo", heading "3D models and more", his sentence tidied, link "Models and more →" to `/models/`.
- `public/models/index.html`: an inner page (same header, footer and theme switch as `/privacy/`), four cards in a 2×2 grid (one column under 820 px), a closing line and button to `/#contact`.
- `public/css/models.css`: the page's styles. Each viewer carries `.night`, so the steel sits on the dark field in Day too, as 05 In motion does.
- `public/js/models.js`: an ES module, one small Three.js scene per card from the same tree-shaken bundle as `js/motion.js`. Drag, or the arrow keys, turn a model; it turns by itself (one turn in 24 s, not for reduced motion) until first taken hold of. The Dimensions button draws figures from points on the part, the way 05 does, so they follow the part round.
- `public/sitemap.xml`: `/models/` added. `scripts/vendor-three.mjs` now scans `models.js` as well as `motion.js` and stamps both import lines.

**The four models (Claude's choice, not confirmed by Nathan).** The project has no model files; its only 3D is the 34A-0100 valve (procedural, `js/motion.js`) and the drawing sheet's flange (SVG, `js/sheet.js`). So the four are that family, built with the valve's own profiles so they match 05 exactly: the assembled valve; its bonnet assembly (bonnet, stem, packing, gland nut, lever, bonnet bolts); its ball; and the flange from the drawing, as a solid. Adding or swapping a model is one entry in `MODELS` in `models.js` and one card in the page.

**Left out, on purpose:** an Explode toggle on the valve card (05 already shows it); the exploded parts list; a nav link; Starlight styling beyond what `site.css` gives inner pages; a still image fallback (the card says it needs WebGL instead).

**Checking:** `node scripts/build.mjs`, start the `34automation-onepager` preview (restart after every build; it holds files in memory), then `node scripts/qa/models-probe.mjs http://localhost:8790/models/ 1512 900 d` for screenshots of all four with and without dimensions, a drag, and Day. The in-app Browser pane does not animate; headless Chrome does.
