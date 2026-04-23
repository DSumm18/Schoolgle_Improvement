import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Multiple instances') || text.includes('Canvas') || text.includes('test')) {
      console.log('📋', text);
    }
  });

  console.log('🌐 Loading minimal test with fixed Three.js...');
  await page.goto('http://localhost:3002/dashboard/estates/building-3d/minimal', {
    waitUntil: 'domcontentloaded',
    timeout: 20000
  });

  console.log('⏳ Waiting 6 seconds...');
  await page.waitForTimeout(6000);

  await page.screenshot({ path: 'three-fix-test.png', fullPage: true });
  console.log('📸 Screenshot saved: three-fix-test.png');

  // Check if Three.js multiple instances warning is gone
  const hasMultipleInstances = await page.evaluate(() => {
    const warnings = [];
    const originalWarn = console.warn;
    console.warn = (...args) => warnings.push(args.join(' '));
    return warnings.some(w => w.includes('Multiple instances'));
  });

  console.log('Multiple Three.js instances warning:', hasMultipleInstances ? 'STILL PRESENT ❌' : 'GONE ✅');

  console.log('\n⏳ Browser open for 8 seconds...');
  await page.waitForTimeout(8000);

  await browser.close();
  console.log('\n✅ Test complete!');
})();
