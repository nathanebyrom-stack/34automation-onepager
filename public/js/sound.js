// Sound for the three scroll sections (Nathan, 15 Nov 2026): the hero film, the why-us film and 05 In motion.
// Fetched by js/site.js the first time the Sound button is pressed, and never otherwise; the page is silent until then. The button's click also makes the
// AudioContext (window.__snd.ctx), because a browser only lets sound start from inside a press.
// Nothing here is a recording: every sound is made in the browser from noise and a few oscillators, so there are no audio files to fetch.
// The reader's scroll is the throttle. How loud each layer is follows how fast the page is moving; what it sounds like follows where the reader is in the section.
// Stop scrolling and the picture holds still, so the sound settles to a quiet room tone. Scroll back and the events play again in reverse order.
//   Hero     the shop after hours: room tone, mist hissing off the billet (left), a warm tone that opens and crosses to the right with the light, swarf pinging down mid-film.
//   Why us   the drill in the cut: spindle and its whine (they wind up and down with the scroll), the grind of the cut, the coolant jet; it all brightens as the camera pushes in.
//   Valve    the section lifts off the paper (air), turns into a solid (a rising turned tone and a steel shimmer), then each part seats with its own knock, in the same order
//            and at the same moments as js/motion.js; apart again, each part lets go with a click and its balloon arrives with a soft tick.
// Outside those three sections, while a film from the 01 cards is open, or in a hidden tab, it is silent.
(function(){
var S=window.__snd;if(!S||!S.ctx||S.set)return;
var ctx=S.ctx,d=document.documentElement,PI=Math.PI;
function clamp(x){return Math.min(Math.max(x,0),1);}
function seg(p,a,b){return clamp((p-a)/(b-a));}
function $(id){return document.getElementById(id);}
function G(v){var g=ctx.createGain();g.gain.value=v;return g;}
function F(type,f,q){var b=ctx.createBiquadFilter();b.type=type;b.frequency.value=f;if(q)b.Q.value=q;return b;}
function O(type,f){var o=ctx.createOscillator();o.type=type;o.frequency.value=f;o.start();return o;}
function PAN(v){if(!ctx.createStereoPanner)return G(1);var p=ctx.createStereoPanner();p.pan.value=v;return p;}
function chain(){for(var i=0;i<arguments.length-1;i++)arguments[i].connect(arguments[i+1]);return arguments[arguments.length-1];}
// move a setting towards a value, smoothly; nothing is sent when it has not changed
function to(p,v,tc){if(!p||Math.abs(v-p._v)<1e-5)return;p._v=v;p.setTargetAtTime(v,ctx.currentTime,tc||.07);}

// one stretch of white noise, in stereo, looped; every hiss, grind and click is cut from it with filters. Each user starts at its own place, so no two sound alike
var white=(function(){var n=Math.floor(ctx.sampleRate*3),b=ctx.createBuffer(2,n,ctx.sampleRate);for(var c=0;c<2;c++){var a=b.getChannelData(c);for(var i=0;i<n;i++)a[i]=Math.random()*2-1;}return b;})();
function N(){var s=ctx.createBufferSource();s.buffer=white;s.loop=true;s.start(0,Math.random()*3);return s;}

// out: everything meets at the master, then a limiter so nothing can clip however fast the reader scrolls
var master=G(0),lim=ctx.createDynamicsCompressor();
lim.threshold.value=-14;lim.knee.value=8;lim.ratio.value=8;lim.attack.value=.004;lim.release.value=.18;
master.connect(lim);lim.connect(ctx.destination);
// the room: a short, dark echo, so that pings and knocks sit in a workshop and not inside the speaker
var wet=ctx.createConvolver();
(function(){var n=Math.floor(ctx.sampleRate*1.5),b=ctx.createBuffer(2,n,ctx.sampleRate);for(var c=0;c<2;c++){var a=b.getChannelData(c),l=0;for(var i=0;i<n;i++){l+=((Math.random()*2-1)*Math.pow(1-i/n,3.4)-l)*.3;a[i]=l;}}wet.buffer=b;})();
chain(wet,G(.5),master);

// room tone, under all three sections: a low rumble, some air, and the hum of machines left on
var bed=G(0);bed.connect(master);
chain(N(),F('lowpass',150,.5),G(.07),bed);
chain(N(),F('bandpass',560,.5),G(.03),bed);
chain(O('sine',100),G(.008),bed);chain(O('sine',100.13),G(.005),bed);chain(O('sine',150.2),G(.005),bed);

/* ---------- hero ---------- */
var hero=G(0);hero.connect(master);
var mist=G(0),mistAm=G(.7);chain(N(),F('highpass',2400),F('bandpass',5200,.8),mistAm,mist,PAN(-.35),hero);
chain(O('sine',.19),G(.3),mistAm.gain); // the mist curls: its hiss comes and goes
var glow=G(0),glowLp=F('lowpass',320,.7),glowPan=PAN(-.5);chain(glowLp,glow,glowPan,hero);
chain(O('sine',110),G(.3),glowLp);chain(O('sine',164.9),G(.3),glowLp);chain(O('triangle',220.4),G(.3),glowLp);chain(O('triangle',329.2),G(.2),glowLp);
chain(N(),F('bandpass',1760,7),G(.05),glowLp);

/* ---------- why us ---------- */
var why=G(0),whyLp=F('lowpass',2600,.5);chain(why,whyLp,G(.55),master);
var spA=O('sawtooth',90),spB=O('sawtooth',90.6),spLp=F('lowpass',820,1.1),spin=G(0);chain(spA,spLp,F('highpass',120,.7),spin,why);spB.connect(spLp);
var wh=O('sine',540),whT=O('triangle',1085),whine=G(0);chain(wh,whine,why);chain(whT,G(.3),whine);
var cutAm=G(.55),cut=G(0),flute=O('sine',180);chain(N(),F('bandpass',2400,1.4),cutAm,cut,why);chain(flute,G(.45),cutAm.gain); // the grind pulses once for each flute going round
var coolAm=G(.86),cool=G(0);chain(N(),F('highpass',3400),F('bandpass',6400,.5),coolAm,cool,PAN(.22),why);
chain(O('sine',7.3),G(.09),coolAm.gain);chain(O('sine',.31),G(.05),coolAm.gain);

/* ---------- valve ---------- */
var valve=G(0);valve.connect(master);
var liftBp=F('bandpass',350,1.2),lift=G(0);chain(N(),liftBp,lift,valve);
var fmA=O('sawtooth',82),fmB=O('triangle',164),fmLp=F('lowpass',500,.9),form=G(0);chain(fmA,G(.5),fmLp,form,valve);chain(fmB,G(.5),fmLp);
var shim=G(0),shN=N();chain(shN,F('bandpass',3100,9),shim,valve);chain(shN,F('bandpass',4700,9),G(.7),shim);
var slideBp=F('bandpass',800,2),slide=G(0);chain(N(),slideBp,slide,valve);
var parts=G(1.3);parts.connect(valve); // every knock, ring and click of the valve's parts goes through here: one place to set their level

/* ---------- one-off sounds ---------- */
function env(g,t,vol,a,dur){g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+a);g.gain.exponentialRampToValueAtTime(.0001,t+a+dur);}
function burst(t,len){var s=ctx.createBufferSource();s.buffer=white;s.start(t,Math.random()*2.5,len);return s;}
// struck metal: three partials that are not in tune with each other, which is what makes a ring sound like metal and not like a note
function ping(bus,f,dur,vol,pan,when){
  var t=ctx.currentTime+(when||0),out=G(0),pn=PAN(pan||0);env(out,t,vol,.002,dur);
  [1,2.756,5.404].forEach(function(m,i){if(f*m>15000)return;var o=ctx.createOscillator(),g=G([1,.5,.22][i]);o.frequency.value=f*m;o.connect(g);g.connect(out);o.start(t);o.stop(t+dur+.06);});
  out.connect(pn);pn.connect(bus);pn.connect(wet);
}
// the weight of a part landing: a low note that drops, and the click of the touch
function knock(bus,f,vol,when){
  var t=ctx.currentTime+(when||0),o=ctx.createOscillator(),g=G(0),c=G(0);
  o.frequency.setValueAtTime(f*1.7,t);o.frequency.exponentialRampToValueAtTime(f,t+.06);env(g,t,vol,.003,.13);o.connect(g);g.connect(bus);g.connect(wet);o.start(t);o.stop(t+.25);
  env(c,t,vol*.5,.001,.03);chain(burst(t,.05),F('bandpass',Math.min(f*10,5000),1.2),c,bus);
}
// a small dry click
function tick(bus,f,vol,pan,when){
  var t=ctx.currentTime+(when||0),g=G(0),pn=PAN(pan||0);env(g,t,vol,.0008,.02);chain(burst(t,.04),F('bandpass',f,6),g,pn,bus);
}
function rnd(a,b){return a+Math.random()*(b-a);}
// swarf: bright chips landing on the plate, at random, more of them the faster the film runs
function chips(bus,rate,dt,lo,hi){if(Math.random()<rate*dt)ping(bus,rnd(lo,hi),rnd(.05,.16),rnd(.03,.075),rnd(-.7,.7));}

// the valve's parts, by the point on its build-and-explode path (e in js/motion.js: 1 = fully apart, 0 = together) at which each one seats or lets go. Same numbers as W_ there.
var PARTS=[];
function part(e,seat,free){PARTS.push({e:e,seat:seat,free:free});}
function sp(){return rnd(-.3,.3);}
[.58,.64,.70,.76].forEach(function(e){part(e,function(){knock(parts,210,.05);tick(parts,900,.05,sp());},function(){tick(parts,1100,.03,sp());});}); // seat rings, PTFE: dull
part(.46,function(){knock(parts,92,.15);ping(parts,640,.5,.05,0);},function(){ping(parts,640,.3,.022,0);});                                         // ball: the heavy one
part(.36,function(){knock(parts,170,.1);ping(parts,1380,.4,.04,sp());},function(){ping(parts,1380,.25,.02,sp());});                              // stem
part(.26,function(){knock(parts,125,.16);ping(parts,830,.55,.05,sp());},function(){ping(parts,830,.3,.022,sp());});                              // bonnet
part(.18,function(){for(var i=0;i<4;i++){tick(parts,rnd(2900,3500),.06,sp(),i*.045);}},function(){for(var i=0;i<4;i++)tick(parts,rnd(2600,3100),.035,sp(),i*.045);}); // four bonnet bolts
part(.12,function(){tick(parts,700,.06,sp());},function(){tick(parts,820,.035,sp());});                                                         // gland packing: soft
part(.06,function(){ping(parts,2150,.22,.035,sp());tick(parts,2400,.05,0,.05);tick(parts,2500,.05,0,.1);},function(){tick(parts,2300,.04,0);tick(parts,2200,.04,0,.05);ping(parts,2150,.15,.016,sp(),.08);}); // gland nut: rings, then two clicks of the spanner
part(.004,function(){knock(parts,200,.08);ping(parts,1120,.7,.05,sp());},function(){ping(parts,1120,.4,.024,sp());});                            // lever handle: rings longest
for(var bi=0;bi<4;bi++)for(var k=0;k<4;k++)(function(e,pn){part(e,function(){tick(parts,rnd(3600,4400),.04,pn);},function(){tick(parts,rnd(3300,4000),.026,pn);});})(.02+bi*.05+k*.012,[-.5,.5,-.2,.2][bi]); // sixteen flange bolts
// the point (same scale) at which each part is clear and its balloon and parts-list row appear. Same numbers as CLEAR there.
var CLEAR=[.02,.56,.70,.46,.22,.16,.08,.19,.36,.28];

/* ---------- where the reader is ---------- */
var el={hero:$('hero'),stage:$('stage'),why:$('why'),whyTrack:$('whyTrack'),whyPin:$('whyPin'),mo:$('motion'),moTrack:$('vTrack'),vid:$('vid')};
// p: how far through the section's scroll (0 to 1). w: how much of it is in front of the reader (1 inside, falling to 0 over most of a screen either side)
function place(track,view){var s=track.offsetHeight-view,t=-track.getBoundingClientRect().top,o=t<0?-t:t>s?t-s:0;return {p:s>0?clamp(t/s):0,w:1-clamp(o/(innerHeight*.7))};}
var OFF={p:0,w:0};
function where(){return {
  h:el.hero&&el.stage&&d.classList.contains('film')&&el.stage.classList.contains('live')?place(el.hero,el.stage.clientHeight):OFF,
  y:el.why&&el.whyTrack&&el.whyPin&&el.why.classList.contains('scrub')&&el.whyPin.classList.contains('live')?place(el.whyTrack,innerHeight):OFF,
  v:el.mo&&el.moTrack&&el.mo.classList.contains('scrub')&&el.mo.classList.contains('v3d')?place(el.moTrack,innerHeight):OFF};}

var raf=0,last=0,ly=0,act=0,ps={h:0,y:0,v:0},le=-1,lv=-1,offT=0;
function frame(ts){
  raf=requestAnimationFrame(frame);
  var real=Math.max((ts-last)/1000,.004),dt=Math.min(real,.1);last=ts;
  // how hard the reader is scrolling, in screens a second, squashed to 0..1: quick to rise, slower to fall, like a machine winding down
  var y=window.scrollY||0,v=(y-ly)/real/innerHeight,a=1-Math.exp(-Math.abs(v)/.55),back=v<0;ly=y;
  if(Math.abs(v)>12)a=0; // a jump (a nav link, the keyboard's End), not a scroll: it makes no noise
  act+=(a-act)*(1-Math.exp(-dt/(a>act?.06:.34)));if(act<.002)act=0;
  var W=where(),k=1-Math.exp(-dt/.075),key,q;
  for(key in ps){q=W[key];ps[key]+=(q.p-ps[key])*k;} // the films ease towards the scroll; so does the sound, to stay with the picture
  var open=el.vid&&el.vid.open,mw=Math.max(W.h.w,W.y.w,W.v.w),p,w,e;
  to(master.gain,S.on&&!open?1:0,.1);
  to(bed.gain,mw*(.4+.6*act));

  // hero: mist off the billet early on, the light crossing from the billet to the finished part, swarf in the middle of the film
  p=ps.h;w=W.h.w;to(hero.gain,w);
  var m=seg(p,.02,.1)*(1-seg(p,.3,.48));
  to(mist.gain,m*(.1+.9*act)*.2);
  to(glow.gain,act*(.45+.55*seg(p,.05,.55))*.06);to(glowLp.frequency,320+1500*seg(p,.1,.6),.12);to(glowPan.pan,-.5+.9*seg(p,.1,.55),.12);
  if(w>.3)chips(hero,16*act*seg(p,.36,.46)*(1-seg(p,.66,.8)),dt,3200,7800);

  // why us: the spindle winds up with the scroll and down when it stops; everything gets closer and brighter as the camera pushes in
  p=ps.y;w=W.y.w;e=p*p*(3-2*p);to(why.gain,w);
  var f=92*(.6+.4*act)*(1+.14*e)*(back?.95:1);
  to(spA.frequency,f,.09);to(spB.frequency,f*1.006,.09);to(wh.frequency,f*6,.09);to(whT.frequency,f*12.04,.09);to(flute.frequency,f*2,.09);
  to(spin.gain,Math.pow(act,1.2)*(.55+.45*e)*.07);to(whine.gain,act*(.4+.6*e)*.02);
  to(cut.gain,act*(.35+.65*e)*.17);to(cool.gain,(.08+.92*act)*(.6+.4*e)*.15);
  to(whyLp.frequency,2600+9000*e,.12);
  if(w>.3)chips(why,7*act*(.4+.6*e),dt,4200,9000);

  // valve: lift, turn into a solid, then the parts
  p=ps.v;w=W.v.w;to(valve.gain,w);
  var lw=seg(p,.05,.08)*(1-seg(p,.16,.2)),fw=seg(p,.15,.18)*(1-seg(p,.4,.46)),kk=seg(p,.16,.4);
  var sw=Math.max(seg(p,.4,.42)*(1-seg(p,.56,.58)),seg(p,.6,.62)*(1-seg(p,.84,.87)));
  to(lift.gain,act*lw*.32);to(liftBp.frequency,350+1500*seg(p,.06,.16),.1);
  to(form.gain,act*fw*.15);to(fmA.frequency,82*(1+kk),.1);to(fmB.frequency,164*(1+kk),.1);to(fmLp.frequency,500+1300*kk,.1);to(shim.gain,act*fw*kk*.55);
  to(slide.gain,act*sw*.2);to(slideBp.frequency,700+500*act,.1);
  // the parts: e as js/motion.js has it. Falling through a part's point seats it; rising through it lets it go. Only for a reader who is in the section and scrolling, not jumping
  e=p<.58?1-seg(p,.4,.56):seg(p,.6,.84);
  if(w>.3&&S.on&&!open&&le>=0&&Math.abs(p-lv)<.05&&e!==le){
    var n=0,i,t;
    for(i=0;i<PARTS.length&&n<8;i++){t=PARTS[i].e;if(e<t&&le>=t){PARTS[i].seat();n++;}else if(e>=t&&le<t){PARTS[i].free();n++;}}
    if(p>.6&&e>le)for(i=0;i<CLEAR.length;i++){t=CLEAR[i];if(e>=t&&le<t){ping(parts,1760,.09,.02,.25);tick(parts,5200,.03,.25);}}
  }
  le=e;lv=p;
}

function run(){clearTimeout(offT);var r=ctx.resume();if(r&&r.catch)r.catch(function(){});if(!raf){last=performance.now();ly=window.scrollY||0;le=lv=-1;raf=requestAnimationFrame(frame);}}
function rest(){to(master.gain,0,.08);cancelAnimationFrame(raf);raf=0;clearTimeout(offT);offT=setTimeout(function(){if(!S.on||document.hidden){var r=ctx.suspend();if(r&&r.catch)r.catch(function(){});}},400);}
S.set=function(on){S.on=!!on;if(S.on&&!document.hidden)run();else rest();};
S.out=lim; // handle for testing
document.addEventListener('visibilitychange',function(){if(document.hidden)rest();else if(S.on)run();});
S.set(S.on);
})();
