import { test, expect } from '@playwright/test';

test('Verify Trust Assessor tabs and UI structure', async ({ page }) => {
  console.log('=== Starting Trust Assessor UI Verification ===');

  // Go to the Trust Assessor page directly
  await page.goto('http://localhost:3000/dashboard/school-improvement/trust-assessor');

  // Wait for page to settle
  await page.waitForTimeout(3000);

  // Log current URL
  console.log('Current URL after navigation:', page.url());

  // Take initial screenshot
  await page.screenshot({ path: 'C:/tmp/verify-01-initial.png', fullPage: true });

  // Get all text on page
  const bodyText = await page.locator('body').textContent();
  console.log('Page contains "Trust Assessor":', bodyText?.includes('Trust Assessor'));
  console.log('Page contains "Overview":', bodyText?.includes('Overview'));
  console.log('Page contains "Forensic":', bodyText?.includes('Forensic'));
  console.log('Page contains "Sign in":', bodyText?.includes('Sign in'));
  console.log('Page contains "Log in":', bodyText?.includes('Log in'));

  // Look for any tab elements
  const tabElements = await page.locator('[role="tab"]').all();
  console.log('Number of tab elements found:', tabElements.length);

  for (let i = 0; i < Math.min(tabElements.length, 10); i++) {
    const text = await tabElements[i].textContent();
    console.log(`  Tab ${i}: "${text}"`);
  }

  // Look for buttons that might be tabs
  const buttons = await page.locator('button').all();
  console.log('Number of buttons found:', buttons.length);

  const tabLikeButtons = [];
  for (let i = 0; i < Math.min(buttons.length, 20); i++) {
    const text = await buttons[i].textContent();
    if (text && (text.includes('Overview') || text.includes('Forensic') || text.includes('Cohort') || text.includes('Evidence'))) {
      tabLikeButtons.push(text);
      console.log(`  Tab-like button ${i}: "${text.trim()}"`);
    }
  }

  // Check for any navigation elements
  const navElements = await page.locator('nav').all();
  console.log('Number of nav elements:', navElements.length);

  // Check if we're on login page
  const isLoginPage = bodyText?.includes('Sign in') || bodyText?.includes('Log in') || page.url().includes('/login');
  console.log('Is on login page:', isLoginPage);

  if (isLoginPage) {
    console.log('ERROR: Page redirected to login. Cannot test authenticated page.');
    await page.screenshot({ path: 'C:/tmp/verify-02-login-required.png', fullPage: true });
    return;
  }

  // Try to find and click Forensic tab if it exists
  const forensicButton = page.locator('button').filter({ hasText: /forensic/i });

  if (await forensicButton.count() > 0) {
    console.log('Found Forensic button, clicking...');
    await forensicButton.first().click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'C:/tmp/verify-03-after-forensic-click.png', fullPage: true });

    // Check for KPI Dashboard elements
    const kpiVisible = await page.locator('text=School Intelligence').count() > 0;
    const kpiLoading = await page.locator('text=Loading school intelligence').count() > 0;
    const diagnosticVisible = await page.locator('text=Waiting for LA benchmark').count() > 0;

    console.log('After clicking Forensic tab:');
    console.log('  KPI Dashboard visible:', kpiVisible);
    console.log('  Loading visible:', kpiLoading);
    console.log('  Diagnostic visible:', diagnosticVisible);
  } else {
    console.log('Forensic button NOT found on page');
  }

  // Final screenshot
  await page.screenshot({ path: 'C:/tmp/verify-04-final.png', fullPage: true });

  console.log('=== Verification Complete ===');
});
