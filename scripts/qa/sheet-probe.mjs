// QA only (not shipped). Opens the built site in headless Chrome and looks at the drawing sheet behind "Imagine you never missed a call" and 01:
// is its frame the size of the sheet, are the cards inside it, is the part clear of the cards, is the flange's handle over the flange, and does the pencil still run in step.
// Usage: node scripts/qa/sheet-probe.mjs <url> <width> <height> <tag> [still|pencil|resize|themes] [outDir]
//   still   (default) reduced motion: the finished drawing at once. Three window shots and one tall one
//   pencil  the 30 s pass as a reader sees it: shots at 6 s, 23 s and 33 s, with how much of the frame's pencil is down each time
//   resize  10 s into the pass the window is made 220px narrower: the frame is drawn again and must stay in step
//   themes  the finished drawing in Night, Day and Starlight
// Serve dist first: node scripts/build.mjs && node scripts/qa/serve.mjs dist 8790
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const [url = "http://localhost:8790/", W = "1512", H = "900", tag = "d", flag = "still", outDir = join(tmpdir(), "sheet-probe-out")] = process.argv.slice(2);
mkdirSync(outDir, { recursive: true });
const PORT = 9377 + Math.floor(Math.random() * 200), dir = mkdtempSync(join(tmpdir(), "sheet-probe-"));
const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", ["--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${dir}`, `--window-size=${W},${H}`, "--no-first-run", "--no-default-browser-check", "--hide-scrollbars", "--mute-audio", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function done(c) { try { chrome.kill(); } catch {} await sleep(300); try { rmSync(dir, { recursive: true, force: true }); } catch {} process.exit(c); }

try {
  let list; for (let i = 0; i < 50; i++) { try { list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); if (list.length) break; } catch {} await sleep(200); }
  const ws = new WebSocket(list.find((t) => t.type === "page").webSocketDebuggerUrl); await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let id = 0; const wait = new Map(), logs = [];
  ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && wait.has(d.id)) { wait.get(d.id)(d); wait.delete(d.id); }
    if (d.method === "Runtime.exceptionThrown") logs.push("exception: " + (d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text).slice(0, 400));
    if (d.method === "Runtime.consoleAPICalled" && d.params.type === "error") logs.push("error: " + d.params.args.map((a) => a.value || a.description || "").join(" ").slice(0, 300));
    if (d.method === "Log.entryAdded" && d.params.entry.level === "error") logs.push("log: " + d.params.entry.text.slice(0, 300)); };
  const send = (method, params = {}) => new Promise((r) => { const n = ++id; wait.set(n, r); ws.send(JSON.stringify({ id: n, method, params })); });
  const ev = async (e) => { const r = await send("Runtime.evaluate", { expression: e, awaitPromise: true, returnByValue: true }); return r.result?.result?.value ?? ("! " + (r.result?.exceptionDetails?.exception?.description || "")); };
  const shot = async (name, extra = {}) => { const s = await send("Page.captureScreenshot", { format: "png", ...extra }); writeFileSync(join(outDir, name), Buffer.from(s.result.data, "base64")); };
  const mobile = +W < 700, still = flag === "still" || flag === "themes";
  const size = (w) => send("Emulation.setDeviceMetricsOverride", { width: w, height: +H, deviceScaleFactor: mobile ? 2 : 1, mobile });
  await size(+W);
  if (still) await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  await send("Runtime.enable"); await send("Log.enable"); await send("Page.enable"); await send("Page.navigate", { url }); await sleep(3000);
  const go = (y) => ev(`(window.__pace&&window.__pace.scrollTo)?window.__pace.scrollTo(${y},{immediate:true,force:true}):scrollTo(0,${y})`);
  await go(`document.getElementById('sheet').getBoundingClientRect().top+scrollY-70`); await sleep(still ? 2500 : 1200);
  // what the sheet looks like in numbers. All in screen pixels from the sheet's top left
  const facts = `(()=>{const sh=document.getElementById('sheet'),s=document.getElementById('dwg'),r=sh.getBoundingClientRect(),c=sh.querySelector('.offer .cols').getBoundingClientRect(),vb=s.getAttribute('viewBox').split(' ').map(Number),k=r.width/vb[2],
    inn=s.querySelector('g.fr rect.in').getBoundingClientRect(),g=document.getElementById('grab').getBoundingClientRect(),fl=s.querySelector('.g3d').getBoundingClientRect(),pen=[...s.children[1].children],
    down=pen.filter(p=>parseFloat(getComputedStyle(p).strokeDashoffset)<1).length,tb=[...s.querySelectorAll('g.fr text')].find(t=>t.textContent==='TITLE').getBoundingClientRect(),
    part=s.children[2].getBoundingClientRect(),svc=document.getElementById('services').getBoundingClientRect();
    return JSON.stringify({window:innerWidth+'x'+innerHeight,sheet:Math.round(r.width)+'x'+Math.round(r.height),scale:+k.toFixed(3),frame:[Math.round(inn.left-r.left),Math.round(inn.top-r.top),Math.round(inn.right-r.left),Math.round(inn.bottom-r.top)],
      cards:[Math.round(c.left-r.left),Math.round(c.top-r.top),Math.round(c.right-r.left),Math.round(c.bottom-r.top)],cardsInsideFrame:c.left>=inn.left&&c.right<=inn.right&&c.top>=inn.top&&c.bottom<=inn.bottom,
      partLowestLine:Math.round(1222*k),revTable:[...s.querySelectorAll('g.fr text')].some(t=>t.textContent==='DESCRIPTION')?'shown':'left out',
      notes:(()=>{const t=[...s.querySelectorAll('.dm text')].find(t=>t.textContent.indexOf('TEST 24 BAR')>-1);if(!t||!t.getClientRects().length)return 'left out';const b=t.getBoundingClientRect();return b.right<=inn.right&&b.left>=inn.left?'inside the frame':'CUT BY THE FRAME'})(),
      flange:(()=>{const g=s.querySelector('.g3d');if(!g.getClientRects().length&&getComputedStyle(g).display==='none')return 'left out';const b=g.getBoundingClientRect();return b.right<=inn.right&&b.left>=inn.left?'inside the frame':'CUT BY THE FRAME'})(),
      dimClearOfRevTable:(()=>{const d=[...s.querySelectorAll('g.fr text')].find(t=>t.textContent==='DESCRIPTION');if(!d)return true;const tb=d.getBoundingClientRect(),x=r.left+(vb[2]-1600)/2*k+1288*k;return x<tb.left-34-8})(),partClearOfCards:1222*k<c.top-r.top,titleBlockTop:Math.round(tb.top-r.top-8),titleBlockClearOfCards:tb.top-8>c.bottom,sectionTwoBelowSheet:Math.round(svc.top-r.bottom),
      grabOverFlange:Math.abs(g.left+g.width/2-(fl.left+fl.width/2))<14&&Math.abs(g.top+g.height/2-(fl.top+fl.height/2))<14,grab:getComputedStyle(document.getElementById('grab')).visibility,
      framePencil:down+' of '+pen.length+' strokes down',O:s.children[1].style.getPropertyValue('--O'),sideways:document.documentElement.scrollWidth-innerWidth})})()`;
  const tall = async (name) => { await ev(`document.getElementById('hdr').style.visibility='hidden'`); const b = JSON.parse(await ev(`(()=>{const s=document.getElementById('sheet').getBoundingClientRect();return JSON.stringify({y:Math.round(s.top+scrollY-72),h:Math.round(s.height+72+240)})})()`));
    await shot(name, { clip: { x: 0, y: b.y, width: await ev("innerWidth"), height: b.h, scale: mobile ? 1 : 0.6 }, captureBeyondViewport: true }); await ev(`document.getElementById('hdr').style.visibility=''`); };
  if (flag === "still") {
    console.log(await ev(facts));
    const y = JSON.parse(await ev(`(()=>{const s=document.getElementById('sheet').getBoundingClientRect(),o=document.getElementById('offer').getBoundingClientRect(),v=document.getElementById('services').getBoundingClientRect(),t=scrollY;return JSON.stringify([s.top+t-70,o.top+t-64,v.top+t-innerHeight*.66])})()`));
    for (let i = 0; i < y.length; i++) { await go(Math.round(y[i])); await sleep(900); await shot(`${tag}-${i + 1}.png`); }
    await tall(`${tag}-whole.png`);
  }
  if (flag === "themes") {
    for (const [name, btn] of [["night", "mNight"], ["day", "mDay"], ["starlight", "mStar"]]) { await ev(`document.getElementById('${btn}').click()`); await sleep(1600); console.log(name, await ev(facts)); await tall(`${tag}-${name}.png`); }
  }
  if (flag === "pencil" || flag === "resize") { // the pencil starts half a second after the sheet reaches the middle of the window
    const t0 = Date.now(), at = async (s) => { const ms = s * 1000 - (Date.now() - t0); if (ms > 0) await sleep(ms); };
    await at(6); console.log("6 s", await ev(facts)); await shot(`${tag}-06s.png`);
    if (flag === "resize") { await at(10); await size(+W - 220); await sleep(900); console.log("10 s, 220px narrower", await ev(facts)); await shot(`${tag}-10s-narrower.png`); }
    await at(23.5); console.log("23.5 s", await ev(facts)); await shot(`${tag}-23s.png`);
    await at(34); console.log("34 s", await ev(facts)); await tall(`${tag}-34s-whole.png`);
  }
  console.log(logs.length ? "LOGS\n" + [...new Set(logs)].join("\n") : "no console errors");
  await done(0);
} catch (e) { console.error("probe failed:", e && e.stack); await done(1); }
