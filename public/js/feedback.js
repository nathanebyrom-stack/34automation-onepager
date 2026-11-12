// /feedback-request/: Nathan's private tool for asking a client for a review.
// Builds the email (copy passed humanize + slop-gate, 12 Nov 2026) and a link that opens the home page's
// review form with the business name filled in and "Yes, I'm a client" ticked. Nothing is sent from here:
// "Open in email" hands it to his own mail app, so it goes from his mailbox and replies come back to him.
(function(){
  var f=document.getElementById('fbr');if(!f)return;
  var first=document.getElementById('fb-first'),email=document.getElementById('fb-email'),biz=document.getElementById('fb-biz'),note=document.getElementById('fb-note');
  var open=document.getElementById('fb-open'),copy=document.getElementById('fb-copy'),lnk=document.getElementById('fb-link'),msg=document.getElementById('fb-msg');
  var subjEl=document.getElementById('fb-subj'),bodyEl=document.getElementById('fb-body');
  var SITE=location.origin.indexOf('34automation.co.uk')>-1?'https://34automation.co.uk':location.origin;
  var EMAIL=/^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[^\s@<>()",;:]+$/;

  function v(x){return x.value.trim();}
  function link(){return SITE+'/?review='+encodeURIComponent(v(biz)||'Your business')+'#reviews';}
  function subject(){return 'Quick favour, '+(v(first)||'{first}')+'?';}
  function body(){
    var n=v(note);
    return 'Hi '+(v(first)||'{first}')+',\n\n'+
      'Hope all’s good your end.. Can I ask a quick favour?\n\n'+
      (n?n+'\n\n':'')+
      'I’d really value your honest take on working with 34. A score out of 5, plus a line or two on what worked and what didn’t if you’ve got time. It’s quick:\n\n'+
      link()+'\n\n'+
      'All feedback welcome, good or bad. Genuine reviews go up on the site either way.\n\n'+
      'Thanks\nNathan\n34 Automation';
  }
  function ready(){return !!(v(first)&&v(biz)&&(!v(email)||EMAIL.test(v(email))));}
  function render(){
    subjEl.textContent=subject();bodyEl.textContent=body();
    var ok=ready();
    open.setAttribute('aria-disabled',ok?'false':'true');
    open.href=ok?'mailto:'+encodeURIComponent(v(email)).replace(/%40/g,'@')+'?subject='+encodeURIComponent(subject())+'&body='+encodeURIComponent(body()):'#';
  }
  function say(t,err){msg.textContent=t;msg.className='enq-msg'+(err?' err':'');}
  function check(){
    if(!v(first)){say('Add their first name.',true);first.focus();return false;}
    if(!v(biz)){say('Add their business name. It fills in the review form for them.',true);biz.focus();return false;}
    if(v(email)&&!EMAIL.test(v(email))){say('That email address doesn’t look right.',true);email.focus();return false;}
    return true;
  }
  function clip(text,done){
    function fallback(){var t=document.createElement('textarea');t.value=text;t.setAttribute('readonly','');t.style.position='fixed';t.style.opacity='0';document.body.appendChild(t);t.select();
      var ok=false;try{ok=document.execCommand('copy');}catch(e){}document.body.removeChild(t);say(ok?done:'Couldn’t copy. Select the preview and copy it by hand.',!ok);}
    if(navigator.clipboard&&window.isSecureContext)navigator.clipboard.writeText(text).then(function(){say(done);},fallback);else fallback();
  }
  f.addEventListener('input',function(){render();if(msg.classList.contains('err'))say('');});
  f.addEventListener('submit',function(e){e.preventDefault();});
  open.addEventListener('click',function(e){if(!check()){e.preventDefault();return;}say('Opening your email app…');});
  copy.addEventListener('click',function(){if(check())clip('Subject: '+subject()+'\n\n'+body(),'Email copied. Paste it into a new message.');});
  lnk.addEventListener('click',function(){if(!v(biz)){say('Add their business name first.',true);biz.focus();return;}clip(link(),'Review link copied. Handy for WhatsApp or LinkedIn.');});
  render();
})();
