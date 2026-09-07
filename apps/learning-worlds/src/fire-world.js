import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import './fire-world.css';
import {createFireSky} from './fire-sky.js';
import {createFireExplorer} from './fire-explorer.js';

// Original compressed historical story map. See FIRE-HISTORY.md for evidence,
// interpretation limits and why 1666 St Paul's has neither a spire nor a dome.
export function createFireWorld(container,{reducedMotion=false,onSelect=()=>{}}={}){
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(43,1,.1,1000);
 const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.setClearColor(0x9eb5bc);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 const canvas=renderer.domElement;canvas.style.cssText='display:block;width:100%;height:100%;touch-action:pan-y';canvas.setAttribute('aria-hidden','true');container.append(canvas);
 scene.fog=new THREE.Fog(0xb4c2bf,100,290);
 const hemi=new THREE.HemisphereLight(0xd1e4f0,0x806a49,2.6),sun=new THREE.DirectionalLight(0xffe3b0,3.2);sun.position.set(-20,45,30);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-60,right:60,top:60,bottom:-60,near:1,far:150});sun.shadow.normalBias=.06;scene.add(hemi,sun);
 const textures=new Set(),materials=new Map(),groups=[],hotspots=[],badges=[],badgeMaps=[],boats=[],smokePuffs=[];
 let chapter=0,disposed=false,raf=0,last=0,time=0,dirty=true,pointerStart=null,orbit=0,currentOrbit=0;
 const target=new THREE.Vector3(3,5,-10),desiredTarget=target.clone(),offset=new THREE.Vector3(37,26,48),desiredOffset=offset.clone();
 const material=(color,extra={})=>{const key=String(color)+'|'+Object.entries(extra).map(([k,v])=>k+':'+(v?.uuid||String(v))).join('|');if(!materials.has(key))materials.set(key,new THREE.MeshStandardMaterial({color,roughness:.92,...extra}));return materials.get(key);};
 const group=(name)=>{const g=new THREE.Group();g.name=name;scene.add(g);groups.push(g);return g;};
 const fixed=group('River, bridge and permanent setting'),before=group('London before the fire'),roofBefore=group('Old cathedral roof and tower'),after=group('After the fire: ruins and work in progress'),smoke=group('Distant illustrative smoke'),helping=group('Community river transport');
 const add=(geometry,color,x,y,z,parent=fixed)=>{const m=new THREE.Mesh(geometry,typeof color==='number'?material(color):color);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;};
 const box=(x,y,z,w,h,d,color,parent)=>add(new THREE.BoxGeometry(w,h,d),color,x,y,z,parent);
 const cyl=(x,y,z,r1,r2,h,color,parent)=>add(new THREE.CylinderGeometry(r1,r2,h,10),color,x,y,z,parent);
 const sphere=(x,y,z,r,color,parent)=>add(new THREE.SphereGeometry(r,12,8),color,x,y,z,parent);
 const roof=(x,y,z,w,h,d,color,parent=fixed)=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute([-w/2,0,d/2,w/2,0,d/2,0,h,d/2,-w/2,0,-d/2,0,h,-d/2,w/2,0,-d/2,-w/2,0,d/2,0,h,d/2,0,h,-d/2,-w/2,0,d/2,0,h,-d/2,-w/2,0,-d/2,0,h,d/2,w/2,0,d/2,w/2,0,-d/2,0,h,d/2,w/2,0,-d/2,0,h,-d/2],3));g.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,1,0,.5,1,0,0,.5,1,1,0,0,0,1,0,1,1,0,0,1,1,0,1,0,0,1,0,1,1,0,0,1,1,0,1],2));g.computeVertexNormals();return add(g,color,x,y,z,parent);};
 function patterned(kind){const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d');ctx.fillStyle=kind==='stone'?'#787d78':kind==='brick'?'#76503e':kind==='roof'?'#3f5057':'#d8cbb0';ctx.fillRect(0,0,256,256);
  if(kind==='stone'||kind==='brick'||kind==='roof')for(let r=0;r<10;r++)for(let col=-1;col<7;col++){const colors=kind==='stone'?['#a8aaa0','#969d98','#b1afa0']:kind==='brick'?['#aa775b','#a16a51','#b48663']:['#58636a','#4b5961','#627075'];ctx.fillStyle=colors[(r+col+10)%3];ctx.fillRect(col*43+(r%2)*21+1,r*26+1,41,24);}
  else{let seed=331;for(let i=0;i<4000;i++){seed=(1664525*seed+1013904223)>>>0;ctx.fillStyle=i%2?'#fff6d72b':'#7e725918';ctx.fillRect(seed%256,(seed>>>12)%256,2,2);}}
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());textures.add(t);return t;
 }
 const stoneTex=patterned('stone'),brickTex=patterned('brick'),roofTex=patterned('roof'),plasterTex=patterned('plaster');stoneTex.repeat.set(3,3);
 const stone=material(0xc0bda8,{map:stoneTex,bumpMap:stoneTex,bumpScale:.035}),brick=material(0xd0a783,{map:brickTex}),roofMat=material(0x8a9394,{map:roofTex}),oak=material(0x544538),plaster=material(0xf0dfbe,{map:plasterTex}),glass=material(0xa9c1be,{emissive:0xffb966,emissiveIntensity:.04,roughness:.42});
 // North bank at the right, south bank at the left, Thames running north/south
 // on this deliberately compressed and rotated story map.
 const pavingTex=stoneTex.clone();pavingTex.repeat.set(80,160);textures.add(pavingTex);const paving=material(0xb8baa9,{map:pavingTex});
 // Both banks continue beyond the view. Only the real river edges are exposed;
 // the city must never read as a floating square model on a pale background.
 box(154.5,-.9,-60,300,1.5,650,paving);box(-194.5,-.9,-60,300,1.5,650,paving);box(4.5,.12,-60,.6,.65,650,stone);
 const waterMaterial=new THREE.ShaderMaterial({uniforms:{time:{value:0},night:{value:0},hazeColor:{value:new THREE.Vector3()},hazeNear:{value:100},hazeFar:{value:290}},vertexShader:'varying vec2 uvv;varying float depth;void main(){uvv=uv;vec4 mv=modelViewMatrix*vec4(position,1.);depth=-mv.z;gl_Position=projectionMatrix*mv;}',fragmentShader:'uniform float time;uniform float night;uniform vec3 hazeColor;uniform float hazeNear;uniform float hazeFar;varying vec2 uvv;varying float depth;void main(){float wave=sin(uvv.y*900.+sin(uvv.x*31.+time*.12)*1.2+time*.27);float gleam=pow(max(0.,wave),22.);vec3 col=mix(vec3(.10,.31,.34),vec3(.30,.52,.52),uvv.x)+gleam*vec3(.12,.18,.16);col=mix(col,col*.47,night);gl_FragColor=vec4(mix(col,hazeColor,smoothstep(hazeNear,hazeFar,depth)),1.);}'});
 const water=add(new THREE.PlaneGeometry(49,650),waterMaterial,-20,-.09,-60);water.rotation.x=-Math.PI/2;water.castShadow=false;water.receiveShadow=false;
 const pane=(x,y,z,w,h,parent)=>{box(x,y,z,w+.15,h+.14,.13,oak,parent);box(x,y,z+.08,w,h,.05,glass,parent);box(x,y,z+.12,.04,h,.05,0x76664f,parent);box(x,y,z+.12,w,.04,.05,0x76664f,parent);};
 function house(x,z,w,h,d,parent=before,tint=0xf0dfbe){const wall=tint===0xf0dfbe?plaster:material(tint,{map:plasterTex});box(x,h/2,z,w,h,d,wall,parent);box(x,h*.57,z+.05,w+.34,.19,d+.18,oak,parent);box(x,h,z,w+.45,.20,d+.3,oak,parent);roof(x,h,z,w+.7,h*.40,d+.7,roofMat,parent);
  for(const side of [-1,1]){box(x+side*(w/2-.12),h/2,z+d/2+.055,.18,h,.14,oak,parent);for(const y of [h*.25,h*.76])pane(x+side*w*.24,y,z+d/2+.12,w*.19,h*.16,parent);const diagonal=box(x+side*w*.24,h*.77,z+d/2+.07,.12,h*.37,.13,oak,parent);diagonal.rotation.z=side*.62;}
  box(x,h*.24,z+d/2+.10,.16,h*.47,.14,oak,parent);box(x,h*.78,z+d/2+.10,.16,h*.42,.14,oak,parent);box(x+w*.25,h+1,z-d*.22,.6,2.3,.7,brick,parent);box(x+w*.25,h+2.2,z-d*.22,.80,.20,.90,0x806349,parent);
 }
 // Old London Bridge: arches, starlings and a recognisable row of houses.
 // The northern open section recalls the gap left by the 1633 bridge fire.
 const bridge=new THREE.Shape();bridge.moveTo(-42,.05);bridge.lineTo(6,.05);bridge.lineTo(6,4.2);bridge.lineTo(-42,4.2);bridge.closePath();
 for(let i=0;i<8;i++){const x=-39+i*5.6,hole=new THREE.Path();hole.moveTo(x-1.8,.05);hole.lineTo(x-1.8,1.2);hole.quadraticCurveTo(x-1.8,2.95,x,3.05);hole.quadraticCurveTo(x+1.8,2.95,x+1.8,1.2);hole.lineTo(x+1.8,.05);hole.closePath();bridge.holes.push(hole);}
 const bridgeBody=add(new THREE.ExtrudeGeometry(bridge,{depth:5.4,bevelEnabled:false,curveSegments:10}),stone,0,0,5.3);box(-18,4.25,8,48.8,.30,6.2,0x9b9d8d);
 for(let i=0;i<9;i++){const x=-41+i*5.6;const pier=add(new THREE.CylinderGeometry(1.15,1.45,1.1,4),0x777f78,x,.35,8);pier.scale.z=2.65;pier.rotation.y=Math.PI/4;}
 const bridgeHouses=group('Houses on Old London Bridge');bridgeHouses.position.y=4.4;
 for(let i=0;i<7;i++){const x=-38+i*4.7;house(x,7.8,4.2,4.6+(i%3)*.65,4.7,bridgeHouses,[0xead2a8,0xd5c8ad,0xdbc09a][i%3]);}
 // Bridge gateway is modest and square; no modern Tower Bridge towers.
 for(const x of [-41,3.8]){box(x,6.5,8,2.0,4.2,5.6,stone);roof(x,8.65,8,2.7,1.35,6.0,roofMat);}
 const houses=[[9,-5,4.8,6.8,5],[15,-7,5.1,8.0,5],[22,-6,5.0,7.3,5],[29,-9,5.2,8.8,5],[35,-12,5.3,7.7,5],[12,-15,4.7,7.5,5],[20,-16,4.8,8.5,5],[28,-19,5,8,5],[36,-22,4.6,7.8,5],[40,-6,4.6,7,5]];
 houses.forEach((h,i)=>house(...h,before,i%4===0?0xd6bb92:0xf0dfbe));
 // Low-detail rooflines continue the city into the haze, framing the cathedral
 // without competing with the detailed foreground or adding selectable clutter.
 for(let i=0;i<17;i++){const x=8+i*4.1,z=-67-(i%3)*3,h=5+(i%4)*1.4;box(x,h/2,z,3.8,h,7,material(0x8f9b92));roof(x,h,z,4.3,2.7,7.6,material(0x687e80));}
 for(let i=0;i<11;i++){const z=-60+i*7,h=5+(i%3);box(-49,h/2,z,5,h,5,material(0x969d8a));roof(-49,h,z,5.5,3,5.6,material(0x718180));}
 // Brick existed before 1666 too: a brick warehouse is visible from stage 0.
 box(39,3.2,-30,8,6.4,7,brick);roof(39,6.4,-30,8.6,3.1,7.6,roofMat);for(const x of [37,40.5])pane(x,3.8,-26.42,1.4,2.1,fixed);
 // A continuous clerestory, transepts and a square crossing tower distinguish
 // OLD St Paul's. The 1561-lost spire and Wren's later dome are both absent.
 const cathedralBase=group('Old St Paul’s surviving wall interpretation');
 for(const x of [13.8,24.2])box(x,4.5,-40,.65,9,33,stone,cathedralBase);
 for(const z of [-23.7,-56.3])box(19,4.5,z,11,9,.65,stone,cathedralBase);
 for(const x of [9.5,28.5])for(const z of [-37.7,-46.3])box(x,4,z,8,8,.65,stone,cathedralBase);
 for(const x of [5.7,32.3])box(x,4,-42,.65,8,9,stone,cathedralBase);
 box(19,.12,-40,10,.16,32,0x64665a,cathedralBase);box(19,.12,-42,26,.16,8,0x64665a,cathedralBase);
 const arch=(w,h)=>{const s=new THREE.Shape();s.moveTo(-w/2,0);s.lineTo(-w/2,h*.64);s.quadraticCurveTo(-w/2,h*.82,0,h);s.quadraticCurveTo(w/2,h*.82,w/2,h*.64);s.lineTo(w/2,0);s.closePath();return s;};
 const gothic=(x,y,z,w,h,angle=0,parent=cathedralBase)=>{const g=new THREE.Group();g.position.set(x,y,z);g.rotation.y=angle;parent.add(g);add(new THREE.ShapeGeometry(arch(w+.25,h+.18)),material(0xc5c5b0),0,-.08,0,g);add(new THREE.ShapeGeometry(arch(w,h)),material(0x3c5961),0,0,.02,g);box(0,h*.35,.04,.065,h*.7,.08,0xb7b9a7,g);for(let row=0;row<3;row++)box(0,h*(.18+row*.18),.05,w*.91,.055,.05,0xb7b9a7,g);const tracer=add(new THREE.TorusGeometry(w*.22,.04,5,16),0xbfc1ae,0,h*.76,.05,g);g.updateMatrixWorld(true);for(const m of [...g.children])parent.attach(m);parent.remove(g);};
 for(let z=-26;z> -55;z-=4.1){gothic(24.53,4.1,z,1.8,4.2,Math.PI/2);box(24.85,4,z+1.6,.75,8,1.0,stone,cathedralBase);roof(24.85,8,z+1.6,1.1,.55,1.3,stone,cathedralBase);}
 roof(19,9.06,-40,11.6,5.3,33.7,roofMat,roofBefore);const transept=roof(19,8.05,-42,9.5,4.5,27.6,roofMat,roofBefore);transept.rotation.y=Math.PI/2;
 box(19,14,-42,7.6,11.8,7.6,stone,roofBefore);box(19,20.05,-42,8.1,.34,8.1,stone,roofBefore);
 for(const x of [-2.2,0,2.2])gothic(19+x,15.6,-38.17,1.3,3.2,0,roofBefore);
 for(const side of [-1,1])for(const x of [-2.2,0,2.2])box(19+x,20.55,-42+side*3.7,.7,.7,.8,stone,roofBefore);
 // Simplified classical west portico expresses Inigo Jones's pre-fire addition.
 for(let x=14.5;x<24;x+=1.8){cyl(x,3.6,-22.5,.30,.39,7.1,0xb6b8a4,cathedralBase);cyl(x,7.20,-22.5,.52,.52,.24,0xc2c3ae,cathedralBase);}
 box(19,7.55,-22.3,11.5,.5,3.1,stone,cathedralBase);roof(19,7.8,-22.3,12,2.2,3.4,stone,cathedralBase);
 // Later work is intentionally incomplete: ruins, scaffold and two partial
 // brick buildings, not an instantly restored city or new domed cathedral.
 for(const [x,z]of [[10,-7],[28,-12],[36,-21]]){box(x,.34,z,5.1,.7,5.2,0x796e5a,after);for(let i=0;i<4;i++)box(x-2+i*1.3,1.0+(i%2)*.35,z+1.8,.5,1.4+(i%2)*.7,.6,0x625d51,after);}
 for(const [x,z]of [[15,-8],[29,-19]]){box(x,2.2,z,4.9,4.4,4.9,brick,after);for(const side of [-1,1]){pane(x+side,2.7,z+2.5,1,1.7,after);box(x+side*3,3.5,z+2.8,.11,7,.11,oak,after);}for(const y of [1.2,3.5,5.8])box(x,y,z+2.8,6.5,.10,.8,0xa18b64,after);}
 for(let i=0;i<4;i++){box(18+i*.42,.22,-.5,1.4,.42,.65,brick,after);box(31+i*.5,.17,-6,1.2,.32,.7,stone,after);}
 // Original labelled stations: the parent supplies the full accessible controls
 // and learning tasks. Here, tapping requests a chapter; it never awards gems.
 for(let i=0;i<18;i++)box(4.2-i*.55,.15,15,.51,.17,4.2,0x907951);
 for(const x of [-5.1,3.7])for(const z of [13.4,16.6])cyl(x,.4,z,.10,.15,1.5,0x5b503e);
 const positions=[[10,12],[13,-1],[25,6],[-4,15],[36,-1]],names=['LONDON','BAKERY','EVIDENCE','HELPING','REBUILDING'];
 function labelMap(text,active=false,small=false){const c=document.createElement('canvas');c.width=512;c.height=small?100:210;const ctx=c.getContext('2d');ctx.fillStyle=active?'#f7cb79':'#f2e6cc';ctx.beginPath();ctx.roundRect(7,7,498,c.height-14,25);ctx.fill();ctx.strokeStyle='#916b42';ctx.lineWidth=3;ctx.stroke();ctx.fillStyle='#263e45';ctx.textAlign='center';ctx.font=small?'500 39px Georgia':'600 45px sans-serif';ctx.fillText(text,256,small?65:126);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;textures.add(t);return t;}
 function sign(text,x,y,z,width=14){const t=labelMap(text,false,true),s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthTest:false,depthWrite:false,toneMapped:false,fog:false}));s.position.set(x,y,z);s.scale.set(width,width*100/512,1);s.renderOrder=3;scene.add(s);return s;}
 const cathedralSign=sign('Old St Paul’s · 1666',19,23,-40,14),bridgeSign=sign('Old London Bridge',-22,14,7,15),puddingSign=sign('Pudding Lane',16,12,-7,10);
 const edgeLabels=[cathedralSign,bridgeSign,puddingSign];edgeLabels.forEach(s=>{s.userData.anchor=s.position.clone();});
 for(let i=0;i<5;i++){const g=group('Chapter '+i);g.userData.chapter=i;const [x,z]=positions[i];g.position.set(x,0,z);hotspots.push(g);cyl(0,.18,0,1.55,1.65,.3,0xa59874,g);box(0,1.1,0,1.8,.16,1.2,oak,g);for(const x of [-.7,.7])box(x,.65,0,.10,.9,.8,oak,g);
  if(i===0){const globe=sphere(0,1.8,0,.5,0x698f8c,g);const band=add(new THREE.TorusGeometry(.54,.045,6,24),0xc4a66b,0,1.8,0,g);band.rotation.x=.4;}
  if(i===1){for(let n=0;n<3;n++){const loaf=sphere(-.5+n*.5,1.40,0,.25,0xcba15f,g);loaf.scale.set(.8,.55,1.25);}}
  if(i===2){box(-.35,1.3,0,.65,.10,.9,0xf1dca5,g);box(.35,1.3,0,.65,.10,.9,0xf1dca5,g);for(let j=0;j<3;j++)box(.35,1.36,-.25+j*.19,.43,.01,.028,0x9a885e,g);}
  if(i===3){cyl(0,1.55,0,.43,.31,.74,0x8a7353,g);const handle=add(new THREE.TorusGeometry(.41,.035,5,20,Math.PI),0x374d50,0,1.86,0,g);}
  if(i===4){for(let n=0;n<3;n++)box(-.46+n*.45,1.37+n*.05,0,.65,.22,.43,brick,g);}
  badgeMaps[i]=[labelMap(`${i+1}  ${names[i]}`),labelMap(`${i+1}  ${names[i]}`,true)];const b=new THREE.Sprite(new THREE.SpriteMaterial({map:badgeMaps[i][0],depthWrite:false,depthTest:false,toneMapped:false,fog:false,transparent:true}));b.position.set(0,3.85,0);b.scale.set(5.1,2.09,1);b.renderOrder=4;g.add(b);badges.push(b);
  const hit=add(new THREE.SphereGeometry(1.8,8,6),new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false,colorWrite:false}),0,1.8,0,g);hit.castShadow=false;
 }
 // A bakery glow and distant smoke communicate the event without moving flames,
 // dangerous actions, threatened characters or instructions for lighting fires.
 const bakeryLight=new THREE.PointLight(0xffb35a,0,17,1.8);bakeryLight.position.set(13,3,-.4);scene.add(bakeryLight);
 const smokeCanvas=document.createElement('canvas');smokeCanvas.width=smokeCanvas.height=128;const smokeCtx=smokeCanvas.getContext('2d'),gradient=smokeCtx.createRadialGradient(64,64,2,64,64,64);gradient.addColorStop(0,'#65716fe0');gradient.addColorStop(.55,'#65716f75');gradient.addColorStop(1,'#65716f00');smokeCtx.fillStyle=gradient;smokeCtx.fillRect(0,0,128,128);const smokeMap=new THREE.CanvasTexture(smokeCanvas);textures.add(smokeMap);
 for(let i=0;i<9;i++){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:smokeMap,transparent:true,opacity:.45,depthWrite:false,color:0xc5bfb0}));s.position.set(12+(i%3)*4,10+i*1.5,-8-i*.9);s.scale.set(6+i*.45,5+i*.3,1);s.userData.origin=s.position.clone();smoke.add(s);smokePuffs.push(s);}
 function boat(x,z,parent=fixed){const g=new THREE.Group();g.position.set(x,.22,z);g.rotation.y=.2;parent.add(g);const hull=sphere(0,0,0,1,0x69533f,g);hull.scale.set(1.0,.34,2.7);box(0,.18,0,1.6,.12,4.0,0xaa8b5d,g);for(const z of [-1.1,0,1.1])box(0,.27,z,1.65,.12,.27,0x5c4f3c,g);boats.push(g);return g;}
 boat(-7,-7);boat(-30,23);for(const [x,z]of [[-10,19],[-18,-8],[-5,28]]){const b=boat(x,z,helping);box(0,.52,0,.85,.58,.85,0xb69a6b,b);}
 // Merge geometry per static/stage/interaction group, retaining stage visibility
 // and callback identity. No additional network requests or external models.
 function batch(g){for(const child of [...g.children])if(child.isGroup)batch(child);g.updateMatrixWorld(true);const map=new Map();for(const m of g.children){if(!m.isMesh||!m.material.isMeshStandardMaterial)continue;const key=m.material.uuid+'|'+Object.keys(m.geometry.attributes).sort().join(',')+'|'+!!m.geometry.index;if(!map.has(key))map.set(key,[]);map.get(key).push(m);}for(const list of map.values()){if(list.length<2)continue;const parts=list.map(m=>m.geometry.clone().applyMatrix4(m.matrix)),geo=mergeGeometries(parts);if(geo){const merged=new THREE.Mesh(geo,list[0].material);merged.castShadow=true;merged.receiveShadow=true;g.add(merged);for(const m of list){g.remove(m);m.geometry.dispose();}}parts.forEach(p=>p.dispose());}}
 groups.forEach(batch);
 const sky=createFireSky(scene);textures.add(sky.texture);
 const palettes=[{sky:0xa8bdc2,fog:0xb6c6c3,light:3.2,hemi:2.6,night:0},{sky:0x172f40,fog:0x294455,light:1.9,hemi:1.7,night:1},{sky:0x7c8588,fog:0x9a9d94,light:2.5,hemi:2.1,night:.35},{sky:0x8da5ad,fog:0xabbab7,light:2.7,hemi:2.3,night:.1},{sky:0xb9caca,fog:0xc3cec6,light:3.3,hemi:2.6,night:0}];
 const explorer=createFireExplorer(scene,{reducedMotion,requestRender});
 const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
 function requestRender(){dirty=true;if(!disposed&&!raf)raf=requestAnimationFrame(tick);}
 function render(){const framing=Math.min(2.2,Math.max(1,1.65/camera.aspect));scene.fog.near=offset.length()*framing+25;scene.fog.far=scene.fog.near+180;waterMaterial.uniforms.hazeNear.value=scene.fog.near;waterMaterial.uniforms.hazeFar.value=scene.fog.far;camera.position.copy(target).add(offset.clone().multiplyScalar(framing).applyAxisAngle(new THREE.Vector3(0,1,0),currentOrbit));camera.lookAt(target);camera.updateMatrixWorld();
  // Preserve readable landmark names when architecture extends beyond a narrow
  // pane. Only the floating label moves; the historical building stays in place.
  const titleRect=container.closest('.fire-scene')?.querySelector('.fire-scene-title')?.getBoundingClientRect(),canvasRect=canvas.getBoundingClientRect();
  for(const s of edgeLabels){s.position.copy(s.userData.anchor);const p=s.position.clone().project(camera),distance=s.position.clone().applyMatrix4(camera.matrixWorldInverse).z,worldWidth=2*Math.abs(distance)*Math.tan(THREE.MathUtils.degToRad(camera.fov/2))*camera.aspect,margin=s.scale.x/worldWidth+.045;const nx=THREE.MathUtils.clamp(p.x,-1+margin,1-margin);if(nx!==p.x){p.x=nx;s.position.copy(p.clone().unproject(camera));}const px=canvasRect.left+(nx+1)*canvasRect.width/2,py=canvasRect.top+(1-p.y)*canvasRect.height/2,halfWidth=s.scale.x/worldWidth*canvasRect.width/2,halfHeight=halfWidth*s.scale.y/s.scale.x;s.visible=!titleRect||px+halfWidth<titleRect.left||px-halfWidth>titleRect.right||py+halfHeight<titleRect.top||py-halfHeight>titleRect.bottom+8;}
  if(reducedMotion)animateSmoke(0);sky.update(reducedMotion?0:time,camera.aspect);renderer.render(scene,camera);dirty=false;}
 function animateSmoke(t){smokePuffs.forEach((s,i)=>{const phase=(t*.025+i/9)%1;s.position.copy(s.userData.origin);s.position.x+=phase*3.5;s.position.y+=phase*5;s.material.opacity=Math.sin(phase*Math.PI)*.36;s.scale.set(6+i*.45+phase*2,5+i*.3+phase*2,1);});}
 function tick(now){raf=0;if(disposed)return;const dt=Math.min(.05,last?(now-last)/1000:0);last=now;if(!reducedMotion){time+=dt;explorer.update(dt);waterMaterial.uniforms.time.value=time;target.lerp(desiredTarget,1-Math.exp(-dt*3));offset.lerp(desiredOffset,1-Math.exp(-dt*3));currentOrbit=THREE.MathUtils.lerp(currentOrbit,orbit,1-Math.exp(-dt*7));boats.forEach((b,i)=>{b.position.y=.22+Math.sin(time*.45+i)*.035;});animateSmoke(time);dirty=true;}if(dirty)render();if(!reducedMotion&&!document.hidden)raf=requestAnimationFrame(tick);}
 function setChapter(index){if(disposed)return;chapter=THREE.MathUtils.clamp(Math.round(Number(index)||0),0,4);const p=palettes[chapter];sky.setChapter(chapter,p.fog);renderer.setClearColor(p.fog);scene.fog.color.setHex(p.fog);const haze=new THREE.Color(p.fog).getRGB({},THREE.SRGBColorSpace);waterMaterial.uniforms.hazeColor.value.set(haze.r,haze.g,haze.b);sun.intensity=p.light;sun.color.setHex(chapter===1?0xb5d1e7:0xffe0ab);hemi.intensity=p.hemi;waterMaterial.uniforms.night.value=p.night;glass.emissiveIntensity=chapter===1?.65:.04;bakeryLight.intensity=chapter===1?45:chapter===2?25:0;
  before.visible=chapter<4;roofBefore.visible=chapter<4;after.visible=chapter===4;smoke.visible=chapter===2||chapter===3;helping.visible=chapter>=3;cathedralSign.material.map=chapter===4?ruinLabel:cathedralLabel;cathedralSign.userData.anchor.y=chapter===4?14:23;
  badges.forEach((b,i)=>{b.material.map=badgeMaps[i][i===chapter?1:0];});desiredTarget.set(positions[chapter][0],4,positions[chapter][1]-8);desiredOffset.set(24,18,32);orbit=0;explorer.setChapter(chapter);
  if(reducedMotion){target.copy(desiredTarget);offset.copy(desiredOffset);currentOrbit=0;}requestRender();
 }
 const cathedralLabel=cathedralSign.material.map,ruinLabel=labelMap('Old St Paul’s · ruins',false,true);
 function setReducedMotion(value){if(disposed)return;reducedMotion=Boolean(value);explorer.setReducedMotion(reducedMotion);if(reducedMotion){target.copy(desiredTarget);offset.copy(desiredOffset);currentOrbit=orbit;waterMaterial.uniforms.time.value=0;boats.forEach(b=>{b.position.y=.22;});animateSmoke(0);}last=0;requestRender();}
 function resize(){if(disposed)return;const r=container.getBoundingClientRect();renderer.setSize(Math.max(1,r.width),Math.max(1,r.height),false);camera.aspect=Math.max(1,r.width)/Math.max(1,r.height);camera.updateProjectionMatrix();requestRender();}
 function down(e){if(e.button!==0)return;pointerStart={id:e.pointerId,x:e.clientX,y:e.clientY,orbit,moved:false};canvas.setPointerCapture?.(e.pointerId);}
 function move(e){if(!pointerStart||e.pointerId!==pointerStart.id)return;const dx=e.clientX-pointerStart.x,dy=e.clientY-pointerStart.y;if(Math.hypot(dx,dy)>=8)pointerStart.moved=true;if(pointerStart.moved){orbit=THREE.MathUtils.clamp(pointerStart.orbit-dx*.0025,-.3,.3);if(reducedMotion)currentOrbit=orbit;requestRender();}}
 function up(e){if(!pointerStart||e.pointerId!==pointerStart.id)return;const start=pointerStart;pointerStart=null;canvas.releasePointerCapture?.(e.pointerId);if(start.moved||Math.hypot(e.clientX-start.x,e.clientY-start.y)>=8)return;const r=canvas.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,1-(e.clientY-r.top)/r.height*2);raycaster.setFromCamera(pointer,camera);const hits=raycaster.intersectObjects(hotspots,true);if(hits.length){let o=hits[0].object;while(o&&o.userData.chapter===undefined)o=o.parent;if(o)onSelect(o.userData.chapter);}}
 function cancel(){pointerStart=null;}
 function visibility(){if(document.hidden){if(raf)cancelAnimationFrame(raf);raf=0;}else{last=0;requestRender();}}
 const observer=new ResizeObserver(resize);observer.observe(container);canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',cancel);document.addEventListener('visibilitychange',visibility);
 function dispose(){if(disposed)return;disposed=true;explorer.dispose();if(raf)cancelAnimationFrame(raf);observer.disconnect();canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',cancel);document.removeEventListener('visibilitychange',visibility);const geo=new Set(),mats=new Set();scene.traverse(o=>{if(o.geometry)geo.add(o.geometry);if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])mats.add(m);});geo.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());renderer.dispose();renderer.forceContextLoss();canvas.remove();}
 resize();setChapter(0);explorer.setExplorer();return {setChapter,setReducedMotion,setExplorer:explorer.setExplorer,celebrateExplorer:explorer.celebrate,getExplorerState:explorer.getState,dispose};
}
