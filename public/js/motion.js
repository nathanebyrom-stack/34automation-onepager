// 05 In motion (Nathan, 15 Nov 2026): the 34A-0107 four-way valve from the page's drawing sheet, in 3D, driven by scroll. Plan of record: docs/valve-motion-plan.md.
// Fetched by js/site.js once #motion is near, and only where it will run: motion allowed, a connection worth it, WebGL 2 present. It draws only while the section is pinned (.scrub).
// Every pose is a pure function of p, the scroll progress through the section's track, so scrolling back up runs it all backwards:
//   p 0.00-0.08  Section A-A lies on the sheet in pencil.
//   p 0.06-0.16  The section lifts off the paper; its hatched faces come up with it.
//   p 0.16-0.42  Each branch's section sweeps round its own axis into a solid, the housing rises out of the section plane, the bonnet boss grows. Dark solid turns to 316 steel.
//   p 0.40-0.56  The internals come down into the body in assembly order: seats, ball, stem, bonnet, bonnet bolts, packing, gland nut, lever, flange bolts.
//   p 0.60-0.84  It comes apart in the reverse order, each part by a path it could really take (top entry); balloons and parts-list rows appear as each part clears.
//   p 0.86-1.00  Hold: drag to turn, and the call to action.
// Dimensions are the drawing's (js/sheet.js, 4 drawing units = 1 mm): bore Ø50, flange Ø120 x 14 with a 2 mm raised face, neck Ø80, hub Ø102.5, face to face 244, ball SØ76, holes 4x Ø9 on PCD 100.
// Once the scene is built the section gets .v3d (js/site.js waits for that). If it cannot start, or its WebGL context is lost and does not come back,
// it sends 'valve-lost' on the section and js/site.js goes back to the plain band with the still.
// Three.js here is a tree-shaken copy: it holds only the classes this file uses. Use a new one and scripts/vendor-three.mjs must be run again.
import * as THREE from './vendor/three-r186/three.min.js?h=f99759f476';

(function(){
const $=id=>document.getElementById(id);
const sec=$('motion'),track=$('vTrack'),pin=$('vPin'),cv=$('vCan');
if(!sec||!track||!pin||!cv)return;
let dead=false,renderer=null;
function lost(){if(dead)return;dead=true;pin.classList.remove('live');sec.classList.remove('v3d');try{if(renderer)renderer.dispose();}catch(e){}sec.dispatchEvent(new Event('valve-lost'));}
try{

const PI=Math.PI,H=PI/2,clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x)),seg=(p,a,b)=>clamp((p-a)/(b-a)),lerp=(a,b,t)=>a+(b-a)*t;
const ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2,smooth=t=>t*t*(3-2*t);
const V3=(x,y,z)=>new THREE.Vector3(x,y,z);

/* ---------- renderer, scene, light ---------- */
renderer=new THREE.WebGLRenderer({canvas:cv,antialias:true,alpha:true,powerPreference:'high-performance'});
renderer.setClearColor(0x000000,0);
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
renderer.outputColorSpace=THREE.SRGBColorSpace;
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(28,1,10,9000);
// what the steel reflects: a dim room with big soft cards all round, as steel is photographed. Flat tops reflect the far wall, so that wall is lit too.
// One gold work light on the left, a cool rim behind right.
// The capture's far plane must reach past the room (it is 3000 across): the default, 100, sees none of it and the steel reflects nothing.
function makeEnv(){const env=new THREE.Scene(),pm=new THREE.PMREMGenerator(renderer),old=scene.environment;
  env.add(new THREE.Mesh(new THREE.BoxGeometry(3000,3000,3000),new THREE.MeshBasicMaterial({color:new THREE.Color(.03,.033,.04),side:THREE.BackSide})));
  function panel(w,h,c,k,pos,look){const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:new THREE.Color(c).multiplyScalar(k),side:THREE.DoubleSide,toneMapped:false}));m.position.copy(pos);m.lookAt(look);env.add(m);}
  panel(1800,1200,0xffffff,2.2,V3(0,1400,200),V3(0,0,0));        // soft box overhead
  panel(1500,1100,0xF4F6F8,.42,V3(500,350,1400),V3(0,0,0));      // fill, behind the camera
  panel(620,1200,0xC9A24C,3.4,V3(-1400,260,420),V3(0,0,0));      // the gold work light, left
  panel(700,1100,0xBFD2EA,1.8,V3(1150,300,-1050),V3(0,0,0));     // cool rim, behind right
  panel(2000,500,0xffffff,.18,V3(0,-900,700),V3(0,0,0));         // a little bounce off the bench
  panel(2800,1300,0xE9EDF2,.5,V3(-500,520,-1400),V3(0,120,0));   // the far wall: what flat tops reflect
  panel(1100,1300,0xE9EDF2,.3,V3(1400,420,300),V3(0,100,0));
  scene.environment=pm.fromScene(env,.02,1,6000).texture;pm.dispose();if(old)old.dispose();
  env.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material)o.material.dispose();});}
makeEnv();
const key=new THREE.DirectionalLight(0xFFE7B8,1.5);key.position.set(-500,700,400);scene.add(key);
const rim=new THREE.DirectionalLight(0xBFD2EA,.9);rim.position.set(600,300,-700);scene.add(rim);
scene.add(new THREE.HemisphereLight(0xffffff,0x1b1d22,.3));

/* ---------- materials ---------- */
const DARK=new THREE.Color(0x24272c),STEEL=new THREE.Color(0xd2d6db);
const mk=(o)=>new THREE.MeshStandardMaterial(Object.assign({color:0xd8dce1,metalness:1,roughness:.36},o));
const bodyMat=mk({side:THREE.DoubleSide});
const pencil=0xE4E7EB,gold=0xC9A24C;
// the cut faces carry the drawing's own hatch: lines X+Z = const, 5 mm apart, in step with the pencil hatch on the sheet (sheet.js: step 20√2 units, offset 7.37)
function hatchTex(){const c=document.createElement('canvas');c.width=64;c.height=8;const g=c.getContext('2d');g.fillStyle='#17191d';g.fillRect(0,0,64,8);g.fillStyle='rgba(228,231,235,.62)';g.fillRect(0,0,2.5,8);g.fillRect(61.5,0,2.5,8);
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t;}
function hatchUV(geo,toXZ){const p=geo.attributes.position,uv=new Float32Array(p.count*2);for(let i=0;i<p.count;i++){const [X,Z]=toXZ(p.getX(i),p.getY(i));uv[i*2]=(X+Z-1.8425)/7.0711;uv[i*2+1]=(X-Z)/7.0711;}geo.setAttribute('uv',new THREE.BufferAttribute(uv,2));return geo;}
const capMat=new THREE.MeshBasicMaterial({map:hatchTex(),side:THREE.DoubleSide,transparent:true,opacity:0,toneMapped:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
const edgeMat=new THREE.LineBasicMaterial({color:pencil,transparent:true,opacity:.85,toneMapped:false});

/* ---------- geometry helpers ---------- */
// a profile (r, a) turned about the local Y axis from phi0 through dphi. Triangles are written in order of angle, so drawRange reveals the sweep as it turns
function revolve(prof,phi0,dphi,segs){
  let A=0;for(let j=0;j<prof.length;j++){const p=prof[j],q=prof[(j+1)%prof.length];A+=p[0]*q[1]-q[0]*p[1];}
  const P=A<0?prof.slice().reverse():prof,n=P.length,pos=[],nor=[],idx=[];
  for(let j=0;j<n;j++){const a=P[j],b=P[(j+1)%n],dr=b[0]-a[0],da=b[1]-a[1],L=Math.hypot(dr,da)||1,nr=da/L,na=-dr/L;
    for(let i=0;i<=segs;i++){const f=phi0+dphi*i/segs,s=Math.sin(f),c=Math.cos(f);pos.push(a[0]*s,a[1],a[0]*c,b[0]*s,b[1],b[0]*c);nor.push(nr*s,na,nr*c,nr*s,na,nr*c);}}
  const v=(j,i,k)=>(j*(segs+1)+i)*2+k,flip=dphi<0;
  for(let i=0;i<segs;i++)for(let j=0;j<n;j++){const a=v(j,i,0),b=v(j,i,1),c=v(j,i+1,0),d=v(j,i+1,1);if(flip)idx.push(a,b,c,b,d,c);else idx.push(a,c,b,b,c,d);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));g.setIndex(idx);
  g.userData.perStep=n*6;return g;}
// pencil circles at the profile's corners, drawn round with the sweep
function corners(prof,skip){const out=[],n=prof.length;for(let j=0;j<n;j++){if(skip&&skip.includes(j))continue;const a=prof[(j+n-1)%n],b=prof[j],c=prof[(j+1)%n];
  const u=[b[0]-a[0],b[1]-a[1]],w=[c[0]-b[0],c[1]-b[1]],t=Math.abs(Math.atan2(u[0]*w[1]-u[1]*w[0],u[0]*w[0]+u[1]*w[1]));if(t>.4&&b[0]>.5)out.push(b);}return out;}
function arcLine(r,a,phi0,dphi,segs){const p=[];for(let i=0;i<=segs;i++){const f=phi0+dphi*i/segs;p.push(r*Math.sin(f),a,r*Math.cos(f));}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));return g;}
function shapeOf(prof){const s=new THREE.Shape();prof.forEach((p,i)=>i?s.lineTo(p[0],p[1]):s.moveTo(p[0],p[1]));s.closePath();return s;}
function turned(prof,mat,segs=72){return new THREE.Mesh(revolve(prof,0,2*PI,segs),mat);}
function cutSphere(R,ws,hs,holes){ // a sphere with round holes cut where its surface lies within an angle of the given directions
  const g=new THREE.SphereGeometry(R,ws,hs).toNonIndexed(),p=g.attributes.position.array,keepU=[],keepL=[];
  for(let t=0;t<p.length;t+=9){const cx=(p[t]+p[t+3]+p[t+6])/3,cy=(p[t+1]+p[t+4]+p[t+7])/3,cz=(p[t+2]+p[t+5]+p[t+8])/3,L=Math.hypot(cx,cy,cz);let cut=false;
    for(const h of holes){if((cx*h[0]+cy*h[1]+cz*h[2])/L>Math.cos(h[3])){cut=true;break;}}
    if(!cut)(cy>=0?keepU:keepL).push(t);}
  const build=keep=>{const q=new Float32Array(keep.length*9);keep.forEach((t,i)=>q.set(p.subarray(t,t+9),i*9));const b=new THREE.BufferGeometry();b.setAttribute('position',new THREE.BufferAttribute(q,3));
    const nn=new Float32Array(q.length);for(let i=0;i<q.length;i+=3){const L=Math.hypot(q[i],q[i+1],q[i+2]);nn[i]=q[i]/L;nn[i+1]=q[i+1]/L;nn[i+2]=q[i+2]/L;}b.setAttribute('normal',new THREE.BufferAttribute(nn,3));return b;};
  return {upper:build(keepU),lower:build(keepL)};}
const UP=V3(0,1,0);
function alongAxis(obj,dir){obj.quaternion.setFromUnitVectors(UP,dir.clone().normalize());}

/* ---------- the model ---------- */
const model=new THREE.Group();scene.add(model);
const DIRS=[V3(1,0,0),V3(-1,0,0),V3(0,0,1),V3(0,0,-1)];
// one branch's half-section, (radius, distance from centre) in mm, read off the drawing (sheet.js P, Q, R). The last point closes the section inside the housing.
const fil=[];for(let t=-90;t>=-180;t-=18){const r=t*PI/180;fil.push([(170+10*Math.cos(r))/4,(414-10*Math.sin(r))/4]);}
const BR=[[25,38.5],[25,122],[42,122],[42,120],[60,120],[60,106],...fil,[40,85],[51.25,85],[51.25,75]];
const BR_SKIP=[0]; // no pencil circle where the section closes inside the housing
const QUARTERS=[[0,H],[0,-H],[PI,-H],[PI,H]],SEGS=30;
const branches=[];
DIRS.forEach(d=>{
  const g=new THREE.Group(),z=new THREE.Vector3().crossVectors(UP,d);
  g.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(UP,d,z));model.add(g);
  const sweeps=QUARTERS.map(([f0,df])=>{
    const geo=revolve(BR,f0,df,SEGS),mesh=new THREE.Mesh(geo,bodyMat);geo.setDrawRange(0,0);g.add(mesh);
    const cf=Math.cos(f0),cap=new THREE.Mesh(hatchUV(new THREE.ShapeGeometry(shapeOf(BR)),(r,a)=>[d.x*a+z.x*r*cf,d.z*a+z.z*r*cf]),capMat);g.add(cap);
    const lines=corners(BR,BR_SKIP).map(([r,a])=>{const l=new THREE.Line(arcLine(r,a,f0,df,SEGS),edgeMat);l.geometry.setDrawRange(0,0);g.add(l);return l;});
    return {mesh,cap,lines,f0,df};});
  branches.push({g,sweeps});
});
// the housing: a sphere through the hub ends (R 90.8 mm sits within 1.6 mm of the drawing's 45° shoulders), open where the bores and the bonnet come in
const RH=Math.hypot(75,51.25),asinA=r=>Math.asin(r/RH);
const sph=cutSphere(RH,96,64,[[0,1,0,asinA(40)],[1,0,0,asinA(25)],[-1,0,0,asinA(25)],[0,0,1,asinA(25)],[0,0,-1,asinA(25)]]);
const hsU=new THREE.Mesh(sph.upper,bodyMat),hsL=new THREE.Mesh(sph.lower,bodyMat);model.add(hsU,hsL);
// the housing's own section, four hatched walls between the bores, flat in the section plane until the housing rises out of it
const eqPieces=new THREE.Group();eqPieces.rotation.x=-H;eqPieces.position.y=-.3;model.add(eqPieces);
(()=>{const Ri=Math.sqrt(38.5*38.5-625),pts=[];
  const a0=Math.asin(25/RH),a1=H-a0;for(let i=0;i<=12;i++){const t=a0+(a1-a0)*i/12;pts.push([RH*Math.cos(t),RH*Math.sin(t)]);}
  pts.push([25,Ri]);const c0=Math.atan2(Ri,25),c1=Math.atan2(25,Ri);for(let i=1;i<6;i++){const t=c0+(c1-c0)*i/6;pts.push([38.5*Math.cos(t),38.5*Math.sin(t)]);}pts.push([Ri,25]);
  for(let q=0;q<4;q++){const c=Math.cos(q*H),s=Math.sin(q*H);eqPieces.add(new THREE.Mesh(hatchUV(new THREE.ShapeGeometry(shapeOf(pts.map(([x,y])=>[x*c-y*s,x*s+y*c]))),(x,y)=>[x,-y]),capMat));}})();
// the bonnet boss on top of the housing, grows up out of it
const boss=new THREE.Group();boss.position.y=60;model.add(boss);
boss.add(turned([[40,0],[40,40],[60,40],[60,0]],bodyMat,96));
[[40,40],[60,40]].forEach(([r,a])=>boss.add(new THREE.Line(arcLine(r,a,0,2*PI,96),edgeMat)));
const holeMat=new THREE.MeshStandardMaterial({color:0x0b0c0e,metalness:.2,roughness:.8});
const BOLT_TH=[45,135,225,315].map(a=>a*PI/180);
BOLT_TH.forEach(t=>{const h=new THREE.Mesh(new THREE.CircleGeometry(4,20),holeMat);h.rotation.x=-H;h.position.set(50*Math.cos(t),40.08,50*Math.sin(t));boss.add(h);});

// moving parts: each a group at its assembled position, with its own material so it can fade on its way in
function partMat(o){return mk(Object.assign({transparent:true,opacity:1},o));}
const parts={};
function part(id,mat){const g=new THREE.Group();g.userData.mats=[mat];model.add(g);parts[id]=g;return g;}
// 02 ball, L-port facing +X and +Z
{const m=partMat({side:THREE.DoubleSide}),g=part('ball',m),R=38,a=Math.asin(25/R),rim=Math.sqrt(R*R-625); // rim: how far out along a port its edge lies (28.6)
  const s=cutSphere(R,144,96,[[1,0,0,a],[0,0,1,a]]);g.add(new THREE.Mesh(s.upper,m),new THREE.Mesh(s.lower,m));
  const pm=partMat({color:0x8d939b,roughness:.45,side:THREE.DoubleSide});g.userData.mats.push(pm);
  const tube=new THREE.CylinderGeometry(25,25,rim,48,1,true);
  const tx=new THREE.Mesh(tube,pm);tx.rotation.z=H;tx.position.x=rim/2;const tz=new THREE.Mesh(tube,pm);tz.rotation.x=H;tz.position.z=rim/2;g.add(tx,tz);
  [V3(1,0,0),V3(0,0,1)].forEach(d=>{const lip=turned([[23.8,rim-1.6],[26.5,rim-1.6],[26.5,rim+.5],[23.8,rim+.5]],m,64);alongAxis(lip,d);g.add(lip);}); // a turned lip round each port
  const slot=new THREE.Mesh(new THREE.BoxGeometry(7,6,30),holeMat);slot.position.y=R-1.5;g.add(slot);}
// 03 seat rings, one in each port, pressed against the ball
const SEAT=[[23,0],[31,0],[31,8],[23,8]];
const seats=DIRS.map((d,i)=>{const m=partMat({color:0xebe8e1,metalness:0,roughness:.55}),g=part('seat'+i,m),inner=new THREE.Group();
  inner.add(turned(SEAT,m,64));alongAxis(inner,d);inner.position.copy(d).multiplyScalar(30);g.add(inner);g.userData.dir=d;g.userData.inner=inner;g.userData.w=[.58+i*.06,.76+i*.06];return g;});
// 04 stem
{const m=partMat({color:0xbfc4ca,roughness:.34}),g=part('stem',m);
  const c=new THREE.Mesh(new THREE.CylinderGeometry(9,9,126,40),m);c.position.y=93;g.add(c);
  const sq=new THREE.Mesh(new THREE.BoxGeometry(12,14,12),m);sq.position.y=163;g.add(sq);
  const tang=new THREE.Mesh(new THREE.BoxGeometry(6,10,24),m);tang.position.y=31;g.add(tang);}
// 09 bonnet: spigot into the body, flange, stuffing box
{const m=partMat({}),g=part('bonnet',m);
  g.add(turned([[9.5,88],[39.6,88],[39.6,100],[60,100],[60,114],[22,114],[22,140],[16,140],[16,118],[9.5,118]],m,96));
  BOLT_TH.forEach(t=>{const h=new THREE.Mesh(new THREE.CircleGeometry(4.5,20),holeMat);h.rotation.x=-H;h.position.set(50*Math.cos(t),114.08,50*Math.sin(t));g.add(h);});}
// 10 bonnet bolts, 08 flange bolts: M8 hex head (13 AF) and shank
const hexG=new THREE.CylinderGeometry(7.5,7.5,5.3,6),shankG=new THREE.CylinderGeometry(4,4,1,16);
function bolt(m,len){const b=new THREE.Group(),h=new THREE.Mesh(hexG,m);h.position.y=2.65;const s=new THREE.Mesh(shankG,m);s.scale.y=len;s.position.y=-len/2;b.add(h,s);return b;}
const bBolts=BOLT_TH.map((t,i)=>{const m=partMat({roughness:.4}),g=part('bb'+i,m),b=bolt(m,30);b.position.set(50*Math.cos(t),114,50*Math.sin(t));g.add(b);return g;});
const fBolts=[];DIRS.forEach((d,bi)=>{const z=new THREE.Vector3().crossVectors(UP,d);
  BOLT_TH.forEach((t,k)=>{const m=partMat({roughness:.4}),g=part('fb'+bi+'_'+k,m),b=bolt(m,20);
    b.position.copy(d).multiplyScalar(120).addScaledVector(UP,50*Math.sin(t)).addScaledVector(z,50*Math.cos(t));alongAxis(b,d);g.add(b);g.userData.dir=d;g.userData.w=[.02+bi*.05+k*.012,.30+bi*.05+k*.012];fBolts.push(g);});});
// 05 gland packing: three PTFE rings in the stuffing box
const packs=[0,1,2].map(k=>{const m=partMat({color:0xebe8e1,metalness:0,roughness:.6}),g=part('pk'+k,m);g.add(turned([[9.5,0],[16,0],[16,5.4],[9.5,5.4]],m,48));g.children[0].position.y=118.4+k*6;return g;});
// 06 gland nut
{const m=partMat({}),g=part('nut',m),n=new THREE.Mesh(new THREE.CylinderGeometry(21,21,12,6),m);n.position.y=146;g.add(n);
  const top=new THREE.Mesh(new THREE.CircleGeometry(9.6,24),holeMat);top.rotation.x=-H;top.position.y=152.05;g.add(top);}
// 07 lever, along the diagonal between two branches
{const m=partMat({}),g=part('lever',m),L=new THREE.Group();L.rotation.y=-135*PI/180;g.add(L);
  const hub=new THREE.Mesh(new THREE.BoxGeometry(30,12,30),m);hub.position.y=164;L.add(hub);
  const bar=new THREE.Mesh(new THREE.BoxGeometry(150,6,22),m);bar.position.set(88,166,0);L.add(bar);
  const gm=partMat({color:0x1a1b1e,metalness:0,roughness:.62});g.userData.mats.push(gm);
  const grip=new THREE.Mesh(new THREE.CylinderGeometry(10,10,52,24),gm);grip.rotation.z=H;grip.position.set(136,166,0);L.add(grip);
  const tip=new THREE.Object3D();tip.position.set(160,166,0);L.add(tip);g.userData.tip=tip;}
// when each part leaves, as fractions of the explode (0 together .. 1 apart), and how far up the stem axis it goes
const W_={lever:[0,.2],nut:[.06,.26],pk:[.12,.32],bb:[.18,.36],bonnet:[.26,.46],stem:[.36,.54],ball:[.46,.64]};
const LIFT={lever:462,nut:430,bb:402,bonnet:340,stem:255,ball:232};
parts.lever.userData.w=W_.lever;parts.nut.userData.w=W_.nut;parts.bonnet.userData.w=W_.bonnet;parts.stem.userData.w=W_.stem;parts.ball.userData.w=W_.ball;
packs.forEach(g=>g.userData.w=W_.pk);bBolts.forEach(g=>g.userData.w=W_.bb);
const allParts=[parts.ball,...seats,parts.stem,parts.bonnet,...bBolts,...fBolts,...packs,parts.nut,parts.lever];

/* ---------- the drawing: Section A-A as on the sheet, in pencil; centre lines in gold. It rides in the section plane ---------- */
const dwg=new THREE.Group();dwg.position.y=.25;model.add(dwg);
(()=>{
  const P=[[100,-488],[168,-488],[168,-480],[240,-480],[240,-424],[170,-424]],Q=[[160,-414],[160,-340],[205,-340],[205,-300],[300,-205],[340,-205],[340,-160],[414,-160]],
        R=[[424,-170],[424,-240],[480,-240],[480,-168],[488,-168],[488,-100]],QS=[[1,1],[1,-1],[-1,-1],[-1,1]];
  const arc=(cx,cy,r,a0,a1,n)=>{const o=[];for(let i=0;i<=n;i++){const t=(a0+(a1-a0)*i/n)*PI/180;o.push([cx+r*Math.cos(t),cy+r*Math.sin(t)]);}return o;};
  const runs=[P,arc(170,-414,10,-90,-180,5),Q,arc(414,-170,10,90,0,5),R];
  const ink=[],hatch=[],cl=[],put=(arr,a,b)=>arr.push(a[0]/4,0,a[1]/4,b[0]/4,0,b[1]/4);
  for(let q=0;q<4;q++)runs.forEach(r=>{for(let i=0;i<r.length-1;i++)put(ink,[QS[q][0]*r[i][0],QS[q][1]*r[i][1]],[QS[q][0]*r[i+1][0],QS[q][1]*r[i+1][1]]);});
  [[488,-100,488,100],[-488,-100,-488,100],[-100,-488,100,-488],[-100,488,100,488]].forEach(s=>put(ink,[s[0],s[1]],[s[2],s[3]]));
  const rot=(p,k)=>k===0?p:k===1?[-p[1],p[0]]:k===2?[-p[0],-p[1]]:[p[1],-p[0]];
  for(let k=0;k<4;k++)for(const s of [1,-1]){put(ink,rot([s*100,-488],k),rot([s*100,-114.5],k));put(cl,rot([s*200,-496],k),rot([s*200,-416],k));}
  for(let i=0;i<96;i++){const a=i/96*2*PI,b=(i+1)/96*2*PI;put(ink,[152*Math.cos(a),152*Math.sin(a)],[152*Math.cos(b),152*Math.sin(b)]);}
  put(cl,[-522,0],[522,0]);put(cl,[0,-522],[0,522]);
  const polyNE=[[100,-488],[168,-488],[168,-480],[240,-480],[240,-424],[160,-424],[160,-340],[205,-340],[205,-300],[300,-205],[340,-205],[340,-160],[424,-160],[424,-240],[480,-240],[480,-168],[488,-168],[488,-100],[114.5,-100],[100,-114.5]];
  for(let q=0;q<4;q++){const poly=polyNE.map(p=>[QS[q][0]*p[0],QS[q][1]*p[1]]),step=20*Math.SQRT2,OFF=7.37,cs=poly.map(p=>p[0]+p[1]),c0=Math.min(...cs),c1=Math.max(...cs);
    for(let c=Math.ceil((c0-OFF)/step)*step+OFF;c<c1;c+=step){const xs=[];for(let n=0;n<poly.length;n++){const a=poly[n],b=poly[(n+1)%poly.length],sa=a[0]+a[1]-c,sb=b[0]+b[1]-c;if((sa>0)!==(sb>0)){const t=sa/(sa-sb);xs.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]);}}
      xs.sort((m,n)=>m[0]-n[0]);for(let j=0;j+1<xs.length;j+=2)if(Math.hypot(xs[j+1][0]-xs[j][0],xs[j+1][1]-xs[j][1])>3)put(hatch,xs[j],xs[j+1]);}}
  const LS=(arr,mat)=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(arr,3));const l=new THREE.LineSegments(g,mat);dwg.add(l);return l;};
  dwg.userData.ink=LS(ink,new THREE.LineBasicMaterial({color:pencil,transparent:true,opacity:.9,toneMapped:false}));
  dwg.userData.hatch=LS(hatch,new THREE.LineBasicMaterial({color:pencil,transparent:true,opacity:.34,toneMapped:false}));
  const c=LS(cl,new THREE.LineDashedMaterial({color:gold,dashSize:6,gapSize:2.4,transparent:true,opacity:.75,toneMapped:false}));c.computeLineDistances();dwg.userData.cl=c;
})();
// gold chain lines along the axes the parts leave by, shown while it is apart
const axisMat=new THREE.LineDashedMaterial({color:gold,dashSize:7,gapSize:3,transparent:true,opacity:0,toneMapped:false});
{const a=[0,96,0,0,700,0];DIRS.forEach(d=>a.push(d.x*124,0,d.z*124,d.x*230,0,d.z*230));const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(a,3));const l=new THREE.LineSegments(g,axisMat);l.computeLineDistances();model.add(l);}

/* ---------- the sheet it lies on, and a soft contact shadow ---------- */
const SHEET_Y=-92;
const sheetMat=new THREE.MeshBasicMaterial({color:0xffffff,toneMapped:false});
const sheet=new THREE.Mesh(new THREE.PlaneGeometry(680,481),sheetMat);sheet.rotation.x=-H;sheet.position.set(118,SHEET_Y,34);scene.add(sheet);
function drawSheet(){const W=2048,Hh=1449,k=W/680,c=document.createElement('canvas');c.width=W;c.height=Hh;const g=c.getContext('2d');
  g.fillStyle='#131418';g.fillRect(0,0,W,Hh);g.strokeStyle='rgba(228,231,235,.30)';g.fillStyle='rgba(228,231,235,.42)';g.lineWidth=2;
  const mm=v=>v*k;g.strokeRect(mm(8),mm(8),W-mm(16),Hh-mm(16));g.lineWidth=3;g.strokeRect(mm(15),mm(15),W-mm(30),Hh-mm(30));g.lineWidth=2;
  g.font='500 '+Math.round(mm(4.2))+'px "IBM Plex Mono", monospace';g.textAlign='center';g.textBaseline='middle';
  for(let i=1;i<8;i++){const x=mm(15)+(W-mm(30))*i/8;g.beginPath();g.moveTo(x,mm(8));g.lineTo(x,mm(15));g.moveTo(x,Hh-mm(8));g.lineTo(x,Hh-mm(15));g.stroke();}
  for(let i=0;i<8;i++){const x=mm(15)+(W-mm(30))*(i+.5)/8;g.fillText(String(8-i),x,mm(11.5));g.fillText(String(8-i),x,Hh-mm(11.5));}
  for(let i=0;i<4;i++){const y=mm(15)+(Hh-mm(30))*(i+.5)/4;g.fillText('DCBA'[i],mm(11.5),y);g.fillText('DCBA'[i],W-mm(11.5),y);}
  // title block, bottom right
  const tw=mm(170),th=mm(39),tx=W-mm(15)-tw,ty=Hh-mm(15)-th;g.strokeRect(tx,ty,tw,th);
  [13,26].forEach(y=>{g.beginPath();g.moveTo(tx,ty+mm(y));g.lineTo(tx+tw,ty+mm(y));g.stroke();});
  [[110,0,13],[150,0,39],[70,13,39],[115,13,39]].forEach(([x,y0,y1])=>{g.beginPath();g.moveTo(tx+mm(x),ty+mm(y0));g.lineTo(tx+mm(x),ty+mm(y1));g.stroke();});
  g.textAlign='left';const cell=(x,y,lab,val)=>{g.font='500 '+Math.round(mm(2.6))+'px "IBM Plex Mono", monospace';g.fillStyle='rgba(228,231,235,.34)';g.fillText(lab,tx+mm(x+2),ty+mm(y+3.4));
    g.font='500 '+Math.round(mm(3.9))+'px "IBM Plex Mono", monospace';g.fillStyle='rgba(228,231,235,.5)';g.fillText(val,tx+mm(x+2),ty+mm(y+8.8));};
  cell(0,0,'TITLE','4-WAY VALVE BODY · DN50');cell(110,0,'DRG NO','34A-0107');cell(150,0,'REV','C');
  cell(0,13,'MATERIAL','316L · 1.4404');cell(70,13,'FINISH','Ra 3.2');cell(115,13,'SCALE','1:1');cell(150,13,'SHEET','1/1');
  cell(0,26,'DRAWN','34 AUTOMATION');cell(70,26,'TOL.','ISO 2768-mK');cell(150,26,'SIZE','A2');
  // section label and notes, placed from the section (the sheet's centre sits at +118, +34 mm from the part's axis)
  const sx=W/2-mm(118),sy=Hh/2-mm(34);g.font='500 '+Math.round(mm(4.4))+'px "IBM Plex Mono", monospace';g.fillStyle='rgba(228,231,235,.5)';
  g.fillText('SECTION A–A',sx+mm(84),sy+mm(104));g.beginPath();g.moveTo(sx+mm(84),sy+mm(107));g.lineTo(sx+mm(115),sy+mm(107));g.stroke();
  g.font='500 '+Math.round(mm(3.2))+'px "IBM Plex Mono", monospace';g.fillText('SCALE 1:1',sx+mm(84),sy+mm(111));
  ['NOTES','1. DIMENSIONS IN MM','2. TOL. ISO 2768-mK','3. BREAK EDGES 0.2–0.5','4. TEST 24 BAR, 10 MIN'].forEach((s,i)=>{g.font='500 '+Math.round(mm(i?3.4:2.8))+'px "IBM Plex Mono", monospace';g.fillStyle='rgba(228,231,235,'+(i?.42:.32)+')';g.fillText(s,W-mm(150),mm(40)+i*mm(6));});
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=renderer.capabilities.getMaxAnisotropy();sheetMat.map=t;sheetMat.needsUpdate=true;kick();}
const shadowMat=(()=>{const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d'),r=g.createRadialGradient(128,128,0,128,128,128);r.addColorStop(0,'rgba(0,0,0,.75)');r.addColorStop(.45,'rgba(0,0,0,.35)');r.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=r;g.fillRect(0,0,256,256);
  return new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c),transparent:true,depthWrite:false,opacity:0,toneMapped:false});})();
const shadow=new THREE.Mesh(new THREE.PlaneGeometry(420,420),shadowMat);shadow.rotation.x=-H;shadow.position.y=SHEET_Y+.3;scene.add(shadow);

/* ---------- where each part is, for e: 0 assembled .. 1 apart ---------- */
function place(e){
  const le=w=>ease(seg(e,w[0],w[1]));
  parts.lever.position.y=LIFT.lever*le(W_.lever);parts.nut.position.y=LIFT.nut*le(W_.nut);
  packs.forEach((g,k)=>g.position.y=(392+k*14)*le(W_.pk));
  bBolts.forEach(g=>g.position.y=LIFT.bb*le(W_.bb));
  parts.bonnet.position.y=LIFT.bonnet*le(W_.bonnet);parts.stem.position.y=LIFT.stem*le(W_.stem);parts.ball.position.y=LIFT.ball*le(W_.ball);
  seats.forEach(g=>{const t=seg(e,g.userData.w[0],g.userData.w[1]),u1=ease(seg(t,0,.55)),u2=ease(seg(t,.55,1)),d=g.userData.dir,inner=g.userData.inner;
    // out of its pocket, up through the bonnet opening, then out to its place above the body
    const a=d.clone().multiplyScalar(30),b=d.clone().multiplyScalar(6).add(V3(0,132,0)),c=d.clone().multiplyScalar(84).add(V3(0,150,0));
    inner.position.copy(u2>0?b.lerp(c,u2):a.lerp(b,u1));});
  fBolts.forEach(g=>{g.position.copy(g.userData.dir).multiplyScalar(70*le(g.userData.w));});
}
function fade(g,o){g.visible=o>.002;g.userData.mats.forEach(m=>{m.opacity=o;const tr=o<.999;if(m.transparent!==tr){m.transparent=tr;m.needsUpdate=true;}m.depthWrite=!tr||o>.6;});}

/* ---------- balloons and the parts list ---------- */
const ITEMS=[ // item, which object, a point on it (local), its half-width, which side its balloon goes
  {n:1,name:'Valve body, 4-way DN50',mat:'316L',q:'1',obj:model,at:V3(0,10,0),r:128,side:-1},
  {n:2,name:'Ball, SØ76, L-port',mat:'316L',q:'1',obj:parts.ball,at:V3(0,0,0),r:38,side:1},
  {n:3,name:'Seat ring',mat:'PTFE',q:'4',obj:seats[0].userData.inner,at:V3(0,4,0),r:31,side:1},
  {n:4,name:'Stem',mat:'17-4PH',q:'1',obj:parts.stem,at:V3(0,96,0),r:10,side:-1},
  {n:5,name:'Gland packing',mat:'PTFE',q:'1 set',obj:packs[1],at:V3(0,127,0),r:16,side:-1},
  {n:6,name:'Gland nut',mat:'316',q:'1',obj:parts.nut,at:V3(0,146,0),r:21,side:1},
  {n:7,name:'Lever handle',mat:'316',q:'1',obj:parts.lever.userData.tip,at:V3(0,0,0),r:4,side:-1},
  {n:8,name:'Flange bolt M8',mat:'A4-70',q:'16',obj:fBolts[1].children[0],at:V3(0,-8,0),r:6,side:1},
  {n:9,name:'Bonnet',mat:'316L',q:'1',obj:parts.bonnet,at:V3(0,108,0),r:60,side:1},
  {n:10,name:'Bonnet bolt M8',mat:'A4-70',q:'4',obj:bBolts[1].children[0],at:V3(0,-12,0),r:6,side:-1}];
const NS='http://www.w3.org/2000/svg',lead=$('vLead'),bal=$('vBal'),rows=[].slice.call(document.querySelectorAll('#vRows tr')),cap=$('vCap');
ITEMS.forEach(it=>{it.b=document.createElement('span');it.b.className='v-b';it.b.textContent=String(it.n).padStart(2,'0');bal.appendChild(it.b);
  it.g=document.createElementNS(NS,'g');it.l=document.createElementNS(NS,'line');it.d=document.createElementNS(NS,'circle');it.d.setAttribute('r','2.2');it.g.append(it.l,it.d);lead.appendChild(it.g);
  it.row=rows.find(r=>r.dataset.i===String(it.n));});
// when each item counts as clear of the rest (fraction of the explode)
const CLEAR={1:.02,2:W_.ball[0]+.1,3:seats[0].userData.w[0]+.12,4:W_.stem[0]+.1,5:W_.pk[0]+.1,6:W_.nut[0]+.1,7:W_.lever[0]+.08,8:fBolts[4].userData.w[0]+.12,9:W_.bonnet[0]+.1,10:W_.bb[0]+.1};

/* ---------- layout: where on screen the model sits, and how far away the camera must be to fit it there ---------- */
let W=1,Hh=1,region=[0,0,1,1],mode='d',bomLeft=1e4;
const mqD=matchMedia('(min-width:1100px)'),mqT=matchMedia('(min-width:700px)'); // the stylesheet's own breakpoints
// On a phone the words sit above the valve and the closing line below it, so its box changes with the scroll: it starts under the sub, grows up to the heading
// as the sub fades (p .03-.10), and makes room at the foot as the closing line arrives (p .80-.87). These are those four edges, measured from the page.
const copyEl=pin.querySelector('.v-copy'),h2El=copyEl.querySelector('.h2'),ledeEl=copyEl.querySelector('.lede'),ctaEl=pin.querySelector('.v-cta');
let mTop0=0,mTop1=0,mBot0=0,mBot1=0;
function offset(){const cx=region[0]+region[2]/2,cy=region[1]+region[3]/2;camera.setViewOffset(W,Hh,W/2-cx,Hh/2-cy,W,Hh);camera.updateProjectionMatrix();}
function phoneBox(p){if(mode!=='m')return;const t=lerp(mTop0,mTop1,smooth(seg(p,.03,.1))),b=lerp(mBot0,mBot1,smooth(seg(p,.8,.87)));
  if(Math.abs(t-region[1])<.5&&Math.abs(b-t-region[3])<.5)return;region[1]=t;region[3]=Math.max(b-t,80);offset();}
const tanV=Math.tan(28*PI/360);
function size(){if(dead||!sec.classList.contains('scrub'))return;W=pin.clientWidth;Hh=pin.clientHeight;if(!(W>0&&Hh>0))return;renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.setSize(W,Hh,false);camera.aspect=W/Hh;
  lead.setAttribute('viewBox','0 0 '+W+' '+Hh);
  if(mqD.matches){mode='d';region=[W*.33,84,W*.41,Hh-84-76];}
  else if(mqT.matches){mode='t';region=[W*.38,84,W*.6,Hh-84-96];}
  else{mode='m';const ct=copyEl.offsetTop;mTop0=ct+ledeEl.offsetTop+ledeEl.offsetHeight+8;mTop1=ct+h2El.offsetTop+h2El.offsetHeight+10;mBot0=Hh-96;mBot1=ctaEl.offsetTop-10;
    region=[0,mTop0,W,Math.max(mBot0-mTop0,80)];}
  bomLeft=mode==='d'?$('vBom').getBoundingClientRect().left-pin.getBoundingClientRect().left:W;
  offset();if(mode==='m')phoneBox(cur);kick();}
function fit(hw,hh){return Math.max(hh*Hh/(region[3]*tanV),hw*Hh/(region[2]*tanV))*1.06;}

/* ---------- one frame: everything from p ---------- */
let cur=0,target=0,yawU=0,elU=0,dragging=false,vis=true,gone=false;
const tmp=V3(0,0,0),right=V3(0,0,0),bar=$('vBar'),ops=[].slice.call($('vOps').children);
function pose(p){
  phoneBox(p);
  // the drawing rides in the section plane: on the paper, then lifted, then gone as the solid takes its place
  const lift=ease(seg(p,.06,.16)),baseY=lerp(SHEET_Y+.3,0,lift);model.position.y=baseY;
  dwg.userData.ink.material.opacity=.9*(1-seg(p,.2,.36));dwg.userData.hatch.material.opacity=.34*(1-seg(p,.11,.17));dwg.userData.cl.material.opacity=.75*(1-seg(p,.3,.44));
  dwg.visible=p<.45;
  capMat.opacity=seg(p,.07,.13);
  // the sweep: each branch turns from its section into a solid; the housing rises out of the section plane; the boss grows
  branches.forEach((b,bi)=>{const k=ease(seg(p,.16+bi*.022,.34+bi*.022));
    b.sweeps.forEach(s=>{const st=Math.round(k*SEGS);s.mesh.geometry.setDrawRange(0,st*s.mesh.geometry.userData.perStep);s.mesh.visible=st>0;
      s.cap.rotation.y=s.f0+s.df*k-H;s.cap.visible=k<1&&p>.065;
      s.lines.forEach(l=>{l.geometry.setDrawRange(0,st+1);l.visible=st>0;});});});
  const hs=ease(seg(p,.2,.38));hsU.scale.y=hsL.scale.y=Math.max(hs,.001);hsU.visible=hsL.visible=hs>0;eqPieces.visible=p>.065&&hs<.98;
  const bg=ease(seg(p,.32,.42));boss.scale.y=Math.max(bg,.001);boss.visible=bg>0;
  // dark solid to 316 steel
  const st=smooth(seg(p,.2,.46));bodyMat.color.copy(DARK).lerp(STEEL,st);bodyMat.envMapIntensity=lerp(.12,1,st);bodyMat.roughness=lerp(.62,.36,st);
  // apart: the body turns to a ghost so the parts inside read as they leave
  const ex=seg(p,.6,.84),gh=ease(seg(p,.6,.68)),bo=1-.72*gh;
  if(bodyMat.opacity!==bo){bodyMat.opacity=bo;const tr=bo<.999;if(bodyMat.transparent!==tr){bodyMat.transparent=tr;bodyMat.needsUpdate=true;}bodyMat.depthWrite=bo>.6;}
  edgeMat.opacity=p<.4?.85:p<.6?lerp(.85,.14,seg(p,.4,.54)):lerp(.14,.5,gh);
  shadowMat.opacity=.85*st;
  axisMat.opacity=.7*seg(ex,.04,.25);
  // assembly (parts come in, last out first in) and explode share one path
  const e=p<.58?1-seg(p,.4,.56):ex;place(e);
  if(p<.58)allParts.forEach(g=>{const w=g.userData.w;fade(g,p<.4?0:smooth(clamp((w[1]-e)/((w[1]-w[0])*.3))));});
  else allParts.forEach(g=>fade(g,1));
  // camera: straight down on the sheet, round to three-quarters as it is built, back and up before it comes apart
  const tilt=ease(seg(p,.07,.44)),apart=ease(seg(p,.565,.66));
  const el=lerp(lerp(89.4,24,tilt),17,apart)*PI/180+elU,az=(lerp(0,38,tilt)+lerp(0,5,seg(p,.44,.6))-lerp(0,13,apart)-lerp(0,4,seg(p,.86,1)))*PI/180;
  const ty=baseY+30*tilt+232*apart,d=lerp(lerp(fit(150,150),fit(168,150),tilt),fit(178,392),apart);
  camera.position.set(d*Math.cos(el)*Math.sin(az),ty+d*Math.sin(el),d*Math.cos(el)*Math.cos(az));camera.lookAt(0,ty,0);
  model.rotation.y=yawU;
  // page furniture
  pin.classList.toggle('go',p>.05);pin.classList.toggle('ex',p>.62);pin.classList.toggle('end',p>.86);
  bar.style.transform='scaleX('+p.toFixed(4)+')';
  const stage=p<.16?0:p<.6?1:2;ops.forEach((s,i)=>s.classList.toggle('on',i===stage));
  return ex;
}
function labels(p,ex){
  camera.updateMatrixWorld();model.updateMatrixWorld(true);right.setFromMatrixColumn(camera.matrixWorld,0);
  const L=[],R=[];let latest=null,lt=-1;
  ITEMS.forEach(it=>{const on=p>.6&&(ex>=CLEAR[it.n]||p>.86);it.row.classList.toggle('on',on);if(on&&CLEAR[it.n]>lt){lt=CLEAR[it.n];latest=it;}
    let show=on;
    if(show){tmp.copy(it.at);it.obj.localToWorld(tmp);tmp.addScaledVector(right,it.side*it.r);tmp.project(camera);it.x=(tmp.x+1)/2*W;it.y=(1-tmp.y)/2*Hh;show=it.y>72&&it.y<Hh-44&&it.x>8&&it.x<W-8;}
    if(!show){it.b.classList.remove('on');it.g.classList.remove('on');return;}
    (it.side<0?L:R).push(it);});
  const gap=mode==='m'?26:31,top=mode==='m'?region[1]+6:96,bot=mode==='m'?region[1]+region[3]-2:Hh-110,off=mode==='m'?26:46,r0=mode==='m'?11:13;
  [[L,-1],[R,1]].forEach(([arr,s])=>{if(!arr.length)return;arr.sort((a,b)=>a.y-b.y);
    let col=s<0?Math.min(...arr.map(a=>a.x))-off:Math.max(...arr.map(a=>a.x))+off;
    if(s>0&&mode==='d')col=Math.min(col,bomLeft-22); // balloons on the right stop short of the parts list
    const bx=Math.min(Math.max(col,14),W-14);
    let y=-1e9;arr.forEach(a=>{a.by=Math.max(a.y,y+gap,top);y=a.by;});
    const over=y-bot;if(over>0)arr.forEach(a=>a.by-=over);
    arr.forEach(a=>{a.b.style.transform='translate('+bx.toFixed(1)+'px,'+a.by.toFixed(1)+'px)';a.b.classList.add('on');
      const dx=a.x-bx,dy=a.y-a.by,dl=Math.hypot(dx,dy)||1;
      a.l.setAttribute('x1',(bx+dx/dl*r0).toFixed(1));a.l.setAttribute('y1',(a.by+dy/dl*r0).toFixed(1));a.l.setAttribute('x2',a.x.toFixed(1));a.l.setAttribute('y2',a.y.toFixed(1));
      a.d.setAttribute('cx',a.x.toFixed(1));a.d.setAttribute('cy',a.y.toFixed(1));a.g.classList.add('on');});});
  const txt=latest?String(latest.n).padStart(2,'0')+' · '+latest.name+' · '+latest.mat+' · ×'+latest.q:'';if(cap.textContent!==txt)cap.textContent=txt;
}
let raf=0,last=0;
function kick(){if(!raf&&vis&&!dead&&!gone&&sec.classList.contains('scrub'))raf=requestAnimationFrame(tick);}
function tick(t){raf=0;if(dead||gone||!sec.classList.contains('scrub')){last=0;return;}const dt=Math.min((t-(last||t))/1000,.05);last=t;
  cur+=(target-cur)*(1-Math.exp(-dt/.075));if(Math.abs(target-cur)<1e-4)cur=target;
  if(cur<.86&&!dragging){yawU*=1-Math.min(1,dt*4);elU*=1-Math.min(1,dt*4);if(Math.abs(yawU)<1e-3)yawU=0;if(Math.abs(elU)<1e-3)elU=0;} // scrolled back from the end: it turns back to face the reader
  const ex=pose(cur);renderer.render(scene,camera);labels(cur,ex);
  if(cur!==target||((yawU||elU)&&cur<.86))kick();else last=0;}
function prog(){const span=track.offsetHeight-innerHeight;return span>0?clamp(-track.getBoundingClientRect().top/span):0;}
const onScroll=()=>{if(dead)return;const t=prog();if(t!==target){target=t;kick();}};
const onResize=()=>{if(dead)return;size();target=prog();kick();}; // js/site.js pins or un-pins on resize first (its listener is older), then this fits the new window
addEventListener('scroll',onScroll,{passive:true});addEventListener('resize',onResize);
if('IntersectionObserver' in window)new IntersectionObserver(e=>{vis=e[e.length-1].isIntersecting;if(vis){target=prog();kick();}},{rootMargin:'200px 0px'}).observe(pin);

/* ---------- the WebGL context can be taken away (a phone switching apps does it). Three.js rebuilds what it drew once the context is back; the reflections are redrawn here.
   If it has not come back a few seconds after the page is in front again, the still takes over ---------- */
let goneT=0;
function waitBack(){clearTimeout(goneT);goneT=setTimeout(()=>{if(!gone)return;if(document.hidden)waitBack();else lost();},4000);}
cv.addEventListener('webglcontextlost',e=>{e.preventDefault();gone=true;pin.classList.remove('live');waitBack();});
cv.addEventListener('webglcontextrestored',()=>{if(dead)return;clearTimeout(goneT);
  try{makeEnv();[sheetMat.map,shadowMat.map,capMat.map].forEach(t=>{if(t)t.needsUpdate=true;});gone=false;size();pose(cur);renderer.render(scene,camera);pin.classList.add('live');kick();}catch(e){lost();}});

/* ---------- turning it by hand, once it is apart: drag, or the left and right arrow keys. Up-and-down swipes and keys still scroll the page ---------- */
const grab=$('vGrab');let dg=null;
function aria(){const d=Math.round(((yawU*180/PI)%360+360)%360);grab.setAttribute('aria-valuenow',String(d));grab.setAttribute('aria-valuetext',d+' degrees');}
grab.addEventListener('pointerdown',e=>{if(e.button)return;dg={id:e.pointerId,x:e.clientX,y:e.clientY,yaw:yawU,el:elU};dragging=true;grab.classList.add('on');try{grab.setPointerCapture(e.pointerId);}catch(_){}});
grab.addEventListener('pointermove',e=>{if(!dg||e.pointerId!==dg.id)return;yawU=dg.yaw+(e.clientX-dg.x)*.009;elU=clamp(dg.el+(e.clientY-dg.y)*.004,-.28,.5);kick();});
const drop=e=>{if(!dg||(e&&e.pointerId!==dg.id))return;dg=null;dragging=false;grab.classList.remove('on');aria();};
grab.addEventListener('pointerup',drop);grab.addEventListener('pointercancel',drop);grab.addEventListener('lostpointercapture',drop);
grab.addEventListener('keydown',e=>{const k=e.key;if(k!=='ArrowLeft'&&k!=='ArrowRight')return;e.preventDefault();yawU+=(k==='ArrowLeft'?-1:1)*PI/12;aria();kick();}); // up and down are left to the page

window.__valve={bare:on=>{sheet.visible=shadow.visible=!on;kick();}}; // handle for the still capture (scripts/qa/valve-probe.mjs)
size();
const draw=()=>{if(!dead)drawSheet();};
(document.fonts&&document.fonts.load?Promise.race([document.fonts.load('500 20px "IBM Plex Mono"'),new Promise(r=>setTimeout(r,2500))]):Promise.resolve()).then(draw,draw);
target=cur=prog();
pose(cur);
try{renderer.compile(scene,camera);}catch(e){} // the shaders are built now, not in the middle of the scroll
renderer.render(scene,camera);
sec.classList.add('v3d');pin.classList.add('live');kick();
}catch(e){lost();}
})();
