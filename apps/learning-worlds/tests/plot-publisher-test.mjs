import fs from 'node:fs';
import path from 'node:path';

// Opt-in tests of the final website publisher, without starting another server.
// Every context (including fallback/mobile contexts) receives the same artifacts.
export function configurePlotPublisher(browser){
 if(!process.env.PLOT_PUBLISH_DIR)return;
 const root=path.resolve(process.env.PLOT_PUBLISH_DIR),newContext=browser.newContext.bind(browser);
 const types={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.mp3':'audio/mpeg','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.glb':'model/gltf-binary','.woff2':'font/woff2'};
 browser.newContext=async(...args)=>{
  const context=await newContext(...args);
  await context.route('**/worlds/play/**',async route=>{
   const u=new URL(route.request().url()),file=path.resolve(root,decodeURIComponent(u.pathname.split('/worlds/play/')[1]||'index.html'));
   if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){await route.fulfill({status:404,body:'Missing publisher artifact'});return;}
   await route.fulfill({contentType:types[path.extname(file)]||'application/octet-stream',body:fs.readFileSync(file)});
  });return context;
 };
}
