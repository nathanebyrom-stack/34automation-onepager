// Day / Night switch for the inner pages, the same as the home page: follows the viewer's system until they pick one, then remembers it.
// A visitor who chose Starlight on the home page sees these pages in Night, and keeps that choice unless they pick Day here.
(function(){
  var d=document.documentElement,K='34-theme',bs=[].slice.call(document.querySelectorAll('.mode button'));
  function cur(){var t=d.getAttribute('data-theme');if(t)return t;return matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';}
  var PH=matchMedia('(max-width:700px)'); // phones: the switch is a carousel, one button that moves on to the next mode (css: max-width 700px)
  function nx(b){var i=bs.indexOf(b);return bs[(i+1)%bs.length];}
  function lab(){var ph=PH.matches;bs.forEach(function(b){var n=b.title||b.textContent.trim();b.setAttribute('aria-label',ph&&b.getAttribute('aria-pressed')==='true'?n+', tap for '+(nx(b).title||nx(b).textContent.trim()):n);});}
  function paint(){var c=cur();bs.forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.mode===c));});lab();}
  try{var s=localStorage.getItem(K);if(s==='starlight')s='dark';if(s==='light'||s==='dark')d.setAttribute('data-theme',s);}catch(e){}
  bs.forEach(function(b){b.addEventListener('click',function(){var m=(PH.matches&&b.getAttribute('aria-pressed')==='true'?nx(b):b).dataset.mode;d.setAttribute('data-theme',m);try{if(!(m==='dark'&&localStorage.getItem(K)==='starlight'))localStorage.setItem(K,m);}catch(e){}paint();});});
  try{matchMedia('(prefers-color-scheme: light)').addEventListener('change',paint);PH.addEventListener('change',lab);}catch(e){}
  new MutationObserver(paint).observe(d,{attributes:true,attributeFilter:['data-theme']});
  paint();
})();
