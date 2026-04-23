import { chromium } from 'playwright';

(async () => {
  console.log('✅ Verifying the fix...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Navigate to the page
  console.log('📍 Loading page...');
  await page.goto('http://localhost:3000/admin/onboarding/8a55bcab-ac16-4f21-9343-0e739c7fe365');
  
  // Wait for it to load
  await page.waitForTimeout(5000);
  
  // Check for errors
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  
  // Take screenshot
  await page.screenshot({ path: 'verification-screenshot.png', fullPage: true });
  console.log('📸 Screenshot: verification-screenshot.png');
  
  // Check page title
  const title = await page.title();
  console.log('📄 Page title:', title);
  
  // Check for error messages on page
  const hasError = await page.evaluate(() => {
    return document.body.innerText.includes('error') || 
           document.body.innerText.includes('Error');
  });
  
  console.log('❌ Errors on page:', errors.length);
  errors.forEach(err => console.log('  -', err));
  console.log('❌ Error text visible:', hasError);
  
  if (errors.length === 0 && !hasError) {
    console.log('✅ SUCCESS! Page loads without errors');
  } else {
    console.log('❌ STILL HAS ERRORS');
  }
  
  // Keep browser open for 10 seconds for user to see
  console.log('⏳ Browser open for 10 seconds - VERIFY IT WORKS');
  await page.waitForTimeout(10000);
  
  await browser.close();
  console.log('✅ Verification complete');
})();
