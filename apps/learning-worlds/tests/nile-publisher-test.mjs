import fs from 'node:fs';
import path from 'node:path';

// Optional exact deployment-artifact interception. Without the environment
// variable, every request goes directly to the requested live game.
export async function mountNilePublisher(context) {
  if (!process.env.NILE_PUBLISH_DIR) return;
  const root = path.resolve(process.env.NILE_PUBLISH_DIR);
  const types = {'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.mp3':'audio/mpeg','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.glb':'model/gltf-binary','.woff2':'font/woff2'};
  await context.route('**/worlds/play/**', async route => {
    const url = new URL(route.request().url());
    const relative = decodeURIComponent(url.pathname.split('/worlds/play/')[1] || 'index.html');
    const file = path.resolve(root, relative);
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
      await route.fulfill({status:404,body:'Missing publisher file'});
      return;
    }
    await route.fulfill({contentType:types[path.extname(file)] || 'application/octet-stream',body:fs.readFileSync(file)});
  });
}
