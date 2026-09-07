import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const dir='test-results/enhancement/details';
const browser=await chromium.launch({channel:'chrome',headless:true});
const context=await browser.newContext({viewport:{width:320,height:740},hasTouch:true,reducedMotion:'reduce'});
const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
try {
 await page.goto('http://127.0.0.1:4173/?game=fire&demo=1');
 await page.locator('#fire-choose-explorer').tap();
 assert.equal(await page.locator('#fire-skin').isVisible(),true);
 await page.locator('[name="fire-character"][value="explorer-girl"]').check();
 await page.locator('#fire-skin').selectOption('deep');
 await page.locator('#fire-close').tap();
 await page.waitForFunction(()=>window.__fire.snapshot().explorer?.displayedCharacter==='explorer-girl');
 assert.equal(await page.evaluate(()=>window.__fire.snapshot().gems),0);
 assert.equal(await page.evaluate(()=>window.__fire.snapshot().settings.skinTone),'deep');
 await page.locator('#fire-start').tap();
 assert.equal(await page.evaluate(()=>window.__fire.snapshot().chapter),0);
 assert.equal(await page.evaluate(()=>window.__fire.snapshot().completed.length),0);
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
 await page.screenshot({path:`${dir}/fire-fresh320.png`});
 assert.deepEqual(errors,[]);
 fs.writeFileSync(`${dir}/fire-welcome-report.json`,JSON.stringify({ok:true,checks:['Fresh 320px welcome chooser opens character and skin settings; Maya/deep renders; begin starts chapter0 without rewards'],errors},null,2));
 console.log('PASS Fresh welcome explorer controls and start at320px');
} finally {await context.close();await browser.close();}
