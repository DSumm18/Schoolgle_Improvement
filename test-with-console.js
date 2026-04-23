const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 200
  });

  const page = await browser.newPage();

  // Listen for console messages
  page.on('console', msg => {
    console.log(`🔍 CONSOLE: ${msg.text()}`);
  });

  try {
    console.log('Navigating to http://localhost:3001/admin/create-school');
    await page.goto('http://localhost:3001/admin/create-school', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Type in input
    const input = page.locator('input[type="text"]');
    await input.click();
    await page.keyboard.type('123456');
    await page.waitForTimeout(500);

    // Click button
    console.log('\n=== Clicking Look Up button ===');
    const button = page.locator('button:has-text("Look Up")');
    await button.click();
    await page.waitForTimeout(2000);

    // Check state
    const step2 = await page.locator('text=Step 2 of 5').count();
    const grove = await page.locator('text=Grove House').count();
    const error = await page.locator('text=not found').count();

    console.log('\n=== RESULTS ===');
    console.log('Step 2 found:', step2 > 0 ? 'YES ✅' : 'NO ❌');
    console.log('Grove House found:', grove > 0 ? 'YES ✅' : 'NO ❌');
    console.log('Error message:', error > 0 ? 'YES ❌' : 'NO ✅');

    await page.screenshot({ path: 'test-with-console.png' });
    console.log('\nScreenshot saved');

    console.log('\n=== Browser staying open for inspection ===');
    await new Promise(() => {});

  } catch (error) {
    console.error('ERROR:', error.message);
  } finally {
    // await browser.close();
  }
})();
