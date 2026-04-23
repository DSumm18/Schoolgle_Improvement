import { chromium } from 'playwright';

(async () => {
  console.log('🔍 Searching for the subscription UI you mentioned...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 800
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();

  // Start at the main onboarding page
  console.log('📍 Starting at: http://localhost:3000/admin/onboarding');
  await page.goto('http://localhost:3000/admin/onboarding');
  await page.waitForTimeout(3000);
  
  // Take screenshot of list view
  await page.screenshot({ path: '01-onboarding-list.png' });
  console.log('📸 Screenshot: 01-onboarding-list.png');
  
  // Look for any "Create" or "subscription" buttons
  const createButtons = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button, a'));
    return buttons
      .filter(btn => btn.textContent?.includes('Create') || btn.textContent?.includes('Subscription') || btn.textContent?.includes('Set up'))
      .map(btn => ({
        text: btn.textContent?.trim(),
        tag: btn.tagName,
        href: btn.getAttribute('href')
      }));
  });
  
  console.log('🔘 Found these Create/Subscription buttons:', createButtons);
  
  // If there's a "Set up school" or similar button, click it
  const setupButton = createButtons.find(btn => 
    btn.text.includes('Set up') || 
    btn.text.includes('Create') ||
    btn.text.includes('Add')
  );
  
  if (setupButton) {
    console.log('🖱️ Clicking button:', setupButton.text);
    
    if (setupButton.tag === 'A' && setupButton.href) {
      await page.goto(setupButton.href);
    } else {
      const button = await page.$(`button:has-text("${setupButton.text}"), a:has-text("${setupButton.text}")`);
      if (button) await button.click();
    }
    
    await page.waitForTimeout(3000);
    await page.screenshot({ path: '02-after-click.png', fullPage: true });
    console.log('📸 Screenshot: 02-after-click.png');
  }
  
  // Check all text on page for "subscription", "plan", "module"
  const allText = await page.evaluate(() => {
    return document.body.innerText;
  });
  
  const hasSubscription = allText.toLowerCase().includes('subscription');
  const hasPlan = allText.toLowerCase().includes('plan');
  const hasModule = allText.toLowerCase().includes('module');
  const hasAccess = allText.toLowerCase().includes('access');
  
  console.log('📄 Page contains:');
  console.log('  - subscription:', hasSubscription);
  console.log('  - plan:', hasPlan);
  console.log('  - module:', hasModule);
  console.log('  - access:', hasAccess);
  
  // Keep open for you to see
  console.log('⏳ Browser open for 30 seconds - LOOK AT IT NOW');
  await page.waitForTimeout(30000);
  
  await browser.close();
})();
