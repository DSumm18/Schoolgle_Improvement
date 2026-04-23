import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  page.on('console', msg => console.log('Console:', msg.text()));
  page.on('pageerror', error => console.log('❌ Error:', error.message));

  try {
    console.log('🌐 Loading: http://localhost:3003/dashboard/estates/building-3d');
    await page.goto('http://localhost:3003/dashboard/estates/building-3d', {
      waitUntil: 'domcontentloaded',
      timeout: 20000
    });

    console.log('⏳ Waiting 5 seconds for 3D to render...');
    await page.waitForTimeout(5000);

    await page.screenshot({ path: 'building-3d-fixed.png', fullPage: true });
    console.log('📸 Screenshot saved: building-3d-fixed.png');

    const canvasCount = await page.locator('canvas').count();
    console.log('🖼️ Canvas elements:', canvasCount);

    const bodyText = await page.locator('body').innerText();
    console.log('📝 Page preview:', bodyText.substring(0, 200));

  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  console.log('\n⏳ Keeping browser open for 10 seconds...');
  await page.waitForTimeout(10000);

  await browser.close();
  console.log('\n✅ Done! Check building-3d-fixed.png');
})();
