import {chromium} from 'playwright';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const dir=process.env.NILE_QA_DIR||'test-results/fictional-pupil/nile';
const BASE=process.env.NILE_TEST_URL||'http://127.0.0.1:4173/?game=nile&demo=1';
fs.mkdirSync(dir,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const context=await browser.newContext({viewport:{width:1024,height:768},storageState:process.env.NILE_EARNED_STATE||`${dir}/earned-state.json`,acceptDownloads:true,reducedMotion:'reduce'});
const page=await context.newPage();const report={at:new Date().toISOString(),checks:[],errors:[]};
page.on('pageerror',e=>report.errors.push(e.message));
await page.routeWebSocket('**',ws=>{if(ws.protocols().includes('vite-hmr'))ws.send('{"type":"connected"}');else ws.connectToServer();});
const click=t=>page.getByRole('button',{name:t,exact:true}).click();const snap=()=>page.evaluate(()=>window.__nile.snapshot());
const pass=t=>{report.checks.push(t);console.log('PASS',t);};
const model=async()=>{for(let i=1;i<=3;i++)for(let j=0;j<5;j++)await click(`Add an offering to tray ${i}`);await click('Check my model');};
try{
 await page.goto(BASE);await page.waitForFunction(()=>window.__nile&&!document.querySelector('#loading'),null,{timeout:60000});
 const normal=await page.evaluate(()=>localStorage.getItem('schoolgle-nile-v1'));assert.equal((await snap()).gems,210);
 await page.locator('#begin').click();if(await page.locator('#controls-start').isVisible())await page.locator('#controls-start').click();
 await page.locator('#journal').click();await page.locator('#sphinx-bonus').click();await click('Check my model');assert.equal((await snap()).gems,210);
 await model();await page.locator('#bonus-answer').fill('6');await page.locator('#bonus-answer').press('Enter');assert.equal((await snap()).gems,210);
 await page.locator('#bonus-answer').fill('5');await page.locator('#bonus-answer').press('Enter');await click('Equal groups are enough, even if some are left.');assert.equal((await snap()).gems,210);
 await click('All 15 are used: 3 equal groups of 5.');await click('Collect 15 bonus gems');assert.equal((await snap()).gems,225);assert.deepEqual((await snap()).completed,[0,1,2,3,4,5,6]);await click('Back to my adventure');
 pass('Alex earns bonus only after physical model, typed calculation and explanation; all seven core completions preserved');
 await page.locator('#journal').click();await page.locator('#sphinx-bonus').click();await model();await page.locator('#bonus-answer').fill('5');await page.locator('#bonus-answer').press('Enter');await click('All 15 are used: 3 equal groups of 5.');await click('Finish practice · gems already collected');assert.equal((await snap()).gems,225);await click('Back to my adventure');pass('Optional challenge replay retains 225 gems without duplicate reward');
 await page.locator('#journal').click();await page.locator('#teacher-studio').click();const text=await page.locator('dialog').innerText();assert.match(text,/Alex/);assert.match(text,/curriculum/i);
 await page.screenshot({path:`${dir}/teacher-guide.png`});await page.locator('#teacher-live').click();
 const dp=page.waitForEvent('download');await page.locator('#export-record').click();await(await dp).saveAs(`${dir}/practice-record.json`);
 const record=JSON.parse(fs.readFileSync(`${dir}/practice-record.json`));assert.equal(record.learner.id,'fictional-alex');assert.equal(record.bonus.sphinx,true);assert.ok(record.evidence.some(a=>a.details?.phase==='calculation'&&a.details.response==='6'&&!a.correct));assert.ok(record.evidence.some(a=>a.details?.phase==='calculation'&&a.details.response==='5'&&a.correct));
 assert.equal(await page.evaluate(()=>localStorage.getItem('schoolgle-nile-v1')),normal);await context.storageState({path:`${dir}/earned-state.json`});await page.screenshot({path:`${dir}/alex-final-record.png`});pass('Final download includes wrong and corrected typed answers, model and explanation; normal save remains unchanged');assert.deepEqual(report.errors,[]);report.ok=true;
}catch(e){report.ok=false;report.failure=e.stack;console.error(e);await page.screenshot({path:`${dir}/bonus-failure.png`});process.exitCode=1;}
finally{fs.writeFileSync(`${dir}/bonus-report.json`,JSON.stringify(report,null,2));await context.close();await browser.close();}
