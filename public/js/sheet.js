// The drawing sheet (Nathan, 14 Nov 2026): the engineering drawing behind "Imagine you never missed a call" and 01 What we offer.
// Fetched by js/site.js once #sheet is near the screen, and only after css/sheet.css has loaded (unstyled SVG shapes are solid black).
// Three things happen here, in this order down the file:
//   1. The sheet is drawn as fine vector lines: a four-way valve body in section, a flange view, dimensions, notes, border and title block.
//   2. A pencil goes over every line once, on the clock (30 s), starting when those words come up the screen. It does not follow the scroll, loop or rewind.
//      Only lettering is never pencilled: figures, notes, title block and border text.
//   3. The flange view is a solid 3D flange that turns slowly from the start and can be dragged or turned with the arrow keys.
// Reduced motion: the finished drawing, nothing moving, the flange still but turnable by hand. Without JS none of this runs and the page shows the old bitmap (index.html, <noscript>).
(function(){
'use strict';
var sheet=document.getElementById('sheet');if(!sheet||sheet.querySelector('.dwg'))return;
var NS='http://www.w3.org/2000/svg',CX=800,CY=700,box=document.createElement('div'),hit=document.createElement('div'),grab=document.createElement('div'),svg=document.createElementNS(NS,'svg');
box.className='dwg';box.setAttribute('aria-hidden','true');svg.setAttribute('id','dwg');svg.setAttribute('viewBox','0 0 1600 1408');svg.setAttribute('preserveAspectRatio','xMidYMin meet');box.appendChild(svg);
// the grab handle: a transparent circle over the flange, in a layer above the page's bands (the drawing itself sits behind them and cannot take a click)
hit.className='dwg-hit';grab.id='grab';grab.tabIndex=0;grab.setAttribute('role','slider');grab.setAttribute('aria-label','Turn the 3D flange drawing');grab.setAttribute('aria-valuemin','0');grab.setAttribute('aria-valuemax','360');grab.setAttribute('aria-valuenow','0');hit.appendChild(grab);
sheet.insertBefore(hit,sheet.firstChild);sheet.insertBefore(box,sheet.firstChild);
function el(n,a,p){var e=document.createElementNS(NS,n),k;for(k in a)e.setAttribute(k,a[k]);if(p)p.appendChild(e);return e;}
function f(n){return Math.round(n*100)/100;}
function X(v){return CX+v;}function Y(v){return CY+v;}
var seed=3407;function rnd(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;} // seeded: the same hand every load
function plen(p){var L=0,i;for(i=1;i<p.length;i++)L+=Math.hypot(p[i][0]-p[i-1][0],p[i][1]-p[i-1][1]);return L;}
function dstr(p){var s='M',i;for(i=0;i<p.length;i++)s+=(i?'L':'')+f(p[i][0])+' '+f(p[i][1]);return s;}
function lerp(a,b,t){return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];}
function arcPts(cx,cy,r,a0,a1,n){var o=[],i,t;for(i=0;i<=n;i++){t=(a0+(a1-a0)*i/n)*Math.PI/180;o.push([cx+r*Math.cos(t),cy+r*Math.sin(t)]);}return o;}

var gFr=el('g',{'class':'fr'},svg),gHt=el('g',{'class':'ht'},svg),gCl=el('g',{'class':'cl'},svg),gOb=el('g',{'class':'ob'},svg),gPen=el('g',{'class':'pen'},svg),gDm=el('g',{'class':'dm'},svg);
function ln(g,x1,y1,x2,y2,c){var a={x1:f(x1),y1:f(y1),x2:f(x2),y2:f(y2)};if(c)a['class']=c;return el('line',a,g);}
function tx(g,x,y,s,o){o=o||{};var a={x:f(x),y:f(y),'text-anchor':o.a||'start'};if(o.c)a['class']=o.c;if(o.r)a.transform='rotate('+o.r+' '+f(x)+' '+f(y)+')';var t=el('text',a,g);t.textContent=s;return t;}
var dl=[]; // every dimension, extension and leader line and arrowhead, in the order drawn, for the pencil to go over last
function ah(g,x,y,deg){var t=deg*Math.PI/180,c=Math.cos(t),s=Math.sin(t),bx=x-c*12,by=y-s*12,d='M'+f(x)+' '+f(y)+'L'+f(bx-s*2.4)+' '+f(by+c*2.4)+'L'+f(bx+s*2.4)+' '+f(by-c*2.4)+'Z';var it={fill:d};it.e=el('path',{d:d,'class':'ar'},g);dl.push(it);return it;}

/* ---------- the pencil ---------- */
function rough(pts,amp){var out=[],i,k,a,b,dx,dy,L,n,nx,ny,t,j;
  for(i=0;i<pts.length-1;i++){a=pts[i];b=pts[i+1];dx=b[0]-a[0];dy=b[1]-a[1];L=Math.hypot(dx,dy)||1;n=Math.max(1,Math.round(L/34));nx=-dy/L;ny=dx/L;
    for(k=(i?1:0);k<=n;k++){t=k/n;j=(rnd()-.5)*2*amp;out.push([a[0]+dx*t+nx*j,a[1]+dy*t+ny*j]);}}
  return out;}
function mk(pts,cls,o){var L=plen(pts),e=el('path',{d:dstr(pts),'class':'p '+cls+(o.es?' es':'')+(o.g?' '+o.g:'')+(o.c?' '+o.c:''),'stroke-dasharray':f(L)+' '+f(L+12)},gPen);
  e.style.setProperty('--L',f(L+2));e.style.setProperty('--t0',o.t0.toFixed(4));e.style.setProperty('--d',Math.max(o.d,.0015).toFixed(4));}
function pen(pts,o){ // a ruled line: one firm pass that crosses its corners, then a second pass a little short of both ends
  var p=pts.map(function(q){return [q[0],q[1]];}),ov=o.over,p2=p;
  if(ov&&p.length===2){var dx=p[1][0]-p[0][0],dy=p[1][1]-p[0][1],L=Math.hypot(dx,dy),ux=dx/L,uy=dy/L,m=L*.3,e0=Math.min(ov[0],m)*(.5+rnd()),e1=Math.min(ov[1],m)*(.5+rnd());
    p[0]=[p[0][0]-ux*e0,p[0][1]-uy*e0];p[1]=[p[1][0]+ux*e1,p[1][1]+uy*e1];}
  mk(rough(p,.2),'pa',o);
  if(p.length===2)p2=[lerp(p[0],p[1],.02+rnd()*.07),lerp(p[0],p[1],1-(.02+rnd()*.07))];
  mk(rough(p2,.5),'pb',{t0:o.t0+.003,d:o.d,es:o.es,g:o.g});}
function circ(cx,cy,r,o){ // compass: the second lap sits a hair off-centre
  var a=[],b=[],n=Math.max(40,Math.round(r*.75)),ph=rnd()*6.28,ox=(rnd()-.5)*.9,oy=(rnd()-.5)*.9,i,t,rr;
  for(i=0;i<=n;i++){t=-Math.PI/2+6.2832*i/n;a.push([cx+r*Math.cos(t),cy+r*Math.sin(t)]);}
  for(i=0;i<=n+3;i++){t=-Math.PI/2+.5+6.2832*i/n;rr=r+.35*Math.sin(2*t+ph);b.push([cx+ox+rr*Math.cos(t),cy+oy+rr*Math.sin(t)]);}
  mk(a,'pa',o);mk(b,'pb',{t0:o.t0+.004,d:o.d,es:o.es,c:o.c});}
// chain (centre) lines: every dash and dot is its own short stroke, laid down one after the other
var PAT=[24,5,3,5];
function chain(a,b,t0,d){var L=Math.hypot(b[0]-a[0],b[1]-a[1]),ux=(b[0]-a[0])/L,uy=(b[1]-a[1])/L,pos=0,n=0,s,e;
  while(pos<L){if(n%2===0){s=pos;e=Math.min(pos+PAT[n%4],L);mk(rough([[a[0]+ux*s,a[1]+uy*s],[a[0]+ux*e,a[1]+uy*e]],.15),'pc',{t0:t0+d*s/L,d:d*(e-s)/L,g:'g2'});}pos+=PAT[n%4];n++;}}
function chainArc(cx,cy,r,t0,d,c){var L=6.2832*r,pos=0,n=0,s,e,m,j,t,pts;
  while(pos<L){if(n%2===0){s=pos;e=Math.min(pos+PAT[n%4],L);m=Math.max(1,Math.round((e-s)/6));pts=[];for(j=0;j<=m;j++){t=(s+(e-s)*j/m)/r;pts.push([cx+r*Math.cos(t),cy+r*Math.sin(t)]);}mk(pts,'pc',{t0:t0+d*s/L,d:d*(e-s)/L,g:'g2',c:c});}pos+=PAT[n%4];n++;}}

/* ---------- the part: a four-way valve body in section, 4 drawing units to the millimetre ---------- */
var P=[[100,-488],[168,-488],[168,-480],[240,-480],[240,-424],[170,-424]],
    Q=[[160,-414],[160,-340],[205,-340],[205,-300],[300,-205],[340,-205],[340,-160],[414,-160]],
    R=[[424,-170],[424,-240],[480,-240],[480,-168],[488,-168],[488,-100]],
    QS=[[1,1,0],[1,-1,1],[-1,-1,0],[-1,1,1]],runsNE=[],loop=[],q,i,k;
function addSegs(a){for(var n=0;n<a.length-1;n++)runsNE.push({pts:[a[n],a[n+1]]});}
addSegs(P);runsNE.push({pts:arcPts(170,-414,10,-90,-180,5),arc:1});addSegs(Q);runsNE.push({pts:arcPts(414,-170,10,90,0,5),arc:1});addSegs(R);
function tp(p,qq){return [CX+QS[qq][0]*p[0],CY+QS[qq][1]*p[1]];}
for(q=0;q<4;q++){(function(q){
  var rs=runsNE.map(function(r){return {pts:r.pts.map(function(p){return tp(p,q);}),arc:r.arc};});
  if(QS[q][2]){rs.reverse();rs.forEach(function(r){r.pts.reverse();});}
  loop=loop.concat(rs);
  var last=rs[rs.length-1].pts,a=last[last.length-1],nq=(q+1)%4,b=QS[nq][2]?tp(R[R.length-1],nq):tp(P[0],nq);
  loop.push({pts:[a,b]});
})(q);}
// printed outline, one closed path
var od='M',first=true;loop.forEach(function(r){r.pts.forEach(function(p,n){if(n===0&&!first)return;od+=(first?'':'L')+f(p[0])+' '+f(p[1]);first=false;});});
el('path',{d:od+'Z'},gOb);
// pencil goes once round the outline, clockwise from the top flange
var total=0,acc=0;loop.forEach(function(r){r.len=plen(r.pts);total+=r.len;});
loop.forEach(function(r){pen(r.pts,{t0:.30*acc/total,d:.30*r.len/total,over:r.arc?null:[3.5,3.5]});acc+=r.len;});

// the four bores: two ruled walls each, flange face down to the ball
function rot(p,kk){var x=p[0],y=p[1];return kk===0?[x,y]:kk===1?[-y,x]:kk===2?[-x,-y]:[y,-x];}
function ab(a,kk){return a.map(function(p){var r=rot(p,kk);return [CX+r[0],CY+r[1]];});}
var wd='';
for(k=0;k<4;k++){(function(k){
  var a0=.27+k*.035,sl=.035;
  [1,-1].forEach(function(s,n){
    var wall=ab([[s*100,-488],[s*100,-114.5]],k);
    wd+=dstr(wall);
    pen(wall,{t0:a0+n*sl*.5,d:sl*.46,over:[3.5,3],es:1});
    var c0=ab([[s*200,-496],[s*200,-416]],k);ln(gCl,c0[0][0],c0[0][1],c0[1][0],c0[1][1]);chain(c0[0],c0[1],.56+(k*2+n)*.0018,.0018); // bolt circle, each flange
  });
})(k);}
el('path',{d:wd},gOb);

// the ball, drawn whole (balls are not sectioned)
el('circle',{cx:CX,cy:CY,r:152},gOb);
circ(CX,CY,152,{t0:.40,d:.06,es:1});

// view B: one flange face
var VX=1424,VY=226;
[96,67.2,40].forEach(function(r,n){el('circle',{cx:VX,cy:VY,r:r,'class':'v2'},gOb);circ(VX,VY,r,{t0:.45+n*.014,d:.016,es:1,c:'v2'});});
[45,135,225,315].forEach(function(a,n){var t=a*Math.PI/180,hx=VX+80*Math.cos(t),hy=VY+80*Math.sin(t);el('circle',{cx:f(hx),cy:f(hy),r:7.2,'class':'v2'},gOb);circ(hx,hy,7.2,{t0:.49+n*.0025,d:.0025,c:'v2'});});
ln(gCl,VX-110,VY,VX+110,VY);ln(gCl,VX,VY-110,VX,VY+110);el('circle',{cx:VX,cy:VY,r:80,'class':'v2'},gCl);
chain([VX-110,VY],[VX+110,VY],.575,.008);chain([VX,VY-110],[VX,VY+110],.583,.007);chainArc(VX,VY,80,.59,.01,'v2');

// centre lines and the gold centre mark
ln(gCl,X(-522),CY,X(522),CY);ln(gCl,CX,Y(-522),CX,Y(522));
chain([X(-522),CY],[X(522),CY],.50,.03);chain([CX,Y(-522)],[CX,Y(522)],.53,.03);
ln(gCl,CX-16,CY,CX+16,CY,'cm');ln(gCl,CX,CY-16,CX,CY+16,'cm');

// hatching: one family of lines across all four wall sections (one part, one direction)
var polyNE=[[100,-488],[168,-488],[168,-480],[240,-480],[240,-424],[160,-424],[160,-340],[205,-340],[205,-300],[300,-205],[340,-205],[340,-160],[424,-160],[424,-240],[480,-240],[480,-168],[488,-168],[488,-100],[114.5,-100],[100,-114.5]];
function hatchSegs(poly){var segs=[],step=20*Math.SQRT2,OFF=7.37,cs=poly.map(function(p){return p[0]+p[1];}),c0=Math.min.apply(null,cs),c1=Math.max.apply(null,cs),c,n,a,b,sa,sb,t,xs,j;
  for(c=Math.ceil((c0-OFF)/step)*step+OFF;c<c1;c+=step){xs=[];
    for(n=0;n<poly.length;n++){a=poly[n];b=poly[(n+1)%poly.length];sa=a[0]+a[1]-c;sb=b[0]+b[1]-c;if((sa>0)!==(sb>0)){t=sa/(sa-sb);xs.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]);}}
    xs.sort(function(m,n2){return m[0]-n2[0];});
    for(j=0;j+1<xs.length;j+=2)if(Math.hypot(xs[j+1][0]-xs[j][0],xs[j+1][1]-xs[j][1])>3)segs.push([xs[j],xs[j+1]]);}
  return segs;}
var hd='';
for(q=0;q<4;q++){(function(q){
  var segs=hatchSegs(polyNE.map(function(p){return [QS[q][0]*p[0],QS[q][1]*p[1]];}));
  segs.forEach(function(s,n){var a=[CX+s[0][0],CY+s[0][1]],b=[CX+s[1][0],CY+s[1][1]],L=Math.hypot(b[0]-a[0],b[1]-a[1]),ux=(b[0]-a[0])/L,uy=(b[1]-a[1])/L,e0=(rnd()-.4)*3,e1=(rnd()-.4)*3;
    hd+=dstr([a,b]);
    mk(rough([[a[0]-ux*e0,a[1]-uy*e0],[b[0]+ux*e1,b[1]+uy*e1]],.3),'ph',{t0:.60+q*.0575+(n/segs.length)*.0575*.86,d:.004+L/30000,g:'g2'});});
})(q);}
el('path',{d:hd},gHt);

/* ---------- dimensions and notes: printed light. The pencil later goes over the lines and arrowheads; the figures and notes are never pencilled ---------- */
function dln(x1,y1,x2,y2){var it={pts:[[x1,y1],[x2,y2]]};it.e=ln(gDm,x1,y1,x2,y2);dl.push(it);return it;}
function drect(x,y,w,h){el('rect',{x:x,y:y,width:w,height:h},gDm);dl.push({pts:[[x,y],[x+w,y],[x+w,y+h],[x,y+h],[x,y]]});}
// bore
dln(X(-100),Y(-494),X(-100),Y(-548));dln(X(100),Y(-494),X(100),Y(-548));dln(X(-100),Y(-540),X(200),Y(-540));ah(gDm,X(-100),Y(-540),180);ah(gDm,X(100),Y(-540),0);
tx(gDm,X(152),Y(-546),'Ø50 H7',{a:'middle'});
// face to face, with parallelism to datum A
dln(X(-488),Y(-246),X(-488),Y(-608));dln(X(488),Y(-246),X(488),Y(-608));dln(X(-488),Y(-600),X(488),Y(-600));ah(gDm,X(-488),Y(-600),180);ah(gDm,X(488),Y(-600),0);
tx(gDm,X(254),Y(-606),'244 ±0.1',{a:'middle'});
drect(X(210),Y(-594),88,20);dln(X(232),Y(-594),X(232),Y(-574));dln(X(276),Y(-594),X(276),Y(-574));
dln(X(216),Y(-578),X(221),Y(-590));dln(X(222),Y(-578),X(227),Y(-590));
tx(gDm,X(254),Y(-580),'0.02',{a:'middle'});tx(gDm,X(287),Y(-580),'A',{a:'middle'});
// flange diameter
dln(X(494),Y(-240),X(548),Y(-240));dln(X(494),Y(240),X(548),Y(240));dln(X(540),Y(-240),X(540),Y(240));ah(gDm,X(540),Y(-240),-90);ah(gDm,X(540),Y(240),90);
tx(gDm,X(534),Y(-120),'Ø120',{a:'middle',r:-90});
// flange thickness
dln(X(-246),Y(-480),X(-298),Y(-480));dln(X(-246),Y(-424),X(-298),Y(-424));dln(X(-290),Y(-524),X(-290),Y(-380));ah(gDm,X(-290),Y(-480),90);ah(gDm,X(-290),Y(-424),-90);
tx(gDm,X(-296),Y(-452),'14',{a:'middle',r:-90});
// hub shoulder angle
dln(X(211),Y(-300),X(286),Y(-300));el('path',{d:'M'+X(263)+' '+Y(-300)+'A58 58 0 0 1 '+f(X(246.01))+' '+f(Y(-258.99))},gDm);dl.push({pts:arcPts(X(205),Y(-300),58,0,45,8)});tx(gDm,X(272),Y(-268),'45°');
// ball
dln(X(52),Y(-142.8),X(268),Y(-452));dln(X(268),Y(-452),X(284),Y(-452));ah(gDm,X(52),Y(-142.8),124.9);tx(gDm,X(290),Y(-448),'SØ76');
// surface finish on the top face
el('path',{d:'M'+X(-167)+' '+Y(-500)+'L'+X(-160)+' '+Y(-488)+'L'+X(-146)+' '+Y(-512)+'H'+X(-108)},gDm);dl.push({pts:[[X(-167),Y(-500)],[X(-160),Y(-488)],[X(-146),Y(-512)],[X(-108),Y(-512)]]});tx(gDm,X(-145),Y(-516),'Ra 1.6');
// datum A on the left face
(function(){var d='M'+X(-488)+' '+Y(-157)+'L'+X(-488)+' '+Y(-143)+'L'+X(-501)+' '+Y(-150)+'Z';el('path',{d:d,'class':'ar'},gDm);dl.push({fill:d});})();dln(X(-501),Y(-150),X(-514),Y(-150));drect(X(-538),Y(-162),24,24);tx(gDm,X(-526),Y(-145.5),'A',{a:'middle'});
// flange face view notes
tx(gDm,VX,356,'FLANGE FACE',{a:'middle'});var lab3=tx(gDm,VX,371,'TYP 4 POSNS',{a:'middle',c:'sm'});
(function(){var t=135*Math.PI/180,hx=VX+80*Math.cos(t),hy=VY+80*Math.sin(t),ex=1346,ey=398,dx=ex-hx,dy=ey-hy,L=Math.hypot(dx,dy),sx=hx+dx/L*7.2,sy=hy+dy/L*7.2;
  var la=dln(sx,sy,ex,ey),lb;dln(ex,ey,ex+14,ey);lb=ah(gDm,sx,sy,Math.atan2(-dy,-dx)*180/Math.PI);
  la.c=lb.c='ld';la.e.setAttribute('class','ld');lb.e.setAttribute('class','ar ld'); // this leader points at one hole, so it steps aside once the flange turns
tx(gDm,ex+20,ey+4,'4× Ø9 THRU');tx(gDm,ex+20,ey+20,'EQ SP ON PCD 100');})();
// section title
tx(gDm,X(330),Y(400),'SECTION A–A');dln(X(330),Y(406),X(424),Y(406));tx(gDm,X(330),Y(420),'SCALE 1:1',{c:'sm'});
// general notes
['NOTES','1. DIMENSIONS IN MM','2. TOL. ISO 2768-mK','3. BREAK EDGES 0.2–0.5','4. TEST 24 BAR, 10 MIN'].forEach(function(s,n){tx(gDm,1368,600+n*18+(n?2:0),s,n?{}:{c:'sm'});});
// the pencil's last job: dimension, extension and leader lines, then each arrowhead filled in as its line is reached
(function(){var tot=0,acc=0;dl.forEach(function(it){it.len=it.pts?plen(it.pts):14;tot+=it.len;});
  dl.forEach(function(it){var t0=1+.18*acc/tot,d=Math.max(.18*it.len/tot,.0015),e;
    if(it.pts)mk(rough(it.pts,.2),'pd',{t0:t0,d:d,g:'g4',c:it.c});
    else{e=el('path',{d:it.fill,'class':'af g4'+(it.c?' '+it.c:'')},gPen);e.style.setProperty('--t0',t0.toFixed(4));e.style.setProperty('--d',d.toFixed(4));}
    acc+=it.len;});})();

/* ---------- sheet frame, zones, revision table, title block ---------- */
var fl=[];function fln(x1,y1,x2,y2){ln(gFr,x1,y1,x2,y2);fl.push([[x1,y1],[x2,y2]]);} // ruled sheet lines the pencil goes over later
el('rect',{x:30,y:30,width:1540,height:1348},gFr);el('rect',{x:56,y:56,width:1488,height:1296,'class':'in'},gFr);
for(i=1;i<8;i++){fln(56+i*186,30,56+i*186,56);fln(56+i*186,1352,56+i*186,1378);}
for(i=0;i<8;i++){tx(gFr,56+i*186+93,47,String(8-i),{a:'middle',c:'sm'});tx(gFr,56+i*186+93,1369,String(8-i),{a:'middle',c:'sm'});}
for(i=1;i<4;i++){fln(30,56+i*324,56,56+i*324);fln(1544,56+i*324,1570,56+i*324);}
for(i=0;i<4;i++){tx(gFr,43,56+i*324+165,'DCBA'.charAt(i),{a:'middle',c:'sm'});tx(gFr,1557,56+i*324+165,'DCBA'.charAt(i),{a:'middle',c:'sm'});}
// revisions
fln(1304,56,1304,104);fln(1304,104,1544,104);fln(1304,80,1544,80);fln(1340,56,1340,104);fln(1474,56,1474,104);
tx(gFr,1322,72,'REV',{a:'middle',c:'sm'});tx(gFr,1348,72,'DESCRIPTION',{c:'sm'});tx(gFr,1482,72,'DATE',{c:'sm'});
tx(gFr,1322,96,'C',{a:'middle'});tx(gFr,1348,96,'BORE WAS H8');tx(gFr,1482,96,'11.26');
// title block
var TY=1232;
fln(1104,TY,1544,TY);fln(1104,TY,1104,TY+120);fln(1104,TY+40,1544,TY+40);fln(1104,TY+80,1544,TY+80);
fln(1474,TY,1474,TY+120);fln(1334,TY,1334,TY+40);fln(1264,TY+40,1264,TY+120);fln(1404,TY+40,1404,TY+120);
function cell(x,r,lab,val){tx(gFr,x+7,TY+r*40+12,lab,{c:'sm'});if(val)tx(gFr,x+7,TY+r*40+31,val);}
cell(1104,0,'TITLE','4-WAY VALVE BODY · DN50');cell(1334,0,'DRG NO','34A-0107');cell(1474,0,'REV','C');
cell(1104,1,'MATERIAL','316L · 1.4404');cell(1264,1,'FINISH','Ra 3.2 U.O.S.');cell(1404,1,'SCALE','1:1');cell(1474,1,'SHEET','1 / 1');
cell(1104,2,'DRAWN','34 AUTOMATION');cell(1264,2,'TOLERANCE','ISO 2768-mK');cell(1474,2,'SIZE','A2');
el('path',{d:'M1416 '+(TY+93)+'L1434 '+(TY+89)+'V'+(TY+111)+'L1416 '+(TY+107)+'Z','class':'fp'},gFr).setAttribute('style','fill:none');
[4,9].forEach(function(r){el('circle',{cx:1454,cy:TY+100,r:r,'class':'fp'},gFr);});
// pencil for the sheet itself: frame, outer border, then zone ticks, revision table and title block
[[[56,56],[1544,56]],[[1544,56],[1544,1352]],[[1544,1352],[56,1352]],[[56,1352],[56,56]]].forEach(function(s,n){pen(s,{t0:.83+n*.0125,d:.0125,over:[4,4],es:1,g:'g3'});});
[[[30,30],[1570,30]],[[1570,30],[1570,1378]],[[1570,1378],[30,1378]],[[30,1378],[30,30]]].forEach(function(s,n){mk(rough(s,.25),'pf',{t0:.88+n*.0125,d:.0125,es:1,g:'g3'});});
fl.forEach(function(s,n){mk(rough(s,.25),'pf',{t0:.93+(n/fl.length)*.066,d:.105/fl.length,g:'g3'});});

/* ---------- the flange view in 3D: the same circles, turned in space. A circle seen at an angle is an ellipse, so the whole part is ellipses;
   each face is filled with the paper colour and drawn back to front, so nearer parts hide the lines behind (a hidden-line drawing, not a wireframe).
   4/10 of the main view's scale: flange, raised face, bore, a stub of the neck behind, four bolt holes on the pitch circle ---------- */
var RO=96,RF=67.2,RB=40,RN=64,RP=80,RH=7.2,ZF=3.2,Z0=0,ZB=-22.4,ZN=-80.4,ZP=-30;
var g3=el('g',{'class':'g3d'},svg),defs=el('defs',{},svg);
function cyl(r,za,zb){var g=el('g',{},g3);return {g:g,r:r,za:za,zb:zb,far:el('ellipse',{'class':'sf'},g),qd:el('path',{'class':'qd'},g),s1:el('line',{'class':'sl'},g),s2:el('line',{'class':'sl'},g),near:el('ellipse',{'class':'sf'},g)};}
var cN=cyl(RN,ZN,ZB),cF=cyl(RO,ZB,Z0),cR=cyl(RF,Z0,ZF),pcd=el('ellipse',{'class':'pc3'},cF.g);
function thru(parent,id){var ce=el('ellipse',{},el('clipPath',{id:id},defs));return {near:el('ellipse',{'class':'sf'},parent),far:el('ellipse',{'class':'hf','clip-path':'url(#'+id+')'},parent),ce:ce};}
var holes=[45,135,225,315].map(function(a,n){var h=thru(cF.g,'hc'+n),t=a*Math.PI/180;h.x=RP*Math.cos(t);h.y=RP*Math.sin(t);return h;});
var gB=el('g',{},g3),bore=thru(gB,'hcb'),lastSide=0;
function setE(e,cx,cy,rx,ry,th){e.setAttribute('cx',f(cx));e.setAttribute('cy',f(cy));e.setAttribute('rx',f(Math.max(rx,.02)));e.setAttribute('ry',f(ry));e.setAttribute('transform','rotate('+f(th)+' '+f(cx)+' '+f(cy)+')');}
function render(ps,ph){ // ps: turn about the upright axis, ph: tilt
  var sp=Math.sin(ps),cp=Math.cos(ps),sh=Math.sin(ph),ch=Math.cos(ph),ax=sp,ay=-cp*sh,az=cp*ch,len=Math.hypot(ax,ay),kk=Math.abs(az),th=Math.atan2(ay,ax)*180/Math.PI,nx=len>1e-4?-ay/len:0,ny=len>1e-4?ax/len:0,front=az>=0,side=front?1:-1;
  function on(z){return [VX+ax*(z-ZP),VY+ay*(z-ZP)];}
  [cN,cF,cR].forEach(function(c){var F=on(front?c.za:c.zb),N=on(front?c.zb:c.za),r=c.r,dx=r*nx,dy=r*ny;
    setE(c.far,F[0],F[1],r*kk,r,th);setE(c.near,N[0],N[1],r*kk,r,th);
    c.qd.setAttribute('d','M'+f(F[0]+dx)+' '+f(F[1]+dy)+'L'+f(N[0]+dx)+' '+f(N[1]+dy)+'L'+f(N[0]-dx)+' '+f(N[1]-dy)+'L'+f(F[0]-dx)+' '+f(F[1]-dy)+'Z');
    c.s1.setAttribute('x1',f(F[0]+dx));c.s1.setAttribute('y1',f(F[1]+dy));c.s1.setAttribute('x2',f(N[0]+dx));c.s1.setAttribute('y2',f(N[1]+dy));
    c.s2.setAttribute('x1',f(F[0]-dx));c.s2.setAttribute('y1',f(F[1]-dy));c.s2.setAttribute('x2',f(N[0]-dx));c.s2.setAttribute('y2',f(N[1]-dy));});
  if(side!==lastSide){lastSide=side;(front?[cN,cF,cR]:[cR,cF,cN]).forEach(function(c){g3.appendChild(c.g);});g3.appendChild(gB);} // back to front
  var zn=front?Z0:ZB,zf=front?ZB:Z0,P=on(zn);setE(pcd,P[0],P[1],RP*kk,RP,th);
  holes.forEach(function(h){[[h.near,zn],[h.ce,zn],[h.far,zf]].forEach(function(q){var zz=q[1]-ZP,x1=h.x*cp+zz*sp,z1=-h.x*sp+zz*cp;setE(q[0],VX+x1,VY+h.y*ch-z1*sh,RH*kk,RH,th);});});
  var bn=on(front?ZF:ZN),bf=on(front?ZN:ZF);setE(bore.near,bn[0],bn[1],RB*kk,RB,th);setE(bore.ce,bn[0],bn[1],RB*kk,RB,th);setE(bore.far,bf[0],bf[1],RB*kk,RB,th);}
render(0,0);
// turning: a slow steady turn, or the reader's hand. Runs only while the sheet is on screen
var d3=false,psi=0,phi=0,vps=0,auto=true,touched=false,drag=null,vis=true,raf=0,lt=0,W0=6.2832/24,PH0=-.24,
    reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
function frame(t){raf=0;var dt=Math.min(Math.max((t-lt)/1000,0),.05);lt=t;
  if(!drag){vps+=((auto&&!reduce?W0:0)-vps)*(1-Math.exp(-dt/.9));psi+=vps*dt;if(!touched)phi+=(PH0-phi)*(1-Math.exp(-dt/1.1));}
  render(psi,phi);spin();}
function spin(){if(raf||!d3||!vis)return;
  if(!drag&&!(auto&&!reduce)&&Math.abs(vps)<.002&&(touched||Math.abs(PH0-phi)<.002))return;
  raf=requestAnimationFrame(frame);}
function begin3D(){if(d3)return;d3=true;psi=phi=vps=0;touched=false;
  if(reduce){psi=-.6;phi=PH0;touched=true;}
  render(psi,phi);svg.classList.add('d3');lab3.textContent='TYP 4 POSNS · DRAG TO TURN';spin();}
grab.addEventListener('pointerdown',function(e){if(e.button)return;if(!d3)begin3D();drag={x:e.clientX,y:e.clientY,ps:psi,ph:phi,lx:e.clientX,lt:e.timeStamp};touched=true;vps=0;grab.classList.add('on');
  try{grab.setPointerCapture(e.pointerId);}catch(_){}e.preventDefault();spin();});
grab.addEventListener('pointermove',function(e){if(!drag)return;psi=drag.ps+(e.clientX-drag.x)*.012;phi=Math.max(-1.1,Math.min(1.1,drag.ph-(e.clientY-drag.y)*.009));
  var dt=(e.timeStamp-drag.lt)/1000;if(dt>0)vps=.6*vps+.4*(e.clientX-drag.lx)*.012/dt;drag.lx=e.clientX;drag.lt=e.timeStamp;render(psi,phi);spin();});
function drop(){if(!drag)return;drag=null;grab.classList.remove('on');vps=Math.max(-5,Math.min(5,vps));spin();}
grab.addEventListener('pointerup',drop);grab.addEventListener('pointercancel',drop);
grab.addEventListener('keydown',function(e){var k=e.key;if(k.indexOf('Arrow')!==0)return;e.preventDefault();if(!d3)begin3D();touched=true;
  if(k==='ArrowLeft')psi-=.26;else if(k==='ArrowRight')psi+=.26;else if(k==='ArrowUp')phi=Math.min(1.1,phi+.17);else phi=Math.max(-1.1,phi-.17);
  grab.setAttribute('aria-valuenow',Math.round(((psi*180/Math.PI)%360+360)%360));render(psi,phi);spin();});
if('IntersectionObserver' in window)new IntersectionObserver(function(e){vis=e[0].isIntersecting;spin();}).observe(svg);

/* ---------- constant hairlines: drawing units per screen pixel. The grab handle sits over the flange, above the page's bands ---------- */
function fit(){var m=svg.getScreenCTM();if(!m||!(m.a>0))return;svg.style.setProperty('--u',(1/m.a).toFixed(4));
  var r=sheet.getBoundingClientRect(),R=112*m.a;grab.style.left=(m.a*VX+m.e-r.left-R).toFixed(1)+'px';grab.style.top=(m.d*VY+m.f-r.top-R).toFixed(1)+'px';grab.style.width=grab.style.height=(2*R).toFixed(1)+'px';
  var gx=m.a*VX+m.e-r.left;grab.hidden=gx<0||gx>r.width;} // on a phone the flange view is cropped off the side: then there is no handle to tab to or touch
fit();if('ResizeObserver' in window)new ResizeObserver(fit).observe(svg);else addEventListener('resize',fit);

/* ---------- the timeline: starts once those words come up the screen, then runs on the clock for T seconds. It never follows the scroll, loops or rewinds.
   K fits the whole job (outline, bores, ball, flange view, centre lines, hatching, sheet border, then dimension lines) into T ---------- */
var T=30,K=.8475,INK=.45,words=sheet.querySelector('.state .big');
svg.style.setProperty('--T',T);svg.style.setProperty('--K',K);
function go(){svg.classList.add('go');if(reduce)svg.classList.add('ink3');else setTimeout(function(){svg.classList.add('ink3');},INK*K*T*1000);} // ink3: the pencil has reached the flange view
if(reduce||!words||!('IntersectionObserver' in window))go();
else{var io=new IntersectionObserver(function(e){if(e[0].isIntersecting){io.disconnect();setTimeout(go,500);}},{threshold:.3});io.observe(words);}
begin3D(); // the flange is in 3D and turning from the moment the drawing arrives, before the pencil starts
})();
