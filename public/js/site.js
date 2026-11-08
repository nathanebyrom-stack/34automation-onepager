(function(){
  var d=document.documentElement; d.classList.add('js');
  // day / night: follows the viewer's system until they pick one, then remembers it
  (function(){
    var K='34-theme',bs=[].slice.call(document.querySelectorAll('.mode button'));
    function cur(){var t=d.getAttribute('data-theme');if(t)return t;return matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';}
    function paint(){var c=cur();bs.forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.mode===c));});}
    try{var s=localStorage.getItem(K);if(s==='light'||s==='dark')d.setAttribute('data-theme',s);}catch(e){}
    bs.forEach(function(b){b.addEventListener('click',function(){d.setAttribute('data-theme',b.dataset.mode);try{localStorage.setItem(K,b.dataset.mode);}catch(e){}paint();});});
    try{matchMedia('(prefers-color-scheme: light)').addEventListener('change',paint);}catch(e){}
    new MutationObserver(paint).observe(d,{attributes:true,attributeFilter:['data-theme']});
    paint();
  })();
  var still=matchMedia('(prefers-reduced-motion: reduce)').matches;
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
      if(copy){var k=Math.min(Math.max((p-.5)/.3,0),1);copy.style.opacity=1-k;copy.style.transform='translateY('+(k*24)+'px)';}
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

  // why us: a second film. 192 baked frames (three shots, a gold cutter pass between them) packed 16 to a sheet; scroll picks the frame.
  (function(){
    var sec=document.getElementById('why'),track=document.getElementById('whyTrack'),pin=document.getElementById('whyPin'),cv=document.getElementById('whyScrub');
    if(!sec||!track||!pin||!cv||still)return;
    var c=navigator.connection||{};
    if(c.saveData||/(^|-)2g$/.test(c.effectiveType||''))return; // slow connection: keep the stacked photos
    var N=192,PER=16,COLS=4,SHEETS=12;
    var small=Math.min(innerWidth*Math.min(devicePixelRatio||1,2),1600)<=900;
    var dir='video/why/'+(small?'m':'d')+'/';
    var sheets=new Array(SHEETS),loaded=0,fw=0,fh=0,ctx=cv.getContext('2d',{alpha:false}),started=false;
    var txts=[].slice.call(track.querySelectorAll('.item .txt')),bar=document.getElementById('whyBar'),ops=[].slice.call(track.querySelectorAll('.rail .ops span'));
    var on=false,target=0,cur=0,raf=false,W=0,H=0,dpr=1,shown=-1;
    function clamp(x){return Math.min(Math.max(x,0),1);}
    function size(){dpr=Math.min(devicePixelRatio||1,1.5);W=pin.clientWidth;H=pin.clientHeight;cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);shown=-1;drawFrame();}
    function drawFrame(){
      if(!fw)return;
      var f=Math.round(cur*(N-1));if(f===shown)return;
      var s=Math.floor(f/PER),img=sheets[s];
      if(!img){ // nearest sheet that has arrived
        for(var d=1;d<SHEETS&&!img;d++){img=sheets[s-d]||sheets[s+d];if(img){f=(sheets[s-d]?(s-d)*PER+PER-1:(s+d)*PER);}}
        if(!img)return;s=Math.floor(f/PER);
      }
      var i=f%PER,sx=(i%COLS)*fw,sy=Math.floor(i/COLS)*fh;
      var sc=Math.max(W/fw,H/fh),dw=fw*sc,dh=fh*sc,dx=(W-dw)*.5,dy=(H-dh)*.5;
      ctx.setTransform(dpr,0,0,dpr,0,0);ctx.drawImage(img,sx,sy,fw,fh,dx,dy,dw,dh);shown=f;
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

  // spam check: Cloudflare Turnstile, loaded only when the form is near the screen. Site key comes from /api/config.
  var TS=(function(){
    var box=document.getElementById('ts'),id=null,started=false,api={need:false};
    api.token=function(){try{return id!==null&&window.turnstile?turnstile.getResponse(id)||'':'';}catch(e){return '';}};
    api.reset=function(){try{if(id!==null&&window.turnstile)turnstile.reset(id);}catch(e){}};
    api.load=function(){
      if(started||!box)return;started=true;
      fetch('/api/config').then(function(r){return r.ok?r.json():null}).then(function(c){
        if(!c||!c.turnstileSiteKey)return; // no key configured (local preview): skip
        api.need=true;
        window.onTsReady=function(){id=turnstile.render(box,{sitekey:c.turnstileSiteKey,theme:(d.getAttribute('data-theme')||(matchMedia('(prefers-color-scheme: light)').matches?'light':'dark')),size:'flexible',appearance:'interaction-only'});};
        var s=document.createElement('script');s.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=onTsReady';s.async=true;document.head.appendChild(s);
      }).catch(function(){});
    };
    var c=document.getElementById('contact');
    if(c&&'IntersectionObserver' in window){var o=new IntersectionObserver(function(e){if(e[0].isIntersecting){api.load();o.disconnect();}},{rootMargin:'800px 0px'});o.observe(c);}
    else api.load();
    var f=document.getElementById('enq');if(f)f.addEventListener('focusin',api.load,{once:true});
    return api;
  })();

  // enquiry form: sends in the background to /api/enquiry on this same domain, then thanks the visitor in place
  (function(){
    var f=document.getElementById('enq'),btn=document.getElementById('enqBtn'),msg=document.getElementById('enqMsg'),wrap=document.getElementById('enqWrap');
    if(!f)return;
    function say(t,k){msg.textContent=t;msg.className='enq-msg'+(k?' '+k:'');}
    function el(id){return document.getElementById(id);}
    f.addEventListener('input',function(){if(msg.classList.contains('err'))say('');});
    var F={name:el('e-name'),company:el('e-co'),email:el('e-email'),phone:el('e-tel'),message:el('e-msg'),website:el('e-web')};
    f.addEventListener('submit',function(e){
      e.preventDefault();
      var name=F.name.value.trim(),email=F.email.value.trim(),text=F.message.value.trim();
      if(!name){say('Please add your name.','err');F.name.focus();return;}
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){say('That email doesn’t look right.','err');F.email.focus();return;}
      if(!text){say('Tell us a line about where things are now.','err');F.message.focus();return;}
      var data={name:name,company:F.company.value.trim(),email:email,phone:F.phone.value.trim(),
        interest:[].slice.call(f.querySelectorAll('input[name=interest]:checked')).map(function(i){return i.value}),
        message:text,website:F.website.value};
      if(TS.need&&!TS.token()){say('One moment, the spam check is still loading. Try again in a second.','err');TS.load();return;}
      data.turnstile=TS.token();
      btn.disabled=true;say('Sending…');
      fetch('/api/enquiry',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)})
        .then(function(r){if(!r.ok)throw new Error(r.status);return r.json();})
        .then(function(){
          var d=document.createElement('div');d.className='enq-done';d.setAttribute('role','status');
          var h=document.createElement('h3');h.className='h3';h.textContent='Got it, '+name.split(' ')[0]+'.';
          var p=document.createElement('p');p.textContent='We’ll reply to '+email+' the same working day.';
          d.appendChild(h);d.appendChild(p);wrap.replaceChildren(d);
        })
        .catch(function(){btn.disabled=false;TS.reset();say('That didn’t send. Please try again in a minute.','err');});
    });
  })();
})();
