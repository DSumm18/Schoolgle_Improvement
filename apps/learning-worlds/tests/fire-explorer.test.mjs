import test, {after} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {createFireExplorer} from '../src/fire-explorer.js';

// Isolate movement from network loading, while exercising real Three mixers.
// Actual Leo/Maya GLBs and gait appearance are checked in browser QA.
const originalLoad=GLTFLoader.prototype.loadAsync;
GLTFLoader.prototype.loadAsync=async()=>({
 scene:new THREE.Group(),
 animations:['Idle','Walk','Celebrate'].map(name=>new THREE.AnimationClip(name,2,[
  new THREE.NumberKeyframeTrack('.rotation[x]',[0,1,2],[0,.1,0]),
 ])),
});
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

test('all stations keep the walking footprint on solid ground and clear of tables',()=>{
 const explorer=createFireExplorer(new THREE.Scene(),{reducedMotion:true});
 const stations=[[10,12],[13,-1],[25,6],[-4,15],[36,-1]];
 const clearance=1.4; // Real scaled GLB lower-body Walk sweep measured below 1.4.
 try{
  for(let chapter=0;chapter<5;chapter++)for(const [x,z]of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[-1,1],[1,-1]]){
   explorer.setChapter(chapter);const start=explorer.getState();assert.equal(start.movement.active,false);
   assert.ok(start.position[0]>start.bounds.minX&&start.position[0]<start.bounds.maxX&&start.position[2]>start.bounds.minZ&&start.position[2]<start.bounds.maxZ);
   explorer.setMovement(x,z);
   for(let frame=0;frame<160;frame++){
    explorer.update(.05);const {position:p,bounds:b}=explorer.getState();
    assert.ok(p[0]>=b.minX&&p[0]<=b.maxX&&p[2]>=b.minZ&&p[2]<=b.maxZ);
    assert.equal(p[1],b.y);
    assert.ok(Math.hypot(p[0]-stations[chapter][0],p[2]-stations[chapter][1])>=1.65+clearance);
    if(chapter===3){
     assert.ok(p[0]-clearance>=-5.4&&p[0]+clearance<=4.5);
     assert.ok(p[2]-clearance>=12.9&&p[2]+clearance<=17.1);
     for(const postX of [-5.1,3.7])for(const postZ of [13.4,16.6])assert.ok(Math.hypot(p[0]-postX,p[2]-postZ)>=clearance+.15);
    }else assert.ok(p[0]-clearance>4.8); // East of the north-bank river wall.
   }
   assert.equal(explorer.getState().movement.blocked,true);
   explorer.setMovement(0,0);const stopped=explorer.getState().position;
   assert.equal(explorer.update(.05),false);
   assert.deepEqual(explorer.getState().position,stopped);
  }
 }finally{explorer.dispose();}
});

test('diagonal input has the same maximum speed and invalid input cannot corrupt position',()=>{
 const explorer=createFireExplorer(new THREE.Scene(),{reducedMotion:true});
 try{
  const start=explorer.getState().position;
  explorer.setMovement(10,10);explorer.update(.1);const finish=explorer.getState().position;
  assert.ok(Math.abs(Math.hypot(finish[0]-start[0],finish[2]-start[2])-.26)<1e-8);
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
