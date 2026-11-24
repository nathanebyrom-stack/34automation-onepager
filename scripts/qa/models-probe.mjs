// QA only (not shipped). Opens /models/ in headless Chrome, lets the four viewers start, and saves screenshots: as loaded, with every Dimensions button pressed,
// after a drag on the first card, and in Day. Reports each card's state and any console errors.
// Usage: node scripts/qa/models-probe.mjs <url> <width> <height> <tag> [reduce|nojs|nogl] [outDir]
// Serve dist first: node scripts/build.mjs && node scripts/qa/serve.mjs dist 8790
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const [url = "http://localhost:8790/models/", W = "1512", H = "900", tag = "d", flag = "", outDir = join(tmpdir(), "models-probe-out")] = process.argv.slice(2);
mkdirSync(outDir, { recursive: true });
const PORT = 9377 + Math.floor(Math.random() * 200);
const dir = mkdtempSync(join(tmpdir(), "models-probe-"));
const args = ["--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${dir}`, `--window-size=${W},${H}`, "--no-first-run", "--no-default-browser-check", "--hide-scrollbars", "--mute-audio", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"];
if (flag === "nogl") args.push("--disable-gpu", "--disable-webgl", "--disable-webgl2", "--disable-3d-apis");
args.push("about:blank");
const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", args, { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function done(code) { try { chrome.kill(); } catch {} await sleep(300); try { rmSync(dir, { recursive: true, force: true }); } catch {} process.exit(code); }

try {
  let list;
  for (let i = 0; i < 50; i++) { try { list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); if (list.length) break; } catch {} await sleep(200); }
  const page = list.find((t) => t.type === "page");
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let id = 0; const wait = new Map(), logs = [];
  ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && wait.has(d.id)) { wait.get(d.id)(d); wait.delete(d.id); }
    if (d.method === "Runtime.consoleAPICalled" && ["error", "warning"].includes(d.params.type)) logs.push(d.params.type + ": " + d.params.args.map((a) => a.value || a.description || "").join(" ").slice(0, 300));
    if (d.method === "Runtime.exceptionThrown") logs.push("exception: " + (d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text).slice(0, 400));
    if (d.method === "Log.entryAdded" && d.params.entry.level === "error") logs.push("log: " + d.params.entry.text.slice(0, 300)); };
  const send = (method, params = {}) => new Promise((r) => { const n = ++id; wait.set(n, r); ws.send(JSON.stringify({ id: n, method, params })); });
  const ev = async (expression) => { const r = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true }); return r.result?.result?.value ?? ("! " + (r.result?.exceptionDetails?.exception?.description || r.result?.exceptionDetails?.text)); };
  const shot = async (name) => { const s = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, clip: { x: 0, y: 0, width: +W, height: await ev("document.documentElement.scrollHeight"), scale: 1 } }); writeFileSync(join(outDir, name), Buffer.from(s.result.data, "base64")); };
  const mobile = +W < 700;
  await send("Emulation.setDeviceMetricsOverride", { width: +W, height: +H, deviceScaleFactor: mobile ? 2 : 1, mobile });
  if (flag === "reduce") await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  if (flag === "nojs") await send("Emulation.setScriptExecutionDisabled", { value: true });
  await send("Runtime.enable"); await send("Log.enable"); await send("Page.enable");
  await send("Page.navigate", { url });
  await sleep(flag === "nojs" ? 1500 : 4000);
  const state = `JSON.stringify([...document.querySelectorAll('.m-card')].map(c=>({m:c.dataset.model,cls:c.className,off:getComputedStyle(c.querySelector('.m-off')).display,dim:c.querySelector('.m-dim').getAttribute('aria-pressed'),
    figs:[...c.querySelectorAll('.m-d.on')].map(e=>e.textContent),lines:c.querySelectorAll('.m-lead g.on').length,aria:c.querySelector('.m-grab').getAttribute('aria-valuetext'),
    px:(()=>{const cv=c.querySelector('canvas');return cv.width+'x'+cv.height})()})))`;
  if (flag === "nojs") { await shot(`${tag}-nojs.png`); await send("Emulation.setScriptExecutionDisabled", { value: false }); await sleep(300); console.log("no scripts:", await ev(state)); console.log(logs.length ? "LOGS\n" + [...new Set(logs)].join("\n") : "no console errors"); await done(0); }
  // every card draws only while on screen: walk down the page and back so each has drawn at least once
  const walk = async () => { for (const y of [0, .3, .6, 1, .6, .3, 0]) { await ev(`scrollTo(0,${y}*(document.documentElement.scrollHeight-innerHeight))`); await sleep(700); } };
  await walk();
  console.log("loaded:", await ev(state));
  await shot(`${tag}-loaded.png`);
  // is the first card actually turning by itself? (two readings of its slider value, after a drag-free second)
  const yaw = async () => ev(`(()=>{const g=document.querySelector('.m-card .m-grab');g.dispatchEvent(new KeyboardEvent('keydown',{key:'Tab'}));return g.getAttribute('aria-valuetext')})()`);
  await ev(`[...document.querySelectorAll('.m-dim')].forEach(b=>b.click())`); await sleep(1500); await walk();
  console.log("dimensions on:", await ev(state));
  await shot(`${tag}-dims.png`);
  // drag the first card a third of its width to the right, and a little down
  await ev(`(()=>{const g=document.querySelector('.m-card .m-grab'),r=g.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2,o=(t,dx,dy)=>g.dispatchEvent(new PointerEvent(t,{bubbles:true,pointerId:7,clientX:x+dx,clientY:y+dy,button:0}));o('pointerdown',0,0);o('pointermove',60,10);o('pointermove',r.width/3,30);o('pointerup',r.width/3,30);})()`);
  await sleep(900);
  console.log("after drag:", await ev(`document.querySelector('.m-card .m-grab').getAttribute('aria-valuetext')`));
  await ev(`document.querySelector('.m-card .m-grab').dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowLeft',bubbles:true}))`); await sleep(400);
  console.log("after ArrowLeft:", await ev(`document.querySelector('.m-card .m-grab').getAttribute('aria-valuetext')`));
  await shot(`${tag}-dragged.png`);
  await ev(`document.getElementById('mDay').click()`); await sleep(800);
  console.log("day:", await ev(`JSON.stringify({page:getComputedStyle(document.body).backgroundColor,view:getComputedStyle(document.querySelector('.m-view')).backgroundImage.slice(0,60),fig:getComputedStyle(document.querySelector('.m-d')).color,text:getComputedStyle(document.querySelector('.m-meta p')).color})`));
  await shot(`${tag}-day.png`);
  console.log("page:", await ev(`JSON.stringify({sw:document.documentElement.scrollWidth,iw:innerWidth,h:document.documentElement.scrollHeight,title:document.title})`));
  console.log(logs.length ? "LOGS\n" + [...new Set(logs)].join("\n") : "no console errors");
  console.log("screenshots in", outDir);
  await done(0);
} catch (e) { console.error(e); await done(1); }
