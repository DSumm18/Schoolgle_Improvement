import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// Internal geometry checks use the real world, isolated from the pupil UI.
// The separate browser/expert-QA suites own legitimate full UI playthroughs.
fs.mkdirSync('test-results',{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:900}});
const errors=[];page.on('pageerror',error=>errors.push(error.message));
const report={checks:[],errors};
const pass=text=>{report.checks.push(text);console.log('PASS',text);};

try{
 await page.route('**/gameplay-art-harness',route=>route.fulfill({contentType:'text/html',body:`<!doctype html><html lang="en"><title>Isolated navigation QA</title><style>body{margin:0}canvas{display:block}</style><div id="world"></div><script type="module">
 import {NileWorld} from '/src/world.js';import {missions} from '/src/content.js';
 window.missions=missions;window.world=new NileWorld(document.getElementById('world'));
 await world.heroPromise;world.start([13,49]);world.setCompleted([0,1,2,3,4,5,6]);window.ready=true;
 </script></html>`}));
 await page.goto('http://127.0.0.1:4173/gameplay-art-harness');await page.waitForFunction(()=>window.ready);
 report.geometry=await page.evaluate(()=>{
  const failures=[];let pairs=0,edgeStarts=0;
  const validate=(start,id)=>{
   world.start(start);
   if(!world.guide(id)){failures.push({start,id,reason:'no route'});return;}
   let from=world.player.position.clone();
   for(const to of world.guideRoute){
    const count=Math.max(1,Math.ceil(from.distanceTo(to)/.08));
    for(let i=0;i<=count;i++){
     const point=from.clone().lerp(to,i/count);
     if(point.x< -6||point.x>88||point.z< -78||point.z>66){failures.push({start,id,reason:'outside map'});return;}
     for(const obstacle of world.colliders)if(Math.abs(point.x-obstacle.x)<obstacle.hx+.48&&Math.abs(point.z-obstacle.z)<obstacle.hz+.48){failures.push({start,id,reason:'footprint collision'});return;}
    }
    from=to;
   }
   const target=missions[id].pos;
   if(Math.hypot(from.x-target[0],from.z-target[1])>=5)failures.push({start,id,reason:'endpoint outside interaction area'});
  };
  for(const source of missions)for(const target of missions){validate([source.pos[0],source.pos[1]+2.4],target.id);pairs++;}
  for(const start of [[26,37],[44,-28],[-6,-78],[88,66],[88,-78],[13,49],[21.9,37],[44,-15.99],[31,32],[34,42.49]])for(const target of missions){validate(start,target.id);edgeStarts++;}
  return{pairs,edgeStarts,failures};
 });
 assert.deepEqual(report.geometry.failures,[]);
 pass('49 ordered mission-pair geometry checks and 70 difficult start/target checks');

 await page.evaluate(()=>{world.start([40,-5.6]);world.guide(5);});
 await page.waitForFunction(()=>world.guideTarget===null,null,{timeout:20000});
 const arrival=await page.evaluate(()=>({status:world.getNavigationStatus().status,position:world.getPosition(),nearest:world.nearest}));
 assert.equal(arrival.status,'arrived');assert.equal(arrival.nearest,5);
 pass('Real animation-loop travel around the pyramid reaches the excavation');

 await page.evaluate(()=>world.guide(0));await page.keyboard.down('w');await page.waitForTimeout(150);await page.keyboard.up('w');
 assert.equal(await page.evaluate(()=>world.getNavigationStatus().status),'stopped');
 pass('Real keyboard input cancels guided travel');

 await page.evaluate(()=>{world.guide(0);world.move.set(1,0);});await page.waitForTimeout(100);
 assert.equal(await page.evaluate(()=>world.getNavigationStatus().status),'stopped');
 await page.evaluate(()=>{world.move.set(0,0);world.paused=true;});await page.waitForTimeout(100);
 assert.equal(await page.evaluate(()=>world.currentAction),'Idle');
 pass('Touch-stick movement state cancels guide; pause stops locomotion animation');

 await page.evaluate(()=>{world.fps=0;world.lastFrame=performance.now()-1000;requestAnimationFrame(()=>{window.firstSlowFrameFps=world.fps;});});
 await page.waitForFunction(()=>typeof window.firstSlowFrameFps==='number');
 const slowFps=await page.evaluate(()=>window.firstSlowFrameFps);
 assert.ok(slowFps>0&&slowFps<.1,`Smoothed one-second frame sample ${slowFps} should use raw elapsed, not capped simulation time.`);
 pass('FPS telemetry uses actual elapsed frame time below the simulation cap');

 await page.evaluate(()=>{world.paused=false;world.guideTarget=null;world.start([31,37]);world.angle=-Math.PI/2;});await page.waitForTimeout(250);
 const camera=await page.evaluate(()=>({height:world.camera.position.y-world.player.position.y,visible:world.avatar.visible}));
 assert.ok(camera.height>=7);assert.equal(camera.visible,true);
 await page.screenshot({path:'test-results/gameplay-art-camera.png'});
 pass('Tight-gap overhead camera keeps the explorer visible');

 await page.evaluate(()=>{world.start([13,49]);world.angle=.3;world.guide(0);});await page.waitForTimeout(550);
 await page.screenshot({path:'test-results/gameplay-art-route.png'});
 report.observation=await page.evaluate(()=>({drawCalls:world.renderer.info.render.calls,fps:world.fps,notice:'Local Chrome observation, not a school-device benchmark.'}));
 assert.deepEqual(errors,[]);pass('No browser exceptions in the isolated navigation harness');
}catch(error){report.failure=error.stack;process.exitCode=1;console.error(error);await page.screenshot({path:'test-results/gameplay-art-failure.png'}).catch(()=>{});}
finally{fs.writeFileSync('test-results/navigation-report.json',JSON.stringify(report,null,2));await browser.close();}
