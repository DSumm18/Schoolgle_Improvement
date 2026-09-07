import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// Inspect the actual game renderer without changing pupil progress or UI state.
const dir='test-results/visual-environment';fs.mkdirSync(dir,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const errors=[],views=[],comparison={};
try{
 const page=await browser.newPage({viewport:{width:1440,height:900}});
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.route('**/visual-environment-harness',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><html lang="en"><title>Environmental art review</title><style>body{margin:0}canvas{display:block}</style><div id="world"></div><script type="module">import {NileWorld} from "/src/world.js";window.world=new NileWorld(document.getElementById("world"));await world.heroPromise;world.setSettings({reducedMotion:true,lighting:"evening",quality:"high"});window.ready=true;</script></html>'}));
 await page.goto('http://127.0.0.1:4173/visual-environment-harness');await page.waitForFunction(()=>window.ready);
 for(const [name,position,angle,pitch,zoom]of [['temple-court',[59,-17],0,.18,11],['village',[26,44],.3,.10,9],['scribe',[29,20],-.3,.08,9],['sphinx',[43,16],.5,.22,13]]){
  await page.evaluate(({position,angle,pitch,zoom})=>{world.start(position);world.angle=angle;world.pitch=pitch;world.zoom=zoom;},{position,angle,pitch,zoom});await page.waitForTimeout(300);
  await page.screenshot({path:`${dir}/${name}.png`});
  views.push(await page.evaluate(name=>({name,drawCalls:world.renderer.info.render.calls,triangles:world.renderer.info.render.triangles,geometries:world.renderer.info.memory.geometries,textures:world.renderer.info.memory.textures}),name));
 }
 const a=await page.locator('canvas').screenshot();await page.waitForTimeout(300);assert.ok(a.equals(await page.locator('canvas').screenshot()),'New environmental detail must remain still in reduced motion');
 await page.evaluate(()=>world.setSettings({reducedMotion:true,lighting:'day',quality:'low'}));await page.waitForTimeout(300);await page.screenshot({path:`${dir}/low-quality-day.png`});
 // Compare only this art pass, using the same renderer and camera. The baseline
 // module is transformed in this isolated browser response, never on disk.
 await page.route('**/src/atmosphere.js*',async route=>{
  const response=await route.fetch();let source=await response.text();source=source.replace('addCourtsAndVillage(w);','');
  source=source.replace(/const ceilingTexture=paintedCeilingTexture\(\);[\s\S]*?for\(const x of \[49,67\]\)w\.box\(x,8\.6,-7,1\.15,1\.1,2\.7,0xc49960\);/,'');
  await route.fulfill({response,body:source});
 });
 await page.reload();await page.waitForFunction(()=>window.ready);await page.evaluate(()=>{world.start([43,16]);world.angle=.5;world.pitch=.22;world.zoom=13;});await page.waitForTimeout(300);
 comparison.before=await page.evaluate(()=>({drawCalls:world.renderer.info.render.calls,triangles:world.renderer.info.render.triangles}));comparison.after={drawCalls:views.at(-1).drawCalls,triangles:views.at(-1).triangles};
 await page.screenshot({path:`${dir}/sphinx-before.png`});
 assert.deepEqual(errors,[]);console.log('PASS four real-renderer views, reduced-motion stability, low-quality daylight, no browser or shader errors');
}finally{fs.writeFileSync(`${dir}/report.json`,JSON.stringify({views,comparison,errors},null,2));await browser.close();}
