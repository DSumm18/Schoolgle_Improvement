import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  const threeLoads = [];
  page.on('console', msg => {
    const text = msg.text();
    console.log('📋', text);
    if (text.includes('THREE') || text.includes('Three.js Global')) {
      threeLoads.push({
        text,
        url: page.url(),
        timestamp: Date.now()
      });
    }
  });

  await page.goto('http://localhost:3000/dashboard/estates/building-3d/minimal', {timeout: 20000});
  await page.waitForTimeout(6000);

  // Check what THREE instances exist
  const threeInfo = await page.evaluate(() => {
    return {
      hasWindowThree: !!window.THREE,
      windowThreeType: typeof window.THREE,
      windowThreeKeys: window.THREE ? Object.keys(window.THREE).slice(0, 20) : [],
      scripts: Array.from(document.querySelectorAll('script')).map(s => s.src).filter(Boolean)
    };
  });

  console.log('\n🔍 THREE INFO:', JSON.stringify(threeInfo, null, 2));
  console.log('\n📊 THREE LOADS:', threeLoads.length);

  await page.screenshot({path: 'debug-three.png', fullPage: true});
  await page.waitForTimeout(5000);
  await browser.close();
})();
