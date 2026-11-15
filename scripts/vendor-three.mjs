// Dev only (not shipped: the build copies public/). Makes the site's own copy of Three.js for 05 In motion (docs/valve-motion-plan.md).
//   node scripts/vendor-three.mjs
// Three.js is TREE-SHAKEN: the script finds every class public/js/motion.js names as `THREE.X` and bundles only those into one file,
// public/js/vendor/three-r186/three.min.js, and writes that file's hash into motion.js's import line. Run it again whenever motion.js starts using a new Three.js class (the page fails loudly if you forget:
// the missing name is undefined). Nothing from the downloaded package is ever executed.
// It needs npm (to fetch three@VERSION; the npm cache is tried first, so it usually works offline) and esbuild. esbuild is not a dependency of this site:
// it is taken from this repo if someone has installed it, otherwise from the Dollar repo's tools folder next door (../dollar/tools).
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, copyFileSync, rmSync, readdirSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const VERSION = "0.186.1", DIR = "three-r186";
const here = dirname(fileURLToPath(import.meta.url)), root = resolve(here, "..");
const out = join(root, "public", "js", "vendor", DIR), user = join(root, "public", "js", "motion.js");

let esbuild;
for (const from of [join(root, "package.json"), resolve(root, "..", "dollar", "tools", "package.json")]) {
  try { esbuild = createRequire(from)("esbuild"); break; } catch {}
}
if (!esbuild) { console.error("✖ esbuild not found. Install it here (npm i --no-save esbuild) or in ../dollar/tools."); process.exit(1); }

// comments are skipped, so a note that mentions "THREE.Something" is not mistaken for a use
const source = readFileSync(user, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
const names = [...new Set([...source.matchAll(/\bTHREE\.([A-Za-z0-9_]+)/g)].map((m) => m[1]))].sort();
if (!names.length) { console.error("✖ no THREE.X found in public/js/motion.js"); process.exit(1); }

const tmp = mkdtempSync(join(tmpdir(), "34-three-"));
try {
  let packed = false;
  for (const extra of [["--offline"], []]) { // the cache first; the network only if it is not there
    try { execFileSync("npm", ["pack", `three@${VERSION}`, "--silent", "--ignore-scripts", ...extra], { cwd: tmp, stdio: ["ignore", "pipe", "pipe"] }); packed = true; break; } catch {}
  }
  if (!packed) throw new Error(`could not fetch three@${VERSION} from npm`);
  execFileSync("tar", ["xzf", readdirSync(tmp).find((f) => f.endsWith(".tgz"))], { cwd: tmp });
  const pkg = join(tmp, "package");
  const bundled = await esbuild.build({
    stdin: { contents: `export { ${names.join(", ")} } from './build/three.module.js';`, resolveDir: pkg },
    bundle: true, format: "esm", minify: true, treeShaking: true, legalComments: "inline", target: "es2022", write: false,
  });
  const code = bundled.outputFiles[0].contents;
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, "three.min.js"), code);
  copyFileSync(join(pkg, "LICENSE"), join(out, "LICENSE.txt"));
  // motion.js imports the bundle by a name that carries its hash, so a browser never pairs a new motion.js with an old cached bundle (/js/* is cached for an hour)
  const hash = createHash("sha256").update(code).digest("hex").slice(0, 10);
  const src = readFileSync(user, "utf8"), IMPORT = /from '\.\/vendor\/three-r186\/three\.min\.js(\?h=[0-9a-f]+)?'/;
  if (!IMPORT.test(src)) throw new Error("public/js/motion.js: the Three.js import line was not found");
  writeFileSync(user, src.replace(IMPORT, `from './vendor/${DIR}/three.min.js?h=${hash}'`));
  console.log(`  import in motion.js stamped ?h=${hash}`);
  const gz = (b) => gzipSync(b, { level: 9 }).length, mine = readFileSync(user);
  console.log(`three@${VERSION}: ${names.length} exports → public/js/vendor/${DIR}/three.min.js`);
  console.log(`  three.min.js ${code.length} B, ${gz(code)} B gzip`);
  console.log(`  motion.js    ${mine.length} B, ${gz(mine)} B gzip`);
  console.log(`  together     ${gz(code) + gz(mine)} B gzip (budget 163840)`, gz(code) + gz(mine) > 163840 ? "OVER" : "ok");
} finally { rmSync(tmp, { recursive: true, force: true }); }
