import * as THREE from 'three';
import { createFirstPerson } from './first-person';
import { gamePoint } from './landscape';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { OutlineEffect } from 'three/addons/effects/OutlineEffect.js';
import { batchSurfaces } from './minitool-gpu';
import { DECOR_RIBBONS, SORT_SLOTS, RIBBON_NUMBERS, LINE_RIBBONS, RIBBON_COLORS, DECOR_COLORS, PUZZLE_BOOKS, BOOK_START_FIRST, BOOK_START_THIRD, MIDDLE_BOOK_COLORS, MIDDLE_BOOK_HEIGHT } from './puzzles';

export function createRoom(container, { onSelect, onReady, onError, onMode, onFocus, onLights, onRibbonsChange, onBooksChange, markerElements, reducedMotion }) {
  const scene = new THREE.Scene();
  const offline=import.meta.env.MODE==='minitool';
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, offline?1.5:2));
  renderer.shadowMap.enabled = false;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  const inkEffect=offline?null:new OutlineEffect(renderer,{defaultThickness:.0033,defaultColor:[.04,.05,.03],defaultAlpha:1});
  const shadeRamp=new THREE.DataTexture(new Uint8Array([185,230,255]),3,1,THREE.RedFormat);
  shadeRamp.minFilter=shadeRamp.magFilter=THREE.NearestFilter;shadeRamp.needsUpdate=true;
  container.prepend(renderer.domElement);
  const camera = new THREE.PerspectiveCamera(70,1,.055,60);
  scene.background = new THREE.Color('#eee5d1');
  const hemi = new THREE.HemisphereLight('#ffffff', '#e0e4d7', 1.6); scene.add(hemi);
  const sun = new THREE.DirectionalLight('#fff5dc', 1.1); sun.position.set(-3,9,5); sun.castShadow = false;
  sun.shadow.mapSize.set(2048,2048); sun.shadow.camera.left=-9; sun.shadow.camera.right=9;
  sun.shadow.camera.top=9; sun.shadow.camera.bottom=-9; sun.shadow.normalBias=.035;
  sun.shadow.bias=-.0002; sun.shadow.radius=4; scene.add(sun);
  const fill = new THREE.DirectionalLight('#ecf1e8',.35); fill.position.set(6,5,-2); scene.add(fill);
  // Cool moonlight enters through the window; reflected sky light keeps the room readable.
  const moonFill=new THREE.HemisphereLight('#b8cdf2','#727f9f',0);scene.add(moonFill);
  const moonLight=new THREE.DirectionalLight('#b9d2ff',0);moonLight.position.set(-1.7,3.43,-4.85);moonLight.target.position.set(.2,.35,.5);scene.add(moonLight,moonLight.target);
  const materials = new Map();
  const mat = color => { if(!materials.has(color)) materials.set(color,new THREE.MeshToonMaterial({color,gradientMap:shadeRamp})); return materials.get(color); };
  const root = new THREE.Group(); scene.add(root);
  function mesh(geo,color,x,y,z,parent=root) { const m=new THREE.Mesh(geo, typeof color === 'string' ? mat(color) : color); m.position.set(x,y,z); m.castShadow=true; m.receiveShadow=true; parent.add(m); return m; }
  function box(w,h,d,color,x,y,z,r=.05,parent=root) { return mesh(r && (!offline||r>.015) ? new RoundedBoxGeometry(w,h,d,offline?1:2,r) : new THREE.BoxGeometry(w,h,d),color,x,y,z,parent); }
  function ball(r,color,x,y,z,parent=root) { return mesh(new THREE.SphereGeometry(r,offline?12:24,offline?8:16),color,x,y,z,parent); }
  function cyl(rt,rb,h,color,x,y,z,parent=root) { return mesh(new THREE.CylinderGeometry(rt,rb,h,offline?16:40),color,x,y,z,parent); }
  function group(x,y,z,rotation=0) { const g = new THREE.Group(); g.position.set(x,y,z);g.rotation.y=rotation;root.add(g); return g; }
  function line(points,color,r=.018,parent=root) { return mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),32,r,6,false),color,0,0,0,parent); }
  const targets = {}, anchors = {}, animations = [];
  function target(id,g,anchor) { targets[id]=g; anchors[id]=new THREE.Vector3(...anchor); g.traverse(o => {o.userData.target=id;}); }
  // A thick wooden dollhouse foundation and individually laid floorboards.
  box(12.5,.35,10.8,'#bb926d',0,-.2,0,.12);
  box(12.35,.14,10.65,'#e6c49c',0,.03,0,.04);
  for(let row=0;row<22;row++) for(let col=0;col<6;col++) {
    const x=-5.2+col*2.08, z=-4.94+row*.47;
    box(2.063,.055,.45,['#d6b28a','#dfbd96','#e4c49f','#dbb88e'][(row+col*3)%4],x,.12,z,.012);
  }
  // Enclosed interior: every direction has a wall, skirting, and ceiling.
  box(12.5,4.45,.17,'#ece4cf',0,2.24,-5.3,.03);
  box(.18,4.45,10.75,'#e9dcc4',-6.18,2.24,0,.03);
  box(12.3,.18,.13,'#c1ac86',0,.27,-5.16,.02);
  box(.13,.18,10.5,'#c1ac86',-6.04,.27,0,.02);
  box(12.58,.14,.28,'#d9c8a6',0,4.48,-5.3,.04);
  box(.28,.14,10.85,'#d9c8a6',-6.18,4.48,0,.04);
  box(.18,4.45,10.75,'#e8ddc6',6.18,2.24,0,.03);
  box(12.5,4.45,.17,'#e9dfc9',0,2.24,5.34,.03);
  const ceiling=box(12.55,.15,10.9,'#f4ecda',0,4.53,0,.02);
  ceiling.castShadow=false;
  for(const x of [-6.04,6.04]){
    box(.13,.18,10.5,'#bca782',x,.27,0,.02);
    box(.15,.14,10.58,'#d6c49e',x,4.35,0,.02);
  }
  box(12.3,.18,.13,'#c1ac86',0,.27,5.2,.02);
  box(12.3,.14,.15,'#d6c49e',0,4.35,5.2,.02);
  // Entry door, coat hooks, and a bench make the previously open side a real room.
  box(1.52,2.9,.13,'#ae9671',.75,1.62,5.2,.04);
  box(1.34,2.72,.09,'#a9b196',.75,1.6,5.1,.04);
  for(const y of [.98,2.15])box(1.06,.91,.035,'#b9c0a6',.75,y,5.04,.04);
  ball(.06,'#ba985c',1.23,1.52,4.98);
  const lightSwitch=group(-.43,1.58,5.12);
  box(.28,.38,.07,'#f7edda',0,0,0,.035,lightSwitch);
  const rocker=box(.16,.25,.06,'#a8b395',0,0,-.055,.025,lightSwitch);rocker.rotation.x=-.18;
  const switchDot=ball(.015,new THREE.MeshBasicMaterial({color:'#d2e59b'}),0,-.14,-.055,lightSwitch);
  target('lightSwitch',lightSwitch,[-.43,1.83,5.01]);
  const entry=group(-3.75,.17,5.04);
  box(2.17,.14,.43,'#c8a579',0,.54,0,.05,entry);
  for(const x of [-.85,.85])box(.09,.5,.3,'#ac8c62',x,.25,0,.025,entry);
  box(1.8,.13,.12,'#ae8d64',-3.65,2.5,5.16,.035);
  for(const x of [-4.25,-3.65,-3.05]){cyl(.025,.025,.13,'#9c8058',x,2.43,5.07);ball(.05,'#b39262',x,2.43,5.01);}
  // An overcoat and a hat hang on the entry rack, as in the reference sketch.
  const coatColor='#a58d70',coatTrim='#8a735a';
  const coatShape=new THREE.Shape();
  coatShape.moveTo(0,0);coatShape.lineTo(.3,-.06);coatShape.lineTo(.42,-.5);coatShape.lineTo(.29,-.62);coatShape.lineTo(.22,-.34);
  coatShape.lineTo(.3,-1.02);coatShape.lineTo(-.3,-1.02);coatShape.lineTo(-.22,-.34);coatShape.lineTo(-.29,-.62);coatShape.lineTo(-.42,-.5);coatShape.lineTo(-.3,-.06);
  coatShape.closePath();
  const coatGeo=new THREE.ExtrudeGeometry(coatShape,{depth:.15,bevelEnabled:true,bevelSize:.018,bevelThickness:.018,bevelSegments:1});
  coatGeo.translate(0,0,-.075);
  const coat=new THREE.Mesh(coatGeo,mat(coatColor));coat.position.set(-3.65,2.4,4.96);coat.castShadow=true;coat.receiveShadow=true;root.add(coat);
  const lapel=(sx)=>{const l=box(.11,.42,.05,coatTrim,-3.65+sx*.15,2.2,4.87,.02);l.rotation.z=sx*.22;};
  lapel(1);lapel(-1);
  box(.26,.1,.22,coatTrim,-3.65,2.36,4.9,.035);
  line([[-3.65,2.46,5.01],[-3.65,2.42,4.97]],'#9c8058',.012);
  const rackHat=group(-3.05,2.24,4.98);rackHat.rotation.z=.1;
  cyl(.21,.22,.03,'#7d6a4e',0,0,0,rackHat);
  cyl(.14,.16,.26,'#8a7455',0,.14,0,rackHat);
  cyl(.142,.142,.045,'#4f4a38',0,.06,0,rackHat);
  // Right-wall framed landscape and a shallow ledge.
  box(.12,1.37,1.88,'#b49770',6.01,2.57,-.37,.04);
  box(.035,1.2,1.72,'#f1ecd8',5.93,2.57,-.37,.015);
  const artSun=ball(.25,'#d6b475',5.9,2.81,-.68);artSun.scale.x=.035;
  const artHill=ball(.6,'#9daa88',5.88,2.3,-.14);artHill.scale.set(.012,.55,1.15);
  box(.31,.1,2.04,'#c5a379',5.92,1.79,-.37,.025);
  // Warm pendant adds interior light without casting a ceiling-sized shadow.
  cyl(.018,.018,.43,'#b69e75',.4,4.18,-.4);
  const pendant=cyl(.26,.49,.35,'#ecdab1',.4,3.83,-.4);pendant.castShadow=false;
  const innerLight=new THREE.PointLight('#ffe5bb',2,10,2);innerLight.position.set(.4,3.51,-.4);scene.add(innerLight);
  const backDecorStart=root.children.length;
  // Window, warm landscape, moulding, and gathered linen curtains.
  box(3.12,2.34,.14,'#f9f0d8',-1.7,2.87,-3.13,.06);
  const skyMaterial=new THREE.MeshBasicMaterial({color:'#b8d6cc'});
  box(2.82,2.02,.08,skyMaterial,-1.7,2.87,-3.02,.015);
  const moonMaterial=new THREE.MeshBasicMaterial({color:'#fff0b6'});
  const sunDisc = cyl(.28,.28,.02,moonMaterial,-1,3.43,-2.96); sunDisc.rotation.x=Math.PI/2;
  const moonCutMaterial=new THREE.MeshBasicMaterial({color:'#303e61',transparent:true,opacity:0});
  const moonCut=cyl(.245,.245,.025,moonCutMaterial,-.87,3.51,-2.935);moonCut.rotation.x=Math.PI/2;
  const starMaterial=new THREE.MeshBasicMaterial({color:'#dbe6ff',transparent:true,opacity:0});
  for(const [x,y] of [[-2.7,3.6],[-2.1,3.35],[-1.95,3.68],[-.65,2.97],[-2.55,2.97]])ball(.018,starMaterial,x,y,-2.95);
  const landscape = ball(1,'#a1b69b',-2.3,2.25,-2.98); landscape.scale.set(.8,.34,.018);
  const landscape2 = ball(1,'#c0c8a7',-.95,2.16,-2.95); landscape2.scale.set(.6,.23,.018);
  box(.075,2.12,.12,'#fcf5dd',-1.7,2.87,-2.88,.01);
  box(2.88,.075,.12,'#fcf5dd',-1.7,2.83,-2.88,.01);
  box(3.5,.13,.48,'#faf0d7',-1.7,1.73,-2.94,.04);
  box(3.65,.07,.07,'#8d7351',-1.7,4.14,-2.7,.025);
  for(const x of [-3.25,-.2]) for(let i=0;i<5;i++) {
    const curtain = cyl(.105,.14,2.22,'#f4ebd4',x+(i-2)*.12,2.9,-2.7);
    curtain.castShadow=false;
  }
  // Wall ribbons: 8 plain decorative pennants (no number, fixed) and, in the
  // middle, 5 slots for the numbered puzzle ribbons (1,4,5 dots; 2,3 lines).
  const TOTAL_RIBBONS=DECOR_RIBBONS+SORT_SLOTS;
  const slotX=[],slotY=[];
  for(let i=0;i<TOTAL_RIBBONS;i++){
    const x=-4.8+i*(9.6/(TOTAL_RIBBONS-1));
    slotX.push(x);slotY.push(4.34-Math.pow(x/4.8,2)*.13);
  }
  const DECOR_START=Math.floor((TOTAL_RIBBONS-SORT_SLOTS)/2);
  line(slotX.map((x,i)=>[x,slotY[i],-2.45]),'#a28b65',.012);
  const RIBBON_PIPS={1:[[.5,.5]],4:[[.28,.28],[.72,.28],[.28,.72],[.72,.72]],5:[[.28,.28],[.72,.28],[.5,.5],[.28,.72],[.72,.72]]};
  function ribbonGlyph(parent,n,cy){
    const ink=new THREE.MeshBasicMaterial({color:'#5b5646',transparent:true,side:THREE.DoubleSide});
    if(LINE_RIBBONS.includes(n)){const step=.075,total=(n-1)*step;for(let i=0;i<n;i++)box(.24,.026,.02,ink,0,cy+total/2-i*step,.026,0,parent);return;}
    for(const [px,py] of RIBBON_PIPS[n]||[])ball(.026,ink,(px-.5)*.34,cy+(.5-py)*.3,.026,parent);
  }
  const pennantShape=new THREE.Shape();
  pennantShape.moveTo(-.32,0);pennantShape.lineTo(.32,0);pennantShape.lineTo(0,-.86);pennantShape.closePath();
  const pennantGeometry=new THREE.ShapeGeometry(pennantShape);
  const decorHost=new THREE.Group();root.add(decorHost);decorHost.position.z=-2.45;
  for(let i=0;i<TOTAL_RIBBONS;i++){
    if(i>=DECOR_START&&i<DECOR_START+SORT_SLOTS)continue; // middle reserved for the puzzle ribbons
    const d=new THREE.Group();
    const dm=new THREE.MeshToonMaterial({color:DECOR_COLORS[i%DECOR_COLORS.length],gradientMap:shadeRamp,side:THREE.DoubleSide});
    d.add(new THREE.Mesh(pennantGeometry,dm));ball(.045,dm,0,.02,.01,d);
    d.traverse(o=>{o.castShadow=false;o.receiveShadow=false;});
    d.position.set(slotX[i],slotY[i],0);d.scale.setScalar(.86);
    decorHost.add(d);
  }
  const sortHost=new THREE.Group();root.add(sortHost);sortHost.position.z=-2.45;
  const ribbons=[];
  for(const n of RIBBON_NUMBERS){
    const g=new THREE.Group();g.userData.ribbon=n;
    const bodyMat=new THREE.MeshToonMaterial({color:RIBBON_COLORS[n],gradientMap:shadeRamp,transparent:true,opacity:0,side:THREE.DoubleSide});
    g.add(new THREE.Mesh(pennantGeometry,bodyMat));
    ball(.05,bodyMat,0,.02,.01,g);
    ribbonGlyph(g,n,-.34);
    g.traverse(o=>{o.castShadow=false;o.receiveShadow=false;});
    g.position.set(slotX[DECOR_START],slotY[DECOR_START],0);g.visible=false;
    sortHost.add(g);
    const mats=[];g.traverse(o=>{if(o.material&&!mats.includes(o.material))mats.push(o.material);});
    ribbons.push({number:n,group:g,mats,slot:null,appear:0,target:0,dragging:false});
  }
  const sortSlotX=[],sortSlotY=[];
  for(let k=0;k<SORT_SLOTS;k++){sortSlotX.push(slotX[DECOR_START+k]);sortSlotY.push(slotY[DECOR_START+k]);}
  target('ribbons',sortHost,[0,3.9,-4.45]);
  root.children.slice(backDecorStart).forEach(o=>{o.position.z-=2;});
  const moonPoolMaterial=new THREE.MeshBasicMaterial({color:'#aacbff',transparent:true,opacity:0,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1});
  for(const x of [-2.35,-1.17])for(const z of [-3.75,-2.12]){const pool=mesh(new THREE.PlaneGeometry(1.05,1.46),moonPoolMaterial,x,.159,z);pool.rotation.x=-Math.PI/2;pool.userData.moonPool=true;}
  const daySky=new THREE.Color('#b8d6cc'),nightSky=new THREE.Color('#303e61'),dayDisc=new THREE.Color('#fff0b6'),nightDisc=new THREE.Color('#e1eaff');
  // Framed art on the left wall.
  function art(z,y,color) {
    box(.13,1.04,.82,'#a88761',-6.01,y,z,.04);
    box(.025,.89,.67,'#fff6de',-5.93,y,z,.01);
    const a = ball(.2,color,-5.91,y+.05,z); a.scale.set(.045,1,1);
    box(.025,.06,.4,'#a9ad86',-5.90,y-.26,z,.01);
  }
  art(-.55,2.92,'#d9aa69'); art(1.03,3.18,'#a8b6a1');
  // Plush sage sofa, angled inward.
  const sofa=group(-4.65,.17,-1.25,Math.PI/2);
  for(const x of [-1.22,1.22]) for(const z of [-.45,.45]) cyl(.065,.06,.27,'#8e7152',x,.12,z,sofa);
  box(3,.52,1.4,'#93a384',0,.46,0,.15,sofa);
  box(2.94,1.1,.34,'#a5b394',0,1.13,-.54,.15,sofa);
  for(const x of [-1.4,1.4]) box(.32,.75,1.45,'#aab89a',x,.87,0,.14,sofa);
  for(const x of [-.65,.65]) box(1.29,.26,1.13,'#bcc5a7',x,.82,.09,.11,sofa);
  const pillow=box(.68,.65,.23,'#eeddbb',-.81,1.19,-.16,.15,sofa);pillow.rotation.z=.17;pillow.rotation.x=-.2;
  const pillow2=box(.62,.63,.23,'#c69376',.81,1.18,-.16,.14,sofa);pillow2.rotation.z=-.16;
  box(.7,.065,1.1,'#e8dbc0',.68,.99,.25,.04,sofa);
  for(let i=0;i<6;i++) box(.025,.012,.99,'#cbbd9d',.41+i*.105,1.03,.27,.002,sofa);
  // A little birthday hat waits on the sofa; later it moves onto the cat.
  const hat=group(-4.15,1.22,-.85,.3);
  cyl(.23,.25,.045,'#e7cf97',0,0,0,hat);
  cyl(.02,.15,.24,'#c58f6d',0,.12,0,hat);
  ball(.045,'#f0d9a6',0,.25,0,hat);
  target('hat',hat,[-4.15,1.62,-.85]);
  // Round woven rug, offset under the coffee table.
  const rug=cyl(2.05,2.05,.026,'#ddd1ac',.25,.177,.75);rug.scale.z=.82;
  for(let r=.7;r<2.04;r+=.35) { const ring=mesh(new THREE.TorusGeometry(r,.012,5,64),'#c9bd99',.25,.194,.75);ring.rotation.x=Math.PI/2;ring.scale.y=.82; }
  const table=group(.25,.2,.48);
  for(const [x,z] of [[-.65,-.4],[.65,-.4],[0,.55]]) { const leg=cyl(.07,.055,.6,'#a87f52',x,.3,z,table);leg.rotation.z=-x*.18; }
  const tableTop=cyl(1.05,1.03,.16,'#cda878',0,.7,0,table);tableTop.scale.z=.8;
  // Cake, berries and a tiny birthday candle.
  const cake=group(.24,.99,.48);
  cyl(.5,.5,.045,'#faf0d9',0,0,0,cake);
  cyl(.4,.41,.3,'#f2d9b7',0,.16,0,cake);
  cyl(.41,.41,.095,'#fff2d7',0,.325,0,cake);
  for(let i=0;i<9;i++) { const a=i/9*Math.PI*2;ball(.058,'#fff3dd',Math.cos(a)*.35,.373,Math.sin(a)*.35,cake); }
  for(const [x,z] of [[-.2,-.12],[.17,-.13],[.18,.16],[-.18,.17]]) {const berry=ball(.075,'#c86c57',x,.414,z,cake);berry.scale.y=1.2;}
  cyl(.033,.033,.3,'#a0b79f',0,.54,0,cake);
  const flame=ball(.06,new THREE.MeshBasicMaterial({color:'#fff1c5'}),0,.745,0,cake);flame.scale.set(.75,1.5,.75);
  const glowCanvas=document.createElement('canvas');glowCanvas.width=glowCanvas.height=64;const glowCtx=glowCanvas.getContext('2d'),glowGradient=glowCtx.createRadialGradient(32,32,0,32,32,32);glowGradient.addColorStop(0,'rgba(255,219,140,.6)');glowGradient.addColorStop(.25,'rgba(255,165,68,.25)');glowGradient.addColorStop(1,'rgba(255,145,40,0)');glowCtx.fillStyle=glowGradient;glowCtx.fillRect(0,0,64,64);
  const candleGlow=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(glowCanvas),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));candleGlow.position.set(0,.745,0);candleGlow.scale.set(.38,.48,1);cake.add(candleGlow);
  target('cake',cake,[.24,2.05,.48]);
  const candleLight=new THREE.PointLight('#ffce91',0,13,1.7);candleLight.position.set(.24,1.78,.48);scene.add(candleLight);
  // A closed, opaque present surrounds the cake until the final interaction.
  const cakeCover=group(.24,.99,.48),coverPanels=[];
  const coverPaper=new THREE.MeshToonMaterial({color:'#b9c6a4',gradientMap:shadeRamp,transparent:true});
  const coverRibbon=new THREE.MeshToonMaterial({color:'#efd5a4',gradientMap:shadeRamp,transparent:true});
  for(const [x,z,axis,sign] of [[0,-.55,'x',-1],[0,.55,'x',1],[-.55,0,'z',1],[.55,0,'z',-1]]){
    const hinge=new THREE.Group();hinge.position.set(x,0,z);cakeCover.add(hinge);
    box(axis==='x'?1.16:.055,.91,axis==='x'?.055:1.16,coverPaper,0,.455,0,.015,hinge);
    box(axis==='x'?.13:.064,.91,axis==='x'?.064:.13,coverRibbon,0,.455,0,.006,hinge);
    coverPanels.push({hinge,axis,sign});
  }
  const cakeLid=new THREE.Group();cakeLid.position.y=.94;cakeCover.add(cakeLid);
  box(1.23,.13,1.23,coverPaper,0,0,0,.035,cakeLid);
  box(.14,.015,1.24,coverRibbon,0,.074,0,.005,cakeLid);box(1.24,.015,.14,coverRibbon,0,.074,0,.005,cakeLid);
  for(const sign of [-1,1]){const bow=mesh(new THREE.TorusGeometry(.15,.026,8,24),coverRibbon,sign*.13,.17,0,cakeLid);bow.rotation.y=sign*.3;bow.rotation.z=sign*.45;}
  cakeCover.traverse(o=>{o.userData.target='cake';});
  cake.visible=false;
  // Tall bookcase. The 1st and 3rd shelves hold 6 draggable books each (sort low->high,
  // like the wall ribbons); the 2nd shelf keeps the original three equal-height books.
  const shelf=group(4.87,.15,-4.76);
  box(1.83,3.34,.21,'#b28c64',0,1.67,-.24,.03,shelf);
  for(const x of [-.88,.88]) box(.12,3.36,.68,'#bd976e',x,1.67,0,.03,shelf);
  for(const y of [.1,1.09,2.13,3.3]) box(1.86,.12,.72,'#c7a47a',0,y,0,.025,shelf);
  for(const [i,color] of MIDDLE_BOOK_COLORS.entries()) {
    const x=-.58+i*.28,bottom=1.15;
    box(.23,MIDDLE_BOOK_HEIGHT,.43,color,x,bottom+MIDDLE_BOOK_HEIGHT/2,.1,.02,shelf);
    box(.13,.02,.006,'#f2e2c6',x,bottom+MIDDLE_BOOK_HEIGHT-.08,.286,.001,shelf);
  }
  // 相框：放在原先书柜第二层小闹钟的位置，80° 立起来。
  const frameBase=new THREE.Group();frameBase.position.set(.45,1.575,.12);frameBase.rotation.x=-.17;shelf.add(frameBase);
  box(.64,.86,.05,'#a88761',0,0,0,.03,frameBase);
  box(.52,.72,.02,'#f7f1e2',0,0,.028,.01,frameBase);
  mesh(new THREE.PlaneGeometry(.44,.6),new THREE.MeshBasicMaterial({map:frameTexture()}),0,0,.04,frameBase);
  box(.1,.46,.03,'#8a735a',0,-.42,-.09,.02,frameBase).rotation.x=.4;
  const BOOK_SLOT_LOCAL=[-.55,-.33,-.11,.11,.33,.55],BOOK_IDS=PUZZLE_BOOKS.map(b=>b.id),BOOK_HEIGHT=Object.fromEntries(PUZZLE_BOOKS.map(b=>[b.id,b.height]));
  const bookItems=[];
  for(const row of [{key:'first',boardY:.16},{key:'third',boardY:2.19}]){
    for(const id of BOOK_IDS){
      const h=BOOK_HEIGHT[id],color=PUZZLE_BOOKS.find(b=>b.id===id).color;
      const g=new THREE.Group();g.userData.book=id;g.userData.shelf=row.key;
      box(.17,h,.4,color,0,0,0,.02,g);
      box(.09,.02,.006,'#f2e2c6',0,h/2-.07,.206,.001,g);
      g.traverse(o=>{o.castShadow=false;o.receiveShadow=false;});
      shelf.add(g);
      bookItems.push({id,key:row.key,group:g,height:h,slot:0,dragging:false});
    }
  }
  const BOOK_SLOT_WORLD=BOOK_SLOT_LOCAL.map(x=>4.87+x),BOOK_PLANE_Z=-4.7;
  for(const item of bookItems){
    const start=item.key==='first'?BOOK_START_FIRST:BOOK_START_THIRD;
    item.slot=Math.max(0,start.indexOf(item.id));
    item.group.position.set(BOOK_SLOT_LOCAL[item.slot],(item.key==='first'?.16:2.19)+item.height/2,.06);
  }
  target('books',shelf,[4.6,1.88,-4.24]);
  // Low cabinet by the window, with one inviting drawer.
  const cabinet=group(1.1,.16,-4.47);
  for(const x of [-.6,.6]) for(const z of [-.28,.28]) box(.09,.23,.1,'#a6825a',x,.11,z,.025,cabinet);
  box(1.65,.86,.84,'#c3a077',0,.62,0,.06,cabinet);
  box(1.75,.12,.93,'#dfc298',0,1.09,0,.04,cabinet);
  // Lower drawer stays closed; the upper drawer really slides out with its tray.
  box(1.47,.32,.08,'#d2b18a',0,.42,.44,.025,cabinet);
  const lowerKnob=cyl(.047,.047,.06,'#907347',0,.42,.51,cabinet);lowerKnob.rotation.x=Math.PI/2;
  const drawer=new THREE.Group();drawer.position.set(0,.8,0);cabinet.add(drawer);
  box(1.47,.32,.08,'#d2b18a',0,0,.44,.025,drawer);
  const knob=cyl(.047,.047,.06,'#907347',0,0,.51,drawer);knob.rotation.x=Math.PI/2;
  box(1.4,.05,.66,'#c9a87f',0,-.14,.12,.02,drawer);
  for(const x of [-.7,.7]) box(.05,.28,.66,'#c9a87f',x,0,.12,.02,drawer);
  box(1.4,.28,.05,'#b39068',0,0,-.2,.02,drawer);
  const drawerParts=[drawer];
  target('drawer',cabinet,[1.1,1.24,-3.92]);
  function plant(x,y,z,scale=1) {
    const g=group(x,y,z);g.scale.setScalar(scale);
    cyl(.27,.2,.45,'#c89070',0,.23,0,g);cyl(.28,.28,.07,'#d3a382',0,.43,0,g);cyl(.23,.23,.025,'#665640',0,.462,0,g);
    for(let i=0;i<7;i++) {
      const a=i*2.4,h=.78+(i%3)*.19,dx=Math.cos(a)*.32,dz=Math.sin(a)*.32;
      line([[0,.46,0],[dx*.4,h-.2,dz*.4],[dx,h,dz]],'#738564',.016,g);
      const leaf=ball(.2,['#8f9f75','#a5b187','#6f8c6e'][i%3],dx,h,dz,g);leaf.scale.set(.7,1.65,.36);leaf.rotation.set(.3,a,dx>0?-.6:.6);
    }
    return g;
  }
  function slipperPair(x,y,z,color) {
    const g=group(x,y,z);
    for(const sx of [-.13,.13]) {
      box(.2,.05,.42,color,sx,.025,0,.025,g);
      box(.18,.07,.14,color,sx,.075,-.1,.02,g);
    }
    return g;
  }
  const windowPlant=plant(-2.64,1.8,-4.85,.67);target('plant',windowPlant,[-2.64,2.65,-4.64]);
  plant(5.1,.17,2.4,1.4);
  // Side table and record player.
  const music=group(-1.85,.17,.65);
  for(const x of [-.42,.42]) for(const z of [-.3,.3]) box(.075,.65,.075,'#9a7754',x,.32,z,.02,music);
  box(1.19,.12,.97,'#c8a375',0,.67,0,.045,music);
  box(.96,.2,.73,'#b27e5b',0,.84,0,.055,music);
  const lid=box(.96,.66,.06,'#c89773',0,1.23,-.34,.035,music);lid.rotation.x=-.13;
  const record=cyl(.28,.28,.03,'#49463b',-.08,.958,.02,music),recordLabel=cyl(.077,.077,.035,'#d9aa79',-.08,.963,.02,music);
  box(.095,.003,.027,'#ecd8ad',.145,.017,0,.002,record);
  line([[.34,.975,-.23],[.35,.985,.17],[.15,.985,.25]],'#d8c9a7',.022,music);
  target('music',music,[-1.84,1.5,.68]);
  // Floor lamp casts a warm pool beside the couch.
  cyl(.28,.31,.065,'#bda57e',-5.03,.21,-2.98);
  cyl(.028,.028,2.2,'#a68b61',-5.03,1.3,-2.98);
  cyl(.3,.49,.55,'#f5ddb0',-5.03,2.57,-2.98);
  const lamp=new THREE.PointLight('#ffcd85',2,3);lamp.position.set(-5.03,2.33,-2.98);scene.add(lamp);
  // 熙熙：棕灰色双色布偶猫，睡在靠左墙的地垫上，保留原地逆时针 90°。
  const catBody='#f7f2e8',catPoint='#8a7c6a';
  const cat=group(-5.45,.24,1.55,Math.atan2(.85,3.55)+Math.PI/2);
  const cushion=cyl(.59,.59,.13,'#c4a48b',0,0,0,cat);cushion.scale.z=.76;
  const body=ball(.36,catBody,0,.23,0,cat);body.scale.set(1.23,.74,.85);
  const saddle=ball(.3,catPoint,-.04,.32,.02,cat);saddle.scale.set(1.15,.42,.8);
  const head=ball(.235,catBody,.29,.38,.13,cat);head.scale.set(1,.91,.85);
  const mask=ball(.2,catPoint,.25,.47,.06,cat);mask.scale.set(1.02,.62,.95);
  for(const x of [.15,.4]) { const ear=mesh(new THREE.ConeGeometry(.105,.22,3),catPoint,x,.6,.11,cat);ear.rotation.z=x<.2?.24:-.24; }
  for(const x of [.2,.37]) line([[x-.035,.397,.312],[x,.383,.321],[x+.028,.394,.315]],'#5b5646',.009,cat);
  ball(.023,'#c98f86',.29,.348,.334,cat);
  line([[-.31,.26,.05],[-.39,.28,.26],[-.21,.28,.32],[.02,.27,.26]],catPoint,.066,cat);
  target('cat',cat,[-5.45,1.1,1.55]);
  const catHat=new THREE.Group();catHat.position.set(.29,.63,.13);catHat.rotation.z=-.28;catHat.visible=false;cat.add(catHat);
  cyl(.14,.14,.03,'#e7cf97',0,0,0,catHat);cyl(.012,.09,.15,'#c58f6d',0,.08,0,catHat);ball(.032,'#f0d9a6',0,.17,0,catHat);
  // A few birthday parcels and softly bobbing balloons.
  function parcel(x,z,size,color) {const g=group(x,.17,z);box(size,size*.8,size,color,0,size*.4,0,.06,g);box(size*1.06,.12,size*1.06,color,0,size*.84,0,.025,g);box(.1,size*.84,size*1.02,'#f3e2bc',0,size*.43,0,.006,g);box(size*1.02,.015,.1,'#f3e2bc',0,size*.91,0,.004,g);for(const k of [-1,1]) { const bow=mesh(new THREE.TorusGeometry(.12,.025,8,20),'#f3e2bc',k*.1,size*.99,0,g);bow.rotation.y=.5;bow.rotation.z=k*.4; }return g; }
  parcel(4.74,3.8,.57,'#bbbd98');parcel(5.3,4.1,.42,'#d7a186');
  for(let i=0;i<3;i++) {
    const x=4.88+(i-1)*.45,y=2.25+(i%2)*.55,z=3.65;
    const g=group(x,y,z);const b=ball(.31,['#dfb993','#adbba3','#e6d4ae'][i],0,0,0,g);b.scale.y=1.22;
    mesh(new THREE.ConeGeometry(.045,.09,10),'#c8ac84',0,-.39,0,g).rotation.x=Math.PI;
    line([[0,-.38,0],[.08,-1,0],[4.9-x,-y+.37,0]],'#b7a386',.009,g);
    animations.push({g,y,phase:i*1.7});
  }
  // A reading corner and a potting station occupy the newly expanded space.
  const desk=group(4.65,.17,-1,Math.PI/2);
  box(2.3,.13,1.08,'#c4a176',0,.99,0,.06,desk);
  for(const x of [-.93,.93])for(const z of [-.36,.36])box(.09,.93,.09,'#a98b63',x,.48,z,.02,desk);
  box(.64,.045,.43,'#c7977f',-.7,1.09,.1,.015,desk);
  box(.56,.07,.37,'#a9b397',-.68,1.145,.1,.015,desk);
  const deskChair=group(3.35,.17,-1,Math.PI/2);
  box(.78,.13,.73,'#a1b28e',0,.55,0,.07,deskChair);box(.79,.8,.12,'#a8b996',0,1.01,-.32,.07,deskChair);
  for(const x of [-.3,.3])for(const z of [-.26,.26])cyl(.035,.045,.53,'#ac8e66',x,.28,z,deskChair);
  const readingRug=cyl(1.5,1.5,.027,'#bcc5a2',4.1,.178,-1);readingRug.scale.z=1.2;
  function textTile(textValue,w,h,x,y,z,rotation=0){
    const canvas=document.createElement('canvas');canvas.width=768;canvas.height=256;const ctx=canvas.getContext('2d');
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
    const draw=()=>{if(disposed)return;ctx.fillStyle='#f7f0db';ctx.fillRect(0,0,768,256);ctx.fillStyle='#737d5d';ctx.font='62px KaiTi, STKaiti, serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(textValue,384,128,720);texture.needsUpdate=true;};
    if(document.fonts&&document.fonts.load)document.fonts.load('62px KaiTi',textValue).then(draw).catch(draw);else Promise.resolve().then(draw);
    const tile=mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map:texture,roughness:1,side:THREE.DoubleSide}),x,y,z);tile.rotation.y=rotation;return tile;
  }
  textTile('阅读角 · 让矮书站在左边',2.3,.7,5.98,3.62,-1,-Math.PI/2);
  const tablet=group(4.4,1.22,-1.4,-.35);
  box(.64,.05,.92,'#5f6a5a',0,0,0,.04,tablet);
  box(.52,.03,.76,'#cfe0c8',0,.035,0,.012,tablet);
  box(.32,.006,.05,'#8fa383',0,.055,.2,.002,tablet);
  box(.32,.006,.05,'#8fa383',0,.055,.08,.002,tablet);
  box(.2,.006,.05,'#8fa383',0,.055,-.04,.002,tablet);
  target('tablet',tablet,[4.4,1.6,-1.4]);
  // 墙上的挂钟：停在 1:19，是抽屉密码的线索。
  const wallClock=group(5.96,2.72,-3.05,-Math.PI/2);
  const clockBody=cyl(.44,.44,.08,'#ac9165',0,0,0,wallClock);clockBody.rotation.x=Math.PI/2;
  const clockFace=cyl(.385,.385,.015,'#f6efd9',0,0,.05,wallClock);clockFace.rotation.x=Math.PI/2;
  for(let i=0;i<12;i++){const a=i/12*Math.PI*2;const tick=box(.018,.045,.015,'#9c946f',Math.sin(a)*.32,Math.cos(a)*.32,.07,.002,wallClock);tick.rotation.z=-a;}
  for(const [angle,length,width] of [[(1+19/60)/12*Math.PI*2,.2,.032],[19/60*Math.PI*2,.28,.023]]){const hand=box(width,length,.021,'#6f7b5c',Math.sin(angle)*length/2,Math.cos(angle)*length/2,.084,.004,wallClock);hand.rotation.z=-angle;}
  ball(.035,'#b49b66',0,0,.094,wallClock);target('clock',wallClock,[5.84,2.72,-3.05]);
  // Picture inside the standing frame: two stick figures holding hands (one tall, one short).
  function frameTexture(){
    const c=document.createElement('canvas');c.width=256;c.height=340;const x=c.getContext('2d');
    x.fillStyle='#f7f1e2';x.fillRect(0,0,256,340);x.strokeStyle='#e3d9c4';x.lineWidth=6;x.strokeRect(12,12,232,316);
    x.strokeStyle='#5b5646';x.lineWidth=7;x.lineCap='round';x.lineJoin='round';
    const round=(cx,cy,r)=>{x.beginPath();x.arc(cx,cy,r,0,Math.PI*2);x.stroke();};
    const seg=(a,b,c2,d)=>{x.beginPath();x.moveTo(a,b);x.lineTo(c2,d);x.stroke();};
    round(95,92,20);seg(95,112,95,208);seg(95,140,70,112);seg(95,140,124,150);seg(95,208,76,262);seg(95,208,114,262);
    round(165,128,16);seg(165,144,165,208);seg(165,166,140,150);seg(165,166,190,138);seg(165,208,150,258);seg(165,208,180,258);
    seg(123,150,141,150);
    const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
  }
  const potting=group(3.35,.17,4.65);
  for(const x of [-.73,.73])for(const z of [-.3,.3])box(.09,.97,.09,'#ad8b62',x,.48,z,.025,potting);
  box(1.78,.11,.82,'#d2b58b',0,1,0,.045,potting);box(1.64,.07,.7,'#b7956b',0,.29,0,.025,potting);
  plant(3.85,1.24,4.7,.52);
  slipperPair(2.98,.5,4.65,'#e9b8c2');
  slipperPair(3.72,.5,4.65,'#a7c0d8');
  const can=group(2.92,1.25,4.53);
  const canBody=cyl(.18,.21,.35,'#95ac8a',0,.19,0,can);canBody.scale.z=.85;
  const canHandle=mesh(new THREE.TorusGeometry(.18,.029,8,26),'#899e7c',-.2,.27,0,can);canHandle.rotation.y=Math.PI/2;
  line([[.1,.22,0],[.3,.26,0],[.44,.43,0]],'#9bb18e',.047,can);cyl(.09,.035,.07,'#91a581',.45,.44,0,can).rotation.z=-.7;
  target('wateringCan',can,[2.94,1.96,4.53]);
  textTile('绿植角 · 请给窗边的绿植一点水',2.7,.7,3.1,2.57,5.21,Math.PI);
  let puzzleVisual={solved:[],items:[]};
  // Floating dust catches the afternoon light.
  const dustGeo=new THREE.BufferGeometry(),dustCoords=new Float32Array(60*3);
  for(let i=0;i<60;i++){dustCoords[i*3]=(Math.random()-.5)*11;dustCoords[i*3+1]=.5+Math.random()*3.5;dustCoords[i*3+2]=(Math.random()-.5)*9;}
  dustGeo.setAttribute('position',new THREE.BufferAttribute(dustCoords,3));
  const dust=new THREE.Points(dustGeo,new THREE.PointsMaterial({color:'#fff3c5',size:.025,transparent:true,opacity:.65}));root.add(dust);
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2(),reach=3.15;
  let disposed=false,frame,paused=false,focus='',lastPose=0,recordPlaying=false;
  let quality=0,slowTime=0,sampleTime=0,sampleFrames=0,contextLost=false,hiddenAt=0;
  if(offline){
    root.traverse(o=>{if(o.isMesh)o.layers.enable(1);});raycaster.layers.set(1);
    const movers=[cake,cakeCover,can,windowPlant,record,recordLabel,cat,catHat,hat,tablet,decorHost,sortHost,rocker,...bookItems.map(b=>b.group),...drawerParts,...animations.map(a=>a.g)];
    for(const g of [cake,can,windowPlant,cat,...animations.map(a=>a.g)])batchSurfaces(g,new Set(),shadeRamp);
    batchSurfaces(root,new Set(movers),shadeRamp);
  }
  let lightsOn=true,lightBlend=1,cakeOpened=false,candleBlown=false,reveal=null;
  const smooth=value=>{const n=THREE.MathUtils.clamp(value,0,1);return n*n*(3-2*n);};
  function setLights(value){lightsOn=value;rocker.rotation.x=value?-.18:.18;switchDot.material.color.set(value?'#d2e59b':'#b8a585');renderer.domElement.dataset.lightsOn=String(value);onLights?.(value);}
  function setCakeOpened(value){cakeOpened=value;cake.visible=value;cakeCover.visible=!value;renderer.domElement.dataset.cakeOpened=String(value);}
  function visibleHit(hit){let o=hit.object;while(o){if(!o.visible)return false;o=o.parent;}return true;}
  setLights(true);setCakeOpened(false);
  const visibleMarkers=new Set();
  // Dust is visual only; solid meshes block interactions through walls and furniture.
  const solids=[];root.traverse(o=>{if(o.isMesh&&!o.userData.moonPool&&!o.userData.minitoolBatch)solids.push(o);});
  function hitAt(e) {
    pointer.set(0,0);
    if(e){const p=gamePoint(renderer.domElement,e);pointer.set(p.x/p.width*2-1,-p.y/p.height*2+1);}
    raycaster.setFromCamera(pointer,camera);
    return raycaster.intersectObjects(solids,false).find(visibleHit);
  }
  function selectionAt(e){
    const hit=hitAt(e);
    if(hit?.distance<=reach&&hit.object.userData.target)return hit.object.userData.target;
    // Aiming at an object's visible marker works too, including markers above the mesh.
    for(const id of visibleMarkers){const p=anchors[id].clone().project(camera);if(Math.hypot((p.x-pointer.x)*container.clientWidth,(p.y-pointer.y)*container.clientHeight)<42)return id;}
    return '';
  }
  function interact(e){if(paused)return;const id=selectionAt(e);if(id)onSelect(id);}
  const controls=createFirstPerson(camera,renderer.domElement,{onInteract:interact,onMode});
  // Endgame: drag the five unlocked ribbons directly on the wall (mouse, pointer-lock or touch).
  let ribbonDrag=null;
  const ribbonPlane=new THREE.Plane(new THREE.Vector3(0,0,1),0);
  const ribbonMinX=sortSlotX[0]-.55,ribbonMaxX=sortSlotX[SORT_SLOTS-1]+.55;
  function applyOrder(order){for(const r of ribbons){const slot=Array.isArray(order)?order.indexOf(r.number):-1;r.slot=slot>=0?slot:null;r.target=r.slot!=null?1:0;}}
  function ribbonsSortable(){const s=puzzleVisual;return !paused&&Array.isArray(s?.order)&&Array.isArray(s?.solved)&&s.solved.length===5&&!s.sorted;}
  function ribbonNDC(e){if(document.pointerLockElement===renderer.domElement)return new THREE.Vector2(0,0);const p=gamePoint(renderer.domElement,e);return new THREE.Vector2(p.x/p.width*2-1,-p.y/p.height*2+1);}
  function ribbonHit(ndc){
    raycaster.setFromCamera(ndc,camera);
    const hits=raycaster.intersectObjects(solids,false).find(visibleHit);
    if(!hits)return null;
    let o=hits.object;while(o){if(o.userData.ribbon!=null)return {number:o.userData.ribbon,object:o,distance:hits.distance};o=o.parent;}
    return null;
  }
  function planePointAt(z,ndcX,ndcY){
    ribbonPlane.constant=-z;
    raycaster.setFromCamera(new THREE.Vector2(ndcX,ndcY),camera);
    return raycaster.ray.intersectPlane(ribbonPlane,new THREE.Vector3());
  }
  const planePoint=(ndcX,ndcY)=>planePointAt(sortHost.position.z,ndcX,ndcY);
  const bookNDC=e=>{if(document.pointerLockElement===renderer.domElement)return new THREE.Vector2(0,0);const p=gamePoint(renderer.domElement,e);return new THREE.Vector2(p.x/p.width*2-1,-p.y/p.height*2+1);};
  function onRibbonDown(e){
    if(ribbonDrag)return;
    if(e.pointerType==='mouse'&&e.button!==0)return;
    if(!ribbonsSortable())return;
    const hit=ribbonHit(ribbonNDC(e));
    if(!hit||hit.distance>reach*2.2)return; // ribbons span the wall; allow grabbing along it
    const fromSlot=puzzleVisual.order.indexOf(hit.number);
    if(fromSlot<0)return;
    e.stopPropagation();e.preventDefault();
    const locked=document.pointerLockElement===renderer.domElement;
    const c0=planePoint(0,0),c1=planePoint(.2,0);
    const worldPerPixelX=(c0&&c1)?Math.abs((c1.x-c0.x)/(.2*Math.max(container.clientWidth,1)/2)):.02;
    hit.object.position.z=.22;hit.object.scale.setScalar(1.08);
    ribbonDrag={number:hit.number,object:hit.object,fromSlot,pointerId:e.pointerId,locked,startX:hit.object.position.x,accum:0,worldPerPixelX};
    for(const r of ribbons)r.dragging=r.number===hit.number;
    if(!locked){try{container.setPointerCapture(e.pointerId);}catch{}}
  }
  function onRibbonMove(e){
    if(!ribbonDrag||e.pointerId!==ribbonDrag.pointerId)return;
    e.stopPropagation();e.preventDefault();
    const d=ribbonDrag;
    if(d.locked){d.accum+=e.movementX||0;d.object.position.x=THREE.MathUtils.clamp(d.startX+d.accum*d.worldPerPixelX*1.35,ribbonMinX,ribbonMaxX);return;}
    const p=gamePoint(renderer.domElement,e);
    const pt=planePoint(p.x/p.width*2-1,-p.y/p.height*2+1);
    if(pt){d.object.position.x=THREE.MathUtils.clamp(pt.x,ribbonMinX,ribbonMaxX);d.object.position.y=THREE.MathUtils.clamp(pt.y,sortSlotY[SORT_SLOTS-1]-.5,sortSlotY[0]+.25);}
  }
  function onRibbonUp(e){
    if(!ribbonDrag||e.pointerId!==ribbonDrag.pointerId)return;
    e.stopPropagation();e.preventDefault();
    const d=ribbonDrag;ribbonDrag=null;
    for(const r of ribbons)r.dragging=false;
    d.object.scale.setScalar(1);d.object.position.z=0;
    try{if(container.hasPointerCapture?.(d.pointerId))container.releasePointerCapture(d.pointerId);}catch{}
    let target=0,best=1e9;for(let i=0;i<SORT_SLOTS;i++){const dd=Math.abs(d.object.position.x-sortSlotX[i]);if(dd<best){best=dd;target=i;}}
    const order=[...(puzzleVisual.order||[])],cur=order.indexOf(d.number),occupied=order[target];
    if(cur<0||target===cur){d.object.position.x=sortSlotX[d.fromSlot];d.object.position.y=sortSlotY[d.fromSlot];return;}
    order[target]=d.number;order[cur]=occupied;
    puzzleVisual={...puzzleVisual,order};
    applyOrder(order);
    onRibbonsChange?.(order);
  }
  container.addEventListener('pointerdown',onRibbonDown,true);
  container.addEventListener('pointermove',onRibbonMove,true);
  container.addEventListener('pointerup',onRibbonUp,true);
  container.addEventListener('pointercancel',onRibbonUp,true);
  // Bookshelf: first and third shelves are sorted directly, low->high, like the ribbons.
  let bookDrag=null;
  const bookMinX=BOOK_SLOT_WORLD[0]-.16,bookMaxX=BOOK_SLOT_WORLD[BOOK_SLOT_WORLD.length-1]+.16;
  function applyBooks(shelves){
    if(!shelves)return;
    for(const b of bookItems){const arr=shelves[b.key];const slot=Array.isArray(arr)?arr.indexOf(b.id):-1;b.slot=slot>=0?slot:b.slot;}
  }
  function booksSolved(){return Array.isArray(puzzleVisual.solved)&&puzzleVisual.solved.includes('books');}
  function bookHit(ndc){
    raycaster.setFromCamera(ndc,camera);
    const hits=raycaster.intersectObjects(solids,false).find(visibleHit);
    if(!hits)return null;
    let o=hits.object;while(o){if(o.userData.book!=null)return {item:o,distance:hits.distance};o=o.parent;}
    return null;
  }
  function onBookDown(e){
    if(bookDrag||ribbonDrag||booksSolved())return;
    if(e.pointerType==='mouse'&&e.button!==0)return;
    if(!Array.isArray(puzzleVisual.shelves?.first))return;
    const hit=bookHit(bookNDC(e));
    if(!hit||hit.distance>reach*1.6)return;
    const item=bookItems.find(b=>b.group===hit.item);if(!item)return;
    e.stopPropagation();e.preventDefault();
    const locked=document.pointerLockElement===renderer.domElement;
    const c0=planePointAt(BOOK_PLANE_Z,0,0),c1=planePointAt(BOOK_PLANE_Z,.2,0);
    const worldPerPixelX=(c0&&c1)?Math.abs((c1.x-c0.x)/(.2*Math.max(container.clientWidth,1)/2)):.02;
    item.group.position.z=.12;item.group.scale.setScalar(1.08);
    bookDrag={item,pointerId:e.pointerId,locked,startX:item.group.position.x,accum:0,worldPerPixelX};
    item.dragging=true;
    if(!locked){try{container.setPointerCapture(e.pointerId);}catch{}}
  }
  function onBookMove(e){
    if(!bookDrag||e.pointerId!==bookDrag.pointerId)return;
    e.stopPropagation();e.preventDefault();
    const d=bookDrag;
    if(d.locked){d.accum+=e.movementX||0;d.item.group.position.x=THREE.MathUtils.clamp(d.startX+d.accum*d.worldPerPixelX*1.35,bookMinX-4.87,bookMaxX-4.87);return;}
    const p=gamePoint(renderer.domElement,e);
    const pt=planePointAt(BOOK_PLANE_Z,p.x/p.width*2-1,-p.y/p.height*2+1);
    if(pt)d.item.group.position.x=THREE.MathUtils.clamp(pt.x-4.87,bookMinX-4.87,bookMaxX-4.87);
  }
  function onBookUp(e){
    if(!bookDrag||e.pointerId!==bookDrag.pointerId)return;
    e.stopPropagation();e.preventDefault();
    const d=bookDrag;bookDrag=null;
    const item=d.item;item.dragging=false;item.group.scale.setScalar(1);item.group.position.z=.06;
    try{if(container.hasPointerCapture?.(d.pointerId))container.releasePointerCapture(d.pointerId);}catch{}
    let target=0,best=1e9;for(let i=0;i<BOOK_SLOT_LOCAL.length;i++){const dd=Math.abs(item.group.position.x-BOOK_SLOT_LOCAL[i]);if(dd<best){best=dd;target=i;}}
    const shelves={first:[...puzzleVisual.shelves.first],third:[...puzzleVisual.shelves.third]};
    const arr=shelves[item.key],cur=arr.indexOf(item.id),occupied=arr[target];
    if(cur<0||target===cur){item.group.position.x=BOOK_SLOT_LOCAL[item.slot];return;}
    arr[target]=item.id;arr[cur]=occupied;
    puzzleVisual={...puzzleVisual,shelves};
    applyBooks(shelves);
    onBooksChange?.(shelves);
  }
  container.addEventListener('pointerdown',onBookDown,true);
  container.addEventListener('pointermove',onBookMove,true);
  container.addEventListener('pointerup',onBookUp,true);
  container.addEventListener('pointercancel',onBookUp,true);
  const lost=e=>{e.preventDefault();contextLost=true;cancelAnimationFrame(frame);onError('3D 画面暂时中断了。已找到的礼物会保留，可继续轻量探索。');};renderer.domElement.addEventListener('webglcontextlost',lost);
  const restored=()=>{contextLost=false;onError('图形环境已恢复，可以重新加载，或继续轻量探索。');};renderer.domElement.addEventListener('webglcontextrestored',restored);
  function resize(){const w=container.clientWidth,h=container.clientHeight;if(offline)renderer.setPixelRatio(Math.min(devicePixelRatio,quality?1:1.5,Math.sqrt((quality?1000000:2000000)/Math.max(w*h,1))));renderer.setSize(w,h);camera.aspect=w/Math.max(h,1);camera.fov=w<600?78:70;camera.updateProjectionMatrix();}
  const observer=typeof ResizeObserver!=='undefined'?new ResizeObserver(resize):{observe(){window.addEventListener('resize',resize);},disconnect(){window.removeEventListener('resize',resize);}};observer.observe(container);resize();
  const start=performance.now();let previous=start;
  const visibility=()=>{if(document.hidden){hiddenAt=performance.now();cancelAnimationFrame(frame);}else if(!disposed&&!contextLost){previous=performance.now();if(reveal&&hiddenAt)reveal.start+=previous-hiddenAt;hiddenAt=0;sampleTime=sampleFrames=slowTime=0;frame=requestAnimationFrame(render);}};document.addEventListener('visibilitychange',visibility);
  function render(now) {
    if(disposed||contextLost||document.hidden)return;frame=requestAnimationFrame(render);const elapsed=(now-previous)/1000,t=(now-start)/1000,dt=Math.min(elapsed,.05);
    if(offline){sampleTime+=elapsed;sampleFrames++;if(sampleTime>=3){const fps=sampleFrames/sampleTime;slowTime=fps<24?slowTime+sampleTime:0;sampleTime=sampleFrames=0;if(slowTime>=3&&quality===0){quality=1;slowTime=0;dust.visible=false;animations.forEach(a=>a.g.visible=false);resize();}else if(slowTime>=6&&quality===1){cancelAnimationFrame(frame);onError('当前图形性能较低，已切换到轻量探索。');return;}}}
    controls.update(dt);previous=now;
    if(reveal){
      const progress=Math.min(1,(now-reveal.start)/reveal.duration),lift=smooth(progress/.48),unfold=smooth((progress-.2)/.55),fade=smooth((progress-.58)/.35);
      controls.focusOn(new THREE.Vector3(.24,1.48,.48),reducedMotion?1:1-Math.exp(-dt*5));
      cakeLid.position.y=.94+lift*1.15;cakeLid.rotation.set(lift*-.22,lift*.45,lift*.12);
      coverPanels.forEach(({hinge,axis,sign})=>{hinge.rotation[axis]=sign*unfold*Math.PI*.48;});
      coverPaper.opacity=coverRibbon.opacity=1-fade;cake.visible=progress>.18;cake.scale.setScalar(.86+.14*smooth((progress-.18)/.65));
      renderer.domElement.dataset.revealProgress=progress.toFixed(3);
      if(progress===1){const done=reveal.resolve;reveal=null;cake.scale.setScalar(1);setCakeOpened(true);renderer.domElement.dataset.revealing='false';done(true);}
    }
    lightBlend+=(Number(lightsOn)-lightBlend)*(reducedMotion?1:1-Math.exp(-dt*2.8));
    hemi.intensity=1.6*lightBlend;sun.intensity=1.1*lightBlend;fill.intensity=.35*lightBlend;innerLight.intensity=2*lightBlend;lamp.intensity=2*lightBlend;
    const nightBlend=1-lightBlend;moonFill.intensity=.28*nightBlend;moonLight.intensity=.48*nightBlend;moonPoolMaterial.opacity=.12*nightBlend;
    skyMaterial.color.copy(daySky).lerp(nightSky,nightBlend);moonMaterial.color.copy(dayDisc).lerp(nightDisc,nightBlend);moonCutMaterial.color.copy(skyMaterial.color);moonCutMaterial.opacity=starMaterial.opacity=nightBlend;
    const candleActive=cake.visible&&!candleBlown;
    const nightShade=45;shadeRamp.image.data[0]=Math.round(nightShade+(185-nightShade)*lightBlend);shadeRamp.image.data[1]=Math.round(125+105*lightBlend);shadeRamp.needsUpdate=true;
    candleLight.intensity=candleActive?5.5*(reducedMotion?1:1+Math.sin(t*8)*.035+Math.sin(t*13)*.025):0;
    candleGlow.visible=flame.visible=candleActive;dust.material.opacity=.65*lightBlend;
    renderer.domElement.dataset.candleLit=String(candleActive);renderer.domElement.dataset.lightLevel=lightBlend.toFixed(3);
    if(recordPlaying&&!reducedMotion&&!quality){record.rotation.y+=dt*1.65;recordLabel.rotation.y=record.rotation.y;}
    const blend=reducedMotion?1:.13;
    for(const part of drawerParts){const destination=puzzleVisual.solved.includes('drawer')?.34:0;part.position.z+=(destination-part.position.z)*blend;}
    for(const b of bookItems){if(!b.dragging)b.group.position.x+=(BOOK_SLOT_LOCAL[b.slot]-b.group.position.x)*(reducedMotion?1:blend);}
    for(const r of ribbons){
      r.appear+=(r.target-r.appear)*(reducedMotion?1:1-Math.exp(-dt*3));
      if(Math.abs(r.target-r.appear)<.004)r.appear=r.target;
      r.group.visible=r.appear>.01;
      for(const m of r.mats)m.opacity=r.appear;
      if(!r.dragging&&r.slot!=null){r.group.position.x+=(sortSlotX[r.slot]-r.group.position.x)*(reducedMotion?1:blend);r.group.position.y+=(sortSlotY[r.slot]-r.group.position.y)*(reducedMotion?1:blend);r.group.position.z+=(0-r.group.position.z)*(reducedMotion?1:blend);}
    }
    if(!reducedMotion&&!quality) {animations.forEach(({g,y,phase})=>{g.position.y=y+Math.sin(t*1.3+phase)*.055;g.rotation.z=Math.sin(t*.8+phase)*.025;});cat.scale.y=1+Math.sin(t*1.6)*.018;flame.scale.y=1.4+Math.sin(t*9)*.18;dust.rotation.y=t*.006;}
    scene.updateMatrixWorld();
    visibleMarkers.clear();
    Object.entries(anchors).forEach(([id,pos])=>{
      const el=markerElements[id];if(!el)return;const p=pos.clone().project(camera),distance=pos.distanceTo(camera.position);
      let visible=!paused&&(id==='cake'||targets[id]?.visible!==false)&&distance<reach&&p.z>-1&&p.z<1&&Math.abs(p.x)<.92&&Math.abs(p.y)<.83;
      if(visible){raycaster.set(camera.position,pos.clone().sub(camera.position).normalize());const block=raycaster.intersectObjects(solids,false).find(visibleHit);visible=!block||block.distance>=distance-.12||block.object.userData.target===id;}
      el.style.transform=`translate(-50%, -50%) translate(${(p.x*.5+.5)*container.clientWidth}px, ${(-p.y*.5+.5)*container.clientHeight}px)`;
      el.style.visibility=visible?'visible':'hidden';
      el.tabIndex=visible?0:-1;if(visible)visibleMarkers.add(id);
    });
    const id=paused?'':selectionAt();
    if(focus!==id){focus=id;onFocus(id);}
    if(import.meta.env.DEV && now-lastPose>100){renderer.domElement.dataset.pose=JSON.stringify(controls.getState());lastPose=now;}
    if(inkEffect)inkEffect.render(scene,camera);else renderer.render(scene,camera);
    if(offline&&now-lastPose>500){renderer.domElement.dataset.gpu=JSON.stringify({quality,calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,pixels:renderer.domElement.width*renderer.domElement.height,textures:renderer.info.memory.textures});lastPose=now;}
  }
  if(offline){renderer.debug.onShaderError=()=>{contextLost=true;cancelAnimationFrame(frame);onError('画面暂时无法显示，正在切换轻量探索。');};renderer.compile(scene,camera);}frame=requestAnimationFrame(render);onReady();
  return {
    enter:()=>{if(!reveal)controls.enter();},
    resetView:()=>{if(!reveal)controls.reset();},
    setPaused(value){paused=value;controls.setPaused(value);},
    setMove:controls.setMove,
    interact:controls.interact,
    selectMarker(id){if(!paused&&visibleMarkers.has(id))onSelect(id);},
    setPuzzleState(state){puzzleVisual=state;can.visible=!state.items.includes('wateringCan');windowPlant.scale.y=state.solved.includes('plant')?.77:.59;
      applyOrder(state.order);
      applyBooks(state.shelves);
      hat.visible=!state.items.includes('hat');
      catHat.visible=state.solved.includes('cat');
    },
    setRecordPlaying(value){recordPlaying=value;renderer.domElement.dataset.recordPlaying=String(value);},
    toggleLights:()=>setLights(!lightsOn),
    restoreCake(value,blown){if(!reveal){setCakeOpened(value);candleBlown=blown;}},
    revealCake(){if(reveal)return reveal.promise;setLights(false);candleBlown=false;if(cakeOpened)return Promise.resolve(true);let resolve;const promise=new Promise(done=>resolve=done);reveal={start:performance.now(),duration:reducedMotion?150:3600,resolve,promise};renderer.domElement.dataset.revealing='true';return promise;},
    celebrate:()=>{candleBlown=true;setLights(true);},
    reset:()=>{if(reveal){reveal.resolve(false);reveal=null;}renderer.domElement.dataset.revealing='false';setCakeOpened(false);candleBlown=false;cake.scale.setScalar(1);cakeLid.position.y=.94;cakeLid.rotation.set(0,0,0);coverPanels.forEach(({hinge})=>hinge.rotation.set(0,0,0));coverPaper.opacity=coverRibbon.opacity=1;setLights(true);recordPlaying=false;record.rotation.y=0;recordLabel.rotation.y=0;controls.reset();},
    dispose:()=>{if(disposed)return;disposed=true;if(reveal){reveal.resolve(false);reveal=null;}cancelAnimationFrame(frame);observer.disconnect();controls.dispose();renderer.domElement.removeEventListener('webglcontextlost',lost);renderer.domElement.removeEventListener('webglcontextrestored',restored);document.removeEventListener('visibilitychange',visibility);container.removeEventListener('pointerdown',onRibbonDown,true);container.removeEventListener('pointermove',onRibbonMove,true);container.removeEventListener('pointerup',onRibbonUp,true);container.removeEventListener('pointercancel',onRibbonUp,true);container.removeEventListener('pointerdown',onBookDown,true);container.removeEventListener('pointermove',onBookMove,true);container.removeEventListener('pointerup',onBookUp,true);container.removeEventListener('pointercancel',onBookUp,true);shadeRamp.dispose();const geos=new Set(),mats=new Set();scene.traverse(o=>{if(o.geometry)geos.add(o.geometry);if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>mats.add(m));});geos.forEach(g=>g.dispose());mats.forEach(m=>{m.map?.dispose();m.dispose();});renderer.dispose();renderer.domElement.remove();},
  };
}
