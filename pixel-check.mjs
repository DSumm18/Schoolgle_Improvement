import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto('http://localhost:3003/dashboard/estates/building-3d', {
    waitUntil: 'domcontentloaded',
    timeout: 20000
  });

  await page.waitForTimeout(8000);

  // Check what's actually rendered in the canvas
  const check = await page.evaluate(() => {
    const canvas = Array.from(document.querySelectorAll('canvas')).find(c => c.offsetWidth > 100);
    if (!canvas) return { error: 'No canvas' };

    const ctx = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!ctx) return { error: 'No context' };

    // Check 5x5 grid of pixels
    const results = [];
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        const pixels = new Uint8Array(4);
        const px = Math.floor((x + 0.5) / 5 * canvas.width);
        const py = Math.floor((y + 0.5) / 5 * canvas.height);
        ctx.readPixels(px, py, 1, 1, ctx.RGBA, pixels);
        results.push({ x, y, px, py, rgba: Array.from(pixels) });
      }
    }
    
    return {
      width: canvas.width,
      height: canvas.height,
      pixels: results,
      allBlack: results.every(p => p.rgba[0] === 0 && p.rgba[1] === 0 && p.rgba[2] === 0)
    };
  });

  console.log('🎨 PIXEL CHECK:', JSON.stringify(check, null, 2));

  await page.waitForTimeout(10000);
  await browser.close();
})();
