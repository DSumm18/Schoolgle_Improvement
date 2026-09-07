import {ASSET_BASE} from './asset-paths.js';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {skinTones} from './characters.js';

import {explorerHeight,footprintRadius,stationStops,isFireWalkable,fireGroundHeight,moveFirePosition,nearestFireStation,findFirePath,fireSegmentClear,getFireNavigation} from './fire-navigation.js';

// Original modern visitor, normalised against the actual rig's standing bounds.
// All manual and guided movement uses the same reviewed collision geometry.
const movementSpeed=1.8,movementEpsilon=1e-8;
const navigationBounds=getFireNavigation().bounds;
export function createFireExplorer(scene,{reducedMotion=false,requestRender=()=>{}}={}){
 const root=new THREE.Group();root.name='Your modern explorer';scene.add(root);
 const loader=new GLTFLoader(),cache=new Map(),pending=new Map();
 let disposed=false,revision=0,selected='explorer',tone='warm',chapter=0,current=null,action='',arrival=1,celebrating=0,error=false,walkDirection=-Math.PI/2;
 const destination=new THREE.Vector3(),origin=new THREE.Vector3(),movement=new THREE.Vector2();
 let blocked=false,desiredHeading=.55,route=[],routeIndex=0,guideStation=null;
 function release(entry){entry.mixer?.stopAllAction();entry.mixer?.uncacheRoot(entry.avatar);const geo=new Set(),mats=new Set(),textures=new Set(),skeletons=new Set();entry.avatar.traverse(o=>{if(o.skeleton)skeletons.add(o.skeleton);if(o.geometry)geo.add(o.geometry);for(const m of o.material?(Array.isArray(o.material)?o.material:[o.material]):[]){mats.add(m);for(const v of Object.values(m))if(v?.isTexture)textures.add(v);}});geo.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());skeletons.forEach(s=>s.dispose());}
 async function load(id){
  if(cache.has(id))return cache.get(id);if(pending.has(id))return pending.get(id);
  const promise=loader.loadAsync(ASSET_BASE+'models/'+id+'.glb').then(gltf=>{
   const avatar=gltf.scene;avatar.name=id;
   const mixer=new THREE.AnimationMixer(avatar),actions={};for(const clip of gltf.animations)actions[clip.name]=mixer.clipAction(clip);
   actions.Idle?.play();mixer.setTime(0);avatar.updateMatrixWorld(true);
   const standing=new THREE.Box3().setFromObject(avatar,true),rawHeight=standing.getSize(new THREE.Vector3()).y;
   const modelScale=Number.isFinite(rawHeight)&&rawHeight>0?explorerHeight/rawHeight:1;
   avatar.scale.multiplyScalar(modelScale);if(Number.isFinite(standing.min.y))avatar.position.y-=standing.min.y*modelScale;
   mixer.stopAllAction();avatar.updateMatrixWorld(true);
   avatar.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.frustumCulled=false;}});
   const entry={avatar,mixer,actions,rawHeight,modelScale,standingHeight:rawHeight*modelScale};
   if(disposed){release(entry);return null;}cache.set(id,entry);return entry;
  }).finally(()=>pending.delete(id));pending.set(id,promise);return promise;
 }
 function play(name,instant=false){if(!current?.actions[name])return;const previous=current.actions[action],next=current.actions[name];if(action!==name||instant){next.reset().setLoop(name==='Celebrate'?THREE.LoopOnce:THREE.LoopRepeat,Infinity);next.clampWhenFinished=name==='Celebrate';next.enabled=true;next.setEffectiveWeight(1).setEffectiveTimeScale(name==='Walk'?1.15:1).play();if(previous&&previous!==next){if(instant)previous.stop();else previous.crossFadeTo(next,.2,false);}action=name;}if(reducedMotion){current.mixer.setTime(0);if(name==='Celebrate')next.time=Math.min(.75,next.getClip().duration*.4);current.mixer.update(0);}}
 async function setExplorer(character='explorer',skinTone='warm'){
  if(disposed)return false;clearMovement();selected=character==='explorer-girl'?'explorer-girl':'explorer';tone=skinTones.some(t=>t.id===skinTone)?skinTone:'warm';const ticket=++revision;error=false;
  try{const entry=await load(selected);if(disposed||ticket!==revision||!entry)return false;if(current!==entry){if(current){current.mixer.stopAllAction();root.remove(current.avatar);}current=entry;root.add(entry.avatar);action='';}const colour=skinTones.find(t=>t.id===tone).colour;entry.avatar.traverse(o=>{for(const m of o.material?(Array.isArray(o.material)?o.material:[o.material]):[])if(m.name==='warm terracotta skin')m.color.setRGB(...colour);});play(celebrating?'Celebrate':(arrival<1||route.length)&&!reducedMotion?'Walk':'Idle',true);requestRender();return true;}catch{if(ticket===revision&&!disposed){error=true;requestRender();}return false;}
 }
 function clearMovement(){movement.set(0,0);blocked=false;route=[];routeIndex=0;guideStation=null;if(arrival===1&&!celebrating)play('Idle');}
 function stopWalking(){if(disposed)return;arrival=1;celebrating=0;clearMovement();play('Idle');requestRender();}
 function setMovement(x=0,z=0){
  if(disposed)return;
  x=Number(x);z=Number(z);
  const nextX=Number.isFinite(x)?x:0,nextZ=Number.isFinite(z)?z:0;
  const length=Math.hypot(nextX,nextZ),scale=length>1?1/length:1;
  const changed=movement.x!==nextX*scale||movement.y!==nextZ*scale;
  movement.set(nextX*scale,nextZ*scale);blocked=false;
  if(movement.lengthSq()>movementEpsilon){
   // Take control where the character actually is, including mid-arrival.
   arrival=1;celebrating=0;route=[];routeIndex=0;guideStation=null;
  }else{movement.set(0,0);if(arrival===1&&!celebrating&&!route.length)play('Idle');}
  if(changed)requestRender();
 }
 function setChapter(index,{keepPosition=false}={}){
  if(disposed)return;
  clearMovement();chapter=THREE.MathUtils.clamp(Math.round(Number(index)||0),0,4);
  const stop=stationStops[chapter];destination.set(stop.x,stop.y,stop.z);
  if(keepPosition){arrival=1;celebrating=0;play('Idle');requestRender();return;}
  const candidate={x:stop.x+.35,z:stop.z+.1};
  origin.set(isFireWalkable(candidate.x,candidate.z)&&fireSegmentClear(stop,candidate)?candidate.x:stop.x,stop.y,isFireWalkable(candidate.x,candidate.z)&&fireSegmentClear(stop,candidate)?candidate.z:stop.z);
  arrival=reducedMotion?1:0;root.position.copy(reducedMotion?destination:origin);
  walkDirection=Math.atan2(destination.x-origin.x,destination.z-origin.z);
  root.rotation.y=reducedMotion?.55:walkDirection;desiredHeading=root.rotation.y;celebrating=0;
  play(reducedMotion?'Idle':'Walk',true);requestRender();
 }
 function walkToStation(index){
  if(disposed||!Number.isInteger(index)||!stationStops[index])return false;
  const stop=stationStops[index],path=findFirePath(root.position,stop);if(!path.length)return false;
  stopWalking();destination.set(stop.x,stop.y,stop.z);route=path;routeIndex=1;guideStation=index;
  play(reducedMotion?'Idle':'Walk');requestRender();return true;
 }
 function celebrate(){
  if(disposed)return;
  // A reward belongs where the child stopped, not back at the arrival marker.
  clearMovement();arrival=1;celebrating=2.4;play('Celebrate',true);requestRender();
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
   const dx=movement.x*movementSpeed*dt,dz=movement.y*movementSpeed*dt;
   const next=moveFirePosition(root.position,dx,dz);root.position.set(next.x,next.y,next.z);blocked=next.blocked;
   const translated=Math.abs(root.position.x-wasX)+Math.abs(root.position.z-wasZ)>movementEpsilon;
   face=Math.atan2(movement.x,movement.y);
   play(translated&&!reducedMotion?'Walk':'Idle');
  }else if(route.length){
   let remaining=movementSpeed*dt;blocked=false;
   while(remaining>movementEpsilon&&routeIndex<route.length){
    const waypoint=route[routeIndex],dx=waypoint.x-root.position.x,dz=waypoint.z-root.position.z,distance=Math.hypot(dx,dz);
    if(distance<1e-6){routeIndex++;continue;}
    const amount=Math.min(remaining,distance),next=moveFirePosition(root.position,dx/distance*amount,dz/distance*amount);
    root.position.set(next.x,next.y,next.z);face=Math.atan2(dx,dz);remaining-=amount;
    if(next.blocked){blocked=true;route=[];guideStation=null;break;}
    if(amount>=distance-1e-6)routeIndex++;
   }
   if(routeIndex>=route.length){route=[];guideStation=null;face=.55;play('Idle');}
   else play(reducedMotion?'Idle':'Walk');
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
  if(reducedMotion){if(manual||route.length)root.rotation.y=face;}
  else{
   root.rotation.y+=Math.atan2(Math.sin(face-root.rotation.y),Math.cos(face-root.rotation.y))*(1-Math.exp(-dt*9));
   current?.mixer.update(dt);
  }
  // The parent schedules input frames even with reduced motion. A blocked,
  // static avatar need not redraw; normal animation still needs a frame.
  return Math.abs(root.position.x-wasX)+Math.abs(root.position.z-wasZ)+Math.abs(root.rotation.y-wasHeading)>movementEpsilon||Boolean(current&&!reducedMotion);
 }
 function getState(){return {loaded:!!current,displayedCharacter:current?.avatar.name||null,character:selected,skinTone:tone,chapter,action,clip:action,target:destination.toArray(),reducedMotion,arrived:arrival===1&&!route.length,position:root.position.toArray(),rotation:root.rotation.y,standingHeight:current?.standingHeight||null,rawHeight:current?.rawHeight||null,modelScale:current?.modelScale||null,footprintRadius,movement:{x:movement.x,z:movement.y,active:movement.lengthSq()>movementEpsilon,blocked,speed:movementSpeed},bounds:{...navigationBounds,y:root.position.y},navigation:{guiding:route.length>0,targetStation:guideStation,nearbyStation:nearestFireStation(root.position.x,root.position.z),path:route.slice(routeIndex).map(p=>({...p}))},error};}
 function dispose(){if(disposed)return;clearMovement();disposed=true;revision++;scene.remove(root);cache.forEach(release);cache.clear();root.clear();current=null;}
 setChapter(0);
 return {setExplorer,setChapter,setReducedMotion,setMovement,walkToStation,stopWalking,celebrate,update,getState,dispose};
}
