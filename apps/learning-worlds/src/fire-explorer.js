import {ASSET_BASE} from './asset-paths.js';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {skinTones} from './characters.js';

// A modern visitor in an interpreted historical scene, using our original rigs.
// Each arrival is a short, reviewed clear segment beside a learning station.
// Reviewed against fire-world.js: bank areas sit east of the 1.65-unit station
// plinths, clear of houses and rubble. The helping area stays on the jetty
// (x -5.4..4.5, z 12.9..17.1), clear of the table and its four mooring posts.
// Bounds describe the avatar centre, allowing 1.4 units for the lower-body
// walking sweep of the real scaled GLB. The jetty therefore has a narrow lane.
const walkAreas=[
 {minX:13.2,maxX:17.3,minZ:10.7,maxZ:16.7,y:0},
 {minX:16.2,maxX:19.5,minZ:1.4,maxZ:5.1,y:0},
 {minX:28.2,maxX:32.4,minZ:6.5,maxZ:11.5,y:0},
 {minX:-.5,maxX:2.1,minZ:14.35,maxZ:15.65,y:.25},
 {minX:39.2,maxX:43.2,minZ:.6,maxZ:5.6,y:0},
];
const movementSpeed=2.6,movementEpsilon=1e-8;
export function createFireExplorer(scene,{reducedMotion=false,requestRender=()=>{}}={}){
 const root=new THREE.Group();root.name='Your modern explorer';scene.add(root);
 const loader=new GLTFLoader(),cache=new Map(),pending=new Map();
 let disposed=false,revision=0,selected='explorer',tone='warm',chapter=0,current=null,action='',arrival=1,celebrating=0,error=false,walkDirection=-Math.PI/2;
 const destination=new THREE.Vector3(),origin=new THREE.Vector3(),movement=new THREE.Vector2();
 let blocked=false,desiredHeading=.55;
 function release(entry){entry.mixer?.stopAllAction();entry.mixer?.uncacheRoot(entry.avatar);const geo=new Set(),mats=new Set(),textures=new Set(),skeletons=new Set();entry.avatar.traverse(o=>{if(o.skeleton)skeletons.add(o.skeleton);if(o.geometry)geo.add(o.geometry);for(const m of o.material?(Array.isArray(o.material)?o.material:[o.material]):[]){mats.add(m);for(const v of Object.values(m))if(v?.isTexture)textures.add(v);}});geo.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());skeletons.forEach(s=>s.dispose());}
 async function load(id){if(cache.has(id))return cache.get(id);if(pending.has(id))return pending.get(id);const promise=loader.loadAsync(ASSET_BASE+'models/'+id+'.glb').then(gltf=>{const avatar=gltf.scene;avatar.name=id;avatar.scale.setScalar(1.95);avatar.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.frustumCulled=false;}});const mixer=new THREE.AnimationMixer(avatar),actions={};for(const clip of gltf.animations)actions[clip.name]=mixer.clipAction(clip);const entry={avatar,mixer,actions};if(disposed){release(entry);return null;}cache.set(id,entry);return entry;}).finally(()=>pending.delete(id));pending.set(id,promise);return promise;}
 function play(name,instant=false){if(!current?.actions[name])return;const previous=current.actions[action],next=current.actions[name];if(action!==name||instant){next.reset().setLoop(name==='Celebrate'?THREE.LoopOnce:THREE.LoopRepeat,Infinity);next.clampWhenFinished=name==='Celebrate';next.enabled=true;next.setEffectiveWeight(1).play();if(previous&&previous!==next){if(instant)previous.stop();else previous.crossFadeTo(next,.2,false);}action=name;}if(reducedMotion){current.mixer.setTime(0);if(name==='Celebrate')next.time=Math.min(.75,next.getClip().duration*.4);current.mixer.update(0);}}
 async function setExplorer(character='explorer',skinTone='warm'){
  if(disposed)return false;clearMovement();selected=character==='explorer-girl'?'explorer-girl':'explorer';tone=skinTones.some(t=>t.id===skinTone)?skinTone:'warm';const ticket=++revision;error=false;
  try{const entry=await load(selected);if(disposed||ticket!==revision||!entry)return false;if(current!==entry){if(current){current.mixer.stopAllAction();root.remove(current.avatar);}current=entry;root.add(entry.avatar);action='';}const colour=skinTones.find(t=>t.id===tone).colour;entry.avatar.traverse(o=>{for(const m of o.material?(Array.isArray(o.material)?o.material:[o.material]):[])if(m.name==='warm terracotta skin')m.color.setRGB(...colour);});play(celebrating?'Celebrate':arrival<1&&!reducedMotion?'Walk':'Idle',true);requestRender();return true;}catch{if(ticket===revision&&!disposed){error=true;requestRender();}return false;}
 }
 function clearMovement(){movement.set(0,0);blocked=false;if(arrival===1&&!celebrating)play('Idle');}
 function setMovement(x=0,z=0){
  if(disposed)return;
  x=Number(x);z=Number(z);
  const nextX=Number.isFinite(x)?x:0,nextZ=Number.isFinite(z)?z:0;
  const length=Math.hypot(nextX,nextZ),scale=length>1?1/length:1;
  const changed=movement.x!==nextX*scale||movement.y!==nextZ*scale;
  movement.set(nextX*scale,nextZ*scale);blocked=false;
  if(movement.lengthSq()>movementEpsilon){
   // Take control where the character actually is, including mid-arrival.
   arrival=1;celebrating=0;
  }else{movement.set(0,0);if(arrival===1&&!celebrating)play('Idle');}
  if(changed)requestRender();
 }
 function setChapter(index){
  if(disposed)return;
  clearMovement();chapter=THREE.MathUtils.clamp(Math.round(Number(index)||0),0,4);
  const bounds=walkAreas[chapter];
  destination.set((bounds.minX+bounds.maxX)/2,bounds.y,(bounds.minZ+bounds.maxZ)/2);
  origin.set(Math.min(bounds.maxX-.1,destination.x+1.4),bounds.y,Math.min(bounds.maxZ-.1,destination.z+.1));
  arrival=reducedMotion?1:0;root.position.copy(reducedMotion?destination:origin);
  walkDirection=Math.atan2(destination.x-origin.x,destination.z-origin.z);
  root.rotation.y=reducedMotion?.55:walkDirection;desiredHeading=root.rotation.y;celebrating=0;
  play(reducedMotion?'Idle':'Walk',true);requestRender();
 }
 function celebrate(){
  if(disposed)return;
  // A reward belongs where the child stopped, not back at the arrival marker.
  arrival=1;celebrating=2.4;play('Celebrate',true);requestRender();
 }
 function setReducedMotion(value){
  if(disposed)return;
  clearMovement();reducedMotion=Boolean(value);
  if(reducedMotion&&arrival<1){arrival=1;root.position.copy(destination);root.rotation.y=.55;}
  desiredHeading=root.rotation.y;
  celebrating=0;play(arrival<1&&!reducedMotion?'Walk':'Idle',true);requestRender();
 }
 function update(dt){
  if(disposed)return false;
  dt=Number.isFinite(dt)?THREE.MathUtils.clamp(dt,0,.1):0;
  if(dt===0)return false;
  const wasX=root.position.x,wasZ=root.position.z,wasHeading=root.rotation.y;
  const manual=movement.lengthSq()>movementEpsilon;
  let face=desiredHeading;
  if(manual){
   arrival=1;celebrating=0;
   const bounds=walkAreas[chapter],dx=movement.x*movementSpeed*dt,dz=movement.y*movementSpeed*dt;
   const nextX=root.position.x+dx,nextZ=root.position.z+dz;
   root.position.set(THREE.MathUtils.clamp(nextX,bounds.minX,bounds.maxX),bounds.y,THREE.MathUtils.clamp(nextZ,bounds.minZ,bounds.maxZ));
   blocked=Math.abs(nextX-root.position.x)>movementEpsilon||Math.abs(nextZ-root.position.z)>movementEpsilon;
   const translated=Math.abs(root.position.x-wasX)+Math.abs(root.position.z-wasZ)>movementEpsilon;
   face=Math.atan2(movement.x,movement.y);
   play(translated&&!reducedMotion?'Walk':'Idle');
  }else if(!reducedMotion){
   blocked=false;
   if(arrival<1){
    arrival=Math.min(1,arrival+dt/.95);const t=arrival*arrival*(3-2*arrival);
    root.position.lerpVectors(origin,destination,t);
    face=arrival>.72?.55:walkDirection;
    if(arrival===1)play('Idle');
   }else if(celebrating>0){celebrating-=dt;if(celebrating<=0){celebrating=0;play('Idle');}}
  }
  desiredHeading=face;
  if(reducedMotion){if(manual)root.rotation.y=face;}
  else{
   root.rotation.y+=Math.atan2(Math.sin(face-root.rotation.y),Math.cos(face-root.rotation.y))*(1-Math.exp(-dt*9));
   current?.mixer.update(dt);
  }
  // The parent schedules input frames even with reduced motion. A blocked,
  // static avatar need not redraw; normal animation still needs a frame.
  return Math.abs(root.position.x-wasX)+Math.abs(root.position.z-wasZ)+Math.abs(root.rotation.y-wasHeading)>movementEpsilon||Boolean(current&&!reducedMotion);
 }
 function getState(){return {loaded:!!current,displayedCharacter:current?.avatar.name||null,character:selected,skinTone:tone,chapter,action,clip:action,target:destination.toArray(),reducedMotion,arrived:arrival===1,position:root.position.toArray(),rotation:root.rotation.y,movement:{x:movement.x,z:movement.y,active:movement.lengthSq()>movementEpsilon,blocked,speed:movementSpeed},bounds:{...walkAreas[chapter]},error};}
 function dispose(){if(disposed)return;clearMovement();disposed=true;revision++;scene.remove(root);cache.forEach(release);cache.clear();root.clear();current=null;}
 setChapter(0);
 return {setExplorer,setChapter,setReducedMotion,setMovement,celebrate,update,getState,dispose};
}
