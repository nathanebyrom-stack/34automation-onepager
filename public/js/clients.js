// Client area: sign in with a username and password (Brand Builder sign-in API), or open the Brand Builder with a personal link or code.
(function(){
  'use strict';
  // username + password → the Brand Builder. The API answers with a URL carrying the session in its #fragment; we go straight there and keep nothing.
  var lf=document.getElementById('loginForm');
  if(lf){
    var u=document.getElementById('u'),pw=document.getElementById('p'),show=document.getElementById('pShow'),btn=document.getElementById('loginBtn'),lm=document.getElementById('loginMsg');
    // MAIL: kept here, not read from the page, because Cloudflare's email obfuscation rewrites addresses in the live HTML. Keep in step with publicEmail in site.config.json.
    var API=lf.getAttribute('data-api'),BASE=lf.getAttribute('data-clients-url'),MAIL='nathan@34automation.co.uk',busy=false;
    function lsay(t,k,bad){lm.textContent=t;lm.className='enq-msg'+(k?' '+k:'');[u,pw].forEach(function(x){if(bad&&bad.indexOf(x)>-1){x.setAttribute('aria-invalid','true');x.setAttribute('aria-describedby','loginMsg');}else{x.removeAttribute('aria-invalid');x.removeAttribute('aria-describedby');}});}
    function sayMail(lead,tail){ // a message with the contact address as a link
      lm.textContent=lead;lm.className='enq-msg err';var a=document.createElement('a');a.href='mailto:'+MAIL;a.textContent=MAIL;lm.appendChild(a);lm.appendChild(document.createTextNode(tail||'.'));
    }
    show.addEventListener('click',function(){var on=pw.type==='password';pw.type=on?'text':'password';show.textContent=on?'Hide':'Show';show.setAttribute('aria-label',on?'Hide password':'Show password');show.setAttribute('aria-pressed',String(on));});
    lf.addEventListener('input',function(){if(lm.classList.contains('err'))lsay('');});
    function fail(code,j){
      if(code==='missing'){lsay('Enter your username and password.','err');(u.value.trim()?pw:u).focus();return;}
      if(code==='bad_login'){pw.value='';lsay('That username and password don’t match. Check them and try again.','err',[u,pw]);pw.focus();return;}
      if(code==='locked'){var s=j&&+j.retry_after;if(s>0){var n=Math.ceil(s/60);lsay('Too many tries, so sign-in is paused to keep your account safe. Try again in '+(n===1?'a minute.':n+' minutes.'),'err');}else lsay('Too many tries, so sign-in is paused for now to keep your account safe. Try again later.','err');return;}
      if(code==='revoked'){sayMail('Your access has been switched off. If you still need it, email ');return;}
      if(code==='expired'){sayMail('Your access has ended. Your answers are still saved. If you need back in, email ');return;}
      sayMail('We couldn’t sign you in just now. Try again in a minute, or use your personal link if you have one. If it keeps happening, email ');
    }
    lf.addEventListener('submit',function(e){
      e.preventDefault();if(busy)return;
      var un=u.value.trim(),p=pw.value;
      if(!un&&!p){lsay('Enter your username and password.','err',[u,pw]);u.focus();return;}
      if(!un){lsay('Enter your username.','err',[u]);u.focus();return;}
      if(!p){lsay('Enter your password.','err',[pw]);pw.focus();return;}
      busy=true;btn.disabled=true;lsay('Checking your details.');
      var ctl='AbortController' in window?new AbortController():null,timer=setTimeout(function(){if(ctl)ctl.abort();},15000);
      fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'sign_in',username:un,password:p}),credentials:'omit',cache:'no-store',referrerPolicy:'no-referrer',signal:ctl?ctl.signal:undefined})
        .then(function(r){return r.json().catch(function(){return {ok:false,code:'server_error'};});})
        .catch(function(){return {ok:false,code:'offline'};})
        .then(function(j){
          clearTimeout(timer);
          if(j&&j.ok&&typeof j.url==='string'){
            // only ever hand off to the Brand Builder's own address
            try{var to=new URL(j.url),home=new URL(BASE);if(to.origin===home.origin&&to.pathname.indexOf(home.pathname)===0){lsay('Opening your Brand Builder.');location.assign(to.href);return;}}catch(x){}
            j={ok:false,code:'server_error'};
          }
          busy=false;btn.disabled=false;fail(j&&j.code,j);
        });
    });
  }

  // personal link or bare code → the Brand Builder (unchanged)
  var f=document.getElementById('codeForm'),inp=document.getElementById('code'),msg=document.getElementById('codeMsg');
  if(!f)return;
  var base=f.getAttribute('data-clients-url');
  function say(t){msg.textContent=t;msg.className='enq-msg'+(t?' err':'');}
  inp.addEventListener('input',function(){say('');});
  f.addEventListener('submit',function(e){
    e.preventDefault();
    var v=inp.value.trim(),k=v;
    var m=v.match(/[?&#]k=([A-Za-z0-9_-]+)/);if(m)k=m[1];
    if(!/^[A-Za-z0-9_-]{20,64}$/.test(k)){say('That code doesn’t look right. Paste the whole link from your email, or email us for a new one.');inp.focus();return;}
    location.href=base+'?k='+encodeURIComponent(k);
  });
})();
