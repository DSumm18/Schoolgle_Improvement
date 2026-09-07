import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const dir='test-results/garden-instructions';fs.mkdirSync(dir,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true}),checks=[],errors=[],failed=[];
try{
 for(const [width,height,touch] of [[831,746,false],[1024,768,true],[320,740,true]]){
  const context=await browser.newContext({viewport:{width,height},hasTouch:touch,isMobile:touch}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)failed.push(r.url());});
  await page.goto('http://127.0.0.1:4173/?game=nile');await page.waitForFunction(()=>typeof window.__nile?.snapshot==='function',null,{timeout:60000});await page.waitForSelector('#loading',{state:'detached'});await page.locator('#begin').click();if(await page.locator('#controls-start').isVisible())await page.locator('#controls-start').click();
  assert.match(await page.locator('#mission-task').innerText(),/Guide me there/);await page.locator('#guide').click();await page.waitForFunction(()=>window.__nile.snapshot().nearest===0);await page.locator('#interact-button').getByText('Open the gate puzzle').waitFor();assert.match(await page.locator('#mission-task').innerText(),/You’re here/);await page.locator('#interact-button').click();
  assert.match(await page.locator('.garden-directions').innerText(),/Tap or click gates 1, 2 and 3/);assert.equal(await page.locator('.garden-question').count(),0);await Promise.all([page.waitForResponse(r=>r.url().includes('/audio/controls-garden.wav')&&[200,206].includes(r.status())),page.locator('.garden-help-actions').getByRole('button',{name:'Listen to what to do'}).click()]);
  await page.getByRole('button',{name:'Show me the next gate'}).click();assert.equal(await page.evaluate(()=>document.activeElement.getAttribute('aria-label')),'Water gate 1');
  await page.screenshot({path:`${dir}/01-before-${width}.png`});
  const gate=n=>page.getByRole('button',{name:'Water gate '+n,exact:true});
  await gate(2).click();assert.match(await page.locator('#gate-next').innerText(),/1 of 3 gates open.*Gate 1/);await gate(2).click();assert.match(await page.locator('#gate-next').innerText(),/0 of 3/);
  for(let n=1;n<=3;n++){if(touch)await gate(n).tap();else{await gate(n).focus();await page.keyboard.press(n===2?'Space':'Enter');}}
  assert.match(await page.locator('#gate-next').innerText(),/garden has water/);assert.equal(await page.locator('.gate:disabled').count(),3);assert.equal(await page.evaluate(()=>document.activeElement.tagName),'H3');assert.equal(await page.locator('.garden-question').count(),1);
  await page.getByRole('button',{name:'The desert sand never needed water.'}).click();assert.equal(await page.locator('.claim').count(),0);assert.match(await page.locator('.garden-question .challenge-feedback').innerText(),/Try again/);
  await page.getByRole('button',{name:'The floodwater brought water and fertile silt.'}).click();await page.screenshot({path:`${dir}/02-answer-${width}.png`});await page.getByRole('button',{name:'Collect your discovery'}).click();assert.equal(await page.evaluate(()=>window.__nile.snapshot().gems),30);assert.equal(await page.locator('#reward-next').isVisible(),true);
  assert.ok(await page.evaluate(()=>{const d=document.querySelector('dialog');return d.scrollWidth<=d.clientWidth+2;}));
  checks.push(`${width}x${height}: arrival directions, narration, explicit gates, keyboard/touch, reversible partial state, feedback and reward passed`);console.log('PASS',checks.at(-1));await context.close();
 }
 assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
}finally{fs.writeFileSync(`${dir}/report.json`,JSON.stringify({checks,errors,failed},null,2));await browser.close();}
