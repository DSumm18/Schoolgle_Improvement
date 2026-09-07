import test, {after} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {createFireExplorer} from '../src/fire-explorer.js';
import {isFireWalkable,fireGroundHeight,stationStops,findFirePath,fireSegmentClear} from '../src/fire-navigation.js';
import fs from 'node:fs';

// Isolate movement from network loading, while exercising real Three mixers.
// Actual Leo/Maya GLBs and gait appearance are checked in browser QA.
const originalLoad=GLTFLoader.prototype.loadAsync;
const fakeLoad=async()=>({
 scene:new THREE.Group().add(new THREE.Mesh(new THREE.BoxGeometry(.6,2.4,.4),new THREE.MeshBasicMaterial())),
 animations:['Idle','Walk','Celebrate'].map(name=>new THREE.AnimationClip(name,2,[
  new THREE.NumberKeyframeTrack('.rotation[x]',[0,1,2],[0,.1,0]),
 ])),
});
GLTFLoader.prototype.loadAsync=fakeLoad;
after(()=>{GLTFLoader.prototype.loadAsync=originalLoad;});
const advance=(explorer,frames=60)=>{for(let i=0;i<frames;i++)explorer.update(.05);};

test('manual movement takes over arrival and release stays at the actual position',async()=>{
 const explorer=createFireExplorer(new THREE.Scene());
 try{
  await explorer.setExplorer();explorer.update(.1);
  const duringArrival=explorer.getState().position;
  explorer.setMovement(1,0);
  assert.deepEqual(explorer.getState().position,duringArrival);
  assert.equal(explorer.getState().arrived,true);
  assert.equal(explorer.update(.05),true);
  assert.ok(explorer.getState().position[0]>duringArrival[0]);
  assert.equal(explorer.getState().clip,'Walk');
  explorer.setMovement(0,0);const stopped=explorer.getState().position;
  advance(explorer);
  assert.deepEqual(explorer.getState().position,stopped);
  assert.equal(explorer.getState().clip,'Idle');
  explorer.celebrate();assert.deepEqual(explorer.getState().position,stopped);
  assert.equal(explorer.getState().clip,'Celebrate');
  explorer.setMovement(0,1);explorer.update(.05);
  assert.equal(explorer.getState().clip,'Walk');
  assert.notDeepEqual(explorer.getState().position,explorer.getState().target);
 }finally{explorer.dispose();}
});

test('continuous exploration stays off water, buildings, tables and the raised bridge',()=>{
 const explorer=createFireExplorer(new THREE.Scene(),{reducedMotion:true});
 const stations=[[10,12],[13,-1],[25,6],[-4,15],[36,-1]];
 const clearance=.45;
 try{
  for(let chapter=0;chapter<5;chapter++)for(const [x,z]of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[-1,1],[1,-1]]){
   explorer.setChapter(chapter);const start=explorer.getState();assert.equal(start.movement.active,false);
   assert.ok(isFireWalkable(start.position[0],start.position[2]));
   explorer.setMovement(x,z);
   for(let frame=0;frame<600;frame++){
    explorer.update(.05);const {position:p,bounds:b}=explorer.getState();
    assert.ok(p[0]>=b.minX&&p[0]<=b.maxX&&p[2]>=b.minZ&&p[2]<=b.maxZ);
    assert.ok(isFireWalkable(p[0],p[2]));assert.equal(p[1],fireGroundHeight(p[0],p[2]));
    for(const station of stations)assert.ok(Math.hypot(p[0]-station[0],p[2]-station[1])>=1.65+clearance-1e-8);
   }
   assert.equal(explorer.getState().movement.blocked,true);
   explorer.setMovement(0,0);const stopped=explorer.getState().position;
   assert.equal(explorer.update(.05),false);
   assert.deepEqual(explorer.getState().position,stopped);
  }
 }finally{explorer.dispose();}
 for(const [x,z] of [[-7,0],[0,0],[9,-5],[15,-7],[12,-15],[5.5,8],...stations])assert.equal(isFireWalkable(x,z),false,`Blocked landmark ${x},${z}`);
});

test('diagonal input has the same maximum speed and invalid input cannot corrupt position',()=>{
 const explorer=createFireExplorer(new THREE.Scene(),{reducedMotion:true});
 try{
  const start=explorer.getState().position;
  explorer.setMovement(10,10);explorer.update(.1);const finish=explorer.getState().position;
  assert.ok(Math.abs(Math.hypot(finish[0]-start[0],finish[2]-start[2])-explorer.getState().movement.speed*.1)<1e-8);
  assert.ok(Math.abs(Math.hypot(explorer.getState().movement.x,explorer.getState().movement.z)-1)<1e-8);
  explorer.setMovement(NaN,Infinity);assert.equal(explorer.getState().movement.active,false);
  assert.equal(explorer.update(NaN),false);assert.equal(explorer.update(-1),false);
  assert.deepEqual(explorer.getState().position,finish);
 }finally{explorer.dispose();}
});

test('reduced motion permits translation with a static Idle pose and settings clear input',async()=>{
 const scene=new THREE.Scene(),explorer=createFireExplorer(scene,{reducedMotion:true});
 try{
  await explorer.setExplorer();const avatar=scene.children[0].children[0];
  const start=explorer.getState().position,pose=avatar.rotation.x;
  explorer.setMovement(1,0);assert.equal(explorer.update(.1),true);
  assert.ok(explorer.getState().position[0]>start[0]);
  assert.equal(explorer.getState().clip,'Idle');assert.equal(avatar.rotation.x,pose);
  explorer.setMovement(0,0);const stopped=explorer.getState().position;
  assert.equal(explorer.update(.1),false);
  explorer.setMovement(1,0);await explorer.setExplorer('explorer-girl','deep');
  assert.equal(explorer.getState().movement.active,false);
  assert.deepEqual(explorer.getState().position,stopped);
  explorer.setMovement(1,0);explorer.setReducedMotion(false);
  assert.equal(explorer.getState().movement.active,false);
  assert.deepEqual(explorer.getState().position,stopped);
  explorer.setMovement(1,0);explorer.setChapter(4);
  assert.equal(explorer.getState().movement.active,false);
  explorer.setMovement(1,0);explorer.dispose();
  assert.equal(explorer.getState().movement.active,false);
  assert.equal(explorer.update(.1),false);
 }finally{explorer.dispose();}
});

test('per-frame zero input preserves automatic arrival and its smooth final turn',()=>{
 const explorer=createFireExplorer(new THREE.Scene());
 try{
  explorer.setChapter(3);
  for(let i=0;i<70;i++){explorer.setMovement(0,0);explorer.update(.05);}
  const state=explorer.getState();
  assert.equal(state.arrived,true);assert.deepEqual(state.position,state.target);
  assert.ok(Math.abs(state.rotation-.55)<.01);
 }finally{explorer.dispose();}
});

test('an interrupted arrival still offers its nearby station, and jetty heights match the visible ramp',()=>{
 const explorer=createFireExplorer(new THREE.Scene());
 try{for(let i=0;i<5;i++){explorer.setChapter(i);explorer.stopWalking();assert.equal(explorer.getState().navigation.nearbyStation?.index,i);}}
 finally{explorer.dispose();}
 assert.ok(Math.abs(fireGroundHeight(4.455,15)-.235)<1e-8);
 assert.equal(fireGroundHeight(5.35,15),-.15);
 assert.ok(Math.abs(fireGroundHeight((4.455+5.35)/2,15)-.0425)<1e-8);
});

test('all five station approaches connect by clear paths and real guided movement',()=>{
 const explorer=createFireExplorer(new THREE.Scene(),{reducedMotion:true});
 try{
  for(const start of stationStops)for(const end of stationStops){
   const path=findFirePath(start,end);assert.ok(path.length>=2,`${start.index} to ${end.index}`);
   for(let i=1;i<path.length;i++)assert.ok(fireSegmentClear(path[i-1],path[i]));
   explorer.setChapter(start.index);assert.equal(explorer.walkToStation(end.index),true);
   let frames=0;
   while(explorer.getState().navigation.guiding&&frames++<1800){
    const previous=explorer.getState().position;explorer.setMovement(0,0);explorer.update(.05);const now=explorer.getState().position;
    assert.ok(Math.hypot(now[0]-previous[0],now[2]-previous[2])<=explorer.getState().movement.speed*.05+1e-7,'No teleport on a guide route');
    assert.ok(isFireWalkable(now[0],now[2]));
   }
   assert.ok(frames<1800);const state=explorer.getState();assert.equal(state.navigation.guiding,false);
   assert.ok(Math.hypot(state.position[0]-end.x,state.position[2]-end.z)<1e-6);
   assert.equal(state.navigation.nearbyStation.index,end.index);
   assert.equal(state.chapter,start.index,'Walking does not advance the lesson');
  }
 }finally{explorer.dispose();}
});

test('walking is not station-clamped; manual takeover and keepPosition inspection never teleport',()=>{
 const explorer=createFireExplorer(new THREE.Scene(),{reducedMotion:true});
 try{
  const start=explorer.getState().position;explorer.setMovement(1,0);advance(explorer,130);
  assert.ok(explorer.getState().position[0]-start[0]>10,'Can walk well beyond the old station rectangle');
  explorer.setMovement(0,0);assert.equal(explorer.walkToStation(3),true);advance(explorer,10);
  const inFlight=explorer.getState().position;explorer.setMovement(0,1);
  assert.deepEqual(explorer.getState().position,inFlight);assert.equal(explorer.getState().navigation.guiding,false);
  explorer.update(.05);explorer.stopWalking();const stopped=explorer.getState().position;advance(explorer);
  assert.deepEqual(explorer.getState().position,stopped);
  explorer.walkToStation(2);explorer.setChapter(1,{keepPosition:true});
  assert.deepEqual(explorer.getState().position,stopped);assert.equal(explorer.getState().navigation.guiding,false);assert.equal(explorer.getState().chapter,1);
 }finally{explorer.dispose();}
});

test('actual original Leo and Maya GLBs stand 1.5 units tall with their feet on ground',async()=>{
 GLTFLoader.prototype.loadAsync=async url=>{
  const name=url.split('/').at(-1),bytes=fs.readFileSync(new URL('../public/models/'+name,import.meta.url));
  return new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
 };
 try{
  for(const character of ['explorer','explorer-girl']){
   const scene=new THREE.Scene(),explorer=createFireExplorer(scene,{reducedMotion:true});
   try{
    await explorer.setExplorer(character);scene.updateMatrixWorld(true);
    const state=explorer.getState(),box=new THREE.Box3().setFromObject(scene.children[0],true);
    assert.ok(Math.abs(state.rawHeight-2.43)<1e-5);assert.ok(Math.abs(state.standingHeight-1.5)<1e-6);
    assert.ok(Math.abs(box.getSize(new THREE.Vector3()).y-1.5)<1e-5);
    assert.ok(Math.abs(box.min.y-state.position[1])<1e-5);
    assert.ok(state.modelScale>.61&&state.modelScale<.62);
    explorer.setReducedMotion(false);explorer.stopWalking();explorer.setMovement(1,0);
    const vertex=new THREE.Vector3();let sweep=0;
    for(let frame=0;frame<30;frame++){
     explorer.update(.025);scene.updateMatrixWorld(true);const root=scene.children[0];
     root.traverse(mesh=>{if(!mesh.isMesh)return;for(let i=0;i<mesh.geometry.attributes.position.count;i++){
      mesh.getVertexPosition(i,vertex).applyMatrix4(mesh.matrixWorld).sub(root.position);
      if(vertex.y<.75)sweep=Math.max(sweep,Math.hypot(vertex.x,vertex.z));
     }});
    }
    assert.ok(sweep<=state.footprintRadius,`The real walking legs fit the navigation clearance: ${sweep}`);
   }finally{explorer.dispose();}
  }
 }finally{GLTFLoader.prototype.loadAsync=fakeLoad;}
});
