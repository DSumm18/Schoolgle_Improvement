import {chromium} from 'playwright';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {mountNilePublisher} from './nile-publisher-test.mjs';

const URL=process.env.NILE_TEST_URL||'https://www.schoolgle.co.uk/worlds/play/index.html?game=nile&demo=1';
const DIR=process.env.NILE_QA_DIR||'test-results/nile-exploration';
fs.mkdirSync(DIR,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const report={url:URL,mode:process.env.NILE_PUBLISH_DIR?'publisher artifact':'direct public',checks:[],errors:[],failedResponses:[],routes:[]};
let page;
const snap=()=>page.evaluate(()=>window.__nile.snapshot());
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
const pass=name=>{report.checks.push(name);console.log('PASS '+name);};
const shot=name=>page.screenshot({path:`${DIR}/${name}.png`});
async function open(width=1440){
 const c=await browser.newContext({viewport:{width,height:width===320?844:900},hasTouch:width!==1440,isMobile:width===320});
 await mountNilePublisher(c);page=await c.newPage();page.setDefaultTimeout(15000);
 page.on('pageerror',e=>report.errors.push(e.message));page.on('response',r=>{if(r.status()>=400)report.failedResponses.push(r.status()+' '+r.url());});
 await page.goto(URL);await page.waitForFunction(()=>window.__nile&&!document.querySelector('#loading'),null,{timeout:60000});
 await page.locator('#begin').click();if(await page.locator('#controls-start').isVisible())await page.locator('#controls-start').click();return c;
}
async function steer(x,z){
 const before=(await snap()).position;
 for(let n=0;n<150;n++){
  const s=await snap(),dx=x-s.position[0],dz=z-s.position[1];if(Math.hypot(dx,dz)<.45){report.routes.push({target:[x,z],before,after:s.position});return;}
  const a=s.controls.cameraAngle,sx=Math.cos(a)*dx-Math.sin(a)*dz,sy=Math.sin(a)*dx+Math.cos(a)*dz,max=Math.max(Math.abs(sx),Math.abs(sy)),keys=[];
  if(Math.abs(sx)>.4*max)keys.push(sx>0?'d':'a');if(Math.abs(sy)>.4*max)keys.push(sy>0?'s':'w');
  for(const k of keys)await page.keyboard.down(k);await page.waitForTimeout(Math.min(280,Math.hypot(dx,dz)/1.9*650));for(const k of keys)await page.keyboard.up(k);
 }
 throw Error('Actual held keys could not reach '+x+','+z);
}
try{
 const c=await open();assert.deepEqual((await snap()).completed,[]);assert.equal((await snap()).controls.characterMetrics.standingHeight,1.5);await shot('desktop-start');
 pass('Fresh explorer is measured at1.5 units, below the1.9-unit door height verified by the rig test');
 const start=(await snap()).position;await steer(13,38);assert.ok(distance(start,(await snap()).position)>10);assert.equal((await snap()).gems,0);await steer(19,37);await shot('desktop-near-village');
 pass('Real held keys cover more than10 units and continue beside the village without earning or answering');
 // Approach the west wall of the house centred at26,37 (6×5), along an actual route.
 await steer(22,37);const a=(await snap()).controls.cameraAngle;
 const eastKey=Math.cos(a)>.7?'d':'w';await page.keyboard.down(eastKey);await page.waitForTimeout(1800);await page.keyboard.up(eastKey);await page.waitForTimeout(300);
 const wall=(await snap()).position;assert.ok(wall[0]<=22.52||Math.abs(wall[1]-37)>2.99,'Explorer crossed the expanded house wall');await shot('desktop-door-scale');
 pass('Walking into a village wall does not enter the building footprint');
 await steer(18,38);await steer(5,38);assert.equal((await snap()).nearest,0);await page.keyboard.press('e');assert.equal(await page.getByRole('button',{name:'Water gate 1',exact:true}).isVisible(),true);
 for(let i=1;i<=3;i++)await page.getByRole('button',{name:'Water gate '+i,exact:true}).click();await page.getByRole('button',{name:'The desert sand never needed water.',exact:true}).click();assert.equal((await snap()).gems,0);
 await page.getByRole('button',{name:'The floodwater brought water and fertile silt.',exact:true}).click();await page.getByRole('button',{name:'Collect your discovery'}).click();await page.locator('#reward-next').click();assert.equal((await snap()).gems,30);
 pass('Manual travel and E open the real garden task; wrong reasoning earns nothing, correct completion earns30');
 await page.locator('#guide').click();await page.waitForFunction(()=>window.__nile.snapshot().navigation.status==='travelling');await page.waitForTimeout(700);assert.ok((await snap()).controls.speed>3.6&&(await snap()).controls.speed<4.2);await page.locator('#stop-guide').click();const stopped=(await snap()).position;await page.waitForTimeout(400);assert.ok(distance(stopped,(await snap()).position)<.01);
 await page.locator('#guide').click();await page.waitForFunction(()=>window.__nile.snapshot().nearest===1,null,{timeout:20000});await page.locator('#interact-button').click();assert.equal(await page.getByRole('button',{name:'Check the cargo',exact:true}).isVisible(),true);await shot('desktop-reached-cargo');await page.keyboard.press('Escape');
 pass('Slower guide travels to the next real activity, Stop cancels in place, and cargo opens without a teleport');
 await c.close();
 const mobile=await open(320);await page.locator('#settings').click();await page.locator('[data-setting="reducedMotion"]').check();await page.keyboard.press('Escape');const header=await page.evaluate(()=>({logo:document.querySelector('.brand').getBoundingClientRect().right,gems:document.querySelector('.gem-count').getBoundingClientRect().left}));assert.ok(header.logo+4<=header.gems,'Brand and gems must not overlap');await shot('mobile-320-start');
 const joy=await page.locator('#joystick').boundingBox(),cdp=await mobile.newCDPSession(page),before=(await snap()).position;
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,x:joy.x+joy.width/2,y:joy.y+joy.height/2-38}]});await page.waitForTimeout(2300);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert.ok(distance(before,(await snap()).position)>3.5);await page.waitForTimeout(400);assert.ok((await snap()).controls.speed<.14);assert.equal((await snap()).gems,0);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await shot('mobile-320-walked');
 pass('320px real CDP touch hold moves over3.5 units with reduced motion, releases safely and keeps learning unchanged');
 await page.locator('#settings').click();await page.locator('#change-character').click();await page.locator('[data-character="explorer-girl"]').click();await page.locator('#skin-tone').selectOption('deep');await page.locator('#character-done').click();await page.keyboard.press('Escape');assert.equal((await snap()).controls.characterMetrics.standingHeight,1.5);assert.equal((await snap()).character,'explorer-girl');await shot('mobile-320-maya');await page.reload();await page.waitForFunction(()=>window.__nile&&!document.querySelector('#loading'),null,{timeout:60000});assert.equal((await snap()).character,'explorer-girl');assert.equal((await snap()).skinTone,'deep');
 pass('Maya shares the same standing scale and appearance settings survive reload');await mobile.close();
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.failedResponses,[]);report.ok=true;
}catch(e){report.ok=false;report.failure=e.stack;console.error(e);await shot('FAILURE').catch(()=>{});process.exitCode=1;}
finally{await browser.close();fs.writeFileSync(`${DIR}/exploration-report.json`,JSON.stringify(report,null,2));}
