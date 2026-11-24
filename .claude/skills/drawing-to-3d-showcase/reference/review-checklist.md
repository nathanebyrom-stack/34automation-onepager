# Review checklist

Distilled from the reviews of six pieces in Sprint-3D (gearbox, enclosure, spindle, extrusion, bracket, frame). Every piece came back "pass with fixes"; these are the fixes, grouped. Use it on your own piece before hand-over and on anyone else's when reviewing.

A review ends in a verdict (PASS, PASS WITH FIXES, REBUILD), blocking fixes with the line and the exact change, optional fixes, and a "Checked" list that says which screenshots were opened and which were not.

## 1. The numbers (an engineer will look)

- [ ] Recompute every chain: the parts of each dimension chain sum to the overall shown.
- [ ] The same size reads the same on the sheet, in the title block, in the parts list, in the overlay, in any data panel and in the geometry. Pick three sizes and trace each through all of them.
- [ ] Derived figures (mass, area, ratio, stock removed, weld length, rpm) are computed in code from the same numbers, and you have re-run the sum by hand.
- [ ] Fits are real pairs (Ø20 H7 housing with a g6 pin). Thread reliefs are below the minor diameter. Keys and keyways match the shaft size.
- [ ] Holes are the right kind: clearance (Ø5.5 for M5, Ø9 for M8), tap drill, or thread-forming pilot. The screw is named for what it is.
- [ ] Standard parts have standard sizes (a 6204 bearing is 20 × 47 × 14).
- [ ] Materials are real grades and fit the part (6082-T6, 7075-T6, 316L, EN8, EN24T, S355J2H for hollow section, DC01, PA66-GF30).
- [ ] Balloon numbers on the sheet and in 3D match the parts-list items. Quantities equal what is modelled, and the total part count tallies with any readout.
- [ ] Nothing is stated that the part as drawn cannot support (set-up counts, finishes that cannot be that colour).

## 2. The drawing sheet

- [ ] The projection symbol matches the view layout (third angle: circles left, frustum right, narrow end toward the circles).
- [ ] Hidden features a balloon points at are drawn with hidden lines.
- [ ] Section cutting-plane letters sit one at each end, with arrows.
- [ ] Sheet text can be read at the desktop first stage (aim for about 4.6 mm lettering). On a phone the sheet fits the width with border and title block in frame and nothing cut mid-word.

## 3. The model

- [ ] Every fastener has a hole through every part it passes through.
- [ ] Parts sit where they would: no bearing standing proud of its cover with no shoulder, no stud at a different offset from the sheet.
- [ ] Pockets, keyways and holes read as shadowed recesses (flat unlit near-black), not as pale lit patches with a seam.
- [ ] No z-fighting, no camera clipping, no dark part lost on the dark ground (edge lines or a rim light).
- [ ] Colours named on screen look like their names. Anodised and painted colours are deep, not washed out.
- [ ] Highlights do not clip to white during the reveal.

## 4. Balloons and dimensions

- [ ] A balloon whose anchor is hidden behind the part is hidden, with its leader and dot. Check at 150°, -150°, 90°, -90°.
- [ ] Balloons do not overlap each other, the "Demo · 34 concept part" tag, the hint chip or the readouts, on desktop and at 390 px.
- [ ] Each dimension label sits on the feature it describes, with a visible line or leader to it.
- [ ] Dimensions are shown on the assembled part, or every label still reads correctly when exploded.
- [ ] A dimension seen nearly end on (line under about 30 px) is hidden, not left as a stray number.
- [ ] On a phone with Dimensions on: no label is clipped by the stage edge, none overlaps another or a balloon. Every chip is at least 8 px inside the stage.

## 5. Framing

- [ ] Nothing is cropped by the stage edge at any turn angle in the exploded stage, desktop and phone. This includes the floor sheet.
- [ ] The model fills the stage; no large dead bands above and below on a phone.

## 6. Phone

- [ ] No sideways scroll.
- [ ] Every label style is 11 px or more: table headers, rail numbers, meta labels, slider label.
- [ ] Every control is 44 px tall or more.
- [ ] The parts table shows every column at 390 px with no inner sideways scroll.

## 7. Fallbacks

- [ ] No WebGL: a sharp still of the whole sheet, the tag, the parts list; controls that need 3D are hidden; no blank area or error text.
- [ ] Reduced motion: each stage lands on its final state at once (the reduced shots should match the desktop ones), no auto-play.

## 8. Wording and house rules

- [ ] The tag is visible in every mode. Title block has DRAWN 34 AUTOMATION, the drawing number, the date and the not-for-manufacture note.
- [ ] Source search finds no "Claude" (other than the required viewport meta), "AI", "agent", "Frank", no em dash, no grid of any kind, no glow.
- [ ] UK spelling. Labels only, no marketing sentences. No brands, certifications or performance claims.
- [ ] Units keep their case: "m" not "M", "z6" not "Z6", even inside an uppercase style.
- [ ] Gold appears only on active states and the primary button. A part painted yellow is fine if it does not read as the brand gold.

## What the harness does and does not check

`scripts/shoot.mjs` checks: file size and fragment format, external scripts, banned words, the tag and note, the test hook, console errors, blocked requests, sideways overflow, text under 11 px and controls under 44 px on a phone.

It cannot see: numbers that disagree, wrong or overlapping balloons, cropping, labels off their feature, missing holes, wrong colours, dull lighting, or a reveal that does not read. Those need the shots opened and sections 1 to 5 worked through.
