import { chromium } from 'playwright';

(async () => {
  console.log('🎭 DEMONSTRATING ONBOARDING PROCESS');
  console.log('='.repeat(60));
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 // Slow down so you can see what's happening
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();

  // STEP 1: Go to onboarding dashboard
  console.log('\n📍 STEP 1: Navigating to Onboarding Dashboard...');
  await page.goto('http://localhost:3000/admin/onboarding');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'demo-01-dashboard.png' });
  console.log('📸 Saved: demo-01-dashboard.png');

  // STEP 2: Click on Grove House Primary School
  console.log('\n🖱️  STEP 2: Clicking Grove House Primary School...');
  
  // Try to find and click the lead
  const groveLink = await page.$('a:has-text("Grove House")');
  if (groveLink) {
    await groveLink.click();
    console.log('✅ Clicked Grove House link');
  } else {
    console.log('⚠️  Grove House link not found - might need to be logged in');
  }
  
  await page.waitForTimeout(4000);
  await page.screenshot({ path: 'demo-02-detail-page.png', fullPage: true });
  console.log('📸 Saved: demo-02-detail-page.png (full page)');

  // STEP 3: Look for any "Create subscription" or subscription-related buttons
  console.log('\n🔍 STEP 3: Looking for subscription options...');
  
  // Find all buttons
  const buttons = await page.evaluate(() => {
    const allButtons = Array.from(document.querySelectorAll('button, a'));
    return allButtons
      .map(btn => btn.textContent?.trim())
      .filter(text => text.length > 0 && text.length < 100)
      .slice(0, 30); // First 30 buttons
  });
  
  console.log('🔘 Buttons found on page:', buttons);

  // Look for subscription-related content
  const pageText = await page.evaluate(() => document.body.innerText);
  const hasSubscription = pageText.toLowerCase().includes('subscription');
  const hasCreate = pageText.toLowerCase().includes('create');
  const hasPlan = pageText.toLowerCase().includes('plan') || pageText.toLowerCase().includes('trial');
  const hasModule = pageText.toLowerCase().includes('module');
  
  console.log('📋 Page contains:');
  console.log('  - "subscription":', hasSubscription);
  console.log('  - "create":', hasCreate);
  console.log('  - "plan"/"trial":', hasPlan);
  console.log('  - "module":', hasModule);

  // Take another screenshot after a moment
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'demo-03-final-view.png', fullPage: true });
  console.log('📸 Saved: demo-03-final-view.png');

  // Keep browser open for you to see
  console.log('\n⏳ BROWSER OPEN FOR 30 SECONDS - LOOK AT YOUR SCREEN NOW!');
  console.log('👀 This is what you should be seeing...');
  await page.waitForTimeout(30000);
  
  await browser.close();
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ DEMONSTRATION COMPLETE');
  console.log('📸 Screenshots saved:');
  console.log('   - demo-01-dashboard.png (main list)');
  console.log('   - demo-02-detail-page.png (Grove House detail)');
  console.log('   - demo-03-final-view.png (final state)');
})();
