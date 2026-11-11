// Day / Night switch for the inner pages, the same as the home page: follows the viewer's system until they pick one, then remembers it.
(function(){
  var d=document.documentElement,K='34-theme',bs=[].slice.call(document.querySelectorAll('.mode button'));
  function cur(){var t=d.getAttribute('data-theme');if(t)return t;return matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';}
  function paint(){var c=cur();bs.forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.mode===c));});}
  try{var s=localStorage.getItem(K);if(s==='light'||s==='dark')d.setAttribute('data-theme',s);}catch(e){}
  bs.forEach(function(b){b.addEventListener('click',function(){d.setAttribute('data-theme',b.dataset.mode);try{localStorage.setItem(K,b.dataset.mode);}catch(e){}paint();});});
  try{matchMedia('(prefers-color-scheme: light)').addEventListener('change',paint);}catch(e){}
  new MutationObserver(paint).observe(d,{attributes:true,attributeFilter:['data-theme']});
  paint();
})();
