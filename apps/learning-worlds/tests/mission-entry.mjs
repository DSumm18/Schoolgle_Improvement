import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {freshState,SAVE_KEY} from '../src/learning.js';
const dir='test-results/mission-entry';fs.mkdirSync(dir,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true}),checks=[],errors=[];
try{
 for(const [width,height,touch] of [[831,746,false],[1024,768,true],[844,390,true]]){
  const context=await browser.newContext({viewport:{width,height},hasTouch:touch,isMobile:touch});
  // Reproduce the observed wrong-station arrival with a synthetic browser save.
  const state=freshState();state.position=[10,19];state.settings.controlsSeen=true;state.settings.narration=false;
  await context.addInitScript(({key,state})=>localStorage.setItem(key,JSON.stringify(state)),{key:SAVE_KEY,state});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:4173/?game=nile');await page.waitForFunction(()=>typeof window.__nile?.snapshot==='function',null,{timeout:60000});await page.waitForSelector('#loading',{state:'detached'});await page.locator('#begin').click();
  await page.waitForFunction(()=>window.__nile.snapshot().nearest===1);assert.equal(await page.locator('#interact').isVisible(),false);await page.keyboard.press('e');assert.equal(await page.locator('dialog').isVisible(),false);
  assert.equal(await page.locator('#guide-label').innerText(),'Guide me there');
  const before=await page.evaluate(()=>window.__nile.snapshot().position);await page.keyboard.down('ArrowLeft');await page.waitForTimeout(300);await page.keyboard.up('ArrowLeft');assert.notDeepEqual(await page.evaluate(()=>window.__nile.snapshot().position),before);
  await page.locator('#guide').click();await page.getByRole('button',{name:'Open the gate puzzle',exact:false}).first().waitFor();await page.waitForFunction(()=>window.__nile.snapshot().nearest===0);await page.locator('#guide.ready').waitFor();
  const boxes=await Promise.all(['#interact-button','#control-dock','.movement-help'].map(s=>page.locator(s).boundingBox()));for(const b of boxes.slice(1)){if(!b)continue;const a=boxes[0];assert.ok(!(Math.min(a.x+a.width,b.x+b.width)>Math.max(a.x,b.x)&&Math.min(a.y+a.height,b.y+b.height)>Math.max(a.y,b.y)),'Activity entry overlaps controls');}
  await page.screenshot({path:`${dir}/arrival-${width}.png`});
  await page.locator('#guide').click();await page.getByRole('button',{name:'Water gate 1',exact:true}).waitFor();
  for(let i=1;i<=3;i++)await page.getByRole('button',{name:'Water gate '+i,exact:true}).click();await page.getByRole('button',{name:'The floodwater brought water and fertile silt.',exact:true}).click();await page.getByRole('button',{name:'Collect your discovery →',exact:true}).click();assert.equal(await page.evaluate(()=>window.__nile.snapshot().gems),30);await page.screenshot({path:`${dir}/reward-${width}.png`});await page.locator('#reward-next').click();assert.equal(await page.locator('#guide-label').innerText(),'Guide me there');
  checks.push(`${width}x${height}: locked station hidden, real character movement, guide-to-open action, separated controls and garden reward passed`);console.log('PASS',checks.at(-1));await context.close();
 }
 assert.deepEqual(errors,[]);
}finally{fs.writeFileSync(`${dir}/report.json`,JSON.stringify({checks,errors},null,2));await browser.close();}
