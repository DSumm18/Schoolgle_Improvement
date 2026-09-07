import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const base=process.env.NILE_TEST_URL||'http://127.0.0.1:4173/?game=nile';
const dir='test-results/characters';fs.mkdirSync(dir,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});const errors=[],failed=[],checks=[];
const pass=s=>{checks.push(s);console.log('PASS',s);};
try{
 const context=await browser.newContext({viewport:{width:1280,height:900}}),p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)failed.push(r.url());});
 const snap=()=>p.evaluate(()=>window.__nile.snapshot());
 await p.goto(base);await p.waitForFunction(()=>typeof window.__nile?.snapshot==='function',null,{timeout:60000});await p.waitForSelector('#loading',{state:'detached'});await p.locator('#choose-character').click();
 for(const id of ['explorer-girl','explorer'])for(const tone of ['deep','light','warm']){
  await p.locator(`[data-character="${id}"]`).click();await p.locator('#skin-tone').selectOption(tone);
  assert.equal((await snap()).character,id);assert.equal((await snap()).skinTone,tone);assert.equal(await p.locator(`[data-character="${id}"]`).getAttribute('aria-pressed'),'true');
  await p.waitForFunction(()=>[...document.querySelectorAll('.character-choice img')].every(i=>i.complete&&i.naturalWidth>0));
 }
 pass('Both explorers and all three skin tones select correctly with loaded previews');
 await p.locator('[data-character="explorer-girl"]').click();await p.locator('#skin-tone').selectOption('deep');await p.screenshot({path:`${dir}/01-choose-explorer.png`});await p.locator('#character-done').click();await p.locator('#begin').click();await p.locator('#controls-start').click();
 await p.keyboard.down('w');await p.waitForTimeout(450);assert.equal((await snap()).action,'Walk');await p.keyboard.down('Shift');await p.waitForTimeout(450);assert.equal((await snap()).action,'Run');await p.keyboard.up('w');await p.keyboard.up('Shift');await p.waitForTimeout(350);assert.equal((await snap()).action,'Idle');
 await p.screenshot({path:`${dir}/02-maya-in-world.png`});pass('Maya uses the same live walking, running and idle controls');
 await p.locator('#guide').click();await p.waitForFunction(()=>window.__nile.snapshot().nearest===0,null,{timeout:22000});await p.locator('#interact-button').click();
 for(let i=1;i<=3;i++)await p.getByRole('button',{name:'Water gate '+i}).click();await p.getByRole('button',{name:'The floodwater brought water and fertile silt.'}).click();await p.getByRole('button',{name:'Collect your discovery'}).click();await p.locator('#reward-next').click();assert.equal((await snap()).gems,30);
 const before=await snap();await p.locator('#settings').click();await p.locator('#change-character').click();await p.locator('[data-character="explorer"]').click();await p.locator('#character-done').click();await p.getByRole('button',{name:'Ready to explore'}).click();assert.deepEqual((await snap()).completed,before.completed);assert.deepEqual((await snap()).evidence,before.evidence);assert.equal((await snap()).gems,30);pass('Changing explorer in Settings preserves earned discoveries and evidence');
 await p.reload();await p.waitForFunction(()=>typeof window.__nile?.snapshot==='function',null,{timeout:60000});await p.waitForSelector('#loading',{state:'detached'});assert.equal((await snap()).character,'explorer');assert.equal((await snap()).skinTone,'deep');assert.equal((await snap()).gems,30);pass('Selected model, skin tone and learning progress persist after reload');
 await context.close();
 for(const [width,height] of [[768,1024],[844,390],[320,740]]){
  const c=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true}),page=await c.newPage();await page.goto(base);await page.waitForFunction(()=>typeof window.__nile?.snapshot==='function',null,{timeout:60000});await page.waitForSelector('#loading',{state:'detached'});
  const entry=await page.locator('#choose-character').boundingBox();assert.ok(entry.y>=0&&entry.y+entry.height<=height,'Explorer entry offscreen');await page.locator('#choose-character').tap();await page.locator('[data-character="explorer-girl"]').tap();await page.locator('#skin-tone').selectOption('light');
  assert.ok(await page.evaluate(()=>{const d=document.querySelector('dialog');return d.scrollWidth<=d.clientWidth+2;}));await page.locator('#character-done').tap();await page.locator('#begin').tap();await page.locator('#controls-start').tap();await page.screenshot({path:`${dir}/tablet-${width}x${height}.png`});
  const ids=['joystick','run-toggle','camera-reset','controls-help'];const boxes=await Promise.all(ids.map(id=>page.locator('#'+id).boundingBox()));for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){const a=boxes[i],b=boxes[j];assert.ok(!(Math.min(a.x+a.width,b.x+b.width)>Math.max(a.x,b.x)&&Math.min(a.y+a.height,b.y+b.height)>Math.max(a.y,b.y)),`${ids[i]} overlaps ${ids[j]}`);}
  pass(`Character choice and separate touch controls fit ${width}x${height}`);await c.close();
 }
 assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);pass('No page exceptions or failed assets in character workflow');
}finally{fs.writeFileSync(`${dir}/report.json`,JSON.stringify({checks,errors,failed},null,2));await browser.close();}
