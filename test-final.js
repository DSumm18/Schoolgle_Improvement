const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 200
  });

  const page = await browser.newPage();

  try {
    console.log('Navigating to http://localhost:3001/admin/create-school');
    await page.goto('http://localhost:3001/admin/create-school', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    console.log('=== Testing uncontrolled input ===');

    // Click and type
    const input = page.locator('input[type="text"]');
    await input.click();
    await page.keyboard.type('123456');
    await page.waitForTimeout(1000);

    // Check input value
    const inputValue = await input.inputValue();
    console.log('Input value:', inputValue);

    // Check if button is enabled (should be enabled now since we removed disabled check)
    const button = page.locator('button:has-text("Look Up")');
    const isDisabled = await button.isDisabled();
    console.log('Button disabled:', isDisabled);

    if (!isDisabled) {
      console.log('✓ Button is enabled! Clicking...');
      await button.click();
      await page.waitForTimeout(3000);

      // Check if we moved to step 2
      const step2 = await page.locator('text=Step 2 of 5').count();
      const grove = await page.locator('text=Grove House').count();

      console.log('Step 2 found:', step2 > 0);
      console.log('Grove House found:', grove > 0);

      if (step2 > 0) {
        console.log('\n✅ SUCCESS! The form is working!');
      }
    }

    await page.screenshot({ path: 'test-final-result.png' });
    console.log('\nScreenshot saved: test-final-result.png');

    console.log('\n=== Test complete - browser staying open ===');
    await new Promise(() => {});

  } catch (error) {
    console.error('ERROR:', error.message);
  } finally {
    // await browser.close();
  }
})();
