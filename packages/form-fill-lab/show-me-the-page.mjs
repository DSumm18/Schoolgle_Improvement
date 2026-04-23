import { chromium } from 'playwright';

(async () => {
  console.log('🎭 Taking control of your browser to show you what I see...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();

  // Navigate to the onboarding detail page
  console.log('📍 Navigating to Grove House Primary School detail page...');
  await page.goto('http://localhost:3000/admin/onboarding/8a55bcab-ac16-4f21-9343-0e739c7fe365');
  
  // Wait for page to load
  await page.waitForTimeout(3000);
  
  // Take screenshot of what I see
  await page.screenshot({ 
    path: 'what-i-see-full-page.png',
    fullPage: true 
  });
  console.log('📸 Screenshot saved: what-i-see-full-page.png');
  
  // Get page title
  const title = await page.title();
  console.log('📄 Page title:', title);
  
  // Get current URL
  const url = page.url();
  console.log('🔗 Current URL:', url);
  
  // Look for any "Create subscription" or "module access" text
  const content = await page.content();
  const hasCreateSubscription = content.includes('Create subscription') || content.includes('Create Subscription');
  const hasModuleAccess = content.includes('module access') || content.includes('Module Access');
  const hasPlanOptions = content.includes('7 days') || content.includes('30 days') || content.includes('trial');
  
  console.log('🔍 Found "Create subscription":', hasCreateSubscription);
  console.log('🔍 Found "module access":', hasModuleAccess);
  console.log('🔍 Found plan options:', hasPlanOptions);
  
  // Look for subscription-related text
  if (hasCreateSubscription || hasModuleAccess || hasPlanOptions) {
    console.log('✅ Found subscription/module UI!');
    
    // Try to find the specific section
    const subscriptionText = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      for (let el of elements) {
        if (el.textContent?.includes('Create subscription') || 
            el.textContent?.includes('module access') ||
            el.textContent?.includes('Plan')) {
          return {
            text: el.textContent?.substring(0, 200),
            tag: el.tagName,
            id: el.id,
            className: el.className
          };
        }
      }
      return null;
    });
    
    if (subscriptionText) {
      console.log('📦 Found subscription section:', subscriptionText);
    }
  } else {
    console.log('❌ No subscription UI found on this page');
    console.log('💡 You might be on a different page');
  }
  
  // Keep browser open for 30 seconds so you can see what I'm seeing
  console.log('⏳ Keeping browser open for 30 seconds - LOOK AT IT NOW!');
  await page.waitForTimeout(30000);
  
  await browser.close();
  console.log('✅ Done - browser closed');
})();
