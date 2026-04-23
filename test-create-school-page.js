const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  const page = await browser.newPage();

  try {
    console.log('Navigating to create-school page...');
    await page.goto('http://localhost:3001/admin/create-school', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    console.log('✓ Page loaded and hydrated');

    // Use fill() which should work with React controlled components
    console.log('Filling input with 123456...');
    await page.fill('input[type="text"]', '123456');

    // Wait for React to process
    await page.waitForTimeout(1000);

    // Check button state
    const isDisabled = await page.locator('button:has-text("Look Up")').isDisabled();
    console.log(`Button disabled after fill: ${isDisabled}`);

    if (!isDisabled) {
      console.log('✓ Button is enabled! Clicking...');
      await page.click('button:has-text("Look Up")');
    } else {
      console.log('⚠ Button still disabled, trying Enter key...');
      await page.focus('input[type="text"]');
      await page.keyboard.press('Enter');
    }

    // Wait for response
    await page.waitForTimeout(3000);

    // Check results
    const step = await page.locator('text=Step 2 of 5').count();
    const grove = await page.locator('text=Grove House').count();

    console.log('\n--- Results ---');
    console.log(`Step 2 found: ${step > 0 ? 'YES ✓' : 'NO ✗'}`);
    console.log(`Grove House found: ${grove > 0 ? 'YES ✓' : 'NO ✗'}`);

    await page.screenshot({ path: 'create-school-manual-test.png', fullPage: true });
    console.log('\n✓ Screenshot saved: create-school-manual-test.png');

  } catch (error) {
    console.error('Error:', error.message);
    await page.screenshot({ path: 'create-school-error.png' });
  } finally {
    // Don't close browser immediately so user can see
    console.log('\n=== Press Ctrl+C to close browser ===');
    await new Promise(() => {}); // Keep open
  }
})();
