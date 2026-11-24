// Models and more (Nathan, 24 Nov 2026): /models/, four of 34's own 3D models for a visitor to turn and measure. Plan of record: docs/models-plan.md.
// Each card is its own small scene. The parts are the 34A-0100 valve's, built the way js/motion.js builds them (the same profiles, in mm), so the two stay alike:
//   valve    the whole valve, assembled
//   bonnet   its bonnet assembly: bonnet, stem, gland packing, gland nut, lever and the bonnet bolts
//   ball     its ball, SØ76 with the L-port
//   flange   the end of one branch: the flange that turns on the home page's drawing sheet (js/sheet.js)
// A model turns by itself (not for reduced motion) until it is first taken hold of; then drag or the arrow keys turn it. Its Dimensions button draws each figure from points
// on the part, as 05 In motion does, so the figures follow the part round. Three.js is the site's tree-shaken copy: a class this file names must be in it (scripts/vendor-three.mjs scans this file too).
import * as THREE from './vendor/three-r186/three.min.js?h=f99759f476';

(function(){
const PI=Math.PI,H=PI/2,clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x)),V3=(x,y,z)=>new THREE.Vector3(x,y,z),UP=V3(0,1,0);
const still=matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- materials and geometry helpers, as in js/motion.js ---------- */
const mk=o=>new THREE.MeshStandardMaterial(Object.assign({color:0xd8dce1,metalness:1,roughness:.36},o));
const steel=mk({side:THREE.DoubleSide}),holeMat=new THREE.MeshStandardMaterial({color:0x0b0c0e,metalness:.2,roughness:.8});
const edgeMat=new THREE.LineBasicMaterial({color:0xE4E7EB,transparent:true,opacity:.85,toneMapped:false});
// a profile (r, a) in mm turned once about the local Y axis
function revolve(prof,segs){
  let A=0;for(let j=0;j<prof.length;j++){const p=prof[j],q=prof[(j+1)%prof.length];A+=p[0]*q[1]-q[0]*p[1];}
  const P=A<0?prof.slice().reverse():prof,n=P.length,pos=[],nor=[],idx=[];
  for(let j=0;j<n;j++){const a=P[j],b=P[(j+1)%n],dr=b[0]-a[0],da=b[1]-a[1],L=Math.hypot(dr,da)||1,nr=da/L,na=-dr/L;
    for(let i=0;i<=segs;i++){const f=2*PI*i/segs,s=Math.sin(f),c=Math.cos(f);pos.push(a[0]*s,a[1],a[0]*c,b[0]*s,b[1],b[0]*c);nor.push(nr*s,na,nr*c,nr*s,na,nr*c);}}
  const v=(j,i,k)=>(j*(segs+1)+i)*2+k;
  for(let i=0;i<segs;i++)for(let j=0;j<n;j++){const a=v(j,i,0),b=v(j,i,1),c=v(j,i+1,0),d=v(j,i+1,1);idx.push(a,c,b,b,c,d);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));g.setIndex(idx);return g;}
function turned(prof,mat,segs=72){return new THREE.Mesh(revolve(prof,segs),mat);}
function arcLine(r,a,segs){const p=[];for(let i=0;i<=segs;i++){const f=2*PI*i/segs;p.push(r*Math.sin(f),a,r*Math.cos(f));}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));return g;}
// pencil circles at the profile's sharp corners
function edges(prof,skip,par,segs=96){const n=prof.length;for(let j=0;j<n;j++){if(skip&&skip.includes(j))continue;const a=prof[(j+n-1)%n],b=prof[j],c=prof[(j+1)%n];
  const u=[b[0]-a[0],b[1]-a[1]],w=[c[0]-b[0],c[1]-b[1]],t=Math.abs(Math.atan2(u[0]*w[1]-u[1]*w[0],u[0]*w[0]+u[1]*w[1]));if(t>.4&&b[0]>.5)par.add(new THREE.Line(arcLine(b[0],b[1],segs),edgeMat));}}
function cutSphere(R,ws,hs,holes){ // a sphere with round holes cut where its surface lies within an angle of the given directions
  const g=new THREE.SphereGeometry(R,ws,hs).toNonIndexed(),p=g.attributes.position.array,keepU=[],keepL=[];
  for(let t=0;t<p.length;t+=9){const cx=(p[t]+p[t+3]+p[t+6])/3,cy=(p[t+1]+p[t+4]+p[t+7])/3,cz=(p[t+2]+p[t+5]+p[t+8])/3,L=Math.hypot(cx,cy,cz);let cut=false;
    for(const h of holes){if((cx*h[0]+cy*h[1]+cz*h[2])/L>Math.cos(h[3])){cut=true;break;}}
    if(!cut)(cy>=0?keepU:keepL).push(t);}
  const build=keep=>{const q=new Float32Array(keep.length*9);keep.forEach((t,i)=>q.set(p.subarray(t,t+9),i*9));const b=new THREE.BufferGeometry();b.setAttribute('position',new THREE.BufferAttribute(q,3));
    const nn=new Float32Array(q.length);for(let i=0;i<q.length;i+=3){const L=Math.hypot(q[i],q[i+1],q[i+2]);nn[i]=q[i]/L;nn[i+1]=q[i+1]/L;nn[i+2]=q[i+2]/L;}b.setAttribute('normal',new THREE.BufferAttribute(nn,3));return b;};
  return {upper:build(keepU),lower:build(keepL)};}
function alongAxis(obj,dir){obj.quaternion.setFromUnitVectors(UP,dir.clone().normalize());}
const BOLT_TH=[45,135,225,315].map(a=>a*PI/180),DIRS=[V3(1,0,0),V3(-1,0,0),V3(0,0,1),V3(0,0,-1)];
// four dark discs on a pitch circle of 100: the bolt holes, as the valve draws them. flip: a face that looks down the axis
function holes(par,r,y,flip){BOLT_TH.forEach(t=>{const h=new THREE.Mesh(new THREE.CircleGeometry(r,20),holeMat);h.rotation.x=flip?H:-H;h.position.set(50*Math.cos(t),y,50*Math.sin(t));par.add(h);});}
const hexG=new THREE.CylinderGeometry(7.5,7.5,5.3,6),shankG=new THREE.CylinderGeometry(4,4,1,16);
function bolt(len){const b=new THREE.Group(),m=mk({roughness:.4}),h=new THREE.Mesh(hexG,m);h.position.y=2.65;const s=new THREE.Mesh(shankG,m);s.scale.y=len;s.position.y=-len/2;b.add(h,s);return b;}

/* ---------- the parts (js/motion.js, read off the drawing: bore Ø50, flange Ø120 x 14, neck Ø80, hub Ø102.5, face to face 244, ball SØ76) ---------- */
const fil=[];for(let t=-90;t>=-180;t-=18){const r=t*PI/180;fil.push([(170+10*Math.cos(r))/4,(414-10*Math.sin(r))/4]);}
const BR=[[25,38.5],[25,122],[42,122],[42,120],[60,120],[60,106],...fil,[40,85],[51.25,85],[51.25,75]];
function body(m){ // 01 the body: four branches, the housing, the bonnet boss, and the 16 flange bolts
  DIRS.forEach(d=>{const g=new THREE.Group();alongAxis(g,d);g.add(turned(BR,steel,96));edges(BR,[0],g);m.add(g);});
  const RH=Math.hypot(75,51.25),asinA=r=>Math.asin(r/RH),s=cutSphere(RH,96,64,[[0,1,0,asinA(40)],[1,0,0,asinA(25)],[-1,0,0,asinA(25)],[0,0,1,asinA(25)],[0,0,-1,asinA(25)]]);
  m.add(new THREE.Mesh(s.upper,steel),new THREE.Mesh(s.lower,steel));
  const boss=new THREE.Group(),BP=[[40,0],[40,40],[60,40],[60,0]];boss.position.y=60;m.add(boss);boss.add(turned(BP,steel,96));edges(BP,[0,3],boss);
  DIRS.forEach(d=>{const z=new THREE.Vector3().crossVectors(UP,d);BOLT_TH.forEach(t=>{const b=bolt(20);b.position.copy(d).multiplyScalar(120).addScaledVector(UP,50*Math.sin(t)).addScaledVector(z,50*Math.cos(t));alongAxis(b,d);m.add(b);if(!m.userData.fb)m.userData.fb=b;});});
  const SEAT=[[23,0],[31,0],[31,8],[23,8]];DIRS.forEach(d=>{const r=turned(SEAT,mk({color:0xebe8e1,metalness:0,roughness:.55}),64);alongAxis(r,d);r.position.copy(d).multiplyScalar(30);m.add(r);});} // 03 seat rings
function ball(m){ // 02 the ball, L-port facing +X and +Z
  const g=new THREE.Group(),R=38,a=Math.asin(25/R),rim=Math.sqrt(R*R-625),s=cutSphere(R,144,96,[[1,0,0,a],[0,0,1,a]]);g.add(new THREE.Mesh(s.upper,steel),new THREE.Mesh(s.lower,steel));
  const pm=mk({color:0x8d939b,roughness:.45,side:THREE.DoubleSide}),tube=new THREE.CylinderGeometry(25,25,rim,48,1,true);
  const tx=new THREE.Mesh(tube,pm);tx.rotation.z=H;tx.position.x=rim/2;const tz=new THREE.Mesh(tube,pm);tz.rotation.x=H;tz.position.z=rim/2;g.add(tx,tz);
  [V3(1,0,0),V3(0,0,1)].forEach(d=>{const lip=turned([[23.8,rim-1.6],[26.5,rim-1.6],[26.5,rim+.5],[23.8,rim+.5]],steel,64);alongAxis(lip,d);g.add(lip);});
  const slot=new THREE.Mesh(new THREE.BoxGeometry(7,6,30),holeMat);slot.position.y=R-1.5;g.add(slot);m.add(g);return g;}
function stemParts(m){ // 04 stem, 09 bonnet, 10 bonnet bolts, 05 packing, 06 gland nut, 07 lever, each at its assembled place
  const stem=new THREE.Group(),sm=mk({color:0xbfc4ca,roughness:.34});m.add(stem);
  const c=new THREE.Mesh(new THREE.CylinderGeometry(9,9,126,40),sm);c.position.y=93;const sq=new THREE.Mesh(new THREE.BoxGeometry(12,14,12),sm);sq.position.y=163;const tang=new THREE.Mesh(new THREE.BoxGeometry(6,10,24),sm);tang.position.y=31;stem.add(c,sq,tang);
  const bonnet=new THREE.Group(),BN=[[9.5,88],[39.6,88],[39.6,100],[60,100],[60,114],[22,114],[22,140],[16,140],[16,118],[9.5,118]];m.add(bonnet);bonnet.add(turned(BN,steel,96));edges(BN,null,bonnet);
  let bb=null;BOLT_TH.forEach(t=>{const b=bolt(30);b.position.set(50*Math.cos(t),114,50*Math.sin(t));m.add(b);bb=bb||b;});
  [0,1,2].forEach(k=>{const p=turned([[9.5,0],[16,0],[16,5.4],[9.5,5.4]],mk({color:0xebe8e1,metalness:0,roughness:.6}),48);p.position.y=118.4+k*6;m.add(p);});
  const nut=new THREE.Group(),n=new THREE.Mesh(new THREE.CylinderGeometry(21,21,12,6),steel);n.position.y=146;const top=new THREE.Mesh(new THREE.CircleGeometry(9.6,24),holeMat);top.rotation.x=-H;top.position.y=152.05;nut.add(n,top);m.add(nut);
  const L=new THREE.Group();L.rotation.y=-135*PI/180;m.add(L);
  const hub=new THREE.Mesh(new THREE.BoxGeometry(30,12,30),steel);hub.position.y=164;const bar=new THREE.Mesh(new THREE.BoxGeometry(150,6,22),steel);bar.position.set(88,166,0);
  const grip=new THREE.Mesh(new THREE.CylinderGeometry(10,10,52,24),mk({color:0x1a1b1e,metalness:0,roughness:.62}));grip.rotation.z=H;grip.position.set(136,166,0);L.add(hub,bar,grip);
  return {stem,bonnet,bb,nut,L};}

/* ---------- the four models: what to build, where its centre is and how big it is (mm, for the camera), and its dimensions in the form js/motion.js uses:
   t the figure; obj the part; a, b two points on it (local), or c and r for one across the view; o/ov/od how far the line stands off and which way; s the side the figure prefers ---------- */
const MODELS={
  valve:{c:45,R:190,build(m){body(m);ball(m);const s=stemParts(m);return [
    {t:'178',obj:s.L,a:V3(-15,170,0),b:V3(163,170,0),o:'w',ov:V3(0,1,0),od:22,s:1},
    {t:'A/F 36',obj:s.nut,c:V3(0,146,0),r:18.2,od:0,s:1},
    {t:'Ø120 × 52',obj:s.bonnet,c:V3(0,100,0),r:60,o:'w',ov:V3(0,-1,0),od:13,s:1},
    {t:'Ø120',obj:m,a:V3(0,60,120),b:V3(0,-60,120),o:'l',ov:V3(-1,0,0),od:60,s:-1},
    {t:'Ø50 H7',obj:m,a:V3(-122,25,0),b:V3(-122,-25,0),od:0,s:1},
    {t:'244',obj:m,a:V3(-122,-42,0),b:V3(122,-42,0),o:'l',ov:V3(0,-1,0),od:44,s:1},
    {t:'M8 × 20',obj:m.userData.fb,a:V3(0,-20,0),b:V3(0,0,0),o:'w',ov:V3(0,1,0),od:13,s:1}];}},
  bonnet:{c:132,R:128,build(m){const s=stemParts(m);return [
    {t:'178',obj:s.L,a:V3(-15,170,0),b:V3(163,170,0),o:'w',ov:V3(0,1,0),od:22,s:1},
    {t:'A/F 36',obj:s.nut,c:V3(0,146,0),r:18.2,od:0,s:1},
    {t:'Ø120 × 52',obj:s.bonnet,c:V3(0,100,0),r:60,o:'w',ov:V3(0,-1,0),od:13,s:1},
    {t:'Ø18 × 144',obj:s.stem,a:V3(0,26,0),b:V3(0,170,0),o:'r',od:-24,s:-1},
    {t:'M8 × 30',obj:s.bb,a:V3(0,-30,0),b:V3(0,0,0),o:'r',od:-13,s:-1}];}},
  ball:{c:2,R:50,build(m){const g=ball(m);return [
    {t:'SØ76',obj:g,c:V3(0,0,0),r:38,od:0,s:1},
    {t:'Ø50',obj:g,a:V3(28.6,25,0),b:V3(28.6,-25,0),od:0,s:1}];}},
  flange:{c:0,R:74,build(m){ // the drawing's flange detail: axis along X so a turn shows face, edge and back; centred on its own middle
    const g=new THREE.Group(),FL=[[25,0],[25,37],[42,37],[42,35],[60,35],[60,21],...fil.map(([r,a])=>[r,a-85]),[40,0]];alongAxis(g,V3(1,0,0));g.position.x=-18.5;m.add(g);
    g.add(turned(FL,steel,128));edges(FL,null,g,128);holes(g,4.5,35.08);holes(g,4.5,20.92,true);return [
    {t:'Ø120',obj:g,a:V3(-60,28,0),b:V3(60,28,0),o:'l',ov:V3(0,1,0),od:22,s:1},
    {t:'14',obj:g,a:V3(60,21,0),b:V3(60,35,0),o:'l',ov:V3(1,0,0),od:16,s:1},
    {t:'Ø50',obj:g,a:V3(-25,37,0),b:V3(25,37,0),od:0,s:1},
    {t:'Ø80',obj:g,a:V3(-40,0,0),b:V3(40,0,0),o:'l',ov:V3(0,-1,0),od:14,s:1},
    {t:'4× Ø9 · PCD 100',obj:g,a:V3(-35.36,37,-35.36),b:V3(35.36,37,35.36),od:0,s:1}];}}};

/* ---------- one card ---------- */
const viewers=[],NS='http://www.w3.org/2000/svg';
function viewer(card){
  const def=MODELS[card.dataset.model],cv=card.querySelector('canvas'),lead=card.querySelector('.m-lead'),bal=card.querySelector('.m-bal'),grab=card.querySelector('.m-grab'),btn=card.querySelector('.m-dim'),box=cv.parentNode;
  const renderer=new THREE.WebGLRenderer({canvas:cv,antialias:true,alpha:true,powerPreference:'high-performance'});
  renderer.setClearColor(0x000000,0);renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;renderer.outputColorSpace=THREE.SRGBColorSpace;
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(28,1,10,9000);
  // what the steel reflects, as in js/motion.js: a dim room, big soft cards, one gold work light on the left, a cool rim behind right
  function makeEnv(){const env=new THREE.Scene(),pm=new THREE.PMREMGenerator(renderer),old=scene.environment;
    env.add(new THREE.Mesh(new THREE.BoxGeometry(3000,3000,3000),new THREE.MeshBasicMaterial({color:new THREE.Color(.03,.033,.04),side:THREE.BackSide})));
    function panel(w,h,c,k,pos,look){const q=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:new THREE.Color(c).multiplyScalar(k),side:THREE.DoubleSide,toneMapped:false}));q.position.copy(pos);q.lookAt(look);env.add(q);}
    panel(1800,1200,0xffffff,2.2,V3(0,1400,200),V3(0,0,0));panel(1500,1100,0xF4F6F8,.42,V3(500,350,1400),V3(0,0,0));panel(620,1200,0xC9A24C,3.4,V3(-1400,260,420),V3(0,0,0));
    panel(700,1100,0xBFD2EA,1.8,V3(1150,300,-1050),V3(0,0,0));panel(2000,500,0xffffff,.18,V3(0,-900,700),V3(0,0,0));panel(2800,1300,0xE9EDF2,.5,V3(-500,520,-1400),V3(0,120,0));panel(1100,1300,0xE9EDF2,.3,V3(1400,420,300),V3(0,100,0));
    scene.environment=pm.fromScene(env,.02,1,6000).texture;pm.dispose();if(old)old.dispose();env.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material)o.material.dispose();});}
  makeEnv();
  const key=new THREE.DirectionalLight(0xFFE7B8,1.5);key.position.set(-500,700,400);const rim=new THREE.DirectionalLight(0xBFD2EA,.9);rim.position.set(600,300,-700);scene.add(key,rim,new THREE.HemisphereLight(0xffffff,0x1b1d22,.3));
  const model=new THREE.Group();scene.add(model);const DIMS=def.build(model);
  const mkS=(n,cls,par)=>{const e=document.createElementNS(NS,n);if(cls)e.setAttribute('class',cls);par.appendChild(e);return e;};
  DIMS.forEach(d=>{d.el=document.createElement('span');d.el.className='m-d';d.el.textContent=d.t;bal.appendChild(d.el);
    d.g=mkS('g','',lead);d.e1=mkS('line','e',d.g);d.e2=mkS('line','e',d.g);d.m=mkS('line','m',d.g);d.h1=mkS('polygon','',d.g);d.h2=mkS('polygon','',d.g);});
  const v={vis:false,dirty:true,gone:false,auto:!still,yaw:.6,elU:0,dimOn:false,draw};viewers.push(v);
  let W=1,Hh=1,dist=100;const tanV=Math.tan(28*PI/360);
  function size(){W=box.clientWidth;Hh=box.clientHeight;if(!(W>0&&Hh>0))return;renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.setSize(W,Hh,false);camera.aspect=W/Hh;camera.updateProjectionMatrix();
    lead.setAttribute('viewBox','0 0 '+W+' '+Hh);dist=def.R/tanV/Math.min(1,W/Hh)*1.04;v.dirty=true;kick();}
  const right=V3(0,0,0),dA=V3(0,0,0),dB=V3(0,0,0),dO=V3(0,0,0),dP=V3(0,0,0);
  function draw(){model.rotation.y=v.yaw;const el=.38+v.elU;camera.position.set(0,def.c+dist*Math.sin(el),dist*Math.cos(el));camera.lookAt(0,def.c,0);
    renderer.render(scene,camera);camera.updateMatrixWorld();model.updateMatrixWorld(true);right.setFromMatrixColumn(camera.matrixWorld,0);dims();}
  // js/motion.js's dims(), with the one-size figure (11px mono) and this box's edges
  function dims(){
    const scr=p=>{dP.copy(p).project(camera);return [(dP.x+1)/2*W,(1-dP.y)/2*Hh];},f=x=>x.toFixed(1);
    const set=(l,p,q)=>{l.setAttribute('x1',f(p[0]));l.setAttribute('y1',f(p[1]));l.setAttribute('x2',f(q[0]));l.setAttribute('y2',f(q[1]));};
    const cw=6.8,lh=20,put=[];
    DIMS.forEach(d=>{
      const off=()=>{d.el.classList.remove('on');d.g.classList.remove('on');};
      if(!v.dimOn)return off();
      if(d.r){dO.copy(d.c);d.obj.localToWorld(dO);dA.copy(dO).addScaledVector(right,-d.r);dB.copy(dO).addScaledVector(right,d.r);}
      else{dA.copy(d.a);d.obj.localToWorld(dA);dB.copy(d.b);d.obj.localToWorld(dB);}
      let a0=scr(dA),b0=scr(dB);
      if(d.od){if(d.o==='r')dO.copy(right);else if(d.o==='w')dO.copy(d.ov);else dO.copy(d.ov).transformDirection(d.obj.matrixWorld);dA.addScaledVector(dO,d.od);dB.addScaledVector(dO,d.od);}
      let a=scr(dA),b=scr(dB);
      if(d.s<0&&d.r){let t=a;a=b;b=t;t=a0;a0=b0;b0=t;}
      const dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy);
      if(len<9)return off(); // seen end on
      const tx=dx/len,ty=dy/len,w=d.t.length*cw+14,along=Math.abs(tx)*w+Math.abs(ty)*lh;
      let lx,ly;const out=len<30;
      const beside=!(d.r&&!d.od)&&(Math.abs(ty)>.6||len>=along+22);
      if(beside){let nx=-ty,ny=tx;const px=d.od?a[0]-a0[0]:d.s,py=d.od?a[1]-a0[1]:-.2;if(nx*px+ny*py<0){nx=-nx;ny=-ny;}
        const k=(Math.abs(nx)*w+Math.abs(ny)*lh)/2+5;lx=(a[0]+b[0])/2+nx*k;ly=(a[1]+b[1])/2+ny*k;}
      else{const k=along/2+(out?15:7);lx=b[0]+tx*k;ly=b[1]+ty*k;}
      lx=Math.min(Math.max(lx,w/2+4),W-w/2-4);
      put.forEach(q=>{if(Math.abs(q[0]-lx)<(q[2]+w)/2+2&&Math.abs(q[1]-ly)<lh)ly=q[1]+lh;});put.push([lx,ly,w]);
      if(ly<14||ly>Hh-14)return off();
      if(d.od){set(d.e1,a0,[a[0]+(a[0]-a0[0])*.12,a[1]+(a[1]-a0[1])*.12]);set(d.e2,b0,[b[0]+(b[0]-b0[0])*.12,b[1]+(b[1]-b0[1])*.12]);}
      else{set(d.e1,a,a);set(d.e2,b,b);}
      const e=out?10:0;set(d.m,[a[0]-tx*e,a[1]-ty*e],[b[0]+tx*e+(beside?0:tx*5),b[1]+ty*e+(beside?0:ty*5)]);
      const tri=(p,ux,uy)=>f(p[0])+','+f(p[1])+' '+f(p[0]-ux*7-uy*2.4)+','+f(p[1]-uy*7+ux*2.4)+' '+f(p[0]-ux*7+uy*2.4)+','+f(p[1]-uy*7-ux*2.4);
      const sg=out?1:-1;d.h1.setAttribute('points',tri(a,tx*sg,ty*sg));d.h2.setAttribute('points',tri(b,-tx*sg,-ty*sg));
      d.el.style.transform='translate('+f(lx)+'px,'+f(ly)+'px) translate(-50%,-50%)';d.el.classList.add('on');d.g.classList.add('on');});}
  // the Dimensions button: the figures arrive one after another
  let dimT=0;btn.addEventListener('click',()=>{v.dimOn=!v.dimOn;btn.setAttribute('aria-pressed',String(v.dimOn));
    DIMS.forEach((d,i)=>{d.el.style.transitionDelay=d.g.style.transitionDelay=v.dimOn?(i*45)+'ms':'0ms';});
    clearTimeout(dimT);if(v.dimOn)dimT=setTimeout(()=>DIMS.forEach(d=>{d.el.style.transitionDelay=d.g.style.transitionDelay='0ms';}),1200);v.dirty=true;kick();});
  // turning it by hand: drag, or the left and right arrow keys. The first touch ends the slow turn
  let dg=null;
  function aria(){const d=Math.round(((v.yaw*180/PI)%360+360)%360);grab.setAttribute('aria-valuenow',String(d));grab.setAttribute('aria-valuetext',d+' degrees');}
  grab.addEventListener('pointerdown',e=>{if(e.button)return;v.auto=false;dg={id:e.pointerId,x:e.clientX,y:e.clientY,yaw:v.yaw,el:v.elU};grab.classList.add('on');try{grab.setPointerCapture(e.pointerId);}catch(_){}});
  grab.addEventListener('pointermove',e=>{if(!dg||e.pointerId!==dg.id)return;v.yaw=dg.yaw+(e.clientX-dg.x)*.009;v.elU=clamp(dg.el+(e.clientY-dg.y)*.004,-.28,.5);v.dirty=true;kick();});
  const drop=e=>{if(!dg||(e&&e.pointerId!==dg.id))return;dg=null;grab.classList.remove('on');aria();};
  grab.addEventListener('pointerup',drop);grab.addEventListener('pointercancel',drop);grab.addEventListener('lostpointercapture',drop);
  grab.addEventListener('keydown',e=>{const k=e.key;if(k!=='ArrowLeft'&&k!=='ArrowRight')return;e.preventDefault();v.auto=false;v.yaw+=(k==='ArrowLeft'?-1:1)*PI/12;aria();v.dirty=true;kick();});
  // the WebGL context can be taken away (a phone switching apps); Three.js rebuilds what it drew when it is back, the reflections are redrawn here
  cv.addEventListener('webglcontextlost',e=>{e.preventDefault();v.gone=true;});
  cv.addEventListener('webglcontextrestored',()=>{makeEnv();v.gone=false;v.dirty=true;kick();});
  if('ResizeObserver' in window)new ResizeObserver(size).observe(box);else{size();addEventListener('resize',size);}
  if('IntersectionObserver' in window)new IntersectionObserver(e=>{v.vis=e[e.length-1].isIntersecting;if(v.vis)kick();},{rootMargin:'120px 0px'}).observe(box);else v.vis=true;
  size();card.classList.add('on');}

/* ---------- one frame for every card that is on screen, and only while one is turning or has changed ---------- */
let raf=0,last=0;
function kick(){if(!raf)raf=requestAnimationFrame(tick);}
function tick(t){raf=0;const dt=Math.min((t-(last||t))/1000,.05);last=t;let more=false;
  viewers.forEach(v=>{if(!v.vis||v.gone)return;if(v.auto){v.yaw+=dt*2*PI/24;v.dirty=true;more=true;}if(v.dirty){v.draw();v.dirty=false;}});
  if(more)kick();else last=0;}
document.addEventListener('visibilitychange',()=>{if(!document.hidden)kick();});

document.querySelectorAll('.m-card[data-model]').forEach(card=>{try{viewer(card);}catch(e){card.classList.add('off');console.warn('models: '+(card.dataset.model)+' could not start',e);}});
})();
