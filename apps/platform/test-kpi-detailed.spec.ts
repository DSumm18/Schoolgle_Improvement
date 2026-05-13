import { test, expect } from '@playwright/test';

test('detailed KPI Dashboard investigation', async ({ page }) => {
  // Navigate to Trust Assessor page
  await page.goto('http://localhost:3000/dashboard/school-improvement/trust-assessor');

  // Wait for page to load
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // Take initial screenshot
  await page.screenshot({ path: 'C:/tmp/01-initial.png', fullPage: true });

  // Check URL
  console.log('Current URL:', page.url());

  // Check if we're on login page
  const hasSignIn = await page.locator('body').textContent().then(text => text?.includes('Sign in') || text?.includes('Log in'));
  console.log('Has Sign In button:', hasSignIn);

  if (hasSignIn) {
    console.log('ERROR: Not logged in. Cannot proceed with authenticated test.');
    await page.screenshot({ path: 'C:/tmp/02-not-logged-in.png' });
    return;
  }

  // Look for tabs
  const tabs = await page.locator('[role="tab"]').all();
  console.log('Number of tabs found:', tabs.length);

  for (let i = 0; i < tabs.length; i++) {
    const tabText = await tabs[i].textContent();
    console.log(`Tab ${i}:`, tabText);
  }

  // Try to find and click Forensic tab
  const forensicTab = page.locator('[role="tab"]').filter({ hasText: /forensic|Forensic/i });

  if (await forensicTab.count() > 0) {
    console.log('Found Forensic tab, clicking...');
    await forensicTab.click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'C:/tmp/03-after-forensic-click.png', fullPage: true });
  } else {
    console.log('Forensic tab not found');
  }

  // Check page content
  const bodyText = await page.locator('body').textContent();

  // Look for specific elements
  const checks = {
    'KPI Dashboard text': bodyText?.includes('School Intelligence Dashboard'),
    'Loading text': bodyText?.includes('Loading school intelligence'),
    'KPI Card': bodyText?.includes('KS2 Combined'),
    'Forensic Verdict': bodyText?.includes('Forensic Verdict'),
    'Trust Assessor': bodyText?.includes('Trust Assessor'),
  };

  console.log('Content checks:', checks);

  // Look for the specific section where KPI Dashboard should be
  const kpiSection = page.locator('text=School Intelligence').or(page.locator('text=Intelligence Dashboard'));
  const kpiCount = await kpiSection.count();
  console.log('KPI Dashboard elements found:', kpiCount);

  // Check if diagnostic panel is showing
  const diagnosticText = await page.locator('text=Waiting for LA benchmark').count();
  console.log('Diagnostic panel elements:', diagnosticText);

  // Get all headings on page
  const headings = await page.locator('h1, h2, h3, h4').allTextContents();
  console.log('Page headings:', headings);

  // Final screenshot
  await page.screenshot({ path: 'C:/tmp/04-final.png', fullPage: true });
});
