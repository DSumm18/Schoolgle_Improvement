import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  page.on('console', msg => console.log('Console:', msg.text()));
  page.on('pageerror', error => console.log('Error:', error.message));

  // Test different pages
  const pages = [
    'http://localhost:3000',
    'http://localhost:3000/dashboard',
    'http://localhost:3000/dashboard/settings',
    'http://localhost:3003/dashboard/estates/building-3d'
  ];

  for (const url of pages) {
    console.log(`\n🌐 Testing: ${url}`);
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
      const title = await page.title();
      const hasCanvas = await page.locator('canvas').count();
      console.log(`✅ Loaded! Title: "${title}", Canvas: ${hasCanvas}`);
      await page.screenshot({ path: `test-${url.replace(/[^a-z0-9]/gi, '-')}.png` });
      await page.waitForTimeout(2000);
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
    }
  }

  await page.waitForTimeout(5000);
  await browser.close();
})();
