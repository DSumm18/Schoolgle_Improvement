import {ASSET_BASE} from './asset-paths.js';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {skinTones} from './characters.js';

// A modern visitor in an interpreted historical scene, using our original rigs.
// Each arrival is a short, reviewed clear segment beside a learning station.
const stops=[[12.7,0,13.4],[15.7,0,2.0],[27.7,0,8.0],[-1.1,.25,15.4],[38.7,0,2.1]];
export function createFireExplorer(scene,{reducedMotion=false,requestRender=()=>{}}={}){
 const root=new THREE.Group();root.name='Your modern explorer';scene.add(root);
 const loader=new GLTFLoader(),cache=new Map(),pending=new Map();
 let disposed=false,revision=0,selected='explorer',tone='warm',chapter=0,current=null,action='',arrival=1,celebrating=0,error=false,walkDirection=-Math.PI/2;
 const destination=new THREE.Vector3(),origin=new THREE.Vector3();
 function release(entry){entry.mixer?.stopAllAction();entry.mixer?.uncacheRoot(entry.avatar);const geo=new Set(),mats=new Set(),textures=new Set(),skeletons=new Set();entry.avatar.traverse(o=>{if(o.skeleton)skeletons.add(o.skeleton);if(o.geometry)geo.add(o.geometry);for(const m of o.material?(Array.isArray(o.material)?o.material:[o.material]):[]){mats.add(m);for(const v of Object.values(m))if(v?.isTexture)textures.add(v);}});geo.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());skeletons.forEach(s=>s.dispose());}
 async function load(id){if(cache.has(id))return cache.get(id);if(pending.has(id))return pending.get(id);const promise=loader.loadAsync(ASSET_BASE+'models/'+id+'.glb').then(gltf=>{const avatar=gltf.scene;avatar.name=id;avatar.scale.setScalar(1.95);avatar.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.frustumCulled=false;}});const mixer=new THREE.AnimationMixer(avatar),actions={};for(const clip of gltf.animations)actions[clip.name]=mixer.clipAction(clip);const entry={avatar,mixer,actions};if(disposed){release(entry);return null;}cache.set(id,entry);return entry;}).finally(()=>pending.delete(id));pending.set(id,promise);return promise;}
 function play(name,instant=false){if(!current?.actions[name])return;const previous=current.actions[action],next=current.actions[name];if(action!==name||instant){next.reset().setLoop(name==='Celebrate'?THREE.LoopOnce:THREE.LoopRepeat,Infinity);next.clampWhenFinished=name==='Celebrate';next.enabled=true;next.setEffectiveWeight(1).play();if(previous&&previous!==next){if(instant)previous.stop();else previous.crossFadeTo(next,.2,false);}action=name;}if(reducedMotion){current.mixer.setTime(0);if(name==='Celebrate')next.time=Math.min(.75,next.getClip().duration*.4);current.mixer.update(0);}}
 async function setExplorer(character='explorer',skinTone='warm'){
  if(disposed)return false;selected=character==='explorer-girl'?'explorer-girl':'explorer';tone=skinTones.some(t=>t.id===skinTone)?skinTone:'warm';const ticket=++revision;error=false;
  try{const entry=await load(selected);if(disposed||ticket!==revision||!entry)return false;if(current!==entry){if(current){current.mixer.stopAllAction();root.remove(current.avatar);}current=entry;root.add(entry.avatar);action='';}const colour=skinTones.find(t=>t.id===tone).colour;entry.avatar.traverse(o=>{for(const m of o.material?(Array.isArray(o.material)?o.material:[o.material]):[])if(m.name==='warm terracotta skin')m.color.setRGB(...colour);});play(celebrating?'Celebrate':arrival<1&&!reducedMotion?'Walk':'Idle',true);requestRender();return true;}catch{if(ticket===revision&&!disposed){error=true;requestRender();}return false;}
 }
 function setChapter(index){if(disposed)return;chapter=THREE.MathUtils.clamp(Math.round(Number(index)||0),0,4);destination.fromArray(stops[chapter]);origin.copy(destination).add(new THREE.Vector3(chapter===3?1.1:1.8,0,.15));arrival=reducedMotion?1:0;root.position.copy(reducedMotion?destination:origin);walkDirection=Math.atan2(destination.x-origin.x,destination.z-origin.z);root.rotation.y=reducedMotion?.55:walkDirection;celebrating=0;play(reducedMotion?'Idle':'Walk',true);requestRender();}
 function celebrate(){if(disposed)return;arrival=1;root.position.copy(destination);if(reducedMotion)root.rotation.y=.55;celebrating=2.4;play('Celebrate',true);requestRender();}
 function setReducedMotion(value){if(disposed)return;reducedMotion=Boolean(value);if(reducedMotion){arrival=1;root.position.copy(destination);root.rotation.y=.55;play(celebrating?'Celebrate':'Idle',true);}else{celebrating=0;play('Idle',true);}requestRender();}
 function update(dt){if(disposed||reducedMotion)return;if(arrival<1){arrival=Math.min(1,arrival+dt/.95);const t=arrival*arrival*(3-2*arrival);root.position.lerpVectors(origin,destination,t);if(arrival===1)play('Idle');}else if(celebrating>0){celebrating-=dt;if(celebrating<=0)play('Idle');}const face=arrival>.72?.55:walkDirection;root.rotation.y+=Math.atan2(Math.sin(face-root.rotation.y),Math.cos(face-root.rotation.y))*(1-Math.exp(-dt*4.5));current?.mixer.update(dt);}
 function getState(){return {loaded:!!current,displayedCharacter:current?.avatar.name||null,character:selected,skinTone:tone,chapter,action,clip:action,target:destination.toArray(),reducedMotion,arrived:arrival===1,position:root.position.toArray(),rotation:root.rotation.y,error};}
 function dispose(){if(disposed)return;disposed=true;revision++;scene.remove(root);cache.forEach(release);cache.clear();root.clear();current=null;}
 setChapter(0);
 return {setExplorer,setChapter,setReducedMotion,celebrate,update,getState,dispose};
}
