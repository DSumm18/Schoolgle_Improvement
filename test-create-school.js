const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500 // Slow down for visibility
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('Navigating to admin page...');
    await page.goto('http://localhost:3001/admin');
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Take screenshot
    await page.screenshot({ path: 'test-1-admin-page.png' });
    console.log('Screenshot saved: test-1-admin-page.png');

    // Click Create School button
    console.log('Looking for Create School button...');
    const createButton = page.locator('button').filter({ hasText: 'Create School' }).first();
    
    if (await createButton.isVisible()) {
      console.log('Found Create School button - clicking...');
      await createButton.click();
      
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'test-2-create-school-page.png' });
      console.log('Screenshot saved: test-2-create-school-page.png');
      
      // Enter URN
      console.log('Entering URN 137138...');
      const urnInput = page.locator('input[type="text"]').first();
      await urnInput.fill('137138');
      
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'test-3-urn-entered.png' });
      console.log('Screenshot saved: test-3-urn-entered.png');
      
      // Click Look Up button
      console.log('Clicking Look Up button...');
      const lookupButton = page.locator('button').filter({ hasText: 'Look Up' }).first();
      await lookupButton.click();
      
      // Wait for results
      await page.waitForTimeout(3000);
      await page.screenshot({ path: 'test-4-results.png' });
      console.log('Screenshot saved: test-4-results.png');
      
      // Check if school data was found
      const schoolName = page.locator('h3').first();
      const nameText = await schoolName.textContent();
      console.log('School found:', nameText);
      
    } else {
      console.log('ERROR: Create School button not found!');
      await page.screenshot({ path: 'test-error-no-button.png' });
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    await page.screenshot({ path: 'test-error.png' });
  }
  
  await browser.close();
  console.log('Test complete!');
})();
