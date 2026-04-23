import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('Navigating to onboarding page...');
  await page.goto('http://localhost:3000/admin/onboarding');
  
  // Wait for page to load
  await page.waitForTimeout(3000);
  
  // Take screenshot of initial state
  await page.screenshot({ path: 'onboarding-1-initial.png', fullPage: true });
  console.log('Screenshot saved: onboarding-1-initial.png');
  
  // Check page title
  const title = await page.title();
  console.log('Page title:', title);
  
  // Check for any data on the page
  const content = await page.content();
  const hasData = content.includes('Grove House') || content.includes('onboarding');
  console.log('Page has data:', hasData);
  
  // Look for any errors in console
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('Browser error:', msg.text());
    }
  });
  
  // Wait a bit more to see if data loads
  await page.waitForTimeout(5000);
  
  // Take second screenshot
  await page.screenshot({ path: 'onboarding-2-after-load.png', fullPage: true });
  console.log('Screenshot saved: onboarding-2-after-load.png');
  
  await browser.close();
})();
