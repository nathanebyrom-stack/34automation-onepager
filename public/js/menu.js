// Drop-down menu (Nathan, 25 Nov 2026): on phones and small laptops (up to 1280px wide) the section links don't fit in the header,
// so a Menu button opens a panel with every page and section. Built here so every page carries the same list.
// Closes on a link, Escape (focus goes back to the button), a tap outside, or when the window grows past 1280px.
(function(){
  var hdr=document.querySelector('.hdr'),wrap=hdr&&hdr.querySelector('.wrap');
  if(!wrap)return;
  var home=location.pathname==='/'||location.pathname==='/index.html',h=home?'':'/';
  var here=location.pathname.replace(/index\.html$/,'');
  var links=[
    ['Services',h+'#offer'],['Automations',h+'#services'],['Why us',h+'#why'],
    ['News','/news/'],['Reviews',h+'#reviews'],['Client area','/clients/'],['Website report',h+'#report'],
    ['Contact us',h+'#contact',1]   // names and order follow the header (Nathan, 26 Nov 2026); Work left out
  ];
  var btn=document.createElement('button');
  btn.type='button';btn.className='mbtn';btn.setAttribute('aria-expanded','false');btn.setAttribute('aria-controls','mnav');
  btn.innerHTML='<span class="vh">Menu</span><svg viewBox="0 0 20 14" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path class="l1" d="M1 1h18"/><path class="l2" d="M1 7h18"/><path class="l3" d="M1 13h18"/></svg>';
  var nav=document.createElement('nav');
  nav.className='mnav';nav.id='mnav';nav.setAttribute('aria-label','Menu');nav.hidden=true;
  var ul=document.createElement('ul');
  links.forEach(function(l,i){
    var li=document.createElement('li'),a=document.createElement('a');
    a.href=l[1];a.textContent=l[0];if(l[2])a.className='go';
    if(here!=='/'&&(l[1]===here||(l[1]==='/news/'&&here.indexOf('/news/')===0)))a.setAttribute('aria-current','page');
    li.appendChild(a);ul.appendChild(li);
  });
  nav.appendChild(ul);
  wrap.appendChild(btn);hdr.appendChild(nav);
  function set(open,focusBack){
    btn.setAttribute('aria-expanded',String(open));nav.hidden=!open;hdr.classList.toggle('menu-open',open);
    if(open){var f=nav.querySelector('a');if(f)f.focus({preventScroll:true});}
    else if(focusBack)btn.focus({preventScroll:true});
  }
  btn.addEventListener('click',function(){set(btn.getAttribute('aria-expanded')!=='true');});
  nav.addEventListener('click',function(e){if(e.target.closest('a'))set(false);});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!nav.hidden)set(false,true);});
  document.addEventListener('click',function(e){if(!nav.hidden&&!hdr.contains(e.target))set(false);});
  var wide=matchMedia('(min-width:1281px)');
  function onWide(){if(wide.matches&&!nav.hidden)set(false);}
  try{wide.addEventListener('change',onWide);}catch(e){wide.addListener(onWide);}
})();
