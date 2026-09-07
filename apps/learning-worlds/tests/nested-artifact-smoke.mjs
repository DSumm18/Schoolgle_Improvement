// Browser checks against the actual hosted bundle, served by a test-only route.
// Website routing is checked independently by worlds-hosting-qa.mjs.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const dist=path.resolve('dist'),origin='https://schoolgle-artifact.invalid',prefix='/worlds/play/';
assert.ok(fs.readFileSync(path.join(dist,'index.html'),'utf8').includes('<base href="/worlds/play/index.html"'));
assert.equal(fs.readdirSync(path.join(dist,'audio')).filter(f=>f.endsWith('.wav')).length,0);
for(const file of ['three-MIT.txt','DM-Sans-OFL.txt','Fraunces-OFL.txt'])assert.ok(fs.statSync(path.join(dist,'licenses',file)).size>500);
const browser=await chromium.launch({channel:'chrome',headless:true}),requests=[],errors=[],checks=[];
try{
 const context=await browser.newContext({viewport:{width:1024,height:768},reducedMotion:'reduce'});
 await context.addInitScript(()=>{globalThis.__spoken=0;if(globalThis.speechSynthesis)speechSynthesis.speak=()=>{globalThis.__spoken++;};});
 await context.route('**/*',async route=>{
  const url=new URL(route.request().url());requests.push(url.pathname);
  if(url.origin!==origin||!(url.pathname.startsWith(prefix)||url.pathname==='/worlds/play')){errors.push('Escaped nested route: '+url.href);return route.abort();}
  const relative=url.pathname==='/worlds/play'||url.pathname===prefix?'index.html':decodeURIComponent(url.pathname.slice(prefix.length));
  const file=path.resolve(dist,relative),inside=path.relative(dist,file);
  if(inside.startsWith('..')||path.isAbsolute(inside)||!fs.existsSync(file)||!fs.statSync(file).isFile()){errors.push('Missing asset: '+url.pathname);return route.fulfill({status:404,body:'Missing'});}
  const types={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.glb':'model/gltf-binary','.png':'image/png','.woff':'font/woff','.woff2':'font/woff2','.txt':'text/plain'};
  await route.fulfill({body:fs.readFileSync(file),contentType:types[path.extname(file)]||'application/octet-stream'});
 });
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.goto(origin+'/worlds/play?demo=1');
 for(const name of ['Play Nile Quest','Play The Midnight Letter','Play The River of Stories']){
  const link=page.getByRole('link',{name,exact:true});if(await link.count())assert.ok((await link.getAttribute('href')).includes('game='));
 }
 assert.ok(await page.locator('a[href*="game=nile"]').evaluate(a=>a.href===location.origin+'/worlds/play/index.html?game=nile&demo=1'));
 checks.push('No-trailing-slash entry resolves game and Alex links through explicit index.html');
 for(const game of ['nile','plot','fire']){
  await page.goto(origin+prefix+'index.html?game='+game+'&demo=1');
  await page.waitForFunction(game=>!!globalThis['__'+game],game);
  assert.equal(await page.locator('#'+(game==='nile'?'world':game+'-world')+' canvas').count(),1);
  if(game==='nile'){
   await page.waitForSelector('#loading',{state:'detached'});
   await page.locator('#begin').click();await page.locator('#controls-listen').click();
   assert.ok(await page.evaluate(()=>__spoken>0));
  }
  checks.push(game+': compiled renderer, portraits and model requests load at the nested path');
 }
 for(const game of ['nile','plot','fire']){
  await page.goto(origin+prefix+'index.html?game='+game+'&view=example');
  await page.waitForSelector('#example-filter');
  assert.ok(await page.locator('a[download]').evaluate(a=>a.href.startsWith(location.origin+'/worlds/play/examples/')));
 }
 assert.ok(requests.some(p=>p.endsWith('/models/sphinx.glb')));
 assert.ok(requests.some(p=>p.endsWith('/portraits/explorer.png')));
 assert.ok(!requests.some(p=>p.endsWith('.wav')));
 assert.deepEqual(errors,[]);
 checks.push('All three Alex example fetch/download links use the nested directory');
 checks.push('Hosted narration invokes browser speech; no WAV request or bundled WAV output');
 fs.mkdirSync('test-results/nested-artifact',{recursive:true});
 fs.writeFileSync('test-results/nested-artifact/report.json',JSON.stringify({checks,errors,requests},null,2));
 console.log(JSON.stringify({checks,errors},null,2));
}finally{await browser.close();}
