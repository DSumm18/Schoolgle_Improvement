// Reuse the complete, independently asserted browser journeys in Alex's actual
// demo namespace. Only URLs, artifact destinations and capture hooks change.
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
const root=process.env.FICTIONAL_QA_DIR||'test-results/fictional-pupil';
fs.mkdirSync(root,{recursive:true});
const games=process.argv.slice(2).length?process.argv.slice(2):['nile','plot'];
function replace(s,from,to){if(!s.includes(from))throw Error('QA source hook changed: '+from.slice(0,70));return s.replace(from,to);}
for(const game of games){
 const dir=`${root}/${game}`;fs.mkdirSync(dir,{recursive:true});
 let source=fs.readFileSync(`tests/${game==='nile'?'browser':'plot-qa'}.mjs`,'utf8');
 const key=game==='nile'?'schoolgle-nile-v1':'schoolgle-midnight-letter-v1';
 const storageFile=game==='nile'?'test-results/independent-learning/cargo-earned.json':'test-results/plot/earned-plot.json';
 const seed=JSON.parse(fs.readFileSync(storageFile,'utf8')).origins.flatMap(o=>o.localStorage).find(x=>x.name===key)?.value;
 if(!seed)throw Error('Missing independently earned normal-game checkpoint');
 const seedCode=`\nconst normalSeed=${JSON.stringify(seed)};await context.addInitScript(({key,value})=>{if(localStorage.getItem(key)===null)localStorage.setItem(key,value);},{key:${JSON.stringify(key)},value:normalSeed});\n`;
 if(game==='nile'){
  source=source.replaceAll('test-results',dir);
  source=replace(source,"const page=await context.newPage();",seedCode+"const page=await context.newPage();");
  source=replace(source,'const snap=()=>',"await page.routeWebSocket('**',ws=>{if(ws.protocols().includes('vite-hmr'))ws.send('{\"type\":\"connected\"}');else ws.connectToServer();});\nconst snap=()=>");
  source=replace(source,'report.performance=await snap();',`report.performance=await snap();
   assert.equal(await page.evaluate(k=>localStorage.getItem(k),${JSON.stringify(key)}),normalSeed);
   assert.ok(await page.evaluate(k=>localStorage.getItem(k),${JSON.stringify(key+'-demo-alex')}));
   await page.locator('#journal').click();await page.locator('#progress-report').click();
   assert.match(await page.locator('dialog').innerText(),/Alex/);
   const downloadReady=page.waitForEvent('download');await page.locator('#export-record').click();await(await downloadReady).saveAs('${dir}/practice-record.json');
   const actualExport=JSON.parse(fs.readFileSync('${dir}/practice-record.json','utf8'));assert.equal(actualExport.learner.fictional,true);assert.equal(actualExport.learner.id,'fictional-alex');
   assert.deepEqual(actualExport.evidence,report.performance.evidence);assert.ok(Object.values(actualExport.recall).flat().length>=4);
   await page.screenshot({path:'${dir}/alex-record.png'});await context.storageState({path:'${dir}/earned-state.json'});
   await page.getByRole('button',{name:'Close',exact:true}).click();passed('Alex metadata and actual answers exported; normal earned progress remains byte-for-byte unchanged');`);
 }else{
  source=replace(source,"DIR='test-results/plot'",`DIR='${dir}'`);
  source=replace(source,'const page=await context.newPage();',seedCode+'const page=await context.newPage();');
  source=source.replaceAll('`${ORIGIN}/?game=plot`','`${ORIGIN}/?game=plot&demo=1`');
  source=replace(source,"await page.getByRole('link',{name:'Play The Midnight Letter',exact:true}).click();await page.waitForFunction(()=>window.__plot);assert.equal", "await page.goto(`${ORIGIN}/?game=plot&demo=1`);await page.waitForFunction(()=>window.__plot);assert.equal");
  const start=source.indexOf(' const nileAfter=');const end=source.indexOf('report.ok=true;',start);
  if(start<0||end<0)throw Error('Plot capture hooks changed');
  source=source.slice(0,start)+` assert.equal(await page.evaluate(k=>localStorage.getItem(k),${JSON.stringify(key)}),normalSeed);
  assert.ok(await page.evaluate(k=>localStorage.getItem(k),${JSON.stringify(key+'-demo-alex')}));
  assert.equal(exported.learner.fictional,true);assert.equal(exported.learner.id,'fictional-alex');
  pass('Alex metadata and actual answers exported; normal earned progress remains byte-for-byte unchanged');`+source.slice(end);
 }
 const temporary=`tests/.fictional-${game}-run.mjs`;fs.writeFileSync(temporary,source);
 try{const result=spawnSync(process.execPath,[temporary],{stdio:'inherit',env:{...process.env,NILE_TEST_URL:'http://127.0.0.1:4173/?game=nile&demo=1',PLOT_QA_SMOKE_ONLY:'0'}});if(result.status!==0)process.exitCode=1;}finally{fs.unlinkSync(temporary);}
}
