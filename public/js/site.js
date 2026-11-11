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

  // S·04: five keys light one by one as the card climbs the screen, then the panel's screen reads AUTOMATION (after the fifth key)
  (function(){
    var dash=document.getElementById('dash');if(!dash)return;
    var ks=[].slice.call(dash.querySelectorAll('.k')),fr=dash.parentElement,t=false,last=-1,S=ks.length+2;
    function paint(){t=false;var r=fr.getBoundingClientRect(),p=Math.min(Math.max((innerHeight-r.top)/(innerHeight*.85),0),1);if(still)p=1;var n=Math.min(Math.floor(p*S),S-1);if(p>=1)n=S-1;if(n===last)return;last=n;ks.forEach(function(k,i){k.classList.toggle('on',i<n);});dash.classList.toggle('on',n>ks.length);}
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
      if(mid){ // the statement: lines arrive at 38%, 44% and 50% of the scroll, after the headline has cleared, hold for twice as many screens as they did before 11 Nov (the film's scroll was doubled; every beat is a share of the scroll, so they all stretch with it), and leave together at 88%
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
      var s=document.createElement('script');s.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=onTsReady';s.async=true;document.head.appendChild(s);
    }).catch(function(){});
  }
  function tsWidget(boxId,secId,formId,action){
    var box=document.getElementById(boxId),id=null,w={started:false,api:{need:false}};
    w.draw=function(){if(id!==null||!box||!window.turnstile)return;id=turnstile.render(box,{sitekey:TSK.key,action:action,theme:(d.getAttribute('data-theme')||(matchMedia('(prefers-color-scheme: light)').matches?'light':'dark')),size:'flexible',appearance:'interaction-only'});};
    w.api.token=function(){try{return id!==null&&window.turnstile?turnstile.getResponse(id)||'':'';}catch(e){return '';}};
    w.api.reset=function(){try{if(id!==null&&window.turnstile)turnstile.reset(id);}catch(e){}};
    w.api.load=function(){if(w.started||!box)return;w.started=true;if(TSK.key)w.api.need=true;if(TSK.state===2)w.draw();else tsBoot();};
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
        .then(function(r){return r.json().catch(function(){return {};}).then(function(j){if(!r.ok){var e=new Error(r.status);e.code=j&&j.code;e.detail=j&&(j.detail||j.status);throw e;}return j;});})
        .then(function(){
          var d=document.createElement('div');d.className='enq-done';d.setAttribute('role','status');
          var h=document.createElement('h3');h.className='h3';h.textContent='Got it, '+name.split(' ')[0]+'.';
          var p=document.createElement('p');p.textContent='We’ll reply to '+email+' the same working day.';
          d.appendChild(h);d.appendChild(p);wrap.replaceChildren(d);
        })
        .catch(function(err){
          btn.disabled=false;TS.reset();
          if(err&&err.code==='not_configured'){ // the sending service is not set up yet: hand the visitor a ready-made email instead
            var to=(document.querySelector('.ft a[href^="mailto:"]')||{}).href||'';
            var lines=[text,'',name+(data.company?', '+data.company:''),email].concat(data.phone?[data.phone]:[]).concat(data.interest.length?['Interested in: '+data.interest.join(', ')]:[]);
            var a=document.createElement('a');a.href=to+(to.indexOf('?')>-1?'&':'?')+'subject='+encodeURIComponent('Enquiry from '+name)+'&body='+encodeURIComponent(lines.join('\n'));a.textContent='send it by email instead';
            msg.textContent='The form can’t take messages right now, so ';msg.className='enq-msg err';msg.appendChild(a);msg.appendChild(document.createTextNode(': your message is already written.'));
            return;
          }
          say('That didn’t send. Please try again in a minute.'+(err&&err.code?' ['+err.code+(err.detail?': '+err.detail:'')+']':''),'err');
        });
    });
  })();

  // reviews form: business name and a score out of 5 (both required), optional comment. Sent to /api/review, checked by hand before it's published.
  (function(){
    var f=document.getElementById('rev'),btn=document.getElementById('revBtn'),msg=document.getElementById('revMsg'),wrap=document.getElementById('revWrap');
    if(!f)return;
    var biz=document.getElementById('r-biz'),txt=document.getElementById('r-msg'),cnt=document.getElementById('r-cnt'),live=document.getElementById('r-live'),hp=document.getElementById('r-web');
    var mail=f.getAttribute('data-email')||'',MAX=280,lastLive='';
    function say(t,k){msg.textContent=t;msg.className='enq-msg'+(k?' '+k:'');}
    function count(){var n=txt.value.length;cnt.textContent=n+' / '+MAX;cnt.parentNode.classList.toggle('near',n>=260);
      var l=n>=260?(MAX-n)+' characters left':'';if(l!==lastLive){lastLive=l;live.textContent=l;}} // only announced near the limit
    txt.addEventListener('input',count);count();
    f.addEventListener('input',function(){if(msg.classList.contains('err'))say('');});
    function rating(){var r=f.querySelector('input[name=rating]:checked');return r?+r.value:0;}
    function mailFallback(lead,data){ // hand the visitor a ready-made email with their review in it
      var a=document.createElement('a');a.href='mailto:'+mail+'?subject='+encodeURIComponent('Review: '+data.business+' · '+data.rating+'/5')+'&body='+encodeURIComponent('Business: '+data.business+'\nScore: '+data.rating+' out of 5'+(data.comment?'\n\n'+data.comment:''));a.textContent=mail;
      msg.textContent=lead;msg.className='enq-msg err';msg.appendChild(a);msg.appendChild(document.createTextNode('.'));
    }
    f.addEventListener('submit',function(e){
      e.preventDefault();
      var data={business:biz.value.trim(),rating:rating(),comment:txt.value.trim(),website:hp.value};
      if(!data.business){say('Add your business name. It shows with your review.','err');biz.focus();return;}
      if(!data.rating){say('Pick a score from 1 to 5.','err');f.querySelector('input[name=rating]').focus();return;}
      if(data.comment.length>MAX){say('That\u2019s over 280 characters. Trim it a little and send it again.','err');txt.focus();return;}
      if(RTS.need&&!RTS.token()){say('One moment, the spam check is still loading. Try again in a second.','err');RTS.load();return;}
      data.turnstile=RTS.token();
      btn.disabled=true;say('Sending\u2026');
      fetch('/api/review',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)})
        .then(function(r){return r.json().catch(function(){return {};}).then(function(j){if(!r.ok){var e=new Error(r.status);e.code=j&&j.code;e.field=j&&j.field;throw e;}return j;});})
        .then(function(){
          var d=document.createElement('div');d.className='enq-done';d.setAttribute('role','status');d.tabIndex=-1;
          var h=document.createElement('h3');h.className='h3';h.textContent='Thanks, it\u2019s in.';
          var p=document.createElement('p');p.textContent='We\u2019ll check it\u2019s genuine, then it goes up here. If you ever want it taken down, email ';
          var a=document.createElement('a');a.href='mailto:'+mail;a.textContent=mail;p.appendChild(a);p.appendChild(document.createTextNode('.'));
          d.appendChild(h);d.appendChild(p);wrap.replaceChildren(d);d.focus({preventScroll:true});
        })
        .catch(function(err){
          btn.disabled=false;RTS.reset();var c=err&&err.code;
          if(c==='invalid'&&err.field==='business'){say('Add your business name. It shows with your review.','err');biz.focus();return;}
          if(c==='invalid'&&err.field==='rating'){say('Pick a score from 1 to 5.','err');return;}
          if(c==='too_long'){say('That\u2019s over 280 characters. Trim it a little and send it again.','err');txt.focus();return;}
          if(c==='spam_check'){say('The spam check didn\u2019t go through. Give it another go, and if it still won\u2019t send, refresh the page.','err');return;}
          mailFallback('That didn\u2019t send. Try again in a minute. If it still won\u2019t go, email your review to ',data);
        });
    });
  })();
})();
