# Page contract for a showcase piece

Source: the Sprint-3D build brief (23 Nov 2026) that eight pieces were built and reviewed against.

## The file

- One file, `<piece>/index.html`. Target under 150 KB, ceiling 250 KB. No images except tiny inline SVG. All geometry is built in code.
- It is a **fragment**: no `<!DOCTYPE>`, `<html>`, `<head>` or `<body>`. In this order: `<title>` (2 to 4 words, e.g. "Planetary Gearbox 34A-0210"), `<meta name="claude:viewport-fit-sides" content="cover">`, the fonts `<link>`, `<style>`, markup, scripts.
- Only one external script: `<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>` (global `THREE`), before the inline script. No other hosts, no ES module imports, no OrbitControls file (write a small drag-rotate), no fetch, no remote images.
- Fonts, exactly: `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,100..900&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap">`. Give every face a real fallback stack. Text drawn to a 2D canvas for a texture waits for `document.fonts.ready` (with a timeout), then redraws.
- Dark single theme: `color-scheme:dark` on `:root`, every colour a custom property on `:root`, `body{background:var(--graphite);color:var(--silver)}` set explicitly. Do not reset padding on `:root`.
- Desktop is one screen: `html,body{height:100%}` (not `100vh`). A phone may scroll down (stage, controls, parts list). Nothing ever scrolls sideways.
- Outer wrapper gutter: `padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))`, vertical padding with `padding-block`.
- Toggle visibility with `el.hidden`, and add `[hidden]{display:none!important}` so a `display` rule cannot defeat it. Visible focus states. No `alert`, `confirm`, `prompt`, no localStorage.

## What the page must do

1. **Open on a real drawing sheet** of the part: views with hatching, dimensions with proper arrowheads and extension-line gaps, tolerances, surface finish, datums, a detail view, balloons, general notes, a revision table, and a full title block (TITLE, DRG NO, REV, SHEET, SIZE, MATERIAL, FINISH, SCALE, projection symbol, UNITS MM, general tolerance class, DRAWN 34 AUTOMATION, DATE, "DEMO · 34 CONCEPT PART").
2. **Drawing becomes 3D, legibly.** The model comes out of that linework by the piece's reveal. A model that fades in fails.
3. **A real 3D model** the viewer drags to turn (pointer events, touch works) plus a keyboard-operable range slider. Believable geometry: chamfers, fillets, holes, fasteners, proportion. Materials that look manufactured (machined metal, anodising, paint, polymers), not grey primitives.
4. **Three or four stages** on a tappable rail (e.g. Drawing, Build, Assembly, Exploded). It plays once on load, then steps by tap. At least one of: explode with balloons matching the parts list, a section cut, a dimensions toggle (`aria-pressed`).
5. **A parts list in real HTML text**, 6 to 12 rows: item, description, material, quantity. Consistent with balloons, title block and dimensions.
6. **Fallbacks.** No WebGL (also when `window.__forceNoWebGL === true`, or Three.js failed to load): the sheet as a sharp still (inline SVG or canvas) plus the parts list; no broken canvas, blank area or error text. `prefers-reduced-motion: reduce`: no auto-play, no continuous spin, stages switch at once, drag still works.
7. **Phone (390 px).** Labels 11 px or more (check `th`, rail numbers, meta labels), body 14 px or more, rail and buttons 44 px tall or more, the 3D stage large, the parts table showing every column. Desktop (1440 × 900) fills the screen with no large dead areas.

## Test hook (the harness and any reviewer drive the page through it)

```js
window.__showcase = {
  ready: false,          // true once the first frame, or the fallback, is on screen
  mode: 'webgl',         // or 'fallback'
  stages: ['Drawing', 'Build', 'Assembly', 'Exploded'],   // rail labels, in order
  go(i, instant) {},     // jump to stage i; instant=true lands on the final state with no tween
  setDims(on) {},        // show or hide the dimensions overlay
  setAngle(deg) {}       // turn the model, same as dragging
};
```

## 34 brand tokens (Brand Plan Rev A)

```
--graphite:#0E0F11 (page ground)   --graphite-deep:#090A0B   --plate:#1A1C20 (surfaces)   --plate-2:#212428
--edge:#2C2F35 (hairlines)         --steel:#8C929A (secondary text)                       --silver:#D4D8DD (primary text)
--gold:#C9A24C (active state and primary button; flat, never a gradient, about 5% of the screen)   --gold-hover:#D7BE84
--paper:#F2F1ED (the sheet may be Paper with Graphite ink, or dark with Silver ink)
--signal-red:#E0473B (warnings only)
```

- Display: Archivo, `font-stretch:125%`, weight 800, uppercase, tight leading. Buttons: weight 700 at 112%. Body: IBM Plex Sans 400 to 600. Data, labels, title block, dimensions: IBM Plex Mono 400/500, a little letter-spacing on uppercase labels.
- Radii: 0 on buttons, badges and inputs; 2 px at most on big frames.
- Section head in title-block style: a mono eyebrow with the sector and a gold slash (`SHEET METAL / ENCLOSURES`), the Archivo heading (the part name), an Edge hairline.
- Background: graphite with one soft radial from Plate to Graphite behind the model. Nothing else.
- Colour comes from the part (anodising, paint, polymers, coloured section faces) and one signature colour per piece. Nathan likes colourful.

## Three.js r128 notes

- `renderer.outputEncoding = THREE.sRGBEncoding`. Colours given as hex and used in lit materials: `new THREE.Color(0xC20F2C).convertSRGBToLinear()`.
- Section cuts: `renderer.localClippingEnabled = true`, material `clippingPlanes`, and cap the cut (a coloured cap or the stencil trick) so it does not look hollow.
- `ExtrudeGeometry`, `LatheGeometry`, `TubeGeometry`, and `EdgesGeometry` with `LineSegments` for drawing-style edges are all there.
- No environment map files. For metal, build a small procedural environment with `PMREMGenerator.fromScene` from a few coloured emissive panels. Otherwise hemisphere plus key and rim directionals.
- Cap `devicePixelRatio` at 2. Pause rendering when the tab is hidden. Under about 250k triangles, one or two shadow-free lights, no post-processing chain.
- **Balloons, dimension labels and leaders are HTML or SVG over the canvas**, placed each frame by projecting 3D anchor points to the screen. Never bake small text into a texture.
