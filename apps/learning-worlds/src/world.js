import {fitNileCharacter,NILE_ADULT_HEIGHT} from './nile-character-scale.js';
import {ASSET_BASE} from './asset-paths.js';
import {addEgyptianAtmosphere} from './atmosphere.js';
import {skinTones} from './characters.js';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { missions } from './content.js';

const C={sand:0xd6ad70,stone:0xdfc597,cream:0xf2dfb5,brick:0xbf8851,teal:0x226e70,gold:0xf6c66b,green:0x467e45,dark:0x173b3b};
const v3=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
function rng(seed=824){return()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};}
const rand=rng();
const mat=(c,r=1)=>new THREE.MeshStandardMaterial({color:c,roughness:r});
const materials={};function material(c){return materials[c]??=mat(c);}
const bounds={minX:-6,maxX:88,minZ:-78,maxZ:66};
const playerClearance=.58;

// A narrow oval stays inside the river. The model's snout points along +Z,
// so face the path tangent instead of swimming backwards on the return leg.
export function crocodilePatrol(time){
 const angle=time*.08;
 return {x:-20.5+1.5*Math.cos(angle),z:-5+9*Math.sin(angle),yaw:Math.atan2(-1.5*Math.sin(angle),9*Math.cos(angle))};
}

// Navigation uses the same expanded building footprints as movement. A straight
// segment is legal only when the entire segment clears every footprint.
function segmentClear(a,b,obstacles,clearance=playerClearance){
 for(const c of obstacles){let low=0,high=1;for(const [axis,half]of [['x',c.hx],['z',c.hz]]){const delta=b[axis]-a[axis],min=c[axis]-half-clearance,max=c[axis]+half+clearance;if(Math.abs(delta)<1e-8){if(a[axis]<min||a[axis]>max){low=2;break;}}else{let enter=(min-a[axis])/delta,leave=(max-a[axis])/delta;if(enter>leave)[enter,leave]=[leave,enter];low=Math.max(low,enter);high=Math.min(high,leave);if(low>high)break;}}if(low<=high)return false;}
 return true;
}
export class NileWorld {
 constructor(container,onUpdate){
  this.container=container;this.onUpdate=onUpdate;this.time=0;this.running=false;this.paused=false;this.keys=new Set();this.mixers=[];this.markers=[];this.boats=[];this.palms=[];this.particles=[];this.colliders=[];this.guideTarget=null;this.currentAction='';this.move=new THREE.Vector2();this.velocity=v3();this.actualSpeed=0;this.travelSpeed=0;this.runEnabled=false;this.cameraPointer=null;this.wasGuiding=false;this.angle=.3;this.pitch=.48;this.zoom=11;this.lastFrame=performance.now();this.fps=60;this.reduce=false;this.nearest=null;
  this.scene=new THREE.Scene();this.scene.background=new THREE.Color(0xd6d7bb);this.scene.fog=new THREE.FogExp2(0xe4ceb0,.0042);
  this.pitch=.18;
  this.camera=new THREE.PerspectiveCamera(54,innerWidth/innerHeight,.1,600);
  this.renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.65));this.renderer.setSize(innerWidth,innerHeight);this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.22;
  this.renderer.domElement.setAttribute('aria-label','Three-dimensional Nile expedition. Use the mission map for a guided route.');container.append(this.renderer.domElement);
  this.hemisphere=new THREE.HemisphereLight(0xc0d5e0,0x996134,1.6);this.scene.add(this.hemisphere);
  const sun=new THREE.DirectionalLight(0xffdfad,4);sun.position.set(-35,75,35);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-105,right:105,top:105,bottom:-105,near:1,far:230});sun.shadow.bias=-.0005;sun.shadow.normalBias=.06;this.scene.add(sun);this.sun=sun;
  this.createLand();this.createRiver();this.createVillage();this.createStations();this.createSky();this.atmosphere=addEgyptianAtmosphere(this);this.batchStatic();
  this.guideRoute=[];this.navigationStatus='idle';this.routeTrail=new THREE.InstancedMesh(new THREE.CircleGeometry(.14,8),new THREE.MeshBasicMaterial({color:0x2c776d,transparent:true,opacity:.78,depthWrite:false}),180);this.routeTrail.count=0;this.routeTrail.frustumCulled=false;this.scene.add(this.routeTrail);
  this.player=new THREE.Group();this.player.position.set(13,0,49);this.scene.add(this.player);
  this.playerShadow=this.disc(.62,0x44351c,.24);this.playerShadow.rotation.x=-Math.PI/2;this.playerShadow.position.y=.025;this.player.add(this.playerShadow);
  this.heroPromise=this.loadCharacters();this.bind();this.animate();
 }
 add(geo,c,x,y,z,parent=this.scene){const m=new THREE.Mesh(geo,typeof c==='number'?material(c):c);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 box(x,y,z,w,h,d,c,parent){return this.add(new THREE.BoxGeometry(w,h,d),c,x,y,z,parent);}
 cyl(x,y,z,rt,rb,h,c,parent){return this.add(new THREE.CylinderGeometry(rt,rb,h,12),c,x,y,z,parent);}
 ball(x,y,z,r,c,parent){return this.add(new THREE.SphereGeometry(r,14,10),c,x,y,z,parent);}
 disc(r,c,opacity=1){return new THREE.Mesh(new THREE.CircleGeometry(r,48),new THREE.MeshBasicMaterial({color:c,transparent:opacity<1,opacity,depthWrite:opacity===1}));}
 batchStatic(){const groups=new Map(),exclude=[this.channel,this.tombDoor,this.museumDoor];this.scene.updateMatrixWorld(true);for(const m of [...this.scene.children]){if(!m.isMesh||!m.material.isMeshStandardMaterial||m.material.vertexColors||exclude.includes(m))continue;const key=m.material.uuid+Object.keys(m.geometry.attributes).sort().join(',')+!!m.geometry.index;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(m);}for(const list of groups.values()){if(list.length<3)continue;const geometries=list.map(m=>m.geometry.clone().applyMatrix4(m.matrixWorld));const merged=mergeGeometries(geometries,false);if(merged){const mesh=new THREE.Mesh(merged,list[0].material);mesh.castShadow=true;mesh.receiveShadow=true;this.scene.add(mesh);list.forEach(m=>{this.scene.remove(m);m.geometry.dispose();});}geometries.forEach(g=>g.dispose());}}
 mergeStaticGroup(group){const batches=new Map();group.updateMatrixWorld(true);for(const mesh of [...group.children]){if(!mesh.isMesh)continue;const key=mesh.material.uuid;if(!batches.has(key))batches.set(key,[]);batches.get(key).push(mesh);}for(const meshes of batches.values()){if(meshes.length<2)continue;const parts=meshes.map(mesh=>mesh.geometry.clone().applyMatrix4(mesh.matrix));const geometry=mergeGeometries(parts);if(geometry){const combined=new THREE.Mesh(geometry,meshes[0].material);combined.castShadow=true;combined.receiveShadow=true;group.add(combined);for(const mesh of meshes){group.remove(mesh);mesh.geometry.dispose();}}parts.forEach(part=>part.dispose());}}
 createLand(){
  const g=new THREE.PlaneGeometry(380,380,110,110);g.rotateX(-Math.PI/2);const pos=g.attributes.position;const colors=[];
  for(let i=0;i<pos.count;i++){const x=pos.getX(i),z=pos.getZ(i);let y=-.12;if(x>85)y+=Math.sin(x*.025+z*.018)*Math.cos(z*.019)*6+5; if(x< -50)y+=Math.sin(x*.033+z*.014)*4+4;pos.setY(i,y);const c=new THREE.Color(C.sand).lerp(new THREE.Color(0xf2d99c),rand()*.22);colors.push(c.r,c.g,c.b);}
  g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.computeVertexNormals();const land=new THREE.Mesh(g,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1}));land.receiveShadow=true;this.scene.add(land);
  for(let i=0;i<60;i++){const x=rand()*100-9,z=rand()*150-83;if(x<0)continue; const s=.2+rand()*.65;const rock=this.add(new THREE.DodecahedronGeometry(s,0),0xb4976a,x,0,z);rock.scale.set(1.5,.65,1);rock.rotation.set(rand(),rand()*6,rand());}
  for(let i=0;i<35;i++){const x=100+rand()*80,z=-80+rand()*180;const dune=this.add(new THREE.SphereGeometry(1,18,10),i%2?0xd6ac70:0xdfbb80,x,-1,z);dune.scale.set(20+rand()*20,5+rand()*8,10+rand()*15);}
  for(let i=0;i<16;i++){this.palm(-1+rand()*8,52-i*7.7,.75+rand()*.6);if(i%2===0)this.palm(-39+rand()*4,55-i*8,1+rand()*.4);}
  [[21,44],[37,31],[18,-42],[66,-19],[13,-54],[54,8]].forEach(([x,z])=>this.palm(x,z,1));
 }
 createRiver(){
  const geo=new THREE.PlaneGeometry(25,360,30,150);geo.rotateX(-Math.PI/2);const pos=geo.attributes.position;
  for(let i=0;i<pos.count;i++){const z=pos.getZ(i);pos.setX(i,pos.getX(i)-23+Math.sin(z*.024)*4);pos.setY(i,.01);}
  this.waterMaterial=new THREE.ShaderMaterial({uniforms:{time:{value:0}},vertexShader:`uniform float time; varying vec3 p; void main(){vec3 q=position;q.y+=sin(q.z*.5+time)*.07+cos(q.x*.8+time*1.2)*.06;p=q;gl_Position=projectionMatrix*modelViewMatrix*vec4(q,1.);}`,fragmentShader:`uniform float time;varying vec3 p;void main(){float wave=sin(p.z*2.1+p.x*.9+time*1.4)*sin(p.x*1.3-p.z*.8+time*.8);float gleam=pow(max(0.,wave),14.);vec3 col=mix(vec3(.035,.31,.33),vec3(.18,.52,.49),.5+.5*sin(p.x*.21+p.z*.12));col+=gleam*vec3(.46,.52,.34);gl_FragColor=vec4(col,1.);}`});
  const water=new THREE.Mesh(geo,this.waterMaterial);water.receiveShadow=true;this.scene.add(water);
  for(let side of [-1,1]){const points=[];for(let z=-160;z<=160;z+=4)points.push(v3(-23+Math.sin(z*.024)*4+side*12.6,.018,z));this.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),160,.22,5,false),0x71947a,0,0,0);}
  this.boat(-21,35,1.3);this.boat(-28,-31,1);this.boat(-24,90,1.8);
  for(let i=0;i<34;i++){const x=-9+Math.sin(i)*2,z=i*4.6-90;for(let j=0;j<3;j++){const reed=this.cyl(x+j*.18,.6,z+j*.2,.025,.04,1.2+rand(),0x657d3a);reed.rotation.z=(rand()-.5)*.3;}}
  this.croc=new THREE.Group();this.scene.add(this.croc);this.croc.position.set(-19,.13,-2);const b=this.ball(0,0,0,.5,0x40563b,this.croc);b.scale.set(.8,.45,2.5);const sn=this.ball(0,0,1.3,.38,0x566747,this.croc);sn.scale.set(1,.4,2);for(let x of [-.21,.21])this.ball(x,.18,1.27,.085,0xc5bc77,this.croc);const tail=this.add(new THREE.ConeGeometry(.38,2,7),0x40563b,0,0,-1.8,this.croc);tail.rotation.x=-Math.PI/2;
 }
 boat(x,z,s){const g=new THREE.Group();g.position.set(x,.25,z);g.scale.setScalar(s);this.scene.add(g);const hull=this.ball(0,0,0,1,0x72502e,g);hull.scale.set(.8,.35,2.8);this.box(0,.16,0,1.3,.08,3.7,0xc79a55,g);this.cyl(0,2.1,0,.055,.09,4,0x735233,g);const sailgeo=new THREE.BufferGeometry();sailgeo.setAttribute('position',new THREE.Float32BufferAttribute([0,4,0,0,.8,-2.7,0,.8,1.8],3));sailgeo.computeVertexNormals();this.add(sailgeo,new THREE.MeshStandardMaterial({color:0xffedc7,side:THREE.DoubleSide,roughness:1}),0,0,0,g);g.rotation.y=.3;this.boats.push(g);}
 palm(x,z,s){const g=new THREE.Group();g.position.set(x,0,z);g.scale.setScalar(s);this.scene.add(g);const points=[v3(),v3(.15,2,0),v3(.45,4,.1),v3(.7,6,.25)];this.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),12,.22,7,false),0x88673d,0,0,0,g);for(let j=0;j<7;j++){const a=j*Math.PI*2/7;const vs=[];const ix=[];for(let k=0;k<=8;k++){const t=k/8,r=t*3.9,w=Math.sin(t*Math.PI)*.56;for(let side of [-1,1])vs.push(.7+Math.cos(a)*r+Math.sin(a)*w*side,6+Math.sin(t*Math.PI)*1.1-t*t*2.1,.25+Math.sin(a)*r-Math.cos(a)*w*side);if(k<8){let n=k*2;ix.push(n,n+1,n+2,n+1,n+3,n+2);}}const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vs,3));geo.setIndex(ix);geo.computeVertexNormals();const leaf=this.add(geo,new THREE.MeshStandardMaterial({color:j%2?0x587d3d:0x779448,side:THREE.DoubleSide,roughness:1}),0,0,0,g);this.palms.push(leaf);}
  for(let j=0;j<3;j++)this.ball(.7+rand()*.3,5.8,.25+rand()*.2,.20,0x856538,g);
 }
 pyramid(x,z,size){const g=new THREE.Group();g.position.set(x,0,z);this.scene.add(g);const layers=22;for(let i=0;i<layers;i++){let w=size*(1-i/layers);this.box(0,i*(size*.65/layers)+.23,0,w,size*.65/layers+.03,w,i%3?0xd3ae73:0xcda36a,g);}this.cyl(0,size*.65+.4,0,0,size/layers,1.2,0xe9c991,g).rotation.y=Math.PI/4;this.mergeStaticGroup(g);this.colliders.push({x,z,hx:size/2,hz:size/2,height:size*.65});}
 house(x,z,w=6,d=5){this.box(x,1.75,z,w,3.5,d,C.brick);this.box(x,3.56,z,w+.25,.2,d+.25,C.stone);this.box(x,.95,z+d/2+.02,1.2,1.9,.035,0x4b3928);for(let s of [-1,1])this.box(x+s*w*.3,2.4,z+d/2+.035,.6,.7,.05,0x4d402a);this.colliders.push({x,z,hx:w/2,hz:d/2,height:3.7});for(let j=0;j<3;j++){const pot=this.cyl(x+w*.55+j*.65,.45,z+1,.3,.19,.9,0xaa653b);this.cyl(pot.position.x,.91,pot.position.z,.27,.28,.06,0x683d27);}}
 createVillage(){
  [[26,37,6,5],[34,37,5,5],[33,46,7,5],[21,30,4,4],[46,30,7,6]].forEach(a=>this.house(...a));
  this.pyramid(44,-28,23);this.pyramid(80,-75,42);this.pyramid(112,-50,30);this.pyramid(110,-103,24);
  // Harvest plots and water channels.
  for(let i=0;i<3;i++){this.box(7+i*4,.025,28,3.3,.08,8,0x796741);for(let j=0;j<6;j++)for(let k=0;k<2;k++){const wheat=this.cyl(6.2+i*4+k*1.2,.4,25+j*1.1,.026,.045,.8,0x9ca450);this.ball(wheat.position.x,.85,wheat.position.z,.10,0xcfb960);}}
  this.channel=this.box(3,.04,32,1.3,.08,13,0x526a60);this.channel.material=mat(0x526a60);
  // Wooden landing and cargo models.
  for(let i=0;i<10;i++)this.box(-3+i*.65,.38,18,.55,.18,5,0x9c794d);for(let z of [16,20])for(let x of [-3,2])this.cyl(x,.6,z,.12,.14,1.6,0x755638);
  this.cargoModels=[];for(let i=0;i<3;i++){const gr=new THREE.Group();gr.position.set(7+i*2.1,.1,15);this.scene.add(gr);const hull=this.ball(0,.2,0,1,0x725238,gr);hull.scale.set(.65,.3,1.25);this.cargoModels.push(gr);}
  // Scribe's shaded court.
  for(let x of [27,34])for(let z of [11,17])this.cyl(x,2.5,z,.13,.18,5,0x8a6540);
  this.box(30.5,5,14,8,.12,7,0xf0d8a3);this.box(30.5,.15,14,8,.18,6.5,0xb95d3b);this.box(30.5,.65,14,3,.9,1.4,0x9b7348);for(let i=0;i<4;i++)this.cyl(29.4+i*.7,1.14,14,.15,.15,.65,C.cream).rotation.z=Math.PI/2;
  this.arch(58,-32,'tomb');this.arch(23,-59,'museum');
  // Excavation grid and covered conservation bench.
  this.box(43,.02,-49,8,.12,5,0x9a774c);for(let i=0;i<=4;i++){this.box(39+i*2,.1,-49,.035,.035,5,0xdbc48c);this.box(43,.1,-51.5+i*1.25,8,.035,.035,0xdbc48c);}
  this.box(51,1,-50,3,.16,1.6,0x866037);for(let x of [50,52])for(let z of [-50.5,-49.5])this.box(x,.5,z,.1,1,.1,0x61482e);
  this.scarab=new THREE.Group();this.scarab.position.set(43,.4,-49);this.scene.add(this.scarab);const body=this.ball(0,0,0,.7,0x268d89,this.scarab);body.scale.set(1,.5,1.4);this.ball(0,0,.9,.33,0x226564,this.scarab);for(let i=0;i<3;i++)for(let s of [-1,1]){const l=this.box(s*.7,0,-.5+i*.55,.65,.08,.1,0xc7a44d,this.scarab);l.rotation.y=s*.35;}
  // Atmospheric braziers and firefly-like dust.
  this.flames=[];for(let [x,z] of [[54,-28],[62,-28],[18,-56],[28,-56]]){this.cyl(x,.8,z,.18,.4,1.6,0x8d673c);this.cyl(x,1.7,z,.5,.2,.4,C.gold);const flame=this.add(new THREE.IcosahedronGeometry(.3,1),new THREE.MeshBasicMaterial({color:0xffc765}),x,2.1,z);flame.scale.y=1.8;this.flames.push(flame);}
 }
 arch(x,z,type){
  for(let s of [-1,1]){this.box(x+s*3.8,3.5,z,3.2,7,2.4,C.stone);this.box(x+s*3.8,7,z,3.6,.4,2.8,C.cream);for(let i=0;i<3;i++)this.box(x+s*3.8,2+i*1.1,z+1.22,1.8,.09,.06,0xb59058);}
  this.box(x,7.2,z,4.4,1.2,2.5,C.stone);this.box(x,3,z-.3,4.4,6,.25,0x343e36);const disk=this.disc(.65,C.gold);disk.position.set(x,7.3,z+1.29);this.scene.add(disk);
  const door=this.box(x,2.8,z+.15,4,5.5,.4,0x5b6c58);door.material=mat(0x5b6c58);if(type==='tomb')this.tombDoor=door;else this.museumDoor=door;
  for(let i=0;i<4;i++)this.box(x,.1+i*.1,z+3-i*.5,7,.18,1,0xc6ac7b);
 }
 createStations(){for(const m of missions){const g=new THREE.Group();g.position.set(m.pos[0],0,m.pos[1]);this.scene.add(g);const ring=new THREE.Mesh(new THREE.TorusGeometry(1.25,.055,8,48),new THREE.MeshBasicMaterial({color:C.gold,transparent:true,opacity:.8}));ring.rotation.x=Math.PI/2;ring.position.y=.08;g.add(ring);const gem=this.add(new THREE.OctahedronGeometry(.32),new THREE.MeshStandardMaterial({color:C.gold,emissive:0xca7623,emissiveIntensity:.4,metalness:.5,roughness:.25}),0,3.3,0,g);const beam=new THREE.Mesh(new THREE.CylinderGeometry(.09,.3,3.2,12,true),new THREE.MeshBasicMaterial({color:C.gold,transparent:true,opacity:.10,depthWrite:false}));beam.position.y=1.7;g.add(beam);this.markers.push({g,ring,gem,beam,id:m.id});}}
 createSky(){
  const starGeo=new THREE.BufferGeometry(),pts=[];for(let i=0;i<85;i++)pts.push(rand()*110-10,1+rand()*9,rand()*140-80);starGeo.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));this.dust=new THREE.Points(starGeo,new THREE.PointsMaterial({color:0xffe3a4,size:.045,transparent:true,opacity:.6}));this.scene.add(this.dust);
  this.birds=[];const silhouette=new THREE.MeshBasicMaterial({color:0x554e3f,side:THREE.DoubleSide});
  for(let i=0;i<7;i++){const g=new THREE.Group();g.name='Gliding river bird';const wings=[];
   for(const side of [-1,1]){const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute([0,0,.16,side*.52,0,.25,side*1.05,0,-.32,0,0,.16,side*1.05,0,-.32,side*.42,0,-.17],3));geo.computeVertexNormals();const wing=new THREE.Mesh(geo,silhouette);g.add(wing);wings.push(wing);}
   const bodyGeo=new THREE.BufferGeometry();bodyGeo.setAttribute('position',new THREE.Float32BufferAttribute([-.11,0,.20,0,.08,.56,.11,0,.20,-.11,0,.20,.11,0,.20,0,0,-.42,-.20,0,-.57,0,0,-.35,.20,0,-.57],3));bodyGeo.computeVertexNormals();g.add(new THREE.Mesh(bodyGeo,silhouette));g.userData.wings=wings;g.scale.setScalar(.68+i%3*.1);this.scene.add(g);this.birds.push(g);
  }
 }
 async loadCharacters(){const loader=new GLTFLoader();this.characterOptions={};
  for(const id of ['explorer','explorer-girl']){const gltf=await loader.loadAsync(ASSET_BASE+'models/'+id+'.glb');const avatar=gltf.scene;avatar.traverse(o=>{if(o.isMesh){o.castShadow=true;o.frustumCulled=false;}});const mixer=new THREE.AnimationMixer(avatar),actions={};for(const clip of gltf.animations)actions[clip.name]=mixer.clipAction(clip);const metrics=fitNileCharacter(avatar,mixer,gltf.animations);this.characterOptions[id]={avatar,mixer,actions,metrics};}
  this.setCharacter('explorer','warm');
  for(let role of ['farmer','scribe','archaeologist','curator']){const gltf=await loader.loadAsync(ASSET_BASE+'models/'+role+'.glb');const places={farmer:[[12,32],[17,24],[27,40]],scribe:[[32,12]],archaeologist:[[48,-47]],curator:[[26,-56]]}[role];for(let [x,z]of places){const npc=clone(gltf.scene),mixer=new THREE.AnimationMixer(npc);fitNileCharacter(npc,mixer,gltf.animations,NILE_ADULT_HEIGHT);npc.position.set(x,npc.position.y,z);npc.rotation.y=rand()*Math.PI*2;npc.traverse(o=>{if(o.isMesh){o.castShadow=true;o.frustumCulled=false;}});this.scene.add(npc);const idle=gltf.animations.find(a=>a.name==='Idle');if(idle)mixer.clipAction(idle).play();this.mixers.push(mixer);}}
  this.sphinxInfo=await this.atmosphere.loadSphinx(loader);return {clips:Object.keys(this.actions)};
 }
 setCharacter(id,tone='warm'){
  const next=this.characterOptions?.[id];if(!next)return false;
  if(this.characterId!==id){if(this.avatar){this.player.remove(this.avatar);this.mixer.stopAllAction();this.mixers=this.mixers.filter(m=>m!==this.mixer);}this.characterId=id;this.characterMetrics=next.metrics;this.avatar=next.avatar;this.mixer=next.mixer;this.actions=next.actions;this.player.add(this.avatar);this.mixers.push(this.mixer);this.currentAction=null;this.setAction('Idle');}
  const selected=skinTones.find(t=>t.id===tone)||skinTones[0];this.skinTone=selected.id;
  this.avatar.traverse(o=>{if(o.isMesh)for(const material of (Array.isArray(o.material)?o.material:[o.material]))if(material.name==='warm terracotta skin')material.color.setRGB(...selected.colour);});return true;
 }
 setAction(name){if(this.currentAction===name||!this.actions?.[name])return;const old=this.actions[this.currentAction],next=this.actions[name];next.reset().play();if(old)old.crossFadeTo(next,.24,false);this.currentAction=name;}
 bind(){
  window.addEventListener('resize',()=>{this.camera.aspect=innerWidth/innerHeight;this.camera.updateProjectionMatrix();this.renderer.setSize(innerWidth,innerHeight);});
  window.addEventListener('keydown',e=>{if(!this.running||this.paused||['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)||e.target.closest('dialog'))return;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();this.keys.add(e.key.toLowerCase());});
  window.addEventListener('keyup',e=>this.keys.delete(e.key.toLowerCase()));
  window.addEventListener('blur',()=>this.clearInput());
  document.addEventListener('visibilitychange',()=>{if(document.hidden)this.clearInput();this.lastFrame=performance.now();});
  let lx=0,ly=0;const el=this.renderer.domElement;
  el.addEventListener('pointerdown',e=>{if(!this.running||this.paused||this.cameraPointer!==null||(e.pointerType==='mouse'&&e.button!==0))return;this.cameraPointer=e.pointerId;lx=e.clientX;ly=e.clientY;el.setPointerCapture(e.pointerId);});
  el.addEventListener('pointermove',e=>{if(e.pointerId!==this.cameraPointer)return;if(this.running&&!this.paused){this.angle-=(e.clientX-lx)*.005;this.pitch=THREE.MathUtils.clamp(this.pitch+(e.clientY-ly)*.003,.12,1.1);}lx=e.clientX;ly=e.clientY;});
  const release=e=>{if(e.pointerId===this.cameraPointer)this.cameraPointer=null;};
  el.addEventListener('pointerup',release);el.addEventListener('pointercancel',release);el.addEventListener('lostpointercapture',release);
  el.addEventListener('wheel',e=>{if(this.running&&!this.paused)this.zoom=THREE.MathUtils.clamp(this.zoom+e.deltaY*.01,6,19);},{passive:true});
 }
 setRun(enabled){this.runEnabled=!!enabled;}
 resetCamera(){this.angle=this.player.rotation.y+Math.PI;this.pitch=.18;this.zoom=11;this.cameraPointer=null;}
 clearInput(cancelGuide=true){this.keys.clear();this.move.set(0,0);this.velocity.set(0,0,0);this.actualSpeed=0;this.travelSpeed=0;this.runEnabled=false;this.cameraPointer=null;if(cancelGuide){this.guideTarget=null;this.guideRoute=[];this.navigationStatus='stopped';}if(this.running&&this.time>(this.celebrateUntil||0))this.setAction('Idle');}
 getControlStatus(){return{characterMetrics:{...this.characterMetrics},runEnabled:this.runEnabled,speed:this.actualSpeed,cameraAngle:this.angle,pitch:this.pitch,zoom:this.zoom,moving:this.actualSpeed>.14,analog:[this.move.x,this.move.y],camera:{angle:this.angle,pitch:this.pitch,zoom:this.zoom,dragging:this.cameraPointer!==null}};}
 start(position){this.clearInput();this.running=true;if(position)this.player.position.set(position[0],0,position[1]);this.resolvePosition(this.player.position);this.camera.position.copy(this.player.position).add(v3(8,8,11));}
 setSettings(s){this.atmosphere.setLighting(s.lighting||'evening');this.reduce=s.reducedMotion;if(this.reduce){for(const p of this.particles){this.scene.remove(p);p.geometry.dispose();p.material.dispose();}this.particles=[];}this.renderer.setPixelRatio(s.quality==='low'?1:Math.min(devicePixelRatio,1.65));this.renderer.shadowMap.enabled=s.quality!=='low';}
 setCompleted(ids){this.completed=ids;for(let m of this.markers){const done=ids.includes(m.id),open=m.id===0||ids.includes(m.id-1)||done;m.gem.material.color.setHex(done?0x63cbbc:open?C.gold:0x8d8877);m.beam.visible=!done&&open;m.ring.material.opacity=done?.25:open?.85:.15;}}
 resolvePosition(position,clearance=.49){
  for(let pass=0;pass<8;pass++){
   position.x=THREE.MathUtils.clamp(position.x,bounds.minX,bounds.maxX);position.z=THREE.MathUtils.clamp(position.z,bounds.minZ,bounds.maxZ);let changed=false;
   for(const c of this.colliders){const hx=c.hx+clearance,hz=c.hz+clearance,dx=position.x-c.x,dz=position.z-c.z;if(Math.abs(dx)<hx&&Math.abs(dz)<hz){const exits=[v3(c.x-hx,0,position.z),v3(c.x+hx,0,position.z),v3(position.x,0,c.z-hz),v3(position.x,0,c.z+hz)].filter(p=>p.x>=bounds.minX&&p.x<=bounds.maxX&&p.z>=bounds.minZ&&p.z<=bounds.maxZ).sort((a,b)=>a.distanceToSquared(position)-b.distanceToSquared(position));if(exits.length)position.copy(exits[0]);changed=true;}}
   if(!changed)break;
  }
  return position;
 }
 findRoute(from,to){
  if(segmentClear(from,to,this.colliders))return[to.clone()];
  const nodes=[from.clone(),to.clone()];
  for(const c of this.colliders)for(const sx of [-1,1])for(const sz of [-1,1]){const p=v3(c.x+sx*(c.hx+playerClearance+.08),0,c.z+sz*(c.hz+playerClearance+.08));if(p.x>=bounds.minX&&p.x<=bounds.maxX&&p.z>=bounds.minZ&&p.z<=bounds.maxZ&&segmentClear(p,p,this.colliders))nodes.push(p);}
  const costs=nodes.map(()=>Infinity),previous=nodes.map(()=>-1),visited=new Set();costs[0]=0;
  while(visited.size<nodes.length){let current=-1;for(let i=0;i<nodes.length;i++)if(!visited.has(i)&&(current<0||costs[i]<costs[current]))current=i;if(current<0||!Number.isFinite(costs[current]))break;if(current===1){const route=[];for(let at=1;at!==0;at=previous[at])route.unshift(nodes[at]);return route;}visited.add(current);
   for(let i=1;i<nodes.length;i++){if(visited.has(i)||!segmentClear(nodes[current],nodes[i],this.colliders))continue;const cost=costs[current]+nodes[current].distanceTo(nodes[i]);if(cost<costs[i]){costs[i]=cost;previous[i]=current;}}
  }
  return [];
 }
 guide(id){
  const mission=missions[id];if(!mission)return false;this.resolvePosition(this.player.position,playerClearance+.02);
  const p=mission.pos,target=v3(p[0],0,p[1]+2.4);this.guideRoute=this.findRoute(this.player.position,target);this.keys.clear();this.move.set(0,0);this.velocity.set(0,0,0);this.travelSpeed=0;
  this.guideTarget=this.guideRoute.length?target:null;this.navigationStatus=this.guideTarget?'travelling':'unreachable';this.routeTrail.count=0;
  const stamp=new THREE.Object3D();stamp.rotation.x=-Math.PI/2;let previous=this.player.position;
  for(const waypoint of this.guideRoute){const length=previous.distanceTo(waypoint);for(let d=.7;d<length&&this.routeTrail.count<180;d+=1.2){stamp.position.copy(previous).lerp(waypoint,d/length);stamp.position.y=.055;stamp.updateMatrix();this.routeTrail.setMatrixAt(this.routeTrail.count++,stamp.matrix);}previous=waypoint;}this.routeTrail.instanceMatrix.needsUpdate=true;
  return !!this.guideTarget;
 }
 getNavigationStatus(){return{status:this.guideTarget?this.navigationStatus:this.navigationStatus==='travelling'?'stopped':this.navigationStatus,waypoints:this.guideTarget?this.guideRoute.map(p=>[p.x,p.z]):[],target:this.guideTarget?[this.guideTarget.x,this.guideTarget.z]:null};}
 getPosition(){return[this.player.position.x,this.player.position.z];}
 celebrate(id){this.setAction('Celebrate');this.celebrateUntil=this.time+2.5;this.worldReward(id);if(this.reduce){this.setAction('Idle');return;}for(let i=0;i<40;i++){const p=this.add(new THREE.OctahedronGeometry(.06),new THREE.MeshBasicMaterial({color:i%2?C.gold:0x84dac9}),this.player.position.x,2,this.player.position.z);p.userData.velocity=v3((rand()-.5)*5,2+rand()*4,(rand()-.5)*5);p.userData.life=2;this.particles.push(p);}}
 worldReward(id){if(id===0)this.channel.material.color.setHex(0x30978a);if(id===4)this.tombDoor.position.y=8.5;if(id===6)this.museumDoor.position.y=8.5;}
 updateMovement(dt){
  if(!this.running||this.paused){this.velocity.set(0,0,0);this.travelSpeed=0;this.actualSpeed=0;this.keys.clear();this.move.set(0,0);if(this.running&&this.time>(this.celebrateUntil||0))this.setAction('Idle');return;}
  const input=new THREE.Vector2(this.move.x,this.move.y),magnitude=input.length(),deadzone=.16;
  if(magnitude<=deadzone)input.set(0,0);else input.multiplyScalar(Math.min(1,(magnitude-deadzone)/(1-deadzone))/magnitude);
  input.x+=(this.keys.has('d')||this.keys.has('arrowright')?1:0)-(this.keys.has('a')||this.keys.has('arrowleft')?1:0);
  input.y+=(this.keys.has('s')||this.keys.has('arrowdown')?1:0)-(this.keys.has('w')||this.keys.has('arrowup')?1:0);
  if(input.length()>1)input.normalize();
  const manual=input.lengthSq()>.0001;
  if(manual&&this.guideTarget){this.guideTarget=null;this.guideRoute=[];this.navigationStatus='stopped';}
  if(this.wasGuiding&&!this.guideTarget){this.velocity.set(0,0,0);this.travelSpeed=0;}
  const displacement=v3();
  if(this.guideTarget){
   while(this.guideRoute.length&&this.player.position.distanceTo(this.guideRoute[0])<.12)this.guideRoute.shift();
   if(!this.guideRoute.length){this.guideTarget=null;this.navigationStatus='arrived';this.velocity.set(0,0,0);this.travelSpeed=0;}
   else {const direction=this.guideRoute[0].clone().sub(this.player.position),distance=direction.length();this.travelSpeed=THREE.MathUtils.lerp(this.travelSpeed,4,1-Math.exp(-dt*9));displacement.copy(direction).multiplyScalar(Math.min(distance,this.travelSpeed*dt)/Math.max(distance,.001));}
  }else{
   const desired=v3(input.x,0,input.y).applyAxisAngle(v3(0,1,0),this.angle).multiplyScalar(this.runEnabled||this.keys.has('shift')?3.9:1.9);
   this.velocity.lerp(desired,1-Math.exp(-dt*(manual?14:24)));
   if(!manual&&this.velocity.length()<.14)this.velocity.set(0,0,0);
   displacement.copy(this.velocity).multiplyScalar(dt);
  }
  const previous=this.player.position.clone(),candidate=previous.clone().add(displacement);this.resolvePosition(candidate);this.player.position.copy(candidate);
  const travelled=candidate.clone().sub(previous);this.actualSpeed=travelled.length()/Math.max(dt,.001);
  if(!this.guideTarget&&travelled.distanceTo(displacement)>.0001)this.velocity.copy(travelled).divideScalar(Math.max(dt,.001));
  if(this.actualSpeed>.14){
   const facing=Math.atan2(travelled.x,travelled.z);this.player.rotation.y+=Math.atan2(Math.sin(facing-this.player.rotation.y),Math.cos(facing-this.player.rotation.y))*(1-Math.exp(-dt*14));
   const action=this.actualSpeed>2.6?'Run':'Walk';this.setAction(action);
   this.actions?.[action]?.setEffectiveTimeScale(THREE.MathUtils.clamp(this.actualSpeed/((action==='Run'?4.1:2.3)*(this.characterMetrics?.modelScale||1.05)/1.05),.65,1.7));
  }else if(this.time>(this.celebrateUntil||0))this.setAction('Idle');
  this.wasGuiding=!!this.guideTarget;
 }
 animate(){requestAnimationFrame(()=>this.animate());const now=performance.now(),elapsed=(now-this.lastFrame)/1000,dt=Math.min(elapsed,.05);this.lastFrame=now;this.time+=dt;this.fps=THREE.MathUtils.lerp(this.fps,1/Math.max(elapsed,.001),.03);const t=this.time,ambient=this.reduce?0:t;
  this.waterMaterial.uniforms.time.value=ambient;this.boats.forEach((b,i)=>{b.rotation.z=Math.sin(ambient*.6+i)*.035;b.position.y=.3+Math.sin(ambient*.8+i)*.07;});this.palms.forEach((p,i)=>{p.rotation.z=this.reduce?0:Math.sin(ambient*.7+i)*.025;});this.atmosphere.update(ambient);this.birds.forEach((b,i)=>{const a=ambient*.034+i,flapping=Math.max(0,Math.sin(ambient*.55+i));b.position.set(Math.cos(a)*30+8,14.5+i*.75+Math.sin(ambient*.22+i)*.45,Math.sin(a)*43-32);b.rotation.set(0,-a,Math.sin(ambient*.17+i)*.07);b.userData.wings.forEach((wing,j)=>{wing.rotation.z=(.10+Math.sin(ambient*4.3+i)*.35*flapping)*(j?1:-1);});});const crocodile=crocodilePatrol(ambient);this.croc.position.set(crocodile.x,.13,crocodile.z);this.croc.rotation.y=crocodile.yaw;
  for(let m of this.markers){m.gem.rotation.y=ambient*.7;m.gem.position.y=3.25+(this.reduce?0:Math.sin(ambient*2+m.id)*.12);}
  this.flames.forEach((f,i)=>f.scale.y=1.6+Math.sin(ambient*7+i)*.2);
  this.updateMovement(dt);
  this.routeTrail.visible=!!this.guideTarget&&this.running&&!this.paused;
  for(let mixer of this.mixers)if(!this.reduce||(mixer===this.mixer&&['Walk','Run'].includes(this.currentAction)&&!this.paused))mixer.update(dt);
  if(!this.running){const a=.35+Math.sin(ambient*.04)*.10;this.camera.position.set(45+Math.sin(a)*65,43,69+Math.cos(a)*18);this.camera.lookAt(20,3,-20);}
  else {const target=this.player.position.clone().add(v3(0,1,0));const offset=v3(Math.sin(this.angle)*this.zoom,2+this.pitch*this.zoom,Math.cos(this.angle)*this.zoom);const ray=new THREE.Ray(target,offset.clone().normalize()),hit=v3();let cameraDistance=offset.length();
   for(const c of this.colliders){const box=new THREE.Box3(v3(c.x-c.hx-.15,0,c.z-c.hz-.15),v3(c.x+c.hx+.15,c.height,c.z+c.hz+.15));if(ray.intersectBox(box,hit))cameraDistance=Math.min(cameraDistance,Math.max(.08,target.distanceTo(hit)-.25));}
   const desired=cameraDistance<3.2?target.clone().add(v3(Math.sin(this.angle)*.2,Math.max(7,this.zoom*.8),Math.cos(this.angle)*.2)):target.clone().addScaledVector(ray.direction,cameraDistance);this.camera.position.lerp(desired,this.reduce||cameraDistance<offset.length()*.9?1:1-Math.exp(-dt*6));this.camera.lookAt(target);}
  this.nearest=null;let nearestDistance=Infinity;for(let m of missions){let d=Math.hypot(this.player.position.x-m.pos[0],this.player.position.z-m.pos[1]);if(d<nearestDistance){nearestDistance=d;this.nearest=m.id;}}if(nearestDistance>5)this.nearest=null;
  for(let i=this.particles.length-1;i>=0;i--){let p=this.particles[i];p.userData.life-=dt;p.userData.velocity.y-=dt*3;p.position.addScaledVector(p.userData.velocity,dt);p.scale.setScalar(Math.max(0,p.userData.life/2));if(p.userData.life<=0){this.scene.remove(p);p.geometry.dispose();p.material.dispose();this.particles.splice(i,1);}}
  this.onUpdate?.({position:this.getPosition(),nearest:this.nearest,fps:this.fps,guiding:!!this.guideTarget});this.renderer.render(this.scene,this.camera);
 }
}
