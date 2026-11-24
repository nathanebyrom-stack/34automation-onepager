---
name: drawing-to-3d-showcase
description: Use when building, fixing or reviewing a drawing-to-3D showcase piece for 34 Automation - an engineering drawing sheet that becomes an interactive Three.js 3D model with an exploded view, numbered balloons, a parts list, a dimensions overlay or a section cut, shown to a manufacturing or engineering prospect. Also use when such a piece has balloons on the wrong part, an exploded view cropped by the stage, numbers that disagree between sheet, table and model, fasteners with no holes, or labels unreadable on a phone.
---

# Drawing-to-3D showcase pieces

## What this is

One self-contained page that opens on a proper engineering drawing of an invented part, then shows the 3D model **coming out of that linework**, then lets the viewer turn it, explode it and read its parts list. It is shown to owners, MDs and sales managers of UK manufacturers to say "we could do this with your product".

The viewer includes engineers. **Every number on screen must agree with every other number and be plausible for the real kind of part.** That is what separates a piece Nathan can put in front of a client from a pretty toy, and it is where most pieces fail review.

The quality bar is section 05 "In motion" on 34automation.co.uk (the 34A-0100 valve). A piece is in the same family but never copies it: different part, different sector, different reveal.

## Files in this skill

| File | Read it when |
|---|---|
| `reference/page-contract.md` | Before writing any code: file format, brand tokens, Three.js r128 notes, the test hook, fallbacks, phone rules |
| `reference/review-checklist.md` | Before hand-over, and when reviewing someone else's piece |
| `scripts/shoot.mjs` | To check a piece: `node scripts/shoot.mjs <piece-folder>` |
| `example/spindle-34A-0430.html` | When you need a worked piece to adapt (36 KB, passed review). Read the part you need, not the whole file |

## Order of work

1. **Pick part, sector, reveal and signature colour.** The reveal must suit how the part is really made:

   | Part | Reveal that reads as "the drawing made solid" |
   |---|---|
   | Turned part (shaft, spindle) | The half-section profile sweeps 360° about the centreline |
   | Sheet metal (enclosure, bracket) | The flat pattern folds up bend by bend, in bend-schedule order |
   | Extrusion (heat sink, profile) | The section view extrudes along its length |
   | Machined billet | Stock rises off the plan view, then each op cuts it away |
   | Fabrication (welded frame) | Cut members fly in from the cut list, then weld beads run |
   | Assembly (gearbox, valve, cylinder) | The section lifts off the sheet, the housing rises, internals arrive in assembly order |

2. **Write the numbers first, as one object in code.** Every dimension, quantity, material and derived figure (mass, area, ratio, weld length) lives in one place. The sheet, the title block, the parts list, the dimension overlay, the balloons and the geometry all read from it. Derived figures are computed, never typed. Check the arithmetic by hand before drawing anything: chains must sum to the overall, fits must be real (H7/g6), threads standard, holes the right clearance size, fasteners counted.
3. **Build to a save point early.** Get all stages working end to end in plain form, run the harness, and save a copy the moment it runs clean. Then polish. Edit in place; do not rewrite the file to change one thing.
4. **Run the harness, read its summary, then look.** The summary is cheap; screenshots are not. Open at most five per round, three rounds at most. First round, in this order: `desktop-s0`, the last `desktop-sN`, `desktop-turn+150`, `phone-fullpage`, `fallback-page`. Later rounds: `desktop-dims`, `phone-dims`, `desktop-midtransition`, the other turn angles. All dims and turn shots are of the last stage. The harness writes `shots/` and `report.json` into the piece folder and never changes `index.html`.
5. **Go through `reference/review-checklist.md` line by line** against the shots and the source. Fix, re-run.
6. **Hand over** `index.html`, the latest `shots/`, and a `NOTES.md` of ten lines at most: part, drawing number, sector, reveal, stages, key dimensions and where they agree, anything unsure or cut.

## Rules that are never bent

- Invented part only. The tag **"Demo · 34 concept part"** is always on screen, in every stage and in the fallback. Drawing number `34A-NNNN`. Title block: DRAWN "34 AUTOMATION", and the note "CONCEPT PART FOR DEMONSTRATION. NOT FOR MANUFACTURE."
- No real company names, brands, logos, certifications or performance claims. Material grades, thread sizes and tolerance classes are fine.
- Labels only: a heading, table text, button text, one hint such as "Drag to turn". No marketing sentences. The page never mentions Claude, AI or agents, including in comments.
- No grid, dot grid or graph-paper background anywhere, and no `GridHelper`. No glow. Flat gold only on the active state and the primary button.
- It must work with no WebGL (a sharp still of the sheet plus the parts list) and with reduced motion (no auto-play, stages switch at once, drag still works).
- The phone is a first-class view: nothing scrolls sideways, labels 11 px or more, controls 44 px tall or more.

## What goes wrong most (from review of six pieces)

| Fault | Fix |
|---|---|
| Screws pass through solid metal; screws shown do not equal the parts-list quantity | Cut a clearance hole for every fastener; count them |
| A balloon points at whatever is in front once the part is turned | Raycast camera to anchor; hide balloon, leader and dot when occluded. This applies to every part, round ones included |
| An element set `hidden` still shows (stray balloons in a corner, dead controls in the fallback) | Add `[hidden]{display:none!important}`; a `display` rule on the element otherwise wins |
| Exploded parts leave the stage at some turn angle | Frame the exploded stage with margin; test at 150°, -150°, 90°, -90° |
| Dimension labels float off their feature when exploded | Show dimensions on the assembled part; hide a dimension whose line projects under 30 px |
| Dimensions and balloons pile up on a phone | Hide balloons while Dimensions is on in portrait; stagger label heights; clamp chips 8 px inside the stage |
| Parts table hides its last columns at 390 px | No `min-width` on the table; let descriptions wrap |
| A colour named red renders pink; overlay lines wash out | Convert hex colours to linear (`convertSRGBToLinear()`); lower `envMapIntensity` before touching the hue |
| Projection symbol contradicts the view layout | First angle or third angle: draw the symbol that matches where the views sit |
| CSS `text-transform:uppercase` turns "12.32 m" into "M" and "z6" into "Z6" | Wrap units and case-sensitive symbols in a span with `text-transform:none` |
| A stated fact the geometry cannot support ("1 set-up", a tap-drill size on a thread-forming screw) | State only what is true of the part as drawn |

## A section on the live site instead

A pinned scroll section inside 34automation.co.uk follows different plumbing (ES module, vendored tree-shaken Three.js r186, strict CSP, a plain-band fallback). The engineering rules above still hold. For the plumbing read `docs/valve-motion-plan.md` in the `34automation-onepager` repo.
