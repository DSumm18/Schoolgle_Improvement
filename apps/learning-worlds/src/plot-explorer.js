import * as THREE from 'three';
import {createPlotCostumeRig} from './plot-costume-rig.js';
import {explorerHeight,footprintRadius,stationStops,isPlotWalkable,plotGroundHeight,movePlotPosition,nearestPlotStation,findPlotPath,plotSegmentClear,getPlotNavigation} from './plot-navigation.js';

// Original period-dressed visitor, measured against the actual standing bounds.
// All manual and guided movement uses the same reviewed collision geometry.
const movementSpeed=1.6,movementEpsilon=1e-8;
const navigationBounds=getPlotNavigation().bounds;
export function createPlotExplorer(scene,{reducedMotion=false,requestRender=()=>{}}={}){
 const root=new THREE.Group();root.name='Your period-dressed explorer';scene.add(root);
 const figure=createPlotCostumeRig();root.add(figure.root);
 let disposed=false,chapter=0,action='Idle',arrival=1,celebrating=0,error=false,walkDirection=-Math.PI/2;
 const destination=new THREE.Vector3(),origin=new THREE.Vector3(),movement=new THREE.Vector2();
 let blocked=false,desiredHeading=.55,route=[],routeIndex=0,guideStation=null;
 function play(name){action=name;figure.animate(0,action,reducedMotion);}
 function setAppearance(settings={}){if(disposed)return false;stopWalking();root.visible=settings.costumeReady!==false;figure.setAppearance({...settings,outfit:settings.costumeReady===false?'modern':settings.outfit});figure.animate(0,action,reducedMotion);requestRender();return true;}
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
  origin.set(isPlotWalkable(candidate.x,candidate.z)&&plotSegmentClear(stop,candidate)?candidate.x:stop.x,stop.y,isPlotWalkable(candidate.x,candidate.z)&&plotSegmentClear(stop,candidate)?candidate.z:stop.z);
  arrival=reducedMotion?1:0;root.position.copy(reducedMotion?destination:origin);
  walkDirection=Math.atan2(destination.x-origin.x,destination.z-origin.z);
  root.rotation.y=reducedMotion?.55:walkDirection;desiredHeading=root.rotation.y;celebrating=0;
  play(reducedMotion?'Idle':'Walk',true);requestRender();
 }
 function walkToStation(index){
  if(disposed||!Number.isInteger(index)||!stationStops[index])return false;
  const stop=stationStops[index],path=findPlotPath(root.position,stop);if(!path.length)return false;
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
   const next=movePlotPosition(root.position,dx,dz);root.position.set(next.x,next.y,next.z);blocked=next.blocked;
   const translated=Math.abs(root.position.x-wasX)+Math.abs(root.position.z-wasZ)>movementEpsilon;
   face=Math.atan2(movement.x,movement.y);
   play(translated&&!reducedMotion?'Walk':'Idle');
  }else if(route.length){
   let remaining=movementSpeed*dt;blocked=false;
   while(remaining>movementEpsilon&&routeIndex<route.length){
    const waypoint=route[routeIndex],dx=waypoint.x-root.position.x,dz=waypoint.z-root.position.z,distance=Math.hypot(dx,dz);
    if(distance<1e-6){routeIndex++;continue;}
    const amount=Math.min(remaining,distance),next=movePlotPosition(root.position,dx/distance*amount,dz/distance*amount);
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
   figure.animate(dt,action,false);
  }
  // The parent schedules input frames even with reduced motion. A blocked,
  // static avatar need not redraw; normal animation still needs a frame.
  return Math.abs(root.position.x-wasX)+Math.abs(root.position.z-wasZ)+Math.abs(root.rotation.y-wasHeading)>movementEpsilon||!reducedMotion;
 }
 function getState(){return {...figure.getState(),loaded:!disposed,visible:root.visible,displayedCharacter:figure.getState().character,chapter,action,clip:action,target:destination.toArray(),reducedMotion,arrived:arrival===1&&!route.length,position:root.position.toArray(),rotation:root.rotation.y,footprintRadius,movement:{x:movement.x,z:movement.y,active:movement.lengthSq()>movementEpsilon,blocked,speed:movementSpeed},bounds:{...navigationBounds,y:root.position.y},navigation:{guiding:route.length>0,targetStation:guideStation,nearbyStation:nearestPlotStation(root.position.x,root.position.z),path:route.slice(routeIndex).map(p=>({...p}))},error:false};}
 function dispose(){if(disposed)return;clearMovement();disposed=true;figure.dispose();scene.remove(root);root.clear();}
 setChapter(0);
 return {setAppearance,setChapter,setReducedMotion,setMovement,walkToStation,stopWalking,celebrate,update,getState,dispose};
}

