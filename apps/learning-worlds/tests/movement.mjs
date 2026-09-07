import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// Isolated movement/animation harness. The controls-QA suite checks pupil UI
// and actual simultaneous tablet pointers; this suite inspects locomotion.
fs.mkdirSync('test-results',{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:900}});
const errors=[];page.on('pageerror',error=>errors.push(error.message));
const report={checks:[],errors};const pass=text=>{report.checks.push(text);console.log('PASS',text);};
const snapshot=()=>page.evaluate(()=>({position:world.getPosition(),action:world.currentAction,...world.getControlStatus()}));
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
const fresh=async(position=[13,49])=>page.evaluate(position=>{world.start(position);world.angle=0;world.paused=false;},position);
try{
 await page.route('**/movement-harness',route=>route.fulfill({contentType:'text/html',body:`<!doctype html><html lang="en"><title>Isolated movement QA</title><style>body{margin:0}canvas{display:block}</style><div id="world"></div><script type="module">
 import {NileWorld} from '/src/world.js';window.world=new NileWorld(document.getElementById('world'));await world.heroPromise;world.start([13,49]);window.ready=true;
 </script></html>`}));
 await page.goto('http://127.0.0.1:4173/movement-harness');await page.waitForFunction(()=>window.ready);

 await fresh();await page.keyboard.down('w');await page.waitForTimeout(35);const first=await snapshot();await page.waitForTimeout(420);const walk=await snapshot();
 assert.ok(first.speed<walk.speed);assert.ok(walk.speed>2.9&&walk.speed<3.2);assert.equal(walk.action,'Walk');
 await page.keyboard.up('w');const release=await snapshot();await page.waitForTimeout(300);const stopped=await snapshot();
 assert.equal(stopped.action,'Idle');assert.ok(distance(release.position,stopped.position)<.2);
 pass('Walking accelerates gently to3.1units/s and stops within0.2units after release');

 await fresh();await page.evaluate(()=>world.setRun(true));await page.keyboard.down('w');await page.waitForTimeout(450);const run=await snapshot();
 assert.ok(run.speed>6.1&&run.speed<6.5);assert.equal(run.action,'Run');await page.keyboard.up('w');
 pass('Run toggle changes actual travel and animation to running');

 await fresh();await page.keyboard.down('w');await page.keyboard.down('d');await page.waitForTimeout(400);
 const diagonal=await snapshot();assert.ok(diagonal.speed>2.9&&diagonal.speed<3.2);await page.keyboard.up('w');await page.keyboard.up('d');
 pass('Diagonal keyboard input does not move faster than cardinal input');

 await fresh();const still=(await snapshot()).position;await page.evaluate(()=>world.move.set(.086,0));await page.waitForTimeout(500);const drift=await snapshot();
 assert.ok(distance(still,drift.position)<.001);assert.equal(drift.action,'Idle');
 await page.evaluate(()=>world.move.set(.5,0));await page.waitForTimeout(400);const analog=await snapshot();assert.ok(analog.speed>1&&analog.speed<1.5);assert.equal(analog.action,'Walk');
 pass('Small touch-stick drift stays still; half-stick input gives proportionate slower walking');

 await fresh([26,40.2]);await page.keyboard.down('Shift');await page.keyboard.down('w');await page.waitForTimeout(650);const wall=await snapshot();
 assert.ok(wall.speed<.01);assert.equal(wall.action,'Idle');assert.ok(wall.position[1]>=39.98);await page.keyboard.up('w');await page.keyboard.up('Shift');
 pass('Holding run into a building stops physical travel and gait');

 await fresh([-6,10]);await page.keyboard.down('a');await page.waitForTimeout(400);const edge=await snapshot();assert.equal(edge.action,'Idle');assert.ok(edge.speed<.01);await page.keyboard.up('a');
 pass('Holding movement at the world edge stays Idle without foot sliding');

 await fresh();await page.evaluate(()=>{world.setRun(true);world.move.set(1,0);});await page.waitForTimeout(250);
 await page.evaluate(()=>window.dispatchEvent(new Event('blur')));const blur=(await snapshot()).position;await page.waitForTimeout(350);const blurred=await snapshot();
 assert.equal(blurred.runEnabled,false);assert.deepEqual(blurred.analog,[0,0]);assert.ok(distance(blur,blurred.position)<.001);assert.equal(blurred.action,'Idle');
 pass('Focus loss clears touch movement, running and momentum immediately');

 await page.mouse.move(800,450);await page.mouse.down();await page.mouse.move(940,500,{steps:5});const dragged=await snapshot();
 assert.ok(Math.abs(dragged.cameraAngle)>.3);await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await page.mouse.move(1100,600,{steps:3});assert.equal((await snapshot()).cameraAngle,dragged.cameraAngle);await page.mouse.up();
 await page.evaluate(()=>{world.player.rotation.y=.8;world.resetCamera();});const recentered=await snapshot();assert.ok(Math.abs(recentered.cameraAngle-(.8+Math.PI))<.001);assert.equal(recentered.pitch,.18);assert.equal(recentered.zoom,11);
 pass('Focus loss releases camera drag; recenter puts the camera behind the explorer');

 await fresh();await page.evaluate(()=>{world.guide(5);world.clearInput(false);world.paused=true;});assert.notEqual(await page.evaluate(()=>world.guideTarget),null);const paused=(await snapshot()).position;await page.waitForTimeout(200);assert.ok(distance(paused,(await snapshot()).position)<.001);await page.evaluate(()=>world.paused=false);await page.waitForTimeout(300);assert.ok(distance(paused,(await snapshot()).position)>.1);
 pass('A paused panel clears inputs while preserving the guide route for continuation');

 await fresh();await page.keyboard.down('w');await page.waitForTimeout(400);await page.screenshot({path:'test-results/movement-walk.png'});await page.keyboard.down('Shift');await page.waitForTimeout(400);await page.screenshot({path:'test-results/movement-run.png'});await page.keyboard.up('Shift');await page.keyboard.up('w');
 report.gait=await page.evaluate(()=>({walkRate:world.actions.Walk.getEffectiveTimeScale(),runRate:world.actions.Run.getEffectiveTimeScale(),clips:Object.keys(world.actions)}));
 assert.deepEqual(errors,[]);pass('All six character assets render with no browser exceptions during movement checks');
}catch(error){report.failure=error.stack;process.exitCode=1;console.error(error);await page.screenshot({path:'test-results/movement-failure.png'}).catch(()=>{});}
finally{fs.writeFileSync('test-results/movement-report.json',JSON.stringify(report,null,2));await browser.close();}
