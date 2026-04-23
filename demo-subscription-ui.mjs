import { chromium } from 'playwright';

(async () => {
  console.log('🚀 Launching browser...');
  const browser = await chromium.launch({ 
    headless: false, 
    slowMo: 500 
  });
  
  const context = await browser.newContext({ 
    viewport: { width: 1920, height: 1080 } 
  });
  const page = await context.newPage();

  // Navigate to Grove House detail page
  const leadId = '8a55bcab-ac16-4f21-9343-0e739c7fe365';
  const detailUrl = `http://localhost:3000/admin/onboarding/${leadId}`;
  
  console.log(`📍 Navigating to: ${detailUrl}`);
  await page.goto(detailUrl);
  await page.waitForTimeout(3000);
  
  // Screenshot of initial load
  await page.screenshot({ path: 'demo-subscription-01-load.png', fullPage: true });
  console.log('✅ Screenshot: demo-subscription-01-load.png');

  // Look for "Create subscription" button/section
  const pageText = await page.evaluate(() => document.body.innerText);
  
  console.log('\n🔍 Page Analysis:');
  console.log('  - Contains "Create subscription":', pageText.includes('Create subscription'));
  console.log('  - Contains "module access":', pageText.toLowerCase().includes('module access'));
  console.log('  - Contains "trial":', pageText.toLowerCase().includes('trial'));
  console.log('  - Contains "plan":', pageText.toLowerCase().includes('plan'));

  // Find and highlight module checkboxes
  const modules = await page.$$('[type="checkbox"]');
  console.log(`\n📦 Found ${modules.length} checkboxes`);
  
  // Scroll to subscription section
  const subscriptionSection = await page.$('text=Create subscription');
  if (subscriptionSection) {
    await subscriptionSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'demo-subscription-02-subscription-section.png' });
    console.log('✅ Screenshot: demo-subscription-02-subscription-section.png');
  }

  // Keep browser open for user to see
  console.log('\n⏸️  Keeping browser open for 30 seconds...');
  await page.waitForTimeout(30000);
  
  await browser.close();
  console.log('✅ Done!');
})();
