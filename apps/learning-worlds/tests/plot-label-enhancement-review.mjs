import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true});
const context=await browser.newContext({viewport:{width:1024,height:768},storageState:'test-results/enhancement/plot/earned-plot.json',reducedMotion:'reduce'});
const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
try {
 await page.goto('http://127.0.0.1:4173/?game=plot&demo=1');
 await page.locator('#plot-start').click();
 await page.locator('[data-visit="1"]').click();
 await page.locator('#plot-seal').click();
 await page.waitForTimeout(1100);
 await page.screenshot({path:'test-results/enhancement/details/plot-label-normal1024.png'});
 await page.locator('#plot-look-around').click();
 await page.waitForTimeout(400);
 await page.screenshot({path:'test-results/enhancement/details/plot-label-expanded1024.png'});
 await page.keyboard.press('Escape');
 assert.equal(await page.locator('[data-line="1"]').isVisible(),true);
 assert.equal(await page.evaluate(()=>__plot.snapshot().gems),100);
 assert.deepEqual(errors,[]);
 console.log('PASS Plot normal and expanded1024 review capture; Escape restores evidence controls');
} finally {await context.close();await browser.close();}
