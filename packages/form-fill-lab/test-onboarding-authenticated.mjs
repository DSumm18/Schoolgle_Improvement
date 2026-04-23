/**
 * Onboarding Dashboard - Authenticated Test
 * 
 * This script attempts to test the onboarding dashboard with authentication
 * 
 * NOTE: Currently this demonstrates the authentication blocker
 * To test properly, you need to:
 * 1. Login as admin@schoolgle.co.uk in the browser
 * 2. Export the session cookies
 * 3. Use those cookies in this script
 */

import { chromium } from 'playwright';

async function testOnboardingDashboard() {
  console.log('🧪 Testing Onboarding Dashboard (Authentication Required)');
  console.log('=' .repeat(60));

  const browser = await chromium.launch({ 
    headless: false, // Show browser for debugging
    slowMo: 1000 // Slow down for visibility
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 1024 }
  });
  
  const page = await context.newPage();

  try {
    // Navigate to login page first (we'd need to implement login flow)
    console.log('\n📝 Step 1: Navigate to onboarding page');
    await page.goto('http://localhost:3000/admin/onboarding');
    
    // Wait for page to load
    await page.waitForTimeout(3000);
    
    // Check if we're on login page or onboarding page
    const url = page.url();
    console.log('Current URL:', url);
    
    if (url.includes('/login')) {
      console.log('❌ Redirected to login - authentication required');
      console.log('\n💡 TO TEST: You need to login first');
      console.log('1. Login as admin@schoolgle.co.uk');
      console.log('2. Then navigate to /admin/onboarding');
      console.log('3. The leads should display correctly');
    } else {
      console.log('✅ Onboarding page loaded');
      
      // Check for data
      const content = await page.content();
      const hasLeads = content.includes('Grove House');
      const hasLoading = content.includes('spinner') || content.includes('Loading');
      
      console.log('Leads displayed:', hasLeads ? '✅ Yes' : '❌ No');
      console.log('Loading state:', hasLoading ? '⏳ Yes' : '✅ No');
      
      // Take screenshot
      await page.screenshot({ 
        path: 'onboarding-authenticated-test.png',
        fullPage: true 
      });
      console.log('📸 Screenshot saved: onboarding-authenticated-test.png');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  } finally {
    await browser.close();
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('🏁 Test complete');
}

// Run the test
testOnboardingDashboard().catch(console.error);
