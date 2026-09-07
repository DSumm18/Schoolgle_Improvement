import {ASSET_BASE} from './asset-paths.js';
import * as THREE from 'three';

// Original decorative motifs, not a transcription of an ancient inscription.
// Geometry, canvas marks and lighting are authored for this fictional story map.
export function addEgyptianAtmosphere(w){
 const stone=0xbb854b,lapis=0x163b57,gold=0xc79644,ochre=0xb95730;
 // Ground detail anchors each place in the landscape. These are flush surfaces,
 // not new obstacles: the guided route and accessible controls stay unchanged.
 addCourtsAndVillage(w);
 const texture=inscriptionTexture();texture.colorSpace=THREE.SRGBColorSpace;
 const carved=new THREE.MeshStandardMaterial({map:texture,roughness:1});
 const panel=(x,y,z,width,height,parent)=>w.add(new THREE.PlaneGeometry(width,height),carved,x,y,z,parent);
 const column=(x,z,height=7)=>{
  const g=new THREE.Group();g.position.set(x,0,z);w.scene.add(g);
  w.cyl(0,.18,0,.95,1.05,.36,stone,g);w.cyl(0,height/2,0,.52,.7,height,0xc39962,g);
  for(let y of [1,1.24,height-1.2,height-.95])w.cyl(0,y,0,.66,.66,.12,lapis,g);
  w.cyl(0,height-.25,0,1,.55,.8,stone,g);w.cyl(0,height+.18,0,1,1,.15,gold,g);
  panel(0,height/2,.705,.66,height*.57,g);w.mergeStaticGroup(g);
  w.colliders.push({x,z,hx:.85,hz:.85,height:height+.4});
 };
 const obelisk=(x,z,height)=>{
  const g=new THREE.Group();g.position.set(x,0,z);w.scene.add(g);
  w.box(0,.25,0,2.7,.5,2.7,stone,g);w.box(0,.65,0,2.1,.3,2.1,0xd0aa6c,g);
  const shaft=w.add(new THREE.CylinderGeometry(.56,.81,height,4),0xc99c62,0,height/2+.8,0,g);shaft.rotation.y=Math.PI/4;
  const cap=w.add(new THREE.ConeGeometry(.8,1.3,4),gold,0,height+1.45,0,g);cap.rotation.y=Math.PI/4;
  panel(0,height/2+.8,.575,.71,height*.88,g);const back=panel(0,height/2+.8,-.575,.71,height*.88,g);back.rotation.y=Math.PI;
  w.mergeStaticGroup(g);w.colliders.push({x,z,hx:1.4,hz:1.4,height:height+2.1});
 };
 obelisk(19,42,8);obelisk(33,3,10);obelisk(53,3,10);
 // The temple forecourt remains an open route to the existing science station.
 for(const x of [49,67])for(const z of [-7,-12])column(x,z,8.1);
 w.box(58,8.6,-7,20,.9,2.4,stone);w.box(58,9.08,-7,20.3,.16,2.65,gold);
 panel(58,8.6,-5.78,19,.63);
 const ceilingTexture=paintedCeilingTexture();ceilingTexture.colorSpace=THREE.SRGBColorSpace;
 const ceiling=w.add(new THREE.PlaneGeometry(16.6,6.8),new THREE.MeshStandardMaterial({map:ceilingTexture,roughness:.9,side:THREE.DoubleSide}),58,8.04,-9.5);ceiling.rotation.x=Math.PI/2;
 // Warm stone steps and a deep blue cornice frame the threshold as a destination.
 w.box(58,8.05,-5.72,18,.26,.18,lapis);
 for(const x of [49,67])w.box(x,8.6,-7,1.15,1.1,2.7,0xc49960);
 for(const x of [54.2,61.8]){
  panel(x,3.75,-30.77,2.5,5.3);
  w.box(x,6.65,-30.70,3.22,.17,.12,lapis);
  w.colliders.push({x,z:-32,hx:1.6,hz:1.2,height:7.2});
 }
 // A glowing carved door lifts with the existing earned world reward.
 w.tombDoor.material.color.setHex(lapis);
 const doorArt=panel(0,0,.22,3.7,5.1,w.tombDoor);doorArt.material=new THREE.MeshStandardMaterial({map:texture,color:0xb68a41,emissive:0x704612,emissiveIntensity:.14,roughness:.8});
 for(const x of [-1.9,1.9])w.box(x,0,.27,.11,5.3,.12,gold,w.tombDoor);
 const sunDisc=w.disc(.56,0xedba55);sunDisc.position.set(0,.3,.31);w.tombDoor.add(sunDisc);
 const tombLight=new THREE.PointLight(0xffa144,22,20,1.8);tombLight.position.set(58,4,-26);w.scene.add(tombLight);
 // Earth pigments and blue bands give the village a connection to the temple.
 for(const [x,z,width]of [[26,39.53,6],[34,39.53,5],[33,48.53,7]]){
  w.box(x,3.03,z,width,.18,.04,ochre);w.box(x,2.8,z,width,.08,.05,lapis);
  panel(x,3.34,z+.01,width*.85,.26);
 }
 for(const [x,z]of [[26,17],[35,17]]){w.cyl(x,.8,z,.58,.33,1.6,0xa65b35);w.cyl(x,1.6,z,.35,.37,.16,lapis);}
 // A decorative winged sun over the door; no magical learning claims.
 for(const side of [-1,1])for(let i=0;i<5;i++){
  const wing=w.box(58+side*(.9+i*.45),7.35-i*.045,-30.57,.62,.13,.10,i%2?lapis:gold);wing.rotation.z=side*.11;
 }
 // Distant mountains break up the empty horizon without entering play space.
 const ridge=new THREE.Group();w.scene.add(ridge);
 for(let i=0;i<9;i++){
  const rock=w.add(new THREE.DodecahedronGeometry(1),i%2?0x9b725a:0xa77a59,20+i*23,-3,-158-(i%3)*9,ridge);rock.scale.set(27+i%3*4,14+i%4*4,16);rock.rotation.z=(i%3-1)*.13;rock.rotation.y=i*.8;
 }
 w.mergeStaticGroup(ridge);
 // A single original sky shader keeps the cloud layers inexpensive on tablets.
 // The low wisps stay visible from the normal walking camera, below the high sky.
 const skyMaterial=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms:{daylight:{value:0},time:{value:0}},vertexShader:`varying vec3 skyPosition;void main(){skyPosition=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`
 uniform float daylight;uniform float time;varying vec3 skyPosition;
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+1.),f.x),f.y);}
 float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*noise(p);p=p*2.03+vec2(13.1,7.7);a*=.5;}return v;}
 void main(){
  vec3 d=normalize(skyPosition);float h=d.y;
  vec3 horizon=mix(vec3(.86,.49,.25),vec3(.68,.80,.81),daylight);
  vec3 upper=mix(vec3(.16,.29,.40),vec3(.13,.40,.64),daylight);
  vec3 c=mix(horizon,upper,smoothstep(-.04,.60,h));
  float solar=max(0.,dot(d,normalize(vec3(-62.,31.,-190.))));
  c+=vec3(.42,.22,.075)*pow(solar,32.)*(1.-daylight*.35);
  // Two elongated layers drift slowly in slightly different directions. No flash,
  // texture downloads or frame-dependent noise, so reduced motion freezes exactly.
  vec2 p=d.xz/max(h+.16,.08)*vec2(1.45,3.8);
  float lower=fbm(p+vec2(time*.006,0.));
  float upperWisp=fbm(p*1.65+vec2(17.,time*.004));
  float cloud=smoothstep(.49,.73,lower+upperWisp*.19)*smoothstep(.006,.045,h)*(1.-smoothstep(.36,.70,h));
  float fine=noise(p*7.+vec2(time*.006,0.));cloud*=.65+.35*fine;
  vec3 cloudColor=mix(vec3(1.,.74,.45),vec3(.93,.98,1.),daylight);
  c=mix(c,cloudColor,cloud*.52);
  float disc=smoothstep(.99932,.99955,solar);c=mix(c,vec3(1.,.88,.56),disc*.96);
  gl_FragColor=vec4(c,1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
 }`});
 const sky=new THREE.Mesh(new THREE.SphereGeometry(290,32,20),skyMaterial);sky.name='Nile sky · drifting high wisps';sky.frustumCulled=false;sky.renderOrder=-10;w.scene.add(sky);
 return {update(ambient){skyMaterial.uniforms.time.value=ambient;},setLighting(mode){
  const day=mode==='day';skyMaterial.uniforms.daylight??={value:0};skyMaterial.uniforms.daylight.value=day?1:0;
  w.renderer.toneMappingExposure=day?1.18:1.03;
  w.hemisphere.intensity=day?2.3:1.55;w.sun.intensity=day?3.5:2.8;
  w.sun.color.setHex(day?0xffe2b6:0xffc77f);w.sun.position.set(day?-35:-65,day?75:48,day?35:-35);
  w.scene.fog.color.setHex(day?0xddccad:0xc59a73);w.scene.fog.density=day?.0032:.0038;
  tombLight.intensity=day?16:22;
 },async loadSphinx(loader){
  const gltf=await loader.loadAsync(ASSET_BASE+'models/sphinx.glb');const sphinx=gltf.scene;sphinx.name='Sphinx landmark';sphinx.scale.setScalar(1.6);sphinx.position.set(43,0,3);sphinx.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});w.scene.add(sphinx);
  sphinx.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(sphinx),size=box.getSize(new THREE.Vector3()),centre=box.getCenter(new THREE.Vector3());
  w.colliders.push({x:centre.x,z:centre.z,hx:size.x/2,hz:size.z/2,height:box.max.y});
  return {name:sphinx.name,dimensions:size.toArray()};
 }};
}

function addCourtsAndVillage(w){
 const sand=sandTexture();sand.colorSpace=THREE.SRGBColorSpace;sand.wrapS=sand.wrapT=THREE.RepeatWrapping;sand.repeat.set(22,22);sand.anisotropy=Math.min(4,w.renderer.capabilities.getMaxAnisotropy());
 const land=w.scene.children.find(m=>m.isMesh&&m.material.vertexColors&&m.geometry.type==='PlaneGeometry');
 if(land){land.material.map=sand;land.material.needsUpdate=true;}
 const pathSand=sand.clone();pathSand.repeat.set(1,1);pathSand.needsUpdate=true;
 const edgeCanvas=document.createElement('canvas');edgeCanvas.width=128;edgeCanvas.height=8;const edgeContext=edgeCanvas.getContext('2d'),fade=edgeContext.createLinearGradient(0,0,128,0);fade.addColorStop(0,'black');fade.addColorStop(.16,'white');fade.addColorStop(.84,'white');fade.addColorStop(1,'black');edgeContext.fillStyle=fade;edgeContext.fillRect(0,0,128,8);
 const pathMaterial=new THREE.MeshStandardMaterial({color:0xc5a06b,map:pathSand,alphaMap:new THREE.CanvasTexture(edgeCanvas),transparent:true,depthWrite:false,roughness:1});
 const path=(points,width)=>{
  const curve=new THREE.CatmullRomCurve3(points.map(([x,z])=>new THREE.Vector3(x,-.095,z))),positions=[],uvs=[],indices=[];
  for(let i=0;i<=64;i++){const t=i/64,p=curve.getPoint(t),v=curve.getTangent(t);for(const side of [-1,1]){positions.push(p.x+v.z*width/2*side,p.y,p.z-v.x*width/2*side);uvs.push((side+1)/2,t*10);}if(i<64){const n=i*2;indices.push(n,n+2,n+1,n+1,n+2,n+3);}}
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geometry.setIndex(indices);geometry.computeVertexNormals();const mesh=w.add(geometry,pathMaterial,0,0,0);mesh.castShadow=false;
 };
 path([[14,53],[17,44],[17,36],[19,23],[26,19],[38,18],[50,17],[58,9],[58,-23]],3.3);
 path([[4,18],[14,19],[26,19]],2.6);
 path([[60,-22],[63,-34],[55,-43],[44,-45],[27,-49],[23,-54]],2.7);
 // A paved forecourt and processional strip join the gateway to the tomb.
 const court=new THREE.Group();w.scene.add(court);
 for(let row=0;row<16;row++)for(let col=0;col<8;col++){
  const x=50.1+col*2.25,z=-3.2-row*1.62;
  // Do not paint paving over the neighbouring pyramid's occupied footprint.
  if(x<56&&z< -15)continue;
  const tile=w.box(x,-.054,z,2.18,.12,1.55,[0xd8bd8a,0xdcc596,0xcdb280,0xe1ca9c][(row*7+col*3)%4],court);tile.castShadow=false;
 }
 for(const x of [56.8,60.9]){w.box(x,.035,-16,.12,.022,24,0x285367,court);w.box(x+.18,.036,-16,.07,.022,24,0xc39850,court);}
 // A fictional sun-and-water mosaic, deliberately geometric rather than an
 // invented translated message or historical reconstruction.
 const mosaic=new THREE.Group();mosaic.position.set(58.8,.045,-10.5);w.scene.add(mosaic);
 for(const [radius,thickness,color]of [[2.4,.12,0x245568],[2.13,.035,0xc18e44],[.95,.08,0x245568]]){
  const ring=w.add(new THREE.RingGeometry(radius-thickness,radius,64),color,0,0,0,mosaic);ring.rotation.x=-Math.PI/2;ring.castShadow=false;
 }
 const disc=w.disc(.8,0xbd8c3e);disc.rotation.x=-Math.PI/2;disc.position.y=.003;mosaic.add(disc);
 for(let i=0;i<16;i++){const angle=i*Math.PI/8,ray=w.box(Math.sin(angle)*1.48,.004,Math.cos(angle)*1.48,.095,.02,.58,i%2?0xbc8a43:0x285367,mosaic);ray.rotation.y=angle;ray.castShadow=false;}
 w.mergeStaticGroup(court);w.mergeStaticGroup(mosaic);
 // Cloth awnings sit above head height and attach to existing houses. Their
 // striped canopy shapes add village life without narrowing walking space.
 const clothMaterials=new Map();
 const awning=(x,z,width,color)=>{
  const group=new THREE.Group();group.position.set(x,0,z);w.scene.add(group);
  for(let strip=0;strip<10;strip++){
   const vertices=[],indices=[];
   for(let row=0;row<=8;row++){const t=row/8,y=3.38-t*.32-Math.sin(t*Math.PI)*.13;for(const side of [0,1])vertices.push(-width/2+(strip+side)*width/10,y,t*2.3);if(row<8){let n=row*2;indices.push(n,n+2,n+1,n+1,n+2,n+3);}}
   const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setIndex(indices);geometry.computeVertexNormals();const shade=strip%2?0xe7d4a0:color;if(!clothMaterials.has(shade))clothMaterials.set(shade,new THREE.MeshStandardMaterial({color:shade,side:THREE.DoubleSide,roughness:1}));w.add(geometry,clothMaterials.get(shade),0,0,0,group);
  }
  w.box(0,3.08,2.3,width,.09,.09,0x6e5335,group);
  for(const side of [-1,1]){const brace=w.box(side*(width/2-.16),3.13,1.1,.055,.055,2.3,0x6e5335,group);brace.rotation.x=.13;}
  w.mergeStaticGroup(group);
 };
 awning(26,39.56,5.4,0xa55338);awning(34,39.56,4.4,0x345e67);awning(46,33.06,6,0xb3873d);
 // The scribe's existing canopy gains a patterned cloth edge and a woven mat.
 const textile=wovenTexture();textile.colorSpace=THREE.SRGBColorSpace;
 const textileMaterial=new THREE.MeshStandardMaterial({map:textile,roughness:1,side:THREE.DoubleSide});
 const rug=w.add(new THREE.PlaneGeometry(5.5,3.5),textileMaterial,30.5,.249,14.2);rug.rotation.x=-Math.PI/2;rug.castShadow=false;
 w.add(new THREE.PlaneGeometry(7.8,.48),textileMaterial,30.5,4.77,17.51);
 // Painted lintels and roof reeds use existing wall footprints only.
 for(const [x,z,width,depth]of [[26,37,6,5],[34,37,5,5],[33,46,7,5],[21,30,4,4],[46,30,7,6]]){
  w.box(x,2.02,z+depth/2+.075,1.5,.17,.1,0xc6a16a);
  for(let i=0;i<7;i++)w.box(x-width*.36+i*width*.12,3.69,z,.10,.075,depth*.72,0xb48f5b);
 }
}

function sandTexture(){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=512;const c=canvas.getContext('2d');c.fillStyle='#f3e9d5';c.fillRect(0,0,512,512);
 let seed=918;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 for(let i=0;i<10000;i++){c.fillStyle=i%2?'#a9997321':'#ffffff35';c.fillRect(rand()*512,rand()*512,1+rand(),1+rand());}
 for(let row=0;row<32;row++){c.strokeStyle='#b8a78118';c.lineWidth=1;c.beginPath();for(let x=0;x<=512;x+=8){const y=row*16+Math.sin(x/512*Math.PI*4+row*.48)*3;x?c.lineTo(x,y):c.moveTo(x,y);}c.stroke();}
 return new THREE.CanvasTexture(canvas);
}

function wovenTexture(){
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=256;const c=canvas.getContext('2d');c.fillStyle='#bc714b';c.fillRect(0,0,512,256);
 for(let y=0;y<256;y+=4){c.fillStyle=y%8?'#d99a67':'#a96243';c.fillRect(0,y,512,1);}
 for(let y of [12,22,232,242]){c.fillStyle='#e5c481';c.fillRect(8,y,496,4);}
 for(let x=30;x<500;x+=36){c.fillStyle='#254d59';c.beginPath();c.moveTo(x,90);c.lineTo(x+15,128);c.lineTo(x,166);c.lineTo(x-15,128);c.closePath();c.fill();c.fillStyle='#e5c481';c.fillRect(x-3,121,6,14);}
 return new THREE.CanvasTexture(canvas);
}

function paintedCeilingTexture(){
 const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=384;const c=canvas.getContext('2d');c.fillStyle='#1e435a';c.fillRect(0,0,1024,384);c.strokeStyle='#bb9349';c.lineWidth=12;c.strokeRect(14,14,996,356);c.lineWidth=3;c.strokeRect(30,30,964,324);
 for(let row=0;row<5;row++)for(let col=0;col<14;col++){const x=62+col*68+(row%2?22:0),y=65+row*62;c.fillStyle='#d6ba72';c.beginPath();for(let k=0;k<10;k++){const a=k*Math.PI/5-Math.PI/2,r=k%2?3:10;c.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r);}c.closePath();c.fill();}
 return new THREE.CanvasTexture(canvas);
}

function inscriptionTexture(){
 const canvas=document.createElement('canvas');canvas.width=384;canvas.height=768;const c=canvas.getContext('2d');
 c.fillStyle='#c6a16a';c.fillRect(0,0,384,768);
 let seed=47;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 for(let i=0;i<5500;i++){const v=random();c.fillStyle=v>.5?'#e6c99524':'#73533618';c.fillRect(random()*384,random()*768,1+random()*4,1+random()*3);}
 c.strokeStyle='#73502e';c.lineWidth=3;c.strokeRect(14,14,356,740);c.strokeRect(24,24,336,720);
 const glyph=(x,y,type)=>{c.save();c.translate(x,y);c.strokeStyle='#65492f';c.lineWidth=6;c.lineCap='round';c.lineJoin='round';c.beginPath();
  if(type===0){c.ellipse(0,-14,12,17,0,0,Math.PI*2);c.moveTo(0,3);c.lineTo(0,34);c.moveTo(-18,13);c.lineTo(18,13);}
  if(type===1){c.moveTo(-26,0);c.quadraticCurveTo(0,-25,26,0);c.quadraticCurveTo(0,21,-26,0);c.moveTo(0,8);c.lineTo(-6,30);c.lineTo(13,26);c.moveTo(4,0);c.arc(0,0,5,0,Math.PI*2);}
  if(type===2){for(let row=0;row<3;row++){c.moveTo(-25,-15+row*15);for(let j=0;j<6;j++)c.lineTo(-25+j*10,-15+row*15+(j%2?7:0));}}
  if(type===3){c.arc(0,0,21,0,Math.PI*2);c.moveTo(4,0);c.arc(0,0,4,0,Math.PI*2);}
  if(type===4){c.moveTo(-20,12);c.quadraticCurveTo(-5,25,18,4);c.lineTo(18,-13);c.quadraticCurveTo(25,-22,29,-12);c.lineTo(38,-10);c.moveTo(5,15);c.lineTo(4,32);c.moveTo(-9,15);c.lineTo(-11,31);c.moveTo(-20,12);c.lineTo(-31,2);}
  if(type===5){c.moveTo(0,32);c.lineTo(0,-23);c.moveTo(-2,13);c.quadraticCurveTo(-27,2,-15,-17);c.moveTo(2,0);c.quadraticCurveTo(27,-9,14,-29);c.moveTo(-17,33);c.lineTo(17,33);}
  c.stroke();c.restore();};
 for(let row=0;row<8;row++)for(let col=0;col<3;col++)glyph(78+col*114,66+row*88,(row*3+col)%6);
 return new THREE.CanvasTexture(canvas);
}
