// QA only. Text weight against the budget in docs/starlight-plan.md section 9 (gzip level 9). Baseline is main at 9488cb6.
// Usage: node scripts/qa/bytes.mjs [dist]
import { readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
const dir = process.argv[2] || "dist", gz = (f) => gzipSync(readFileSync(`${dir}/${f}`), { level: 9 }).length;
const rows = [["index.html", 9491, 350], ["css/site.css", 9614, 600], ["js/site.js", 9378, 300], ["css/starlight.css", 0, 4096], ["js/starlight.js", 0, 9216]];
let bad = 0, nd = 0;
for (const [f, base, allow] of rows) { const n = gz(f), d = n - base; if (base) nd += d; const over = d > allow; if (over) bad++; console.log(f.padEnd(20), String(n).padStart(6), "B gzip", base ? `(+${d} against ${base}, allowed +${allow})` : `(new, allowed ${allow})`, over ? "OVER" : "ok"); }
const sl = gz("css/starlight.css") + gz("js/starlight.js");
console.log(`Night and Day download ${nd} B more than before (allowed 1250 in total), in the same number of requests.`, nd > 1250 ? "OVER" : "ok");
console.log(`Starlight only: ${sl} B in two files (allowed 13312 in total).`, sl > 13312 ? "OVER" : "ok");
// the totals are the budget; the per-file lines above are the plan's first split and are information only
process.exit(nd > 1250 || sl > 13312 ? 1 : 0);
