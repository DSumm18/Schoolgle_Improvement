import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  page.on('console', msg => console.log('📋', msg.text()));

  console.log('🌐 Loading minimal test page...');
  await page.goto('http://localhost:3000/dashboard/estates/building-3d/minimal', {
    waitUntil: 'domcontentloaded',
    timeout: 20000
  });

  console.log('⏳ Waiting 5 seconds...');
  await page.waitForTimeout(5000);

  const canvasCount = await page.locator('canvas').count();
  console.log(`🖼️ Canvases found: ${canvasCount}`);

  if (canvasCount > 0) {
    const canvasInfo = await page.evaluate(() => {
      const c = document.querySelector('canvas');
      return {
        width: c.width,
        height: c.height,
        visible: c.offsetWidth > 0 && c.offsetHeight > 0,
        opacity: window.getComputedStyle(c).opacity,
        display: window.getComputedStyle(c).display
      };
    });
    console.log('Canvas details:', canvasInfo);
  }

  await page.screenshot({ path: 'minimal-test.png', fullPage: true });
  console.log('📸 Screenshot: minimal-test.png');

  console.log('\n⏳ Browser open for 10 seconds...');
  await page.waitForTimeout(10000);

  await browser.close();
  console.log('\n✅ Test complete');
})();
