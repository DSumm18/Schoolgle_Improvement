import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {createPlotSky} from './plot-sky.js';

// An original, compressed story-map reconstruction inspired by 1605 Westminster.
// Identifiable medieval buildings are based on Parliament's architectural
// research; the layout, proportions of details and lighting are interpretative.
// Parliament describes the old palace as a jumble of medieval buildings:
// https://www.parliament.uk/about/living-heritage/evolutionofparliament/parliamentaryauthority/the-gunpowder-plot-of-1605/overview/the-plot-and-its-discovery/parliament-in-1605/
export function createPlotWorld(container,{onSelect=()=>{},reducedMotion=false}={}){
 const scene=new THREE.Scene();scene.background=new THREE.Color(0x182d40);scene.fog=new THREE.FogExp2(0x243d4e,.013);
 const camera=new THREE.PerspectiveCamera(43,1,.1,220),renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 const canvas=renderer.domElement;canvas.style.cssText='display:block;width:100%;height:100%;touch-action:pan-y;';canvas.setAttribute('aria-hidden','true');container.append(canvas);
 const hemi=new THREE.HemisphereLight(0xc4dcf2,0x67533c,2.2);scene.add(hemi);
 const moonlight=new THREE.DirectionalLight(0xb5d2ec,2.8);moonlight.position.set(-15,35,18);moonlight.castShadow=true;moonlight.shadow.mapSize.set(1024,1024);Object.assign(moonlight.shadow.camera,{left:-38,right:38,top:35,bottom:-35,near:1,far:100});moonlight.shadow.normalBias=.05;scene.add(moonlight);
 const warm=new THREE.DirectionalLight(0xf3aa58,1.6);warm.position.set(25,13,15);scene.add(warm);
 const mats=new Map(),textures=new Set(),staticMeshes=[],selectables=[],beacons=[],rings=[],lanternGlows=[],lanternLights=[],buildingLabels=[];
 const sky=createPlotSky(scene);
 let disposed=false,frame=0,last=0,time=0,chapter=0,drag=null,orbit=0,currentOrbit=0,dirty=true;
 const viewTarget=new THREE.Vector3(3,7,-16),desiredTarget=viewTarget.clone(),viewOffset=new THREE.Vector3(30,21,44),desiredOffset=viewOffset.clone();
 const mat=(color,extra={})=>{const key=JSON.stringify([color,extra]);if(!mats.has(key))mats.set(key,new THREE.MeshStandardMaterial({color,roughness:.9,...extra}));return mats.get(key);};
 const add=(geo,material,x,y,z,parent=scene,merge=true)=>{const mesh=new THREE.Mesh(geo,typeof material==='number'?mat(material):material);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);if(merge&&parent===scene)staticMeshes.push(mesh);return mesh;};
 const box=(x,y,z,w,h,d,c,parent,merge=true)=>add(new THREE.BoxGeometry(w,h,d),c,x,y,z,parent,merge);
 const cyl=(x,y,z,top,bottom,h,c,parent)=>add(new THREE.CylinderGeometry(top,bottom,h,10),c,x,y,z,parent);
 const plane=(x,y,z,w,h,c,parent)=>add(new THREE.PlaneGeometry(w,h),c,x,y,z,parent);
 const texture=(kind)=>{const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d');
  if(kind==='plaster'){ctx.fillStyle='#cdc0a2';ctx.fillRect(0,0,256,256);let seed=82;for(let i=0;i<5500;i++){seed=(seed*1664525+1013904223)>>>0;const x=seed%256;seed=(seed*1664525+1013904223)>>>0;ctx.fillStyle=i%2?'#8c7e6519':'#fff3d824';ctx.fillRect(x,seed%256,2,2);}}
  if(kind==='stone'){ctx.fillStyle='#6e7776';ctx.fillRect(0,0,256,256);for(let row=0;row<8;row++)for(let col=-1;col<7;col++){const x=col*48+(row%2)*24,y=row*32;ctx.fillStyle=['#91958b','#828d8a','#a19d8a','#7d8988'][(row*7+col+10)%4];ctx.fillRect(x+2,y+2,44,28);ctx.fillStyle='#bdbaa244';ctx.fillRect(x+3,y+3,42,2);}}
  if(kind==='roof'){ctx.fillStyle='#39454c';ctx.fillRect(0,0,256,256);for(let row=0;row<12;row++)for(let col=-1;col<9;col++){ctx.fillStyle=['#46525a','#536068','#3f4d55'][(row+col+12)%3];ctx.fillRect(col*34+(row%2)*17+1,row*22+1,32,20);}}
  if(kind==='ashlar'){ctx.fillStyle='#756e60';ctx.fillRect(0,0,256,256);for(let row=0;row<8;row++)for(let col=-1;col<5;col++){const x=col*65+(row%2)*32,y=row*32;ctx.fillStyle=['#b8b19b','#aaa590','#c4bea7','#a49f8e','#b6af98'][(row*3+col+10)%5];ctx.fillRect(x+1,y+1,63,30);ctx.fillStyle='#e1d9ba55';ctx.fillRect(x+2,y+2,61,1);ctx.fillStyle='#6b685633';ctx.fillRect(x+2,y+29,61,1);}}
  if(kind==='lead'){ctx.fillStyle='#53616c';ctx.fillRect(0,0,256,256);for(let i=0;i<8;i++){ctx.fillStyle=i%2?'#576570':'#5d6972';ctx.fillRect(i*32+1,0,30,256);ctx.fillStyle='#303f4f';ctx.fillRect(i*32,0,1,256);ctx.fillStyle='#95a0a133';ctx.fillRect(i*32+2,0,1,256);}for(let y=48;y<256;y+=70){ctx.fillStyle='#384955';ctx.fillRect(0,y,256,1);}}
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());textures.add(t);return t;
 };
 const plaster=mat(0xf2debb,{map:texture('plaster')}),roofMat=mat(0x7b8c98,{map:texture('roof')}),stoneMap=texture('stone');stoneMap.repeat.set(8,8);
 const stone=mat(0xa8aaa0,{map:stoneMap}),timber=0x443831,trim=0x78634a,slate=0x3b4c58;
 const glass=mat(0xffcb7c,{emissive:0xffa23e,emissiveIntensity:.85,roughness:.5,fog:false});
 // The river and a low stone quay establish the Thames-side setting.
 box(6,-.65,-20,52,1.2,87,0x555957);const paving=plane(6,-.035,-20,51,86,stone);paving.rotation.x=-Math.PI/2;paving.castShadow=false;
 box(-19,-.55,0,3,.5,46,0x626a68);box(-18.3,.25,0,.5,.5,46,0x879189);
 const waterMaterial=new THREE.ShaderMaterial({uniforms:{time:{value:0}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform float time;varying vec2 vUv;void main(){float r=sin(vUv.y*230.+sin(vUv.x*44.+time*.18)*1.7+time*.38);float glint=pow(max(0.,r),24.)*.22;float lane=pow(max(0.,1.-abs(vUv.x-.6)*3.),5.);vec3 c=mix(vec3(.055,.17,.22),vec3(.16,.30,.36),vUv.x)+vec3(.34,.39,.35)*glint*(.2+lane);gl_FragColor=vec4(c,1.);}'});
 const river=plane(-35,-.15,-8,30,110,waterMaterial);river.rotation.x=-Math.PI/2;river.castShadow=false;river.receiveShadow=false;
 // Plain gables and lead-coloured roofs deliberately avoid the modern palace.
 const roof=(x,y,z,width,height,depth,material=roofMat,parent=scene)=>{
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute([-width/2,0,depth/2,width/2,0,depth/2,0,height,depth/2,-width/2,0,-depth/2,0,height,-depth/2,width/2,0,-depth/2,-width/2,0,depth/2,0,height,depth/2,0,height,-depth/2,-width/2,0,depth/2,0,height,-depth/2,-width/2,0,-depth/2,0,height,depth/2,width/2,0,depth/2,width/2,0,-depth/2,0,height,depth/2,width/2,0,-depth/2,0,height,-depth/2],3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,1,0,.5,1,0,0,.5,1,1,0,0,0,1,0,1,1,0,0,1,1,0,1,0,0,1,0,1,1,0,0,1,1,0,1],2));g.computeVertexNormals();return add(g,material,x,y,z,parent);
 };
 const window=(x,y,z,width=1,height=1.6,parent=scene)=>{box(x,y,z,width+.22,height+.2,.16,timber,parent);box(x,y,z+.10,width,height,.05,glass,parent);box(x,y,z+.15,.055,height,.06,trim,parent);box(x,y,z+.15,width,.06,.06,trim,parent);};
 const house=(x,z,w=6,h=7,d=6)=>{
  box(x,h/2,z,w,h,d,plaster);box(x,h*.54,z+.10,w+.45,.26,d+.35,timber);box(x,h,z,w+.5,.23,d+.25,timber);roof(x,h,z,w+.9,h*.4,d+.9);
  for(const side of [-1,1])box(x+side*(w/2-.15),h/2,z+d/2+.04,.22,h,.19,timber);
  for(const y of [h*.22,h*.73])for(const side of [-1,1])window(x+side*w*.26,y,z+d/2+.16,w*.18,h*.18);
  box(x,h*.26,z+d/2+.06,.22,h*.52,.15,timber);box(x,h*.78,z+d/2+.07,.22,h*.42,.15,timber);
  for(const side of [-1,1]){const beam=box(x+side*w*.25,h*.76,z+d/2+.06,.14,h*.47,.15,timber);beam.rotation.z=side*.56;}
  box(x+w*.26,h+1.65,z-.8,.7,3,.8,0x865f49);box(x+w*.26,h+3.16,z-.8,.92,.2,1,0x604b3d);
 };
 house(-24,-30,5.5,6.5,6);house(-24,-40,5,7.2,6);house(32,-38,5.5,6.5,6);
 // Westminster Hall's recognisable elongated mass, buttresses, great gable
 // and lead-covered roof replace the former generic distant palace blocks.
 const ashlarMap=texture('ashlar');ashlarMap.repeat.set(2,2);const masonry=mat(0xc8c4b0,{map:ashlarMap,bumpMap:ashlarMap,bumpScale:.055}),dress=mat(0xc4bda4),shadowStone=mat(0x898976),lead=mat(0x8896a1,{map:texture('lead'),roughness:.72});
 const archShape=(width,height)=>{const s=new THREE.Shape();s.moveTo(-width/2,0);s.lineTo(-width/2,height*.62);s.quadraticCurveTo(-width/2,height*.82,0,height);s.quadraticCurveTo(width/2,height*.82,width/2,height*.62);s.lineTo(width/2,0);s.closePath();return s;};
 const flatten=(group)=>{group.updateMatrixWorld(true);for(const child of [...group.children]){scene.attach(child);if(child.isMesh)staticMeshes.push(child);}scene.remove(group);};
 const gothicWindow=(x,y,z,width,height,angle=0,lights=3)=>{
  const group=new THREE.Group();group.position.set(x,y,z);group.rotation.y=angle;scene.add(group);
  add(new THREE.ExtrudeGeometry(archShape(width+.34,height+.25),{depth:.22,bevelEnabled:false,curveSegments:12}),dress,0,-.13,0,group);
  add(new THREE.ShapeGeometry(archShape(width,height),12),mat(0x273c45),0,0,.23,group);
  const windowGlass=mat(0x7d9a9c,{emissive:0xa48147,emissiveIntensity:.14,roughness:.45});
  add(new THREE.ShapeGeometry(archShape(width*.86,height*.93),12),windowGlass,0,.10,.245,group);
  for(let i=1;i<lights;i++)box(-width/2+i*width/lights,height*.37,.29,.065,height*.70,.08,dress,group);
  for(const ratio of [.21,.43,.63])box(0,height*ratio,.29,width*.91,.065,.075,dress,group);
  for(let i=0;i<lights;i++){const xx=-width*.43+(i+.5)*width*.86/lights;const trace=add(new THREE.TorusGeometry(width*.29/lights,.041,5,16),dress,xx,height*.77,.30,group);trace.scale.y=1.35;}
  const roundel=add(new THREE.TorusGeometry(width*.12,.05,5,20),dress,0,height*.89,.30,group);roundel.scale.y=.95;
  // Fine leaded diamond lines add close-view detail without separate glass panes.
  for(let k=0;k<6;k++){const line=box(0,height*(.10+k*.083),.282,width*.87,.015,.015,0x526568,group);}
  box(0,-.12,.23,width+.64,.22,.55,dress,group);flatten(group);
 };
 const buttress=(x,z,height,angle=0)=>{const group=new THREE.Group();group.position.set(x,0,z);group.rotation.y=angle;scene.add(group);for(let k=0;k<3;k++){const h=height/3,d=1.65-k*.36;box(0,h*(k+.5),d*.20,.84-k*.12,h,d,masonry,group);const cap=box(0,h*(k+1),d*.20,.94-k*.12,.18,d+.16,dress,group);cap.rotation.x=.10;}roof(0,height+.05,.13,.74,.55,.9,dress,group);flatten(group);};
 const hallX=-6,hallZ=-30,hallWidth=12,hallLength=42,hallHeight=12;
 box(hallX,hallHeight/2,hallZ,hallWidth,hallHeight,hallLength,masonry);
 box(hallX,.35,hallZ,hallWidth+1.0,.7,hallLength+.6,shadowStone);
 box(hallX,hallHeight,hallZ,hallWidth+.5,.34,hallLength+.55,dress);
 const openRoofEnds=mesh=>{for(const [name,attribute]of Object.entries(mesh.geometry.attributes))mesh.geometry.setAttribute(name,new THREE.BufferAttribute(attribute.array.slice(6*attribute.itemSize),attribute.itemSize));return mesh;};
 openRoofEnds(roof(hallX,hallHeight+.16,hallZ,hallWidth+.9,7.4,hallLength+.8,lead));
 // The end wall rises into the great gable; it is not a roof-coloured triangle.
 const frontGable=new THREE.BufferGeometry();frontGable.setAttribute('position',new THREE.Float32BufferAttribute([-6,0,0,6,0,0,0,7.1,0],3));frontGable.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,1,0,.5,1],2));frontGable.computeVertexNormals();add(frontGable,masonry,hallX,12.14,-8.97);const backGable=add(frontGable.clone(),masonry,hallX,12.14,-51.02);backGable.rotation.y=Math.PI;
 for(const side of [-1,1]){const trimBeam=box(hallX+side*3.05,15.78,-8.91,.23,9.38,.34,dress);trimBeam.rotation.z=side*.697;}
 gothicWindow(hallX,5.4,-8.85,5.2,10.0,0,5);
 // Recessed pointed doorway and side niches establish a human scale.
 add(new THREE.ExtrudeGeometry(archShape(3.1,4.15),{depth:.35,bevelEnabled:false,curveSegments:14}),dress,hallX,0,-8.7);
 add(new THREE.ShapeGeometry(archShape(2.45,3.8)),mat(0x33342e),hallX,.06,-8.33);
 for(const side of [-1,1]){box(hallX+side*.56,1.53,-8.29,1.03,2.9,.08,0x62583f);gothicWindow(hallX+side*4.65,5.7,-8.8,.85,2.8,0,1);}
 for(const side of [-1,1]){box(hallX+side*5.92,6.85,-8.95,1.02,13.7,1.6,masonry);box(hallX+side*5.92,13.7,-8.95,1.26,.30,1.85,dress);for(let k=0;k<3;k++)box(hallX+side*5.92+(k-1)*.4,14.08,-8.22,.26,.65,.4,dress);}
 for(let i=0;i<9;i++){const z=-12-i*4.35;buttress(.20,z,10.5,Math.PI/2);buttress(-12.2,z,10.5,-Math.PI/2);gothicWindow(.10,5.5,z-1.7,2.0,5.6,Math.PI/2,2);}
 // Two roof lanterns are documented for the medieval hall. Their small
 // louvred forms avoid introducing a nineteenth-century clock tower.
 for(const z of [-23,-40]){box(hallX,19.9,z,1.55,1.55,2.1,shadowStone);for(const side of [-1,1])for(let y=19.4;y<20.6;y+=.25)box(hallX+side*.80,y,z,.055,.075,1.75,0x3d494f);roof(hallX,20.72,z,2.2,1.4,2.75,lead);}
 // St Stephen's: an upper chapel over an undercroft, expressed through two
 // storeys, tall pointed windows, buttress bays and a slender lead roof.
 const chapelX=14,chapelZ=-29,chapelWidth=10,chapelLength=28,chapelHeight=13.4;
 box(chapelX,chapelHeight/2,chapelZ,chapelWidth,chapelHeight,chapelLength,masonry);
 box(chapelX,3.25,chapelZ,10.5,.24,28.5,dress);box(chapelX,13.4,chapelZ,10.6,.35,28.6,dress);
 openRoofEnds(roof(chapelX,13.55,chapelZ,10.5,5.2,28.4,lead));
 const chapelGable=frontGable.clone();const chapelFront=add(chapelGable,masonry,chapelX,13.55,-14.95);chapelFront.scale.set(.83,.70,1);const chapelBack=add(frontGable.clone(),masonry,chapelX,13.55,-43.02);chapelBack.scale.set(.83,.70,1);chapelBack.rotation.y=Math.PI;
 gothicWindow(chapelX,5.5,-14.8,6.9,7.0,0,5);gothicWindow(chapelX,1,-14.76,2.4,2.0,0,2);
 for(const side of [-1,1]){buttress(chapelX+side*4.75,-14.78,14.0);for(let k=0;k<6;k++){const z=-17.1-k*4.75;buttress(chapelX+side*5.15,z,13.4,side*Math.PI/2);if(side===1){gothicWindow(chapelX+side*5.10,5.4,z-2.15,2.8,6.9,Math.PI/2,3);gothicWindow(chapelX+side*5.12,.9,z-2.15,1.8,1.7,Math.PI/2,2);}}}
 // Lower connecting ranges give the old palace its irregular composition.
 box(5,3.15,-40,10,6.3,13,masonry);roof(5,6.3,-40,11,3.2,14,lead);for(let x=2;x<9;x+=2.4)gothicWindow(x,2.2,-33.43,1.2,2.8,0,1);
 box(26,4.1,-28,8,8.2,21,masonry);roof(26,8.2,-28,8.7,3.5,21.7,lead);for(let z=-20;z> -37;z-=4)gothicWindow(30.06,3.6,z,1.8,3.6,Math.PI/2,2);
 // These are scene labels, never clickable substitutes for the five tasks.
 const buildingLabel=(text,x,y,z,width)=>{const c=document.createElement('canvas');c.width=768;c.height=110;const ctx=c.getContext('2d');ctx.fillStyle='#102631dc';ctx.beginPath();ctx.roundRect(5,5,758,100,14);ctx.fill();ctx.strokeStyle='#ccb47c';ctx.lineWidth=2;ctx.stroke();ctx.fillStyle='#f2dfad';ctx.textAlign='center';ctx.font='500 54px Georgia';ctx.fillText(text,384,70);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;textures.add(t);const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthTest:false,depthWrite:false,toneMapped:false,fog:false}));sprite.position.set(x,y,z);sprite.scale.set(width,width*110/768,1);sprite.renderOrder=3;scene.add(sprite);buildingLabels.push(sprite);};
 buildingLabel('Westminster Hall',-6,22.5,-24,13.5);buildingLabel('St Stephen’s Chapel',14,20.7,-25,14);
 // Rooflines recede into the blue mist rather than a modern skyline.
 for(let i=0;i<9;i++){const x=-44+i*9,h=4+(i%3)*2;box(x,h/2,-55,7,h,8,0x3b5262);roof(x,h,-55,8,3+(i%2),9,mat(0x304959));}
 // Layered sky textures, fixed stars and a softly shaded moon are owned by sky.
 const glowCanvas=document.createElement('canvas');glowCanvas.width=glowCanvas.height=64;
 const glowContext=glowCanvas.getContext('2d'),glowGradient=glowContext.createRadialGradient(32,32,0,32,32,32);
 glowGradient.addColorStop(0,'rgba(255,224,167,.65)');glowGradient.addColorStop(.18,'rgba(255,191,98,.22)');glowGradient.addColorStop(.6,'rgba(247,155,62,.055)');glowGradient.addColorStop(1,'rgba(247,155,62,0)');glowContext.fillStyle=glowGradient;glowContext.fillRect(0,0,64,64);
 const lanternGlowMap=new THREE.CanvasTexture(glowCanvas);lanternGlowMap.colorSpace=THREE.SRGBColorSpace;textures.add(lanternGlowMap);
 // Original lanterns make the route legible in the blue-hour palette.
 const lantern=(x,z,height=3.7)=>{cyl(x,height/2,z,.065,.12,height,0x363b3d);box(x,height,z,.65,.12,.65,0x3b3a33);box(x,height+.4,z,.42,.7,.42,glass);roof(x,height+.8,z,.8,.4,.8,mat(0x333d41));
  const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:lanternGlowMap,transparent:true,opacity:.52,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false}));glow.position.set(x,height+.43,z);glow.scale.set(2.7,2.7,1);scene.add(glow);lanternGlows.push(glow);
  const pool=new THREE.Mesh(new THREE.CircleGeometry(2.2,32),new THREE.MeshBasicMaterial({color:0xfac474,transparent:true,opacity:.09,depthWrite:false}));pool.rotation.x=-Math.PI/2;pool.position.set(x,.011,z);scene.add(pool);
 };
 for(const [x,z]of [[-15,14],[-15,-2],[-4,12],[8,12],[20,10],[26,-7]])lantern(x,z);
 for(const [x,z]of [[-8,5],[12,3],[24,-9]]){const light=new THREE.PointLight(0xffb45f,32,12,1.8);light.position.set(x,4,z);scene.add(light);lanternLights.push(light);}
 // A small moored boat and jetty are setting details, not interactive hazards.
 for(let i=0;i<7;i++)box(-23-i*.55,.08,12,.5,.16,2.6,0x725b44);
 const boat=new THREE.Group();boat.position.set(-28,.12,15);boat.rotation.y=.3;scene.add(boat);const hull=add(new THREE.SphereGeometry(1,14,8),0x675446,0,0,0,boat);hull.scale.set(1.1,.35,3);box(0,.16,0,1.5,.12,4.5,0x92785a,boat);for(const z of [-1.3,0,1.3])box(0,.25,z,1.7,.12,.26,0x574b3f,boat);
 const landmarkPositions=[[-8,5],[2,-3],[12,3],[22,0],[24,-12]],names=['PEOPLE','WARNING','SEARCH','STORY','REMEMBER'];
 const labelTexture=(index,active=false)=>{const c=document.createElement('canvas');c.width=256;c.height=144;const ctx=c.getContext('2d');ctx.fillStyle=active?'#f5ce7c':'#e9e2cd';ctx.beginPath();ctx.roundRect(10,12,236,114,24);ctx.fill();ctx.strokeStyle=active?'#fff3c1':'#8babae';ctx.lineWidth=4;ctx.stroke();ctx.fillStyle='#233d49';ctx.font='700 43px sans-serif';ctx.textAlign='center';ctx.fillText(String(index+1),128,66);ctx.font='700 21px sans-serif';ctx.fillText(names[index],128,106);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;textures.add(t);return t;};
 const labelMaps=landmarkPositions.map((_,i)=>[labelTexture(i),labelTexture(i,true)]);
 for(let i=0;i<5;i++){
  const [x,z]=landmarkPositions[i],g=new THREE.Group();g.position.set(x,0,z);g.userData.chapter=i;scene.add(g);selectables.push(g);
  cyl(0,.08,0,2.3,2.4,.15,0x778580,g);cyl(0,.17,0,1.92,2.0,.06,0x394f58,g);
  const ring=new THREE.Mesh(new THREE.RingGeometry(2.01,2.13,48),new THREE.MeshBasicMaterial({color:0x7eb3b4,transparent:true,opacity:.8,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=.22;g.add(ring);rings.push(ring);
  const label=new THREE.Sprite(new THREE.SpriteMaterial({map:labelMaps[i][0],depthTest:false,depthWrite:false,transparent:true,fog:false,toneMapped:false}));label.position.set(0,i===1?6:4.5,0);label.scale.set(4.2,2.36,1);label.renderOrder=4;g.add(label);beacons.push(label);
  const target=new THREE.Mesh(new THREE.SphereGeometry(2.2,8,6),new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false,colorWrite:false}));target.position.y=2;target.userData.chapter=i;g.add(target);
  if(i===0){box(0,1.2,0,2.5,.22,1.7,0x806548,g);for(const xx of [-.95,.95])for(const zz of [-.6,.6])box(xx,.66,zz,.14,1.15,.14,0x4d4438,g);for(const [j,x]of [-.76,0,.76].entries()){box(x,1.97,0,.66,1.25,.08,0xf0dcac,g);const ink=[0x6f7f79,0x875d49,0x596e83][j];add(new THREE.CircleGeometry(.14,16),ink,x,2.21,.05,g);const bust=add(new THREE.CircleGeometry(.23,16),ink,x,1.86,.05,g);bust.scale.y=.8;box(x,1.56,.05,.4,.035,.012,0xb4a17d,g);}}
  if(i===1){for(const side of [-1,1])box(side*1.35,2.05,0,.35,4.1,.55,0x75624a,g);box(0,4.15,0,3.2,.24,.75,0xa18961,g);box(0,2.55,.13,2.3,2.9,.18,0x655843,g);box(0,2.58,.24,2.04,2.57,.05,0xf0d9a6,g);for(let k=0;k<6;k++)box(-.09,3.40-k*.24,.28,1.42-(k%3)*.18,.037,.012,0x9c8867,g);const seal=add(new THREE.CircleGeometry(.21,20),0xa04b37,.51,1.64,.29,g);box(-.79,3.72,.3,.09,.09,.04,0xb39a66,g);box(.79,3.72,.3,.09,.09,.04,0xb39a66,g);}
  if(i===2){box(0,1.1,0,2.3,.2,1.7,0x8b7151,g);for(const xx of [-.85,.85])box(xx,.6,0,.18,1,.95,0x4f493d,g);const board=box(-.35,1.55,0,1.15,.08,1.0,0xc2b88f,g);board.rotation.z=-.18;for(let j=0;j<3;j++)box(.65,1.3+j*.13,.12,.6,.11,.72,j%2?0x68746e:0xa37652,g);const lens=add(new THREE.TorusGeometry(.33,.055,8,20),0xc7ac67,.18,1.50,.50,g);lens.rotation.x=-Math.PI/2;const handle=box(.62,1.50,.55,.55,.09,.10,0x514635,g);handle.rotation.y=-.15;}
  if(i===3){box(0,1.22,0,2.8,.2,1.9,0x8b7151,g);for(const x of [-1.1,1.1])box(x,.69,0,.2,1.05,1.4,0x51483d,g);for(let j=0;j<3;j++){box(-.87+j*.87,1.36,0,.72,.045,1.22,0xead8b0,g);for(let line=0;line<4;line++)box(-.87+j*.87,1.387,-.32+line*.18,.47,.01,.024,0xa49371,g);}box(0,1.38,.82,2.3,.07,.07,0xa78952,g);}
  if(i===4){box(0,1.38,0,2.7,2.4,1.1,0x615548,g);for(const y of [.35,1.3,2.25])box(0,y,.12,2.8,.12,1.1,0xa28760,g);for(let row=0;row<2;row++)for(let j=0;j<7;j++){const h=.57+(j%3)*.08;box(-1.06+j*.34,.48+row*.94+h/2,.29,.26,h,.66,[0x8f6650,0x546f71,0xb19a69][(j+row)%3],g);box(-1.06+j*.34,.65+row*.94,.64,.20,.035,.025,0xd2bf8d,g);}}
 }
 // Batch static architectural geometry by material. Interactive groups keep
 // their identity; texture generation never needs a network request.
 scene.updateMatrixWorld(true);const batches=new Map();for(const m of staticMeshes){const key=m.material.uuid+'|'+Object.keys(m.geometry.attributes).sort().join(',')+'|'+!!m.geometry.index;if(!batches.has(key))batches.set(key,[]);batches.get(key).push(m);}
 for(const list of batches.values()){if(list.length<2)continue;const parts=list.map(m=>m.geometry.clone().applyMatrix4(m.matrixWorld)),merged=mergeGeometries(parts);if(merged){const m=new THREE.Mesh(merged,list[0].material);m.castShadow=list.some(x=>x.castShadow);m.receiveShadow=true;scene.add(m);for(const old of list){scene.remove(old);old.geometry.dispose();}}for(const p of parts)p.dispose();}
 // Batch the books, table legs and door boards inside each selectable group;
 // ray hits still resolve to that group's chapter, while labels stay separate.
 for(const group of selectables){const local=new Map();for(const m of group.children){if(!m.isMesh||!m.material.isMeshStandardMaterial)continue;const key=m.material.uuid+'|'+Object.keys(m.geometry.attributes).sort().join(',')+'|'+!!m.geometry.index;if(!local.has(key))local.set(key,[]);local.get(key).push(m);}for(const list of local.values()){if(list.length<2)continue;const parts=list.map(m=>m.geometry.clone().applyMatrix4(m.matrix)),geometry=mergeGeometries(parts);if(geometry){const merged=new THREE.Mesh(geometry,list[0].material);merged.castShadow=true;merged.receiveShadow=true;group.add(merged);for(const old of list){group.remove(old);old.geometry.dispose();}}for(const p of parts)p.dispose();}}
 const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
 const markDirty=()=>{dirty=true;if(!frame&&!disposed)frame=requestAnimationFrame(tick);};
 function resize(){if(disposed)return;const {width,height}=container.getBoundingClientRect();renderer.setSize(Math.max(1,width),Math.max(1,height),false);camera.aspect=Math.max(1,width)/Math.max(1,height);camera.updateProjectionMatrix();markDirty();}
 function render(){const framing=Math.max(1,1.5/camera.aspect),rotated=viewOffset.clone().multiplyScalar(framing).applyAxisAngle(new THREE.Vector3(0,1,0),currentOrbit);scene.fog.density=.013/framing;camera.position.copy(viewTarget).add(rotated);camera.lookAt(viewTarget);camera.updateMatrixWorld();
  // In a narrow scene, decorative labels must not print across the introduction
  // or its Look around button. Their buildings and task destinations stay put.
  const caption=container.closest('.plot-scene')?.querySelector('.plot-scene-caption')?.getBoundingClientRect(),rect=canvas.getBoundingClientRect();
  for(const label of buildingLabels){const point=label.position.clone().project(camera),depth=Math.abs(label.position.clone().applyMatrix4(camera.matrixWorldInverse).z),width=2*depth*Math.tan(THREE.MathUtils.degToRad(camera.fov/2))*camera.aspect,halfW=label.scale.x/width*rect.width/2,halfH=halfW*label.scale.y/label.scale.x,x=rect.left+(point.x+1)*rect.width/2,y=rect.top+(1-point.y)*rect.height/2;label.visible=!caption||x+halfW<caption.left||x-halfW>caption.right||y+halfH<caption.top||y-halfH>caption.bottom+6;}
  sky.update(camera,reducedMotion?0:time);renderer.render(scene,camera);dirty=false;}
 function tick(now){frame=0;if(disposed)return;const dt=Math.min(.05,last?(now-last)/1000:0);last=now;
  if(!reducedMotion){time+=dt;waterMaterial.uniforms.time.value=time;updateLanterns(time);boat.position.y=.12+Math.sin(time*.65)*.025;boat.rotation.z=Math.sin(time*.48)*.008;viewTarget.lerp(desiredTarget,1-Math.exp(-dt*3));viewOffset.lerp(desiredOffset,1-Math.exp(-dt*3));currentOrbit=THREE.MathUtils.lerp(currentOrbit,orbit,1-Math.exp(-dt*7));dirty=true;}
  if(dirty)render();if(!reducedMotion&&!document.hidden)frame=requestAnimationFrame(tick);
 }
 function setChapter(index){if(disposed)return;chapter=THREE.MathUtils.clamp(Math.round(Number(index)||0),0,4);beacons.forEach((b,i)=>{b.material.map=labelMaps[i][i===chapter?1:0];rings[i].material.color.setHex(i===chapter?0xf4ca79:0x7eb3b4);rings[i].material.opacity=i===chapter?1:.6;});
  const [x,z]=landmarkPositions[chapter];desiredTarget.set(3+(x-2)*.05,7,-16+z*.06);desiredOffset.set(30,21,44);orbit=0;
  if(reducedMotion){viewTarget.copy(desiredTarget);viewOffset.copy(desiredOffset);currentOrbit=0;}markDirty();
 }
 function updateLanterns(t){lanternGlows.forEach((glow,i)=>{glow.material.opacity=.52+Math.sin(t*.9+i*1.7)*.025;});lanternLights.forEach((light,i)=>{light.intensity=32+Math.sin(t*.72+i*2)*.9;});}
 function setReducedMotion(value){if(disposed)return;reducedMotion=Boolean(value);if(reducedMotion){viewTarget.copy(desiredTarget);viewOffset.copy(desiredOffset);currentOrbit=orbit;waterMaterial.uniforms.time.value=0;updateLanterns(0);boat.position.y=.12;boat.rotation.z=0;}last=0;markDirty();}
 function down(event){if(event.button!==0)return;drag={id:event.pointerId,x:event.clientX,y:event.clientY,startOrbit:orbit,moved:false};canvas.setPointerCapture?.(event.pointerId);}
 function move(event){if(!drag||drag.id!==event.pointerId)return;const dx=event.clientX-drag.x,dy=event.clientY-drag.y;if(Math.hypot(dx,dy)>=8)drag.moved=true;if(drag.moved){orbit=THREE.MathUtils.clamp(drag.startOrbit-dx*.003,-.40,.40);if(reducedMotion)currentOrbit=orbit;markDirty();}}
 function up(event){if(!drag||drag.id!==event.pointerId)return;const was=drag;drag=null;canvas.releasePointerCapture?.(event.pointerId);if(was.moved||Math.hypot(event.clientX-was.x,event.clientY-was.y)>=8)return;
  const rect=canvas.getBoundingClientRect();pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);const hits=raycaster.intersectObjects(selectables,true);if(hits.length){let object=hits[0].object;while(object&&object.userData.chapter===undefined)object=object.parent;if(object)onSelect(object.userData.chapter);}
 }
 function cancel(){drag=null;}
 function visibility(){if(document.hidden){if(frame)cancelAnimationFrame(frame);frame=0;}else{last=0;markDirty();}}
 const observer=new ResizeObserver(resize);observer.observe(container);canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',cancel);document.addEventListener('visibilitychange',visibility);
 updateLanterns(0);resize();setChapter(0);
 function dispose(){if(disposed)return;disposed=true;sky.dispose();if(frame)cancelAnimationFrame(frame);observer.disconnect();canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',cancel);document.removeEventListener('visibilitychange',visibility);const geometries=new Set(),materials=new Set();scene.traverse(o=>{if(o.isLight&&o.shadow)o.shadow.dispose();if(o.geometry)geometries.add(o.geometry);if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);});for(const g of geometries)g.dispose();for(const m of materials)m.dispose();for(const t of textures)t.dispose();renderer.dispose();renderer.forceContextLoss();canvas.remove();}
 return {setChapter,setReducedMotion,dispose};
}
