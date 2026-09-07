import {chromium} from 'playwright';import {PNG} from 'pngjs';import fs from 'node:fs';import assert from 'node:assert/strict';
const DIR='test-results/atmosphere-2026';fs.mkdirSync(DIR,{recursive:true});
const configs={
 nile:{state:'test-results/fictional-pupil/nile/earned-state.json',api:'__nile',canvas:'#world canvas',key:'schoolgle-nile-v1-demo-alex'},
 plot:{state:'test-results/fictional-pupil/plot/earned-plot.json',api:'__plot',canvas:'#plot-world canvas',key:'schoolgle-midnight-letter-v1-demo-alex'},
 fire:{state:'test-results/fire/alex-earned.json',api:'__fire',canvas:'#fire-world canvas',key:'schoolgle-great-fire-v1-demo-alex'}
};
const browser=await chromium.launch({channel:'chrome',headless:true});const report={at:new Date().toISOString(),checks:[],games:{},errors:[],failedRequests:[],consoleErrors:[]};
const pass=t=>{report.checks.push(t);console.log('PASS',t);};
const record=s=>JSON.stringify({completed:s.completed,gems:s.gems,evidence:s.evidence,attempts:s.attempts,recall:s.recall,bonus:s.bonus});
function difference(a,b){const p=PNG.sync.read(a),q=PNG.sync.read(b);assert.equal(p.width,q.width);assert.equal(p.height,q.height);let visible=0,total=0;for(let i=0;i<p.data.length;i+=4){const delta=Math.abs(p.data[i]-q.data[i])+Math.abs(p.data[i+1]-q.data[i+1])+Math.abs(p.data[i+2]-q.data[i+2]);total+=delta;if(delta>15)visible++;}return {changedPixels:visible,changedFraction:visible/(p.width*p.height),meanChannelDifference:total/(p.width*p.height*3),width:p.width,height:p.height};}
async function motion(p,game,reduce){
 if(game==='nile'){await p.locator('#settings').click();await p.locator('[data-setting="reducedMotion"]').setChecked(reduce);await p.getByRole('button',{name:'Ready to explore',exact:true}).click();}
 if(game==='plot'){await p.locator('#plot-comfort').click();await p.locator('#plot-motion').setChecked(reduce);await p.locator('#plot-comfort-done').click();}
 if(game==='fire'){await p.locator('#fire-comfort').click();await p.locator('#fire-motion').setChecked(reduce);await p.locator('#fire-close').click();}
}
for(const game of process.argv.slice(2).length?process.argv.slice(2):Object.keys(configs)){
 const c=configs[game],context=await browser.newContext({viewport:{width:1440,height:900},hasTouch:true,reducedMotion:'no-preference',storageState:c.state});const page=await context.newPage();page.setDefaultTimeout(20000);const snap=()=>page.evaluate(api=>window[api].snapshot(),c.api);const result={};report.games[game]=result;
 page.on('pageerror',e=>report.errors.push(`${game}: ${e.message}`));page.on('response',r=>{if(r.status()>=400)report.failedRequests.push(`${game}: ${r.status()} ${r.url()}`);});page.on('console',m=>{if(m.type()==='error')report.consoleErrors.push(`${game}: ${m.text()}`);});await page.routeWebSocket('**',ws=>{if(ws.protocols().includes('vite-hmr'))ws.send('{"type":"connected"}');else ws.connectToServer();});
 try{
  await page.goto(`http://127.0.0.1:4173/?game=${game}&demo=1`);await page.waitForFunction(api=>window[api],c.api,{timeout:60000});if(game==='nile'){await page.locator('#loading').waitFor({state:'detached'});await page.locator('#begin').click();if(await page.locator('#controls-start').isVisible())await page.locator('#controls-start').click();}if(game==='plot'){await page.locator('#plot-start').click();await page.locator('[data-visit="1"]').click();}if(game==='fire')await page.locator('[data-chapter="1"]').click();
  const before=record(await snap());result.initialGems=(await snap()).gems;await motion(page,game,false);await page.waitForTimeout(2500);const a=await page.locator(c.canvas).screenshot();await page.waitForTimeout(900);const b=await page.locator(c.canvas).screenshot();result.normal=difference(a,b);assert.ok(result.normal.changedFraction>.0001,'Normal atmosphere should visibly animate, not just redraw identical frames');fs.writeFileSync(`${DIR}/${game}-normal-a.png`,a);fs.writeFileSync(`${DIR}/${game}-normal-b.png`,b);await page.screenshot({path:`${DIR}/${game}-desktop.png`});pass(`${game}: normal rendering changes visible pixels between stationary frames`);
  await motion(page,game,true);await page.waitForTimeout(1300);const stillA=await page.locator(c.canvas).screenshot();await page.waitForTimeout(900);const stillB=await page.locator(c.canvas).screenshot();result.reduced=difference(stillA,stillB);assert.ok(stillA.equals(stillB),'Reduced-motion canvas must be pixel-identical while stationary');fs.writeFileSync(`${DIR}/${game}-reduced.png`,stillA);pass(`${game}: reduced motion produces pixel-identical stationary canvas`);
  for(const [width,height]of [[1024,768],[768,1024]]){await page.setViewportSize({width,height});await page.waitForTimeout(400);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));await page.screenshot({path:`${DIR}/${game}-tablet${width}.png`});}
  if(game==='nile'){await page.locator('#journal').tap();assert.match(await page.locator('dialog').innerText(),/7 of 7 discoveries/);await page.getByRole('button',{name:'Close',exact:true}).click();}else{const look=game==='plot'?'#plot-look-around':'#fire-look';await page.locator(look).tap();await page.waitForTimeout(400);await page.screenshot({path:`${DIR}/${game}-expanded-tablet.png`});await page.keyboard.press('Escape');}
  assert.equal(record(await snap()),before);pass(`${game}: desktop/tablet controls remain usable without overflow or changes to earned learning/rewards`);
  await page.reload();await page.waitForFunction(api=>window[api],c.api,{timeout:60000});assert.equal((await snap()).settings.reducedMotion,true);assert.equal(record(await snap()),before);result.finalGems=(await snap()).gems;pass(`${game}: reload retains reduced motion, earned records and gem total`);result.ok=true;
 }catch(e){result.ok=false;result.failure=e.stack;console.error(e);await page.screenshot({path:`${DIR}/${game}-FAILURE.png`}).catch(()=>{});process.exitCode=1;}
 finally{await context.close();}
}
try{assert.deepEqual(report.errors,[]);assert.deepEqual(report.failedRequests,[]);assert.deepEqual(report.consoleErrors,[]);report.ok=Object.values(report.games).every(g=>g.ok);}catch(e){report.ok=false;report.failure=e.stack;process.exitCode=1;}
fs.writeFileSync(`${DIR}/${process.argv.slice(2).join('-')||'all'}-report.json`,JSON.stringify(report,null,2));await browser.close();
