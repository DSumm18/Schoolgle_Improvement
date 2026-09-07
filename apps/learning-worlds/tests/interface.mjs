import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const browser=await chromium.launch({channel:'chrome',headless:true});
const context=await browser.newContext({viewport:{width:1280,height:900},reducedMotion:'reduce'});
const page=await context.newPage(),checks=[],errors=[];page.on('pageerror',e=>errors.push(e.message));
const pass=t=>{checks.push(t);console.log('PASS',t);};
const url=process.env.NILE_TEST_URL||'http://127.0.0.1:4173/?game=nile';
try{
 await page.goto(url);await page.waitForFunction(()=>typeof window.__nile?.snapshot==='function',null,{timeout:60000});await page.waitForSelector('#loading',{state:'detached'});
 await page.locator('#access-start').click();await page.locator('[data-setting="reducedMotion"]').uncheck();await page.getByRole('button',{name:'Ready to explore'}).click();await page.reload();await page.waitForFunction(()=>typeof window.__nile?.snapshot==='function',null,{timeout:60000});await page.waitForSelector('#loading',{state:'detached'});
 assert.equal(await page.evaluate(()=>window.__nile.snapshot().settings.reducedMotion),false);pass('An explicit comfort choice survives reload and overrides the OS default');
 await page.locator('#begin').click();if(await page.locator('#controls-start').isVisible())await page.locator('#controls-start').click();const origin=await page.evaluate(()=>window.__nile.snapshot().position);
 await page.locator('#guide').click();await page.waitForFunction(()=>window.__nile.snapshot().nearest===0);await page.locator('#interact-button').click();
 assert.equal(await page.evaluate(()=>document.activeElement.id),'dialog-title');pass('Mission opens with keyboard focus on its heading');
 assert.ok(await page.locator('.guide-character img').evaluate(i=>i.complete&&i.naturalWidth>0));
 await page.locator('#hint').click();assert.ok(await page.locator('#mission-help').isVisible());await page.locator('#listen').click();await page.locator('#stop-narration').click();
 for(let i=1;i<=3;i++)await page.getByRole('button',{name:'Water gate '+i}).click();
 await page.getByRole('button',{name:'The floodwater brought water and fertile silt.'}).click();
 const evidence=await page.evaluate(()=>window.__nile.snapshot().evidence);assert.ok(evidence.at(-1).support.includes('hint'));assert.ok(evidence.at(-1).support.includes('read aloud'));pass('Visible teaching help, character portrait and cumulative listening/hint context work');
 await page.getByRole('button',{name:'Collect your discovery'}).click();await page.locator('#reward-next').click();await page.locator('#journal').click();await page.locator('#progress-report').click();await page.getByText('View attempts by learning objective',{exact:true}).click();assert.ok(await page.locator('.evidence-detail li').first().isVisible());pass('Practice report exposes objective-level evidence without mastery claims');
 await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>document.activeElement.id),'journal');pass('Closing a nested report restores focus to the original world control');
 await page.locator('#settings').click();await page.locator('[data-setting="largeText"]').check();await page.locator('#reset').click();await page.locator('#confirm-reset').click();await page.waitForFunction(()=>typeof window.__nile?.snapshot==='function',null,{timeout:60000});await page.waitForSelector('#loading',{state:'detached'});await page.locator('#begin').click();if(await page.locator('#controls-start').isVisible())await page.locator('#controls-start').click();
 const reset=await page.evaluate(()=>window.__nile.snapshot());assert.deepEqual(reset.position,origin);assert.equal(reset.completed.length,0);assert.equal(reset.settings.largeText,true);pass('Fresh expedition resets location and progress while keeping comfort preferences');
 assert.deepEqual(errors,[]);fs.writeFileSync('test-results/interface-report.json',JSON.stringify({ok:true,checks,errors},null,2));
}finally{await context.close();await browser.close();}
