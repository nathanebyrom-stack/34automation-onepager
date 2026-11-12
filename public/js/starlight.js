// Starlight layers: fetched only when the Starlight mode is on (theme block in js/site.js). Styles are in css/starlight.css.
// Fills the three diagram mounts in index.html (.sl-ig), wakes the colour light and glints for bands on screen, and drives the two scroll-linked diagrams.
// Labels are real text; the drawings are aria-hidden. Reduced motion: every diagram shows its finished state and nothing loops.
// Copy passed by Edie 12 Nov 2026
(function(){
  'use strict';
  var d=document.documentElement,still=matchMedia('(prefers-reduced-motion: reduce)').matches;
  function on(){return d.classList.contains('starlight');}
  function q(s,r){return (r||document).querySelector(s);}
  function qa(s,r){return [].slice.call((r||document).querySelectorAll(s));}
  function clamp(x){return Math.min(Math.max(x,0),1);}
  var C={cyan:'#38D6FF',blue:'#7FB0FF',violet:'#B9A0FF',pink:'#FF7EB6',green:'#45E6A4',gold:'#FFC857'};
  var STAR='M6 .5l1.3 4.2L11.5 6 7.3 7.3 6 11.5 4.7 7.3.5 6l4.2-1.3z'; // the same four-point star as the header button

  // ---- 1. the enquiry line: one enquiry through four stations, while the "You" lane is left alone ----
  function line(){
    var st=[ // station names and tags: words from the OP 30 line already on the page
      ['Trigger','Lands',C.cyan,0],['Filter','Checked',C.blue,1.6],['Action','Routed',C.violet,.8],['Output','Answered',C.green,0]];
    return '<figure class="sl-fig sl-line" aria-labelledby="sl-line-c" aria-describedby="sl-line-d">'+
      '<figcaption class="lbl" id="sl-line-c">One enquiry, start to finish</figcaption>'+
      '<p class="vh" id="sl-line-d">An enquiry lands, is checked, routed and answered. None of it waits for you.</p>'+
      '<div class="ln" aria-hidden="true"><div class="trk"><span class="fill"></span><i class="pk"></i><i class="pk"></i></div><ol>'+
      st.map(function(s){return '<li style="--c:'+s[2]+';--dl:'+s[3]+'s"><i class="nd"></i><span class="tag">'+s[0]+'</span><b>'+s[1]+'</b></li>';}).join('')+
      '</ol></div>'+
      '<div class="you" aria-hidden="true"><i></i><b>You</b><span>On the machine</span></div>'+
      '</figure>';
  }

  // ---- 2. the eight checks: the report's eight named checks on a dial, then five rings for the five competitors. Equal segments, full rings: no scores implied ----
  function dial(){
    var names=['First impression','Clarity of offer','Technical detail','Mobile','Speed','Enquiry path','Trust signals','SEO basics']; // the page's own words, verbatim
    var cols=[C.cyan,C.blue,C.violet,C.pink,C.gold,C.green,C.blue,C.violet],s='',i;
    for(i=0;i<5;i++)s+='<circle class="rb" cx="120" cy="120" r="'+(66-i*9)+'"/><circle class="ring" style="--n:'+i+'" cx="120" cy="120" r="'+(66-i*9)+'" pathLength="1" transform="rotate(-90 120 120)"/>';
    for(i=0;i<8;i++)s+='<circle class="seg" style="--n:'+i+';--c:'+cols[i]+'" cx="120" cy="120" r="98" pathLength="80" stroke-dasharray="9 71" transform="rotate('+(i*45-90+2.25)+' 120 120)"/>';
    s+='<g class="hand"><line x1="120" y1="120" x2="120" y2="22"/><path transform="translate(108 2) scale(2)" d="'+STAR+'"/></g><circle class="hub" cx="120" cy="120" r="7"/>';
    return '<figure class="sl-fig sl-dial" aria-labelledby="sl-dial-c">'+
      '<figcaption class="lbl" id="sl-dial-c">Eight checks. Your site first, then five competitors.</figcaption>'+
      '<div class="dl"><svg viewBox="0 0 240 240" aria-hidden="true" focusable="false">'+s+'</svg><ol class="chk">'+
      names.map(function(n,k){return '<li style="--n:'+k+';--c:'+cols[k]+'">'+n+'</li>';}).join('')+'</ol></div>'+
      '<p class="lg"><span><i></i>Your site</span><span><i></i>Five closest competitors</span></p>'+ // words from the page
      '</figure>';
  }

  // ---- 4. where each service sits: one buyer's path from search to order, and the stretch of it each of the four services covers.
  // Pure CSS once it's in the page: the playhead and the bars run while the services band is on screen (.sl-on), and each card's underline keeps time with its bar ----
  function map(){
    var stops=['Search','Visit','Enquiry','Quote','Order']; // all words from the service cards
    var rows=[ // names are the cards' own. Each span is only what that card's own copy promises (Edie, 12 Nov): Website Overhaul is a point at Visit, not a stretch from Search
      ['S\u00b701','Website Overhaul',1,1,C.cyan,'At the visit'],
      ['S\u00b702','Landing Pages',0,2,C.blue,'From search to enquiry'],
      ['S\u00b703','Quote-to-Order',2,4,C.violet,'From enquiry to order'],
      ['S\u00b704','Stay Connected',2,4,C.pink,'From enquiry to order updates']];
    return '<figure class="sl-fig sl-map" aria-labelledby="sl-map-c">'+
      '<figcaption class="lbl" id="sl-map-c">Where each service fits</figcaption>'+
      '<div class="mp"><ol class="stops" aria-hidden="true">'+stops.map(function(x){return '<li>'+x+'</li>';}).join('')+'</ol><ul class="bars">'+
      rows.map(function(r,k){var pt=r[2]===r[3];return '<li class="m'+(k+1)+(pt?' pt':'')+'" style="--a:'+r[2]+';--b:'+r[3]+';--c:'+r[4]+'"><span'+(pt?'':' style="'+(r[3]===4?'right:0':'left:0')+'"')+'><b>'+r[0]+'</b> '+r[1]+'<span class="vh">. '+r[5]+'.</span></span><i></i></li>';}).join('')+
      '</ul><i class="ph" aria-hidden="true"></i></div></figure>';
  }

  // ---- 3. how we work: audit, vision, overhaul, drawn by the scroll ----
  var PATH='M0 112C100 112 130 96 200 96S470 64 600 60S880 26 1000 22S1140 8 1200 6';
  function process(){
    var steps=[ // passed by Edie; Nathan decides on this section's wording, so leave it as it is. "Four to five years" is his own figure (copy interview, Oct 2026)
      ['01','Audit','Where your brand is right now.',C.cyan,'56,214,255',24],
      ['02','Vision','How you see the business changing with technology over the next four to five years.',C.violet,'185,160,255',60],
      ['03','Overhaul','A new brand, and the full design overhaul to match.',C.gold,'255,200,87',98]];
    return '<div class="wrap"><h2 class="kick" id="sl-proc-h"><i aria-hidden="true"><svg viewBox="0 0 12 12" fill="#0A0B1E"><path d="'+STAR+'"/></svg></i><span>How we work</span></h2>'+
      '<div class="pr"><div class="strip" aria-hidden="true"><svg viewBox="0 0 1200 120" preserveAspectRatio="none" focusable="false"><defs><linearGradient id="slpg" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="1200" y2="0">'+
      '<stop offset="0" stop-color="#38D6FF"/><stop offset=".45" stop-color="#B9A0FF"/><stop offset=".72" stop-color="#FF7EB6"/><stop offset="1" stop-color="#FFC857"/></linearGradient></defs>'+
      '<path class="base" d="'+PATH+'"/><path class="draw" pathLength="1" d="'+PATH+'"/></svg></div>'+
      '<div class="rail" aria-hidden="true"><i></i></div><ol>'+
      steps.map(function(s){return '<li style="--c:'+s[3]+';--cr:'+s[4]+';--stem:'+s[5]+'px"><span class="n">'+s[0]+'</span><h3 class="h3">'+s[1]+'</h3><p>'+s[2]+'</p></li>';}).join('')+
      '</ol><i class="star" aria-hidden="true"></i></div></div>';
  }

  // ---- glints: a few four-point stars per band, placed by hand. Each sits inside the band's empty top margin (x %, then y and size as shares of that margin),
  // so at no width can one end up behind a line of text. Then colour, seconds per twinkle, delay.
  var GLINTS={
    '.band.state':[[84,.34,.26,C.cyan,4.6,0],[93,.66,.12,C.pink,3.8,1.1],[70,.2,.11,C.gold,5.2,.6],[97,.3,.08,C.violet,4.1,2],[58,.62,.07,C.green,4.9,1.6]],
    '#offer':[[90,.42,.22,C.pink,4.4,.3],[80,.22,.1,C.cyan,3.9,1.4],[97,.7,.09,C.gold,5,.9],[64,.6,.07,C.violet,4.6,2.2]],
    '#services':[[88,.4,.21,C.violet,4.8,.2],[96,.68,.1,C.blue,3.7,1.7],[78,.2,.09,C.pink,4.3,.8],[60,.55,.07,C.cyan,5.1,1.2]],
    '#work':[[89,.38,.22,C.green,4.5,.5],[97,.18,.09,C.gold,3.9,1.3],[77,.66,.1,C.cyan,5.1,2.1]],
    '#reviews':[[87,.4,.21,C.gold,4.2,.4],[95,.7,.1,C.pink,4.9,1.5],[72,.24,.08,C.violet,4.4,2]],
    '#report':[[90,.4,.22,C.cyan,4.7,.1],[81,.18,.09,C.green,3.8,1.2],[97,.7,.1,C.violet,5.3,.7]],
    '.sl-proc':[[91,.36,.22,C.gold,4.4,.6],[82,.68,.09,C.cyan,3.9,1.8],[68,.24,.08,C.pink,4.7,1.1]]
  };
  function glints(){
    Object.keys(GLINTS).forEach(function(sel){var band=q(sel);if(!band||q('.sl-g',band))return;
      GLINTS[sel].forEach(function(g){var i=document.createElement('i');i.className='sl-g';i.setAttribute('aria-hidden','true');
        i.style.cssText='--x:'+g[0]+'%;--y:'+g[1]+';--s:'+g[2]+';--c:'+g[3]+';--t:'+g[4]+'s;--dl:'+g[5]+'s';band.appendChild(i);});});
  }

  // ---- fill the mounts once, holding the reader's place (blocks above the screen would otherwise push the page down) ----
  var fig={},proc=null,lineDone=false;
  function hold(fn){ // note where the first thing on screen sits (by layout, so a reveal mid-ease doesn't skew it), make the change, put it back
    function top(x){for(var y=-scrollY;x;x=x.offsetParent)y+=x.offsetTop;return y;}
    var a=null,y0=0;qa('.rv,.head').some(function(x){var r=x.getBoundingClientRect();if(r.top>=72&&r.height>0&&!x.closest('.sl-ig')){a=x;y0=top(x);return true;}});
    fn();
    var dy=a?top(a)-y0:0,L=window.__pace;
    if(L&&L.resize)L.resize();
    if(Math.abs(dy)>1){if(L)L.scrollTo(scrollY+dy,{immediate:true,force:true});else scrollTo(0,scrollY+dy);}
  }
  window.__slHold=hold; // the header switch in site.js runs its change through this
  function fill(){
    var make={line:line,dial:dial,process:process,map:map};
    // the services map goes between the section's heading and its four cards
    var grid=q('.svc .grid');
    if(grid&&!q('.sl-ig[data-ig="map"]')){var mm=document.createElement('div');mm.className='sl-ig';mm.setAttribute('data-ig','map');mm.hidden=true;grid.parentNode.insertBefore(mm,grid);}
    // the dial's mount is made here, straight after the paragraph that lists the eight checks (an empty element there in the HTML would cost Night and Day a margin)
    var para=q('#report .txt p');
    if(para&&!q('.sl-ig[data-ig="dial"]')){var dm=document.createElement('div');dm.className='sl-ig';dm.setAttribute('data-ig','dial');dm.hidden=true;para.parentNode.insertBefore(dm,para.nextSibling);}
    qa('.sl-ig').forEach(function(m){var k=m.getAttribute('data-ig');if(!make[k]||m.firstChild)return;m.innerHTML=make[k]();if(k==='process')m.setAttribute('aria-labelledby','sl-proc-h');fig[k]=m;});
    glints();
  }

  // ---- how we work: where along the path each step sits, worked out once per layout ----
  function measure(){
    var m=fig.process;if(!m)return;
    var pr=q('.pr',m),strip=q('.strip',m),path=q('.draw',m),lis=qa('li',m),wide=strip.offsetHeight>0;
    proc={pr:pr,path:path,lis:lis,star:q('.star',m),wide:wide,m:m};
    if(wide){
      var tot=path.getTotalLength();proc.tot=tot;proc.w=strip.clientWidth;proc.h=strip.clientHeight;
      proc.at=[200,600,1000].map(function(x){var lo=0,hi=tot,i;for(i=0;i<22;i++){var mid=(lo+hi)/2;if(path.getPointAtLength(mid).x<x)lo=mid;else hi=mid;}return lo/tot;});
    }else{
      var top=10,len=pr.clientHeight-20;proc.len=len;
      proc.at=lis.map(function(li){return clamp((li.offsetTop+30-top)/len);});
    }
  }

  // ---- one scroll handler for both scroll-linked diagrams (same shape as the S·04 panel in site.js) ----
  var tick=false;
  function paint(){
    tick=false;if(!on())return;
    var H=innerHeight,r,p,ln=fig.line&&q('.sl-line',fig.line);
    if(ln&&!lineDone){
      r=ln.getBoundingClientRect();p=still?1:clamp((H-r.top)/(H*.85));
      ln.style.setProperty('--p',p.toFixed(4));
      qa('li',ln).forEach(function(li,i){li.classList.toggle('on',p>=[.15,.4,.65,.9][i]);});
      if(p>=1){lineDone=true;if(!still)ln.classList.add('run');}
    }
    if(proc){
      r=proc.m.getBoundingClientRect();
      if(r.bottom>-200&&r.top<H+200){
        p=still?1:clamp((H*.88-r.top)/(H*.62));
        proc.m.style.setProperty('--p',p.toFixed(4));
        proc.lis.forEach(function(li,i){li.classList.toggle('on',p>=proc.at[i]-.005);});
        if(proc.wide){var pt=proc.path.getPointAtLength(p*proc.tot);proc.star.style.transform='translate('+(pt.x/1200*proc.w).toFixed(1)+'px,'+(pt.y/120*proc.h).toFixed(1)+'px) rotate('+(p*180).toFixed(0)+'deg)';}
        else proc.star.style.transform='translate(12px,'+(10+p*proc.len).toFixed(1)+'px) rotate('+(p*180).toFixed(0)+'deg)';
        proc.star.style.opacity=p>0&&p<1?1:p>=1?.9:0;
      }
    }
  }
  function onScroll(){if(!tick){tick=true;requestAnimationFrame(paint);}}

  // ---- wake things only while they are on screen ----
  function watch(){
    if(!('IntersectionObserver' in window)){qa('.band,.sl-proc').forEach(function(b){b.classList.add('sl-on');});var dl0=fig.dial&&q('.sl-dial',fig.dial);if(dl0)dl0.classList.add('play');return;}
    var io=new IntersectionObserver(function(en){en.forEach(function(x){x.target.classList.toggle('sl-on',x.isIntersecting&&!still);});},{rootMargin:'10% 0px'});
    qa('.band.state,#offer,#services,#work,#reviews,#report,.sl-proc').forEach(function(b){io.observe(b);});
    var ln=fig.line&&q('.sl-line',fig.line);
    if(ln)new IntersectionObserver(function(en){if(lineDone&&!still)ln.classList.toggle('run',en[0].isIntersecting);}).observe(ln);
    var dl=fig.dial&&q('.sl-dial',fig.dial);
    if(dl){
      if(still){dl.classList.add('play');return;}
      // plays once when a good part of it is on screen; scroll back above it and it resets, like the S·04 panel
      new IntersectionObserver(function(en){var x=en[0];if(x.isIntersecting&&x.intersectionRatio>=.35)dl.classList.add('play');else if(!x.isIntersecting&&x.boundingClientRect.top>innerHeight)dl.classList.remove('play');},{threshold:[0,.35]}).observe(dl);
    }
  }

  // The stylesheet arrives switched off (media "not all", set in site.js). It is switched on here, in the same step as the mounts are filled,
  // so everything that changes the page's height happens at once and the reader's place is put back once.
  function start(){
    var css=q('link[href*="starlight.css"]');
    if(css&&!css.sheet){css.addEventListener('load',start,{once:true});return;}
    hold(function(){if(css)css.media='all';fill();});measure();watch();paint();
    addEventListener('scroll',onScroll,{passive:true});
    addEventListener('resize',function(){measure();onScroll();});
    // back from Night or Day: the blocks are visible again, so re-measure
    var was=on();new MutationObserver(function(){var now=on();if(now&&!was){measure();onScroll();}was=now;}).observe(d,{attributes:true,attributeFilter:['class']});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
