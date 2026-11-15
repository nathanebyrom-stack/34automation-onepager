// QA only (not shipped). Opens the built site in headless Chrome, steps the scroll through 05 In motion, saves screenshots and reports what the section did.
// Usage: node scripts/qa/valve-probe.mjs <url> <width> <height> <tag> [p,p,...] [reduce|nogl|nojs|drag|pace|rotate|lose|block|below|still] [outDir]
//   reduce  prefers-reduced-motion on          nogl  Chrome started without WebGL          nojs  scripts off
//   drag    at the end: drag the valve, press the section's button, then check Day
//   pace    checks the scroll keeps its true speed inside the section
//   rotate  halfway through, the window turns on its side (too short to pin) and back: plain band, then the 3D again
//   lose    the WebGL context is taken away and given back (the 3D carries on), then taken away for good (the still, and the reader keeps their place)
//   block   js/motion.js never arrives: the plain band
//   below   lands on #reviews, just under the section: nothing of the 3D is fetched
//   still   writes the transparent exploded view with its balloons (the fallback image, public/img/19-valve-exploded.webp) as <outDir>/valve-still.webp
// Serve dist first: node scripts/build.mjs && node scripts/qa/serve.mjs dist 8790
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const [url = "http://localhost:8790/", W = "1512", H = "900", tag = "d", ps = "0,0.1,0.3,0.565,0.7,0.9,1", flag = "", outDir = join(tmpdir(), "valve-probe-out")] = process.argv.slice(2);
mkdirSync(outDir, { recursive: true });
const PORT = 9377 + Math.floor(Math.random() * 200);
const dir = mkdtempSync(join(tmpdir(), "valve-probe-"));
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
  let id = 0; const wait = new Map(), logs = [], reqs = [];
  ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && wait.has(d.id)) { wait.get(d.id)(d); wait.delete(d.id); }
    if (d.method === "Runtime.consoleAPICalled" && ["error", "warning"].includes(d.params.type)) logs.push(d.params.type + ": " + d.params.args.map((a) => a.value || a.description || "").join(" ").slice(0, 300));
    if (d.method === "Runtime.exceptionThrown") logs.push("exception: " + (d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text).slice(0, 400));
    if (d.method === "Log.entryAdded" && d.params.entry.level === "error") logs.push("log: " + d.params.entry.text.slice(0, 300));
    if (d.method === "Network.requestWillBeSent") reqs.push(d.params.request.url.replace(/^https?:\/\/[^/]+/, "").replace(/\?.*$/, "")); };
  const send = (method, params = {}) => new Promise((r) => { const n = ++id; wait.set(n, r); ws.send(JSON.stringify({ id: n, method, params })); });
  const ev = async (expression) => { const r = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true }); return r.result?.result?.value ?? ("! " + (r.result?.exceptionDetails?.exception?.description || r.result?.exceptionDetails?.text)); };
  const shot = async (name, extra = {}) => { const s = await send("Page.captureScreenshot", { format: "png", ...extra }); writeFileSync(join(outDir, name), Buffer.from(s.result.data, "base64")); };
  const mobile = +W < 700, dsf = flag === "still" ? 2 : mobile ? 2 : 1;
  await send("Emulation.setDeviceMetricsOverride", { width: +W, height: +H, deviceScaleFactor: dsf, mobile });
  if (flag === "reduce") await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  if (flag === "nojs") await send("Emulation.setScriptExecutionDisabled", { value: true });
  await send("Runtime.enable"); await send("Log.enable"); await send("Network.enable"); await send("Page.enable");
  if (flag === "block") await send("Network.setBlockedURLs", { urls: ["*/js/motion.js*"] });
  await send("Page.navigate", { url: flag === "below" ? url.replace(/#.*$/, "") + "#reviews" : url });
  await sleep(3000);
  const before = reqs.filter((u) => /motion\.js|three|19-valve/.test(u));
  console.log("fetched before the section is near:", before.length ? before.join(" ") : "nothing of the 3D, and not the still");
  const state = `JSON.stringify({sec:document.getElementById('motion').className,pin:document.getElementById('vPin').className,rows:[...document.querySelectorAll('#vRows tr')].filter(r=>getComputedStyle(r).opacity>.9).length,
    bal:[...document.querySelectorAll('.v-b.on')].length,cap:document.getElementById('vCap').textContent,still:(()=>{const i=document.querySelector('.v-still');return i.getAttribute('src')?(getComputedStyle(i).display!=='none'?'shown':'has src, hidden'):'no src'})(),
    cta:getComputedStyle(document.getElementById('vGo')).visibility,sw:document.documentElement.scrollWidth,iw:innerWidth,trackH:document.getElementById('vTrack').offsetHeight,kicks:[...document.querySelectorAll('.kick>i')].map(i=>i.textContent).join(' ')})`;
  if (flag === "nojs") { // nothing can be evaluated with scripts off: scroll with the wheel and look
    for (let i = 0; i < 4; i++) { await send("Input.dispatchMouseEvent", { type: "mouseWheel", x: 200, y: 300, deltaX: 0, deltaY: 100000 }); await sleep(300); }
    await send("Emulation.setScriptExecutionDisabled", { value: false });
    await ev(`document.getElementById('motion').scrollIntoView()`); await sleep(1200);
    console.log(await ev(state)); await shot(`${tag}-nojs.png`);
    console.log(logs.length ? "LOGS\n" + [...new Set(logs)].join("\n") : "no console errors"); await done(0);
  }
  if (flag === "below") {
    await sleep(2500);
    console.log("landed on #reviews:", await ev(`JSON.stringify({reviewsTop:Math.round(document.getElementById('reviews').getBoundingClientRect().top),sec:document.getElementById('motion').className})`), "· fetched:", reqs.filter((u) => /motion\.js|three|19-valve/.test(u)).join(" ") || "nothing of the 3D");
    console.log(logs.length ? "LOGS\n" + [...new Set(logs)].join("\n") : "no console errors"); await done(0);
  }
  for (const p of ps.split(",")) {
    await ev(`(()=>{const t=document.getElementById('vTrack'),s=t.offsetHeight-innerHeight,top=t.getBoundingClientRect().top+scrollY;window.__pace&&window.__pace.scrollTo?window.__pace.scrollTo(top+${p}*Math.max(s,0),{immediate:true,force:true}):scrollTo(0,top+${p}*Math.max(s,0));})()`);
    await sleep(p === ps.split(",")[0] ? 3500 : 1700);
    console.log("p", p, await ev(state));
    if (flag !== "still") await shot(`${tag}-p${String(p).replace(".", "_")}.png`);
  }
  console.log("fetched in all:", reqs.filter((u) => /motion\.|three|19-valve/.test(u)).join(" "));
  if (flag === "drag") {
    const b0 = await ev(`[...document.querySelectorAll('.v-b.on')].map(b=>Math.round(b.getBoundingClientRect().left)).join(',')`);
    await ev(`(()=>{const g=document.getElementById('vGrab'),r=g.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2,o=(t,dx)=>g.dispatchEvent(new PointerEvent(t,{bubbles:true,pointerId:7,clientX:x+dx,clientY:y,button:0}));o('pointerdown',0);o('pointermove',60);o('pointermove',140);o('pointerup',140);})()`);
    await sleep(900);
    console.log("drag: balloons", b0, "→", await ev(`[...document.querySelectorAll('.v-b.on')].map(b=>Math.round(b.getBoundingClientRect().left)).join(',')+' · '+document.getElementById('vGrab').getAttribute('aria-valuetext')`));
    await shot(`${tag}-dragged.png`);
    await ev(`document.getElementById('vGo').click()`); await sleep(2500);
    console.log("button:", await ev(`JSON.stringify({ticked:document.querySelector('#enq input[value="Product animation"]').checked,contactTop:Math.round(document.getElementById('contact').getBoundingClientRect().top),chips:[...document.querySelectorAll('#enq .chips span')].map(s=>s.textContent).join(' | ')})`));
    await shot(`${tag}-form.png`);
    await ev(`document.getElementById('mDay').click()`); await sleep(600);
    console.log("day:", await ev(`JSON.stringify({page:getComputedStyle(document.body).backgroundColor,section:getComputedStyle(document.getElementById('motion')).backgroundColor,sectionText:getComputedStyle(document.querySelector('#motion .h2')).color})`));
    await ev(`document.getElementById('mStar').click()`); await sleep(1500);
    console.log("starlight:", await ev(`JSON.stringify({section:getComputedStyle(document.getElementById('motion')).backgroundColor,gold:getComputedStyle(document.querySelector('#motion .h2 em')).color,chip1:getComputedStyle(document.querySelector('#enq .chips label:nth-child(1)')).getPropertyValue('--gold'),chip4:getComputedStyle(document.querySelector('#enq .chips label:nth-child(4)')).getPropertyValue('--gold')})`));
  }
  if (flag === "pace") { // one wheel notch inside the valve's track, one in The work: Lenis speeds the page up to 108% everywhere but inside the films and this track
    const notch = async (label, at) => {
      await ev(`window.__pace.scrollTo(${at},{immediate:true,force:true})`); await sleep(900);
      const y0 = await ev("scrollY"); await send("Input.dispatchMouseEvent", { type: "mouseWheel", x: 400, y: 400, deltaX: 0, deltaY: 120 }); await sleep(2200);
      console.log(`pace ${label}: a 120px notch moved the page ${Math.round((await ev("scrollY")) - y0)}px`);
    };
    await notch("inside the valve", `(()=>{const t=document.getElementById('vTrack');return t.getBoundingClientRect().top+scrollY+.3*(t.offsetHeight-innerHeight)})()`);
    await notch("in The work", `document.getElementById('work').getBoundingClientRect().top+scrollY+200`);
  }
  const where = `JSON.stringify({sec:document.getElementById('motion').className,pin:document.getElementById('vPin').className,secTop:Math.round(document.getElementById('motion').getBoundingClientRect().top),secH:document.getElementById('motion').offsetHeight,
    still:(()=>{const i=document.querySelector('.v-still');return i.getAttribute('src')&&getComputedStyle(i).display!=='none'?'shown':'not shown'})(),reviewsTop:Math.round(document.getElementById('reviews').getBoundingClientRect().top)})`;
  if (flag === "rotate") {
    await send("Emulation.setDeviceMetricsOverride", { width: +H, height: +W, deviceScaleFactor: dsf, mobile }); await sleep(1500);
    console.log("on its side:", await ev(where)); await shot(`${tag}-side.png`);
    await send("Emulation.setDeviceMetricsOverride", { width: +W, height: +H, deviceScaleFactor: dsf, mobile }); await sleep(1800);
    console.log("upright again:", await ev(where)); await shot(`${tag}-upright.png`);
  }
  if (flag === "lose") {
    await ev(`(()=>{const c=document.getElementById('vCan');window.__lc=(c.getContext('webgl2')).getExtension('WEBGL_lose_context');window.__lc.loseContext();})()`); await sleep(700);
    console.log("context lost:", await ev(where));
    await ev(`window.__lc.restoreContext()`); await sleep(1500);
    console.log("context back:", await ev(where)); await shot(`${tag}-restored.png`);
    await ev(`window.__lc.loseContext()`); await sleep(6000);
    console.log("lost for good:", await ev(where)); await shot(`${tag}-lost.png`);
  }
  if (flag === "block") { console.log("blocked:", await ev(where)); }
  if (flag === "still") {
    await ev(`(()=>{window.__valve.bare(true);const s=document.createElement('style');s.textContent='html,body,.motion,#vPin{background:none!important}.hdr,.v-shade,.v-copy,.v-cta,.v-bom,.v-rail,.v-cap,.skip{visibility:hidden!important}';document.head.appendChild(s);})()`);
    await send("Emulation.setDefaultBackgroundColorOverride", { color: { r: 0, g: 0, b: 0, a: 0 } });
    await sleep(900);
    const box = JSON.parse(await ev(`(()=>{const b=[...document.querySelectorAll('.v-b.on')].map(e=>e.getBoundingClientRect()),p=document.getElementById('vPin').getBoundingClientRect();
      const x0=Math.min(...b.map(r=>r.left))-14,x1=Math.max(...b.map(r=>r.right))+14;return JSON.stringify({x:Math.round(x0+scrollX),y:Math.round(p.top+68+scrollY),width:Math.round(x1-x0),height:Math.round(p.height-68-52)})})()`)); // a clip is in page coordinates, not the window's
    const s = await send("Page.captureScreenshot", { format: "webp", quality: 88, clip: { ...box, scale: 1 }, captureBeyondViewport: false });
    const buf = Buffer.from(s.result.data, "base64");
    writeFileSync(join(outDir, "valve-still.webp"), buf);
    console.log(`still: ${box.width * dsf}×${box.height * dsf} px, ${buf.length} B, alpha chunk ${buf.includes(Buffer.from("ALPH")) || buf.includes(Buffer.from("VP8L")) ? "present" : "MISSING"} → ${join(outDir, "valve-still.webp")}`);
  }
  console.log(logs.length ? "LOGS\n" + [...new Set(logs)].join("\n") : "no console errors");
  await done(0);
} catch (e) { console.error("probe failed:", e && e.stack); await done(1); }
