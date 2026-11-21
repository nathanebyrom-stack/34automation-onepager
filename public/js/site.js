(function(){
  var d=document.documentElement; d.classList.add('js');
  var SRC=(document.currentScript||{}).src||''; // its ?v= is reused for the Starlight files
  // day / night / starlight. The landing page always opens in Night (Nathan, 15 Nov 2026): index.html carries data-theme="dark" on <html>, and neither the viewer's
  // system setting nor an earlier choice is applied on load. The switch still works for the visit, and the choice is still stored, because the inner pages (js/theme.js) follow it.
  // Starlight is Night plus a class: stored as 'starlight', applied as data-theme="dark" + .starlight, only on pages marked data-sl. The system setting can never pick it.
  (function(){
    var K='34-theme',SL='starlight',can=d.hasAttribute('data-sl'),bs=[].slice.call(document.querySelectorAll('.mode button')),got;
    function cur(){if(d.classList.contains(SL))return SL;var t=d.getAttribute('data-theme');if(t)return t;return matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';}
    function set(m){d.classList.toggle(SL,m===SL&&can);d.setAttribute('data-theme',m===SL?'dark':m);}
    function layers(){ // Starlight's stylesheet and script, fetched the first time the mode is on and never for Night or Day. The sheet arrives off; its script switches it on
      if(got||!d.classList.contains(SL))return;got=1;
      var v=SRC.split('?')[1],l=document.createElement('link'),s=document.createElement('script');v=v?'?'+v:'';
      l.rel='stylesheet';l.media='not all';l.href='/css/starlight.css'+v;s.src='/js/starlight.js'+v;document.head.appendChild(l);document.head.appendChild(s);
    }
    var PH=matchMedia('(max-width:700px)'); // phones: the switch is a carousel, one button that moves on to the next mode (css: max-width 700px)
    function nx(b){var i=bs.indexOf(b);return bs[(i+1)%bs.length];}
    function lab(){var ph=PH.matches;bs.forEach(function(b){var n=b.title||b.textContent.trim();b.setAttribute('aria-label',ph&&b.getAttribute('aria-pressed')==='true'?n+', tap for '+(nx(b).title||nx(b).textContent.trim()):n);});}
    function paint(){var c=cur();bs.forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.mode===c));});lab();layers();}
    bs.forEach(function(b){b.addEventListener('click',function(){
      // once Starlight's script is in, it holds the reader's place across the switch (its blocks change the page's height)
      (window.__slHold||function(f){f();})(function(){var m=(PH.matches&&b.getAttribute('aria-pressed')==='true'?nx(b):b).dataset.mode;set(m);try{localStorage.setItem(K,m);}catch(e){}paint();});
    });});
    try{matchMedia('(prefers-color-scheme: light)').addEventListener('change',paint);PH.addEventListener('change',lab);}catch(e){}
    new MutationObserver(paint).observe(d,{attributes:true,attributeFilter:['data-theme']});
    paint();
  })();
  var still=matchMedia('(prefers-reduced-motion: reduce)').matches;

  // scroll pace (Nathan, 11 Nov; 13 Nov): the page scrolls at 108% of the browser's speed (wheel, trackpad and touch; was 50%, sped up 30% to 65% on 11 Nov,
  // then scroll length cut 40% on 13 Nov, so 0.65 / 0.6),
  // except inside the two scroll films (hero, why us), which keep their full speed. No pauses at section tops (removed 11 Nov: it felt clunky).
  // Lenis (js/lenis.min.js) does the smoothing. Off for reduced motion; nav links, keyboard and the scrollbar still go straight there.
  (function(){
    if(still||typeof Lenis!=='function')return;
    var PACE=1.08; // share of normal scroll speed outside the films (above 1: a little faster than the browser's own)
    var lenis;
    var hero=document.getElementById('hero'),why=document.getElementById('why'),whyTrack=document.getElementById('whyTrack'),mo=document.getElementById('motion'),moTrack=document.getElementById('vTrack');
    function span(el,y){var r=el.getBoundingClientRect();return [r.top+y,r.top+y+el.offsetHeight-innerHeight];}
    function inFilm(at){ // is this scroll position inside a film's scrub, or the valve's? (only when it actually runs)
      var y=lenis.scroll,s;
      if(hero&&d.classList.contains('film')){s=span(hero,y);if(at>=s[0]&&at<s[1])return true;}
      if(why&&whyTrack&&why.classList.contains('scrub')){s=span(whyTrack,y);if(at>=s[0]&&at<s[1])return true;}
      if(mo&&moTrack&&mo.classList.contains('scrub')){s=span(moTrack,y);if(at>=s[0]&&at<s[1])return true;}
      return false;
    }
    function pace(e){
      var ev=e.event,t=ev.type,dy=e.deltaY;
      if(!lenis||ev.ctrlKey||t==='touchstart'||t==='touchend'||!dy)return true;
      if(!inFilm(dy>0?lenis.targetScroll:lenis.targetScroll-1)){e.deltaY=dy*PACE;e.deltaX*=PACE;} // Lenis reads the deltas after this returns
      return true;
    }
    lenis=new Lenis({syncTouch:true,lerp:.09,anchors:true,autoRaf:true,virtualScroll:pace});
    window.__pace=lenis; // handle for testing
  })();
  // the contact address for the email fallbacks. Kept here, not read from the page, because Cloudflare's email obfuscation rewrites addresses in the live HTML.
  // Keep in step with publicEmail in site.config.json.
  var MAILTO='nathan@34automation.co.uk';
  // header turns solid once the hero scrolls away
  var hdr=document.getElementById('hdr');
  function onHdr(){hdr.classList.toggle('on',scrollY>40);} onHdr(); addEventListener('scroll',onHdr,{passive:true});
  // reveals: anything already on screen shows at once, the rest as it arrives
  var els=[].slice.call(document.querySelectorAll('.rv,.band'));
  if(!('IntersectionObserver' in window)||still){els.forEach(function(e){e.classList.add('in')});}
  else{
    var io=new IntersectionObserver(function(en){en.forEach(function(x){if(x.isIntersecting){x.target.classList.add('in');io.unobserve(x.target);}})},{rootMargin:'0px 0px -8% 0px',threshold:.08});
    els.forEach(function(e){io.observe(e)});
    // safety: never leave something blank if the observer misses it
    setTimeout(function(){els.forEach(function(e){var r=e.getBoundingClientRect();if(r.top<innerHeight&&r.bottom>0)e.classList.add('in');})},900);
  }
  // gentle parallax on the work-section photo
  if(!still){
    var wp=document.getElementById('workPh'),t=false;
    function px(){t=false;if(wp){var r=wp.parentElement.getBoundingClientRect();if(r.bottom>0&&r.top<innerHeight){var k=(r.top+r.height/2-innerHeight/2)/innerHeight;wp.style.transform='translateY('+(-k*60)+'px) scale(1.12)';}}}
    addEventListener('scroll',function(){if(!t){t=true;requestAnimationFrame(px);}},{passive:true}); px();
  }

  // the drawing sheet (Nathan, 14 Nov): one engineering drawing behind "Imagine you never missed a call" and 01 What we offer, as fine vector lines.
  // A pencil goes over the whole sheet once, on the clock (30 s), from when those words come up the screen; it does not follow the scroll, loop or rewind.
  // The flange view turns slowly in 3D from the start and can be dragged. All of that is js/sheet.js and css/sheet.css, fetched here once the sheet is near.
  // The stylesheet goes first and the script only after it has loaded: unstyled SVG shapes are solid black, and must never flash. If it fails, no drawing.
  (function(){
    var sheet=document.getElementById('sheet');if(!sheet)return;
    function load(){var v=SRC.split('?')[1],l=document.createElement('link'),s=document.createElement('script');v=v?'?'+v:'';
      l.rel='stylesheet';l.href='/css/sheet.css'+v;s.src='/js/sheet.js'+v;l.onload=function(){document.head.appendChild(s);};document.head.appendChild(l);}
    if('IntersectionObserver' in window){var io=new IntersectionObserver(function(e){if(e[0].isIntersecting){io.disconnect();load();}},{rootMargin:'150% 0px'});io.observe(sheet);}else load();
  })();
  // 05 In motion (Nathan, 15 Nov): the valve from the drawing sheet, built in 3D and taken apart as the reader scrolls (js/motion.js, css/motion.css, docs/valve-motion-plan.md).
  // As it stands in the page the section is a plain band: the words, a still of the exploded valve, the whole parts list, the button. Here it is pinned (.scrub) and the 3D
  // is fetched, but only where it will run: motion allowed, not Save-Data or 2G, WebGL 2 present, and a window tall enough (as for the why-us film; that one is looked at
  // again on every resize, so a phone turned on its side goes back to the plain band). Three.js and the script arrive once the section is near.
  (function(){
    var sec=document.getElementById('motion'),pin=document.getElementById('vPin');if(!sec||!pin)return;
    // the section's button ticks Product animation on the enquiry form on its way there (the link itself works without this); the box flashes once it is on screen
    var go=document.getElementById('vGo'),box=document.querySelector('#enq input[name="interest"][value="Product animation"]');
    if(go&&box)go.addEventListener('click',function(){
      box.checked=true;var chip=box.nextElementSibling;if(!chip)return;
      function flash(){chip.classList.remove('flash');void chip.offsetWidth;chip.classList.add('flash');}
      if('IntersectionObserver' in window){var fo=new IntersectionObserver(function(e){if(e[0].isIntersecting){fo.disconnect();setTimeout(flash,250);}},{threshold:1});fo.observe(chip);}else flash();
    });
    var c=navigator.connection||{};
    if(still||c.saveData||/(^|-)2g$/.test(c.effectiveType||''))return;
    var gl=null;try{gl=document.createElement('canvas').getContext('webgl2');}catch(e){gl=null;} // this Three.js needs WebGL 2
    if(!gl)return;
    try{var lose=gl.getExtension('WEBGL_lose_context');if(lose)lose.loseContext();}catch(e){} // that context was only a test: hand it back
    var img=sec.querySelector('.v-still'),src=img&&img.getAttribute('src'),able=true,started=false,timer=0;
    // pin or un-pin, keeping the reader's place: the section is four screens long pinned and one as a plain band, so everything below it moves
    function repin(on){
      if(on===sec.classList.contains('scrub'))return;
      var r=sec.getBoundingClientRect(),y0=window.scrollY||0,to=null;
      sec.classList.toggle('scrub',on);
      if(img&&src){if(on)img.removeAttribute('src');else img.setAttribute('src',src);} // the still is not fetched while the section is pinned
      if(r.bottom<=innerHeight*.5)to=y0+sec.offsetHeight-r.height; // the reader is past it: what they were reading stays where it was
      else if(r.top<0)to=y0+r.top;                                  // the reader is in it: it stays on screen, from its top
      if(to!==null)jump(to);
    }
    function jump(y){if(window.__pace&&window.__pace.scrollTo)window.__pace.scrollTo(y,{immediate:true,force:true});else window.scrollTo(0,y);}
    function want(){return able&&innerHeight>=(innerWidth<700?600:520);} // a phone needs more: the words go above the valve and the closing line below it
    // the 3D could not start, stalled, or lost its context for good: back to the plain band, for the rest of the visit
    function lost(){if(!able)return;able=false;clearTimeout(timer);repin(false);}
    sec.addEventListener('valve-lost',lost);
    function load(){
      if(started||!able||!sec.classList.contains('scrub'))return;
      var r=sec.getBoundingClientRect();if(r.top>innerHeight*2.5||r.bottom<innerHeight*.1)return; // a screen and a half before it arrives; not for a reader who lands just below it
      started=true;removeEventListener('scroll',load);
      var v=SRC.split('?')[1],s=document.createElement('script');s.type='module';s.src='/js/motion.js'+(v?'?'+v:'');
      function check(){if(able&&!sec.classList.contains('v3d'))lost();} // motion.js marks the section .v3d once its scene is built
      s.onerror=lost;s.onload=check;timer=setTimeout(check,10000);document.head.appendChild(s);
    }
    addEventListener('scroll',load,{passive:true});
    // a resize (a phone turned on its side) re-lays the whole page, and can change this section and the why-us film above it in the same moment; neither the browser
    // nor that film is sure to keep the reader's place. So whether the reader is in this section is noted on every scroll (a resize is dealt with before the scroll
    // it causes), and a reader who was in it when it changed is put back at its top once every block has had its turn
    var inIt=false;
    function mark(){var r=sec.getBoundingClientRect();inIt=r.top<innerHeight*.5&&r.bottom>innerHeight*.5;}
    addEventListener('scroll',mark,{passive:true});mark();
    addEventListener('resize',function(){
      var here=inIt,was=sec.classList.contains('scrub');
      repin(want());load();
      if(here&&was!==sec.classList.contains('scrub'))setTimeout(function(){jump((window.scrollY||0)+sec.getBoundingClientRect().top);mark();},0);
    });
    repin(want());load();
  })();
  // S·04: five keys light one by one as the card climbs the screen, then the panel's screen types THE DEVIL'S / IN THE DETAIL (after the fifth key).
  // Scroll back above it and the screen clears, so it types again next time. Reduced motion: the full line, no typing. Without JS the markup already holds the full line.
  (function(){
    var dash=document.getElementById('dash');if(!dash)return;
    var ks=[].slice.call(dash.querySelectorAll('.k')),fr=dash.parentElement,t=false,last=-1,S=ks.length+2;
    var LINES=['THE DEVIL\u2019S','IN THE DETAIL'],texts=[].slice.call(dash.querySelectorAll('.scr text')),tmr=0,lit=false;
    function show(li,n){texts.forEach(function(tx){var ls=tx.querySelectorAll('.s4l');[].forEach.call(ls,function(l,i){l.querySelector('.t').textContent=i<li?LINES[i]:i===li?LINES[i].slice(0,n):'';l.classList.toggle('at',i===li);});});}
    function type(li,n){
      if(n>LINES[li].length){if(li+1<LINES.length){tmr=setTimeout(function(){type(li+1,0)},320);return;}dash.classList.remove('typing');return;}
      show(li,n);var ch=LINES[li].charAt(n-1);tmr=setTimeout(function(){type(li,n+1)},n===0?0:(ch===' '?130:62+Math.random()*58));
    }
    function screen(on){
      if(on===lit)return;lit=on;clearTimeout(tmr);
      if(!on){dash.classList.remove('typing');show(0,0);return;}
      if(still){show(LINES.length-1,LINES[LINES.length-1].length);return;}
      dash.classList.add('typing');show(0,0);tmr=setTimeout(function(){type(0,0)},380);
    }
    show(0,0);
    function paint(){t=false;var r=fr.getBoundingClientRect(),p=Math.min(Math.max((innerHeight-r.top)/(innerHeight*.85),0),1);if(still)p=1;var n=Math.min(Math.floor(p*S),S-1);if(p>=1)n=S-1;if(n===last)return;last=n;ks.forEach(function(k,i){k.classList.toggle('on',i<n);});dash.classList.toggle('on',n>ks.length);screen(n>ks.length);}
    addEventListener('scroll',function(){if(!t){t=true;requestAnimationFrame(paint);}},{passive:true});addEventListener('resize',paint);paint();
  })();

  // hero scrub: 192 frames packed 16 to a sheet (4x4), scroll position picks the frame
  (function(){
    var hero=document.getElementById('hero'),stage=document.getElementById('stage'),cv=document.getElementById('scrub');
    if(!hero||!cv||still)return;
    var c=navigator.connection||{};
    if(c.saveData||/(^|-)2g$/.test(c.effectiveType||''))return; // slow connection: keep the poster
    var N=192,PER=16,COLS=4,SHEETS=12;
    var small=Math.min(innerWidth*Math.min(devicePixelRatio||1,2),1600)<=900;
    var dir='video/sheets/'+(small?'m':'d')+'/';
    var sheets=new Array(SHEETS),loaded=0,fw=0,fh=0,ctx=cv.getContext('2d',{alpha:false});
    var copy=document.getElementById('heroCopy'),bar=document.getElementById('scrubBar'),no=document.getElementById('frameNo');
    var mid=document.getElementById('heroMid'),midLines=mid?[].slice.call(mid.children):[];
    var target=0,shown=-1,cur=0,raf=false,W=0,H=0,dpr=1;
    function size(){dpr=Math.min(devicePixelRatio||1,1.5);W=stage.clientWidth;H=stage.clientHeight;cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);shown=-1;draw();}
    function draw(){
      var f=Math.round(cur);if(f===shown)return;
      var s=Math.floor(f/PER),img=sheets[s];
      if(!img){ // nearest sheet that has arrived
        for(var d=1;d<SHEETS&&!img;d++){img=sheets[s-d]||sheets[s+d];if(img){f=(sheets[s-d]?(s-d)*PER+PER-1:(s+d)*PER);}}
        if(!img)return;s=Math.floor(f/PER);
      }
      var i=f%PER,sx=(i%COLS)*fw,sy=Math.floor(i/COLS)*fh;
      // cover-fit, anchored 62% from the left like the poster
      var sc=Math.max(W/fw,H/fh),dw=fw*sc,dh=fh*sc,dx=(W-dw)*.62,dy=(H-dh)*.5;
      ctx.setTransform(dpr,0,0,dpr,0,0);ctx.drawImage(img,sx,sy,fw,fh,dx,dy,dw,dh);
      shown=f;if(no)no.textContent=String(f).padStart(3,'0')+' / '+N;
    }
    function tick(){
      cur+=(target-cur)*.22;if(Math.abs(target-cur)<.05)cur=target;
      draw();if(cur!==target)requestAnimationFrame(tick);else raf=false;
    }
    function onScroll(){
      var span=hero.offsetHeight-stage.clientHeight,y=Math.min(Math.max(-hero.getBoundingClientRect().top,0),span),p=span>0?y/span:0;
      target=p*(N-1);
      if(bar)bar.style.transform='scaleX('+p+')';
      if(copy){var k=Math.min(Math.max((p-.28)/.10,0),1);copy.style.opacity=1-k;copy.style.transform='translateY('+(k*24)+'px)';}
      if(mid){ // the statement: lines arrive at 38%, 44% and 50% of the scroll, after the headline has cleared, then hold (every beat is a share of the scroll, so they all scale with it: the film's scroll was doubled, then sped up 30%, on 11 Nov, then cut 40% on 13 Nov), and leave together at 88%
        var out=1-Math.min(Math.max((p-.88)/.06,0),1),vis=Math.min(Math.max((p-.36)/.07,0),1)*out;
        mid.style.opacity=vis.toFixed(3);
        midLines.forEach(function(el,i){var a=Math.min(Math.max((p-(.38+i*.06))/.07,0),1);el.style.opacity=(a*out).toFixed(3);el.style.transform='translateY('+((1-a)*22).toFixed(1)+'px)';});
      }
      if(!raf){raf=true;requestAnimationFrame(tick);}
    }
    // load order: first sheet, last sheet, then the middles, so the scrub gets finer as it arrives
    var order=[0,SHEETS-1,6,3,9,1,2,4,5,7,8,10,11];
    (function next(){
      var s=order.shift();if(s===undefined)return;if(sheets[s])return next();
      var img=new Image();img.decoding='async';
      img.onload=function(){sheets[s]=img;if(!fw){fw=img.width/COLS;fh=img.height/COLS;size();stage.classList.add('live');}shown=-1;draw();if(++loaded<SHEETS)next();};
      img.onerror=next;img.src=dir+String(s).padStart(2,'0')+'.webp';
    })();
    addEventListener('scroll',onScroll,{passive:true});addEventListener('resize',size);onScroll();
  })();

  // why us: a second film. 192 frames of a drill spinning in the spindle under the one gold work light: coolant flooding the cut into suds, mist and smoke lifting through the beam, swarf drifting. Packed 16 to a sheet; scroll picks the frame.
  (function(){
    var sec=document.getElementById('why'),track=document.getElementById('whyTrack'),pin=document.getElementById('whyPin'),cv=document.getElementById('whyScrub');
    if(!sec||!track||!pin||!cv||still)return;
    var c=navigator.connection||{};
    if(c.saveData||/(^|-)2g$/.test(c.effectiveType||''))return; // slow connection: keep the stacked photos
    var N=192,PER=16,COLS=4,SHEETS=12;
    var small=Math.min(innerWidth*Math.min(devicePixelRatio||1,2),1600)<=900;
    var dir='video/why/v5/'+(small?'m':'d')+'/'; // v5: drill, suds and smoke under the gold lamp (8 Nov). New frames get a new path, because /video/* is edge-cached for 30 days
    var sheets=new Array(SHEETS),loaded=0,fw=0,fh=0,ctx=cv.getContext('2d',{alpha:false}),started=false;
    var txts=[].slice.call(track.querySelectorAll('.item .txt')),bar=document.getElementById('whyBar'),ops=[].slice.call(track.querySelectorAll('.rail .ops span'));
    var on=false,target=0,cur=0,raf=false,W=0,H=0,dpr=1,shown=-1;
    function clamp(x){return Math.min(Math.max(x,0),1);}
    function size(){dpr=Math.min(devicePixelRatio||1,1.5);W=pin.clientWidth;H=pin.clientHeight;cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);shown=-1;drawFrame();}
    function drawFrame(){
      if(!fw)return;
      var f=Math.round(cur*(N-1)),key=f+'|'+Math.round(cur*1200);if(key===shown)return; // the camera moves between frames too, so redraw on progress, not just on frame
      var s=Math.floor(f/PER),img=sheets[s];
      if(!img){ // nearest sheet that has arrived
        for(var d=1;d<SHEETS&&!img;d++){img=sheets[s-d]||sheets[s+d];if(img){f=(sheets[s-d]?(s-d)*PER+PER-1:(s+d)*PER);}}
        if(!img)return;s=Math.floor(f/PER);
      }
      var i=f%PER,sx=(i%COLS)*fw,sy=Math.floor(i/COLS)*fh;
      // camera: start wide, push in to 1.45x with an eased curve, drift slightly left to right, and keep the drill (dead centre of the frame)
      // locked to the middle of the screen; the focal point eases down the shaft as the tip plunges. dx/dy are clamped so no edge ever shows.
      var e=cur*cur*(3-2*cur),z=1+.45*e,sc=Math.max(W/fw,H/fh)*z,dw=fw*sc,dh=fh*sc,fx=.50+.04*cur,fy=.50+.10*e; // this drill's tip sits at centre, a little below mid-frame; the lamp stays top-left
      var dx=Math.min(0,Math.max(W-dw,W/2-fx*dw)),dy=Math.min(0,Math.max(H-dh,H/2-fy*dh));
      ctx.setTransform(dpr,0,0,dpr,0,0);ctx.drawImage(img,sx,sy,fw,fh,dx,dy,dw,dh);shown=key;
    }
    function render(p){
      drawFrame();
      var t=p*(txts.length-1);
      txts.forEach(function(el,k){var d=t-k,a=clamp(1-(Math.abs(d)-.24)/.22);el.style.opacity=a.toFixed(3);el.style.visibility=a>.01?'visible':'hidden';el.style.transform='translateY('+(-d*30).toFixed(1)+'px)';});
      if(bar)bar.style.transform='scaleX('+p.toFixed(4)+')';
      var idx=Math.round(t);ops.forEach(function(s,i){s.classList.toggle('on',i===idx);});
    }
    function reset(){txts.forEach(function(el){el.style.opacity='';el.style.visibility='';el.style.transform='';});}
    function prog(){var span=track.offsetHeight-innerHeight;return span>0?clamp(-track.getBoundingClientRect().top/span):0;}
    function tick(){cur+=(target-cur)*.22;if(Math.abs(target-cur)<.0005)cur=target;render(cur);if(cur!==target)requestAnimationFrame(tick);else raf=false;}
    function load(){ // sheets start arriving when the section is a screen and a half away; first, last, then the middles
      if(started)return;started=true;
      var order=[0,SHEETS-1,6,3,9,1,2,4,5,7,8,10];
      (function next(){
        var s=order.shift();if(s===undefined)return;if(sheets[s])return next();
        var img=new Image();img.decoding='async';
        img.onload=function(){sheets[s]=img;if(!fw){fw=img.width/COLS;fh=img.height/COLS;size();pin.classList.add('live');}shown=-1;drawFrame();if(++loaded<SHEETS)next();};
        img.onerror=next;img.src=dir+String(s).padStart(2,'0')+'.webp';
      })();
    }
    function onScroll(){
      if(!on)return;
      if(!started&&track.getBoundingClientRect().top<innerHeight*1.5)load();
      target=prog();if(!raf){raf=true;requestAnimationFrame(tick);}
    }
    function mode(){
      var want=innerHeight>=520;
      if(want===on)return;on=want;sec.classList.toggle('scrub',on);
      if(on){cur=target=prog();size();render(cur);}else reset();
    }
    addEventListener('scroll',onScroll,{passive:true});addEventListener('resize',function(){mode();if(on)size();onScroll();});mode();onScroll();
  })();

  // spam check: Cloudflare Turnstile, one script for every form on the page, each widget loaded only when its form is near the screen. Site key comes from /api/config.
  var TSK={key:null,state:0,ws:[]}; // state: 0 idle, 1 fetching, 2 script ready, 3 no key (local preview)
  function tsBoot(){
    if(TSK.state)return;TSK.state=1;
    fetch('/api/config').then(function(r){return r.ok?r.json():null}).then(function(c){
      if(!c||!c.turnstileSiteKey){TSK.state=3;return;} // no key configured (local preview): skip
      TSK.key=c.turnstileSiteKey;TSK.ws.forEach(function(w){if(w.started)w.api.need=true;});
      window.onTsReady=function(){TSK.state=2;TSK.ws.forEach(function(w){if(w.started)w.draw();});};
      var s=document.createElement('script');s.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=onTsReady';s.async=true;s.onerror=function(){TSK.state=4;};document.head.appendChild(s); // 4: blocked (firewall, ad blocker, dropped request)
    }).catch(function(){});
  }
  function tsWidget(boxId,secId,formId,action){
    var box=document.getElementById(boxId),id=null,w={started:false,t0:0,err:false,api:{need:false}};
    w.draw=function(){if(id!==null||!box||!window.turnstile)return;id=turnstile.render(box,{sitekey:TSK.key,action:action,'error-callback':function(){w.err=true;},'before-interactive-callback':function(){w.t0=Date.now();},theme:(d.getAttribute('data-theme')||(matchMedia('(prefers-color-scheme: light)').matches?'light':'dark')),size:'flexible',appearance:'interaction-only'});};
    w.api.token=function(){try{return id!==null&&window.turnstile?turnstile.getResponse(id)||'':'';}catch(e){return '';}};
    w.api.reset=function(){try{if(id!==null&&window.turnstile)turnstile.reset(id);}catch(e){}};
    w.api.load=function(){if(w.started||!box)return;w.started=true;w.t0=Date.now();if(TSK.key)w.api.need=true;if(TSK.state===2)w.draw();else tsBoot();};
    // the spam check can't give us a token: its script was blocked, the widget reported an error, or 12 s have passed without one
    w.api.stuck=function(){return !w.api.token()&&(TSK.state===4||w.err||(w.t0>0&&Date.now()-w.t0>12000));};
    TSK.ws.push(w);
    var sec=document.getElementById(secId);
    if(sec&&'IntersectionObserver' in window){var o=new IntersectionObserver(function(e){if(e[0].isIntersecting){w.api.load();o.disconnect();}},{rootMargin:'800px 0px'});o.observe(sec);}
    else w.api.load();
    var f=document.getElementById(formId);if(f)f.addEventListener('focusin',w.api.load,{once:true});
    return w.api;
  }
  var TS=tsWidget('ts','contact','enq','enquiry'),RTS=tsWidget('rts','reviews','rev','review');

  // enquiry form: sends in the background to /api/enquiry on this same domain, then thanks the visitor in place
  (function(){
    var f=document.getElementById('enq'),btn=document.getElementById('enqBtn'),msg=document.getElementById('enqMsg'),wrap=document.getElementById('enqWrap');
    if(!f)return;
    function el(id){return document.getElementById(id);}
    var F={name:el('e-name'),company:el('e-co'),email:el('e-email'),phone:el('e-tel'),message:el('e-msg'),website:el('e-web')};
    function say(t,k,field){msg.textContent=t;msg.className='enq-msg'+(k?' '+k:'');[F.name,F.email,F.message].forEach(function(x){if(x===field){x.setAttribute('aria-invalid','true');x.setAttribute('aria-describedby','enqMsg');}else{x.removeAttribute('aria-invalid');x.removeAttribute('aria-describedby');}});}
    f.addEventListener('input',function(){if(msg.classList.contains('err'))say('');});
    var EMAIL=/^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[^\s@<>()",;:]+$/; // the same rule the server uses
    function byEmail(lead,data){ // hand the visitor a ready-made email with their message in it
      var to='mailto:'+MAILTO;
      var lines=[data.message,'',data.name+(data.company?', '+data.company:''),data.email].concat(data.phone?[data.phone]:[]).concat(data.interest.length?['Interested in: '+data.interest.join(', ')]:[]);
      var a=document.createElement('a');a.href=to+(to.indexOf('?')>-1?'&':'?')+'subject='+encodeURIComponent('Enquiry from '+data.name)+'&body='+encodeURIComponent(lines.join('\n'));a.textContent='send it by email instead';
      msg.textContent=lead;msg.className='enq-msg err';msg.appendChild(a);msg.appendChild(document.createTextNode(': your message is already written.'));
    }
    f.addEventListener('submit',function(e){
      e.preventDefault();
      var name=F.name.value.trim(),email=F.email.value.trim(),text=F.message.value.trim();
      if(!name){say('Please add your name.','err',F.name);F.name.focus();return;}
      if(!EMAIL.test(email)){say('That email doesn’t look right.','err',F.email);F.email.focus();return;}
      if(!text){say('Tell us a line about where things are now.','err',F.message);F.message.focus();return;}
      var data={name:name,company:F.company.value.trim(),email:email,phone:F.phone.value.trim(),
        interest:[].slice.call(f.querySelectorAll('input[name=interest]:checked')).map(function(i){return i.value}),
        message:text,website:F.website.value};
      if(TS.need&&!TS.token()){
        if(TS.stuck()){byEmail('The spam check can’t load on this connection, so ',data);return;}
        say('One moment, the spam check is still loading. Try again in a second.','err');TS.load();return;}
      data.turnstile=TS.token();
      btn.disabled=true;say('Sending…');
      fetch('/api/enquiry',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)})
        .then(function(r){return r.json().catch(function(){return {};}).then(function(j){if(!r.ok){var e=new Error(r.status);e.code=j&&j.code;e.detail=j&&(j.detail||j.status);throw e;}return j;});})
        .then(function(){
          var d=document.createElement('div');d.className='enq-done';d.setAttribute('role','status');d.tabIndex=-1;
          var h=document.createElement('h3');h.className='h3';h.textContent='Got it, '+name.split(' ')[0]+'.';
          var p=document.createElement('p');p.textContent='We’ll reply to '+email+' the same working day.';
          d.appendChild(h);d.appendChild(p);wrap.replaceChildren(d);d.focus({preventScroll:true}); // keep focus (and the screen reader) with the result
        })
        .catch(function(err){
          btn.disabled=false;TS.reset();btn.focus(); // the button was disabled while sending, so focus fell to the page; put it back
          if(err&&err.code==='not_configured'){byEmail('The form can’t take messages right now, so ',data);return;} // the sending service is not set up yet
          if(err&&err.code==='invalid'){say('Please check your name, email and message, then send it again.','err');return;}
          if(err&&err.code)console.warn('enquiry',err.code,err.detail||''); // for us, not for the visitor
          byEmail('That didn’t send. Please try again in a minute, or ',data);
        });
    });
  })();

  // reviews form: business name and a score out of 5 (both required), optional comment. Sent to /api/review, checked by hand before it's published.
  (function(){
    var f=document.getElementById('rev'),btn=document.getElementById('revBtn'),msg=document.getElementById('revMsg'),wrap=document.getElementById('revWrap');
    if(!f)return;
    var biz=document.getElementById('r-biz'),txt=document.getElementById('r-msg'),cnt=document.getElementById('r-cnt'),live=document.getElementById('r-live'),hp=document.getElementById('r-web');
    var mail=MAILTO,MAX=280,lastLive='';
    function say(t,k,field){msg.textContent=t;msg.className='enq-msg'+(k?' '+k:'');[biz,txt].forEach(function(x){if(x===field){x.setAttribute('aria-invalid','true');x.setAttribute('aria-describedby',x.getAttribute('data-hint')+' revMsg');}else{x.removeAttribute('aria-invalid');x.setAttribute('aria-describedby',x.getAttribute('data-hint'));}});}
    [biz,txt].forEach(function(x){x.setAttribute('data-hint',x.getAttribute('aria-describedby'));});
    function count(){var n=txt.value.length;cnt.textContent=n+' / '+MAX;cnt.parentNode.classList.toggle('near',n>=260);
      var l=n>=260?(MAX-n)+' characters left':'';if(l!==lastLive){lastLive=l;live.textContent=l;}} // only announced near the limit
    txt.addEventListener('input',count);count();
    // a review link from /feedback-request/ (?review=Business#reviews): fill in their business name and tick "I'm a client"
    try{var pre=new URLSearchParams(location.search).get('review');if(pre&&!biz.value){biz.value=pre.trim().slice(0,80);var cl=f.querySelector('input[name=reviewer][value=client]');if(cl)cl.checked=true;}}catch(e){}
    f.addEventListener('input',function(){if(msg.classList.contains('err'))say('');});
    function rating(){var r=f.querySelector('input[name=rating]:checked');return r?+r.value:0;}
    function mailFallback(lead,data){ // hand the visitor a ready-made email with their review in it
      var a=document.createElement('a');a.href='mailto:'+mail+'?subject='+encodeURIComponent('Review: '+data.business+' · '+data.rating+'/5')+'&body='+encodeURIComponent('Business: '+data.business+'\nScore: '+data.rating+' out of 5\nWorked with us: '+(data.reviewer==='client'?'Yes, a client':'No, rating the website')+(data.comment?'\n\n'+data.comment:''));a.textContent=mail;
      msg.textContent=lead;msg.className='enq-msg err';msg.appendChild(a);msg.appendChild(document.createTextNode('.'));
    }
    f.addEventListener('submit',function(e){
      e.preventDefault();
      var who=f.querySelector('input[name=reviewer]:checked');
      var data={business:biz.value.trim(),rating:rating(),reviewer:who?who.value:'',comment:txt.value.trim(),website:hp.value};
      if(!data.business){say('Add your business name. It shows with your review.','err',biz);biz.focus();return;}
      if(!data.rating){say('Pick a score from 1 to 5.','err');f.querySelector('input[name=rating]').focus();return;}
      if(!data.reviewer){say('Tell us if you\u2019ve worked with us.','err');f.querySelector('input[name=reviewer]').focus();return;}
      if(data.comment.length>MAX){say('That\u2019s over 280 characters. Trim it a little and send it again.','err',txt);txt.focus();return;}
      if(RTS.need&&!RTS.token()){
        if(RTS.stuck()){mailFallback('The spam check can\u2019t load on this connection. Email your review to ',data);return;}
        say('One moment, the spam check is still loading. Try again in a second.','err');RTS.load();return;}
      data.turnstile=RTS.token();
      btn.disabled=true;say('Sending\u2026');
      fetch('/api/review',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)})
        .then(function(r){return r.json().catch(function(){return {};}).then(function(j){if(!r.ok){var e=new Error(r.status);e.code=j&&j.code;e.field=j&&j.field;throw e;}return j;});})
        .then(function(){
          var d=document.createElement('div');d.className='enq-done';d.setAttribute('role','status');d.tabIndex=-1;
          var h=document.createElement('h3');h.className='h3';h.textContent='Thanks, it\u2019s in.';
          var p=document.createElement('p');p.textContent='We\u2019ll check it, then it goes up here. If you ever want it taken down, email ';
          var a=document.createElement('a');a.href='mailto:'+mail;a.textContent=mail;p.appendChild(a);p.appendChild(document.createTextNode('.'));
          d.appendChild(h);d.appendChild(p);wrap.replaceChildren(d);d.focus({preventScroll:true});
        })
        .catch(function(err){
          btn.disabled=false;RTS.reset();btn.focus();var c=err&&err.code; // focus back on the button (field errors move it to the field below)
          if(c==='invalid'&&err.field==='business'){say('Add your business name. It shows with your review.','err',biz);biz.focus();return;}
          if(c==='invalid'&&err.field==='rating'){say('Pick a score from 1 to 5.','err');return;}
          if(c==='invalid'&&err.field==='reviewer'){say('Tell us if you\u2019ve worked with us.','err');return;}
          if(c==='too_long'){say('That\u2019s over 280 characters. Trim it a little and send it again.','err',txt);txt.focus();return;}
          if(c==='spam_check'){say('The spam check didn\u2019t go through. Give it another go, and if it still won\u2019t send, refresh the page.','err');return;}
          mailFallback('That didn\u2019t send. Try again in a minute. If it still won\u2019t go, email your review to ',data);
        });
    });
  })();

  // 07 Free website report (Nathan, 21 Nov 2026): the side tab and the report card's "Get your report" button open the #rr form over the page. It sends to /api/report on this domain,
  // with the same spam check (Turnstile, action "report") and honeypot as the enquiry form. Without JS or <dialog>, the card button stays a plain mailto to the same inbox.
  (function(){
    var dlg=document.getElementById('rr'),f=document.getElementById('rrf'),btn=document.getElementById('rrBtn'),msg=document.getElementById('rrMsg'),wrap=document.getElementById('rrWrap'),tab=document.getElementById('rrTab');
    if(!dlg||!f||typeof dlg.showModal!=='function')return;
    var MAIL=dlg.getAttribute('data-mail')||MAILTO,from=null,RRTS=tsWidget('rrts','report','rrf','report');
    function el(id){return document.getElementById(id);}
    var F={name:el('rr-name'),email:el('rr-email'),site:el('rr-site'),comp:el('rr-comp'),hp:el('rr-hp')};
    var ALL=[F.name,F.email,F.site,F.comp];
    // every visitor-facing line in this form, in one place (for Maya and Edie)
    var T={required:'Please fill this in.',email:'Please enter a valid email address.',url:'Please enter a full web address, e.g. https://www.yourcompany.example',
      domain:'Please use a company email address at your website’s own domain.',same:'Please enter a competitor’s website, not your own.',
      wait:'One moment, the spam check is still loading. Try again in a second.',
      sending:'Sending…',ok:'Thanks, that’s come through. We’ll be in touch at the email address you gave us.',err:'Something went wrong and your request didn’t send. Please try again.',or:' Or email '};
    var EMAIL=/^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[^\s@<>()",;:]+$/; // the same rule the server uses
    function site(v){ // "yourfirm.co.uk" or a full address -> {href, host} or null (the same rule as the server)
      v=(v||'').trim();if(!v||/\s/.test(v))return null;if(!/^https?:\/\//i.test(v))v='https://'+v;
      try{var u=new URL(v);if(!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(u.hostname)||u.username||u.password)return null;return {href:u.origin+(u.pathname==='/'?'':u.pathname),host:u.hostname.toLowerCase().replace(/^www\./,'')};}catch(e){return null;}
    }
    function sameDomain(email,host){var dm=email.split('@').pop().toLowerCase();return dm===host||host.slice(-dm.length-1)==='.'+dm||dm.slice(-host.length-1)==='.'+host;}
    function say(t,k,field){msg.textContent=t;msg.className='enq-msg'+(k?' '+k:'');ALL.forEach(function(x){if(x===field){x.setAttribute('aria-invalid','true');x.setAttribute('aria-describedby','rrMsg');}else{x.removeAttribute('aria-invalid');x.removeAttribute('aria-describedby');}});}
    function bad(t,field){say(t,'err',field);field.focus();}
    function byEmail(data){ // if the form can't send: a ready-written email to the same inbox
      var lines=['Name: '+data.name,'Email address: '+data.email,'Website URL: '+data.site].concat(data.competitor?['Competitor website URL: '+data.competitor]:[]);
      var a=document.createElement('a');a.href='mailto:'+MAIL+'?subject='+encodeURIComponent('Free website report request')+'&body='+encodeURIComponent(lines.join('\n'));a.textContent=MAIL;
      msg.textContent=T.err+T.or;msg.className='enq-msg err';msg.appendChild(a);msg.appendChild(document.createTextNode('.'));
    }
    // focus stays in the form: Tab from the last control goes to the first, Shift+Tab from the first to the last
    function focusables(){return [].slice.call(dlg.querySelectorAll('a[href],button:not([disabled]),input:not([tabindex="-1"]):not([type=hidden]),textarea,select,iframe,[tabindex]:not([tabindex="-1"])')).filter(function(x){return x.offsetParent!==null||x===document.activeElement;});}
    dlg.addEventListener('keydown',function(e){if(e.key!=='Tab')return;var fs=focusables();if(!fs.length)return;var a=fs[0],z=fs[fs.length-1];
      if(e.shiftKey&&(document.activeElement===a||!dlg.contains(document.activeElement))){e.preventDefault();z.focus();}
      else if(!e.shiftKey&&(document.activeElement===z||!dlg.contains(document.activeElement))){e.preventDefault();a.focus();}});
    function open(b){if(dlg.open)return;from=b||null;dlg.showModal();if(window.__pace)window.__pace.stop();RRTS.load();
      var first=wrap.querySelector('.enq-done')||F.name;if(first)first.focus({preventScroll:true});}
    dlg.addEventListener('close',function(){if(window.__pace)window.__pace.start();if(from&&document.contains(from))from.focus();from=null;});
    dlg.addEventListener('click',function(e){if(e.target===dlg)dlg.close();}); // a click on the dimmed page closes the form (what's typed stays)
    el('rrX').addEventListener('click',function(){dlg.close();});
    [].slice.call(document.querySelectorAll('[data-rr-open]')).forEach(function(b){b.addEventListener('click',function(e){e.preventDefault();open(b);});});
    if(tab)tab.hidden=false;
    if(/^#(free-report|request-a-report)$/.test(location.hash))open(null); // a direct link opens the form
    f.addEventListener('input',function(){if(msg.classList.contains('err'))say('');});
    f.addEventListener('submit',function(e){
      e.preventDefault();
      var name=F.name.value.trim(),email=F.email.value.trim(),s=site(F.site.value),cw=F.comp.value.trim(),cs=null;
      if(!name)return bad(T.required,F.name);
      if(!email)return bad(T.required,F.email);
      if(!EMAIL.test(email))return bad(T.email,F.email);
      if(!F.site.value.trim())return bad(T.required,F.site);
      if(!s)return bad(T.url,F.site);
      if(!sameDomain(email,s.host))return bad(T.domain,F.email);
      if(cw){cs=site(cw);if(!cs)return bad(T.url,F.comp);if(cs.host===s.host)return bad(T.same,F.comp);} // one competitor, optional
      var data={name:name,email:email,site:s.href,competitor:cs?cs.href:'',homepage:F.hp.value};
      if(RRTS.need&&!RRTS.token()){
        if(RRTS.stuck()){byEmail(data);return;}
        say(T.wait,'err');RRTS.load();return;}
      data.turnstile=RRTS.token();
      btn.disabled=true;btn.setAttribute('aria-busy','true');say(T.sending);
      fetch('/api/report',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)})
        .then(function(r){return r.json().catch(function(){return {};}).then(function(j){if(!r.ok||!j.ok){var e=new Error(r.status);e.code=j&&j.code;throw e;}return j;});})
        .then(function(){
          var d=document.createElement('div');d.className='enq-done';d.setAttribute('role','status');d.tabIndex=-1;
          var p=document.createElement('p');p.textContent=T.ok;d.appendChild(p);
          wrap.replaceChildren(d);d.focus({preventScroll:true}); // keep focus (and the screen reader) with the result
        })
        .catch(function(err){
          btn.disabled=false;btn.removeAttribute('aria-busy');RRTS.reset();btn.focus();
          if(err&&err.code==='invalid'){say(T.err,'err');return;}
          if(err&&err.code)console.warn('report',err.code); // for us, not for the visitor
          byEmail(data);
        });
    });
  })();

  // 01 What we offer: each card's Play video button opens its film over the page (Nathan, 15 Nov 2026). Which film goes with which card is set here.
  // A film is fetched only when its button is pressed, and dropped again when the overlay closes.
  (function(){
    var dlg=document.getElementById('vid'),v=document.getElementById('vidV'),bs=[].slice.call(document.querySelectorAll('.pv')),from=null;
    if(!dlg||!v||!bs.length)return;
    if(typeof dlg.showModal!=='function'){bs.forEach(function(b){b.hidden=true;});return;} // no <dialog> in this browser: no button, the card reads as it did
    var FILMS={web:{tag:'WEB',t:'No Pitch Deck · 0:41',f:'no-pitch-deck',s:'We build the work before we talk about it.'},
               mkt:{tag:'MKT',t:'Night Shift · 0:42',f:'night-shift',s:'The enquiries get answered while you’re not there.'},
               auto:{tag:'AUTO',t:'Drawing to Order · 0:36',f:'drawing-to-order',s:'A quote that becomes the order without being typed twice.'}};
    function txt(id,s){document.getElementById(id).textContent=s;}
    function open(k,b){var F=FILMS[k],p;if(!F||dlg.open)return;from=b||null;
      txt('vidN',F.tag);txt('vidT',F.t);txt('vidS',F.s);
      v.setAttribute('aria-label',F.t.split(' · ')[0]+', film');v.poster='/video/films/'+F.f+'.webp';v.src='/video/films/'+F.f+'.mp4';
      dlg.showModal();if(window.__pace)window.__pace.stop(); // the page behind holds still while the film is up
      p=v.play();if(p&&p.catch)p.catch(function(){});} // if the browser will not start it, the poster and the controls are there
    dlg.addEventListener('close',function(){v.pause();v.removeAttribute('src');v.removeAttribute('poster');v.load(); // dropping the source stops the download
      if(window.__pace)window.__pace.start();if(from)from.focus();from=null;});
    dlg.addEventListener('click',function(e){if(e.target===dlg)dlg.close();}); // a click on the dark around the film closes it
    document.getElementById('vidX').addEventListener('click',function(){dlg.close();});
    bs.forEach(function(b){b.addEventListener('click',function(){open(b.getAttribute('data-film'),b);});});
  })();
})();

// S·02: the five example landing pages take turns on the front glass pane.
// Frames 2-5 load only once the card is near the screen; it runs only while in view, and not at all for reduced motion.
(function(){
  var box=document.querySelector('[data-glass]'); if(!box)return;
  var still=matchMedia('(prefers-reduced-motion: reduce)').matches;
  var gl=[].slice.call(box.querySelectorAll('.gl')),pips=[].slice.call(box.querySelectorAll('.gpips i'));
  if(still||gl.length<2||!('IntersectionObserver' in window)){var p=box.querySelector('.gpips');if(p)p.style.display='none';return;}
  var i=0,t=null,seen=false,hover=false,card=box.closest('.card')||box;
  function load(){gl.forEach(function(g){if(g.dataset.src){g.srcset=g.dataset.srcset;g.src=g.dataset.src;delete g.dataset.src;}});}
  function show(n){gl[i].classList.remove('on');pips[i]&&pips[i].classList.remove('on');i=n;gl[i].classList.add('on');pips[i]&&pips[i].classList.add('on');}
  function next(){var n=(i+1)%gl.length;if(gl[n].complete&&gl[n].naturalWidth)show(n);}
  function run(){if(!t&&seen&&!hover&&!document.hidden)t=setInterval(next,3400);}
  function stop(){clearInterval(t);t=null;}
  new IntersectionObserver(function(e){e.forEach(function(x){if(x.isIntersecting){load();seen=true;run();}else{seen=false;stop();}});},{rootMargin:'200px 0px'}).observe(box);
  card.addEventListener('mouseenter',function(){hover=true;stop();});
  card.addEventListener('mouseleave',function(){hover=false;run();});
  document.addEventListener('visibilitychange',function(){document.hidden?stop():run();});
})();
