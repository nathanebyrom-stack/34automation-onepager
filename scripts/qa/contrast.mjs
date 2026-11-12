// QA only. WCAG contrast for Starlight, worked out from the colours in site.css and starlight.css.
// Covers what axe cannot judge: text over the colour glows (at a glow's centre, the worst case), over tinted panels, gradient text and filled chips.
// Usage: node scripts/qa/contrast.mjs   (exits 1 if anything is under 4.5:1)
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const L = (rgb) => 0.2126 * lin(rgb[0]) + 0.7152 * lin(rgb[1]) + 0.0722 * lin(rgb[2]);
const cr = (a, b) => { const x = L(a), y = L(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const over = (fg, bg, a) => fg.map((v, i) => v * a + bg[i] * (1 - a));
const T = { base: "#0A0B1E", plate: "#141633", field: "#1C1F45", silver: "#F1F2FF", steel: "#A9AED6", ph: "#8E93C2", err: "#FF8F7A", ink: "#0A0B1E" };
const A = { gold: "#FFC857", cyan: "#38D6FF", blue: "#7FB0FF", violet: "#B9A0FF", pink: "#FF7EB6", green: "#45E6A4" };
const t = Object.fromEntries(Object.entries({ ...T, ...A }).map(([k, v]) => [k, hex(v)]));
let bad = 0; const row = (what, r) => { const okk = r >= 4.5; if (!okk) bad++; console.log((okk ? "  ok   " : "  FAIL ") + r.toFixed(2).padStart(6) + "  " + what); };
console.log("Text on the plain surfaces");
for (const fg of ["silver", "steel", "gold", "cyan", "blue", "violet", "pink", "green", "err"]) for (const bg of ["base", "plate"]) row(`${fg} on ${bg}`, cr(t[fg], t[bg]));
row("placeholder on a focused field", cr(t.ph, t.field)); row("placeholder on plate", cr(t.ph, t.plate));
console.log("Dark ink on filled accents (buttons, index tabs, chips, tags, the Live pill, the pressed switch)");
for (const k of Object.keys(A)) row(`ink on ${k}`, cr(t.ink, t[k]));
console.log("Secondary text at the centre of each glow (alpha as set in starlight.css)");
for (const [k, a] of [["violet", 0.3], ["pink", 0.3], ["blue", 0.3], ["cyan", 0.26], ["green", 0.24], ["gold", 0.24]]) { const bg = over(t[k], t.base, a); row(`steel over the ${k} glow at ${a}`, cr(t.steel, bg)); row(`silver over the ${k} glow at ${a}`, cr(t.silver, bg)); }
console.log("Tinted panels (accent over plate; 18% is the most used anywhere)");
for (const k of Object.keys(A)) { const bg = over(t[k], t.plate, 0.18); row(`steel on ${k} 18% panel`, cr(t.steel, bg)); row(`${k} heading on its own 18% panel`, cr(t[k], bg)); }
console.log("Gradient text: every stop against the base");
for (const k of ["cyan", "violet", "pink", "silver", "gold", "green", "blue"]) row(`${k} stop`, cr(t[k], t.base));
console.log(bad ? `\n${bad} under 4.5:1` : "\nall at or above 4.5:1"); process.exit(bad ? 1 : 0);
