# Play video buttons on the 01 cards: implementation plan

**Goal:** Each of the three "01 What we offer" cards ends in a gold Play video button that opens that card's infomercial over the page, and the AUTO card's heading is shortened.

**Architecture:** Three `<button>`s and one `<dialog>` in `public/index.html`, styled in `public/css/site.css`, wired by one block in `public/js/site.js`. The films are plain MP4 files in `public/video/films/`, fetched only when a button is pressed. No libraries.

**Spec:** Nathan's instructions of 14 and 15 Nov 2026 and the approved example at https://claude.ai/artifact/H2Nz61McCCSvafijgDrXjU (version 11). This file is not shipped: the build copies `public/` only.

## What Nathan asked for (his words)

1. "a gold bleed through play button for each of the sections" that "will then take them through to the corresponding infomercial video that we've made".
2. "Go back to how it was and just have a faint gold play button when clicked it will take open the video".
3. "make play button standard brand gold brightess, reduce size by 20% and write 'play video' underneath in gold".
4. "change wording of AUTO to read 'AI AND AUTOMATED WORKFLOWS'".
5. Asked whether the foot of each card is the right place for the button: "Yes, keep it there".
6. "apply all changes to main site".

## Decisions (Claude's, not confirmed by Nathan unless marked)

- Pairing: Web design opens No Pitch Deck (0:41), Marketing opens Night Shift (0:42), Workflow automation opens Drawing to Order (0:36). Not confirmed. It is one object, `FILMS`, in `js/site.js`.
- The button is 53px, a ring and a triangle in `var(--gold)` with "Play video" under it in the mono label style, centred at the foot of the card (placement confirmed). Because it uses the gold tokens, Day gets the darker reading gold and Starlight gets each card's own colour.
- The whole card is the click target: the button's `::after` is stretched over the card and the card's words have `pointer-events:none`.
- The film opens in a native `<dialog>` that is always Night (`class="night"`), plays with sound, and closes with Close, Esc or a click on the dark around it. Closing removes the video's `src`, which stops the download.
- While the film is open the page behind does not scroll: `window.__pace.stop()` (Lenis) plus `html:has(dialog.vid[open]){overflow:hidden}` for readers without Lenis (reduced motion).
- Names: `.pv`, `.pv-m`, `.pv-l`, `dialog.vid`, `.vid-*`. Not `.play` or `.film`: Starlight uses `.play` and the hero uses `.film`.
- Without scripts the buttons are not shown (`.pv` is `display:none` until `.js`). In a browser without `<dialog>` the script hides them.

## Constraints

- CSP is `default-src 'self'` with no `media-src`, so the films must be served from the site itself. No inline script is added (an inline script needs its hash in `public/_headers`).
- No file over Cloudflare Pages' 25 MiB limit: the films are 3.6, 5.3 and 7.4 MB.
- Nothing is pushed or merged to `main` without Nathan's say-so: `main` deploys to the live site.

## Tasks

- [ ] `public/video/films/`: the three MP4s and their `.webp` posters, copied unchanged from the example.
- [ ] `public/index.html`: a `.pv` button at the end of each `.col`; the AUTO heading reads "AI and automated workflows"; `dialog#vid` before the scripts.
- [ ] `public/css/site.css`: button and dialog rules after the `.col` rules.
- [ ] `public/js/site.js`: the films block at the end of the main function.
- [ ] Checks on the built site, served with the real headers (`node scripts/qa/serve.mjs dist 8790`): Night, Day and Starlight at desktop and 375 wide; a click on a card's words opens the right film and it plays; no console or CSP errors; the page behind does not scroll; closing returns focus to the button and drops the video source; `scrollWidth === innerWidth` at 375; `node scripts/qa/contrast.mjs` still passes.
- [ ] Commit on branch `drawing-sheet-pencil`.
