import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const BASE_URL=process.env.NILE_TEST_URL||'http://127.0.0.1:4173/?game=nile';
const browser=await chromium.launch({channel:'chrome',headless:true});
const checks=[];
const passed=text=>{checks.push(text);console.log('PASS',text);};
try {
 const context=await browser.newContext({reducedMotion:'reduce'}),page=await context.newPage();
 await page.addInitScript(()=>{Storage.prototype.getItem=()=>{throw new DOMException('Blocked','SecurityError');};Storage.prototype.setItem=()=>{throw new DOMException('Blocked','SecurityError');};});
 await page.goto(BASE_URL);await page.waitForFunction(()=>typeof window.__nile?.snapshot==='function',null,{timeout:60000});await page.waitForSelector('#loading',{state:'detached'});await page.locator('#begin').click();if(await page.locator('#controls-start').isVisible())await page.locator('#controls-start').click();
 assert.equal(await page.evaluate(()=>window.__nile.snapshot().storageAvailable),false);
 assert.equal(await page.evaluate(()=>window.__nile.snapshot().settings.reducedMotion),true);
 passed('Blocked browser storage still permits play; OS reduced-motion preference is respected');
 await page.locator('#journal').click();await page.locator('#progress-report').click();
 const downloadEvent=page.waitForEvent('download');await page.locator('#export-record').click();const download=await downloadEvent;
 await download.saveAs('test-results/export-check.json');const exported=JSON.parse(fs.readFileSync('test-results/export-check.json','utf8'));
 assert.equal(exported.prototype,true);assert.ok(Array.isArray(exported.evidence));assert.equal(exported.pupil,undefined);passed('Practice record downloads as valid, labelled JSON');
 await context.close();
 const failedContext=await browser.newContext(),failed=await failedContext.newPage();await failed.route('**/models/explorer.glb',route=>route.fulfill({status:404,body:'Missing asset'}));
 await failed.goto(BASE_URL);await failed.getByRole('heading',{name:'One of our expedition assets could not load.'}).waitFor();assert.ok(await failed.getByRole('button',{name:'Reload',exact:true}).isVisible());passed('Missing 3D asset provides an explicit recovery action');await failedContext.close();
 const phoneContext=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),phone=await phoneContext.newPage();await phone.goto(BASE_URL);await phone.waitForFunction(()=>typeof window.__nile?.snapshot==='function',null,{timeout:60000});await phone.waitForSelector('#loading',{state:'detached'});await phone.locator('#begin').click();if(await phone.locator('#controls-start').isVisible())await phone.locator('#controls-start').click();
 const before=await phone.evaluate(()=>window.__nile.snapshot().position),box=await phone.locator('#joystick').boundingBox(),cdp=await phoneContext.newCDPSession(phone);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+box.width/2,y:box.y+box.height/2-30}]});await phone.waitForTimeout(650);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 const after=await phone.evaluate(()=>window.__nile.snapshot().position);assert.ok(Math.hypot(after[0]-before[0],after[1]-before[1])>1);passed('Real browser touch events move the character with the joystick');await phoneContext.close();
 fs.writeFileSync('test-results/resilience-report.json',JSON.stringify({ok:true,checks},null,2));
} finally {await browser.close();}
