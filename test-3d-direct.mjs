import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000 // Slow down to see what's happening
  });
  const page = await browser.newPage();

  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Canvas') || text.includes('building') || text.includes('Error') || msg.type() === 'error') {
      console.log(`[${msg.type()}]`, text);
    }
  });

  page.on('pageerror', error => console.log('❌ Error:', error.message));

  try {
    console.log('🌐 Loading 3D Building Viewer...');
    await page.goto('http://localhost:3003/dashboard/estates/building-3d', {
      waitUntil: 'networkidle',
      timeout: 45000
    });

    console.log('⏳ Waiting 15 seconds for everything to render...');
    await page.waitForTimeout(15000);

    // Check canvas
    const canvasCount = await page.locator('canvas').count();
    console.log(`🖼️ Found ${canvasCount} canvas elements`);

    if (canvasCount > 0) {
      // Get canvas info
      const canvasInfo = await page.evaluate(() => {
        const canvases = Array.from(document.querySelectorAll('canvas'));
        return canvases.map((c, i) => ({
          index: i,
          width: c.width,
          height: c.height,
          style: c.getAttribute('style'),
          classList: Array.from(c.classList)
        }));
      });
      console.log('Canvas info:', JSON.stringify(canvasInfo, null, 2));
    }

    // Take final screenshot
    await page.screenshot({
      path: 'building-3d-final.png',
      fullPage: true
    });
    console.log('📸 Final screenshot: building-3d-final.png');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  console.log('\n⏳ Browser staying open for 20 seconds for manual inspection...');
  await page.waitForTimeout(20000);

  await browser.close();
  console.log('\n✅ Test complete!');
})();
