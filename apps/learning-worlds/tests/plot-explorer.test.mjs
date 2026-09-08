import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createPlotCostumeRig} from '../src/plot-costume-rig.js';
import {createPlotExplorer} from '../src/plot-explorer.js';
import {stationStops,isPlotWalkable,findPlotPath,plotSegmentClear,movePlotPosition} from '../src/plot-navigation.js';

// Only canvas paint is stubbed: all costume vertices, matrix transforms,
// animation, collision calculations and path following are actual Three code.
globalThis.document={createElement:()=>({getContext:()=>({fillRect(){}})})};
const close=(a,b,epsilon=1e-6)=>assert.ok(Math.abs(a-b)<epsilon,`${a} != ${b}`);

test('both original period outfits and characters stand 1.5 units high on the ground',()=>{
 for(const character of ['explorer','explorer-girl'])for(const outfit of ['doublet','petticoat']){
  const rig=createPlotCostumeRig({character,outfit});
  const standing=new THREE.Box3().setFromObject(rig.root,true);
  close(standing.min.y,0);close(standing.max.y,1.5);
  for(let f=0;f<64;f++){
   rig.animate(.01,'Walk');rig.root.updateMatrixWorld(true);
   const feet=[-1,1].map(s=>new THREE.Box3().setFromObject(rig.root.getObjectByName('Leg '+s),true).min.y);
   assert.ok(Math.min(...feet)>-1e-6);assert.ok(Math.min(...feet)<1e-5,'one stance shoe stays planted');
  }
  rig.animate(.1,'Walk',true);const first=new THREE.Box3().setFromObject(rig.root,true);
  rig.animate(.1,'Walk',true);const second=new THREE.Box3().setFromObject(rig.root,true);
  assert.deepEqual(first,second);rig.dispose();
 }
});

test('all 25 station routes are clear and actually reach their destination without teleporting',()=>{
 const explorer=createPlotExplorer(new THREE.Scene(),{reducedMotion:true});
 for(let from=0;from<5;from++)for(let to=0;to<5;to++){
  const path=findPlotPath(stationStops[from],stationStops[to]);assert.ok(path.length);
  for(let i=1;i<path.length;i++)assert.ok(plotSegmentClear(path[i-1],path[i]));
  explorer.setChapter(from);assert.equal(explorer.walkToStation(to),true);
  let steps=0;
  while(explorer.getState().navigation.guiding&&steps++<2000){
   const previous=explorer.getState().position;explorer.setMovement(0,0);explorer.update(.05);
   const current=explorer.getState().position;
   assert.ok(Math.hypot(current[0]-previous[0],current[2]-previous[2])<=.080001);
   assert.ok(isPlotWalkable(current[0],current[2]));assert.equal(explorer.getState().movement.blocked,false);
  }
  assert.ok(steps<2000);const p=explorer.getState().position;
  close(p[0],stationStops[to].x);close(p[2],stationStops[to].z);
  assert.equal(explorer.getState().navigation.nearbyStation.index,to);
 }
 explorer.dispose();
});

test('manual diagonal input has constant speed; release, stop, settings and inspection stay in place',()=>{
 const explorer=createPlotExplorer(new THREE.Scene(),{reducedMotion:true});
 const start=explorer.getState().position;explorer.setMovement(1,1);explorer.update(.1);
 let p=explorer.getState().position;close(Math.hypot(p[0]-start[0],p[2]-start[2]),.16);
 explorer.setMovement(0,0);explorer.update(.1);assert.deepEqual(explorer.getState().position,p);
 explorer.walkToStation(4);explorer.update(.1);p=explorer.getState().position;
 explorer.setMovement(1,0);assert.equal(explorer.getState().navigation.guiding,false);assert.deepEqual(explorer.getState().position,p);
 explorer.stopWalking();explorer.update(.1);assert.deepEqual(explorer.getState().position,p);
 explorer.setChapter(2,{keepPosition:true});assert.deepEqual(explorer.getState().position,p);
 explorer.setAppearance({character:'explorer-girl',outfit:'petticoat',skinTone:'deep',costumeReady:true});
 assert.deepEqual(explorer.getState().position,p);assert.equal(explorer.getState().outfit,'petticoat');
 explorer.setAppearance({costumeReady:false});assert.equal(explorer.getState().visible,false);
 explorer.dispose();assert.equal(explorer.getState().loaded,false);
});

test('river, palace walls, all plinths and lanterns block walking, including a large input step',()=>{
 for(const [x,z]of [[-25,8],[-6,-10],[14,-15],[26,-20],[-8,5],[2,-3],[12,3],[22,0],[24,-12],[-15,14]])assert.equal(isPlotWalkable(x,z),false);
 const approach=movePlotPosition(stationStops[0],0,-50);
 assert.ok(isPlotWalkable(approach.x,approach.z));assert.ok(approach.z>=7.9);assert.equal(approach.blocked,true);
 const river=movePlotPosition({x:-16,z:18},-50,0);assert.ok(river.x>=-17.3);assert.equal(river.blocked,true);
});
