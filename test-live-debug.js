const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });

  const page = await context.newPage();

  // Listen for console messages
  page.on('console', msg => {
    console.log(`BROWSER CONSOLE [${msg.type()}]:`, msg.text());
  });

  // Listen for errors
  page.on('pageerror', error => {
    console.error('BROWSER ERROR:', error.message);
  });

  try {
    console.log('Navigating to http://localhost:3001/admin/create-school');
    await page.goto('http://localhost:3001/admin/create-school', { waitUntil: 'networkidle' });

    console.log('\n=== PAGE LOADED ===\n');
    await page.waitForTimeout(3000);

    // Take a screenshot
    await page.screenshot({ path: 'debug-screenshot-1-initial.png' });
    console.log('Screenshot 1 saved: debug-screenshot-1-initial.png');

    // Check what elements exist
    console.log('\n=== CHECKING ELEMENTS ===');
    const hasInput = await page.locator('input[type="text"]').count() > 0;
    console.log('Input exists:', hasInput);

    const hasDebugPanel = await page.locator('text=DEBUG:').count() > 0;
    console.log('Debug panel exists:', hasDebugPanel);

    const hasDevMode = await page.locator('text=DEV MODE').count() > 0;
    console.log('DEV MODE badge exists:', hasDevMode);

    // Get the initial debug state
    const debugText = await page.locator('text=DEBUG:').textContent();
    console.log('Debug panel text:', debugText);

    // Try to click and focus the input
    console.log('\n=== ATTEMPTING TO TYPE ===');
    const input = page.locator('input[type="text"]');

    // Click on input
    await input.click();
    console.log('Clicked on input');
    await page.waitForTimeout(500);

    // Take screenshot after click
    await page.screenshot({ path: 'debug-screenshot-2-after-click.png' });
    console.log('Screenshot 2 saved: debug-screenshot-2-after-click.png');

    // Try typing
    console.log('Typing "123456"...');
    await page.keyboard.type('123456');
    await page.waitForTimeout(1000);

    // Take screenshot after typing
    await page.screenshot({ path: 'debug-screenshot-3-after-typing.png' });
    console.log('Screenshot 3 saved: debug-screenshot-3-after-typing.png');

    // Check debug state after typing
    const debugTextAfter = await page.locator('text=DEBUG:').textContent();
    console.log('Debug panel text after typing:', debugTextAfter);

    // Check input value
    const inputValue = await input.inputValue();
    console.log('Input value after typing:', inputValue);

    // Check button state
    const buttonDisabled = await page.locator('button:has-text("Look Up")').isDisabled();
    console.log('Look Up button disabled:', buttonDisabled);

    console.log('\n=== LEAVING BROWSER OPEN FOR INSPECTION ===');
    console.log('Press Ctrl+C to close');

    // Keep browser open
    await new Promise(() => {});

  } catch (error) {
    console.error('ERROR:', error.message);
    await page.screenshot({ path: 'debug-screenshot-error.png' });
  } finally {
    // await browser.close();
  }
})();
