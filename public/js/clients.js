// Client area: take a personal link or a bare code and open the Brand Builder with it.
(function(){
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
