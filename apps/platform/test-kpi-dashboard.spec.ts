import { test, expect } from '@playwright/test';

test('verify KPI Dashboard renders', async ({ page }) => {
  // Navigate to Trust Assessor page
  await page.goto('http://localhost:3000/dashboard/school-improvement/trust-assessor');

  // Wait for page to load
  await page.waitForLoadState('networkidle');

  // Take screenshot of current state
  await page.screenshot({ path: 'C:/tmp/trust-assessor-before.png', fullPage: true });

  // Check if we need to log in
  const loginButton = page.locator('text=Sign in').first();
  if (await loginButton.isVisible()) {
    console.log('Login required - cannot proceed without credentials');
    await page.screenshot({ path: 'C:/tmp/trust-assessor-login.png' });
    return;
  }

  // Click on Forensic Review tab
  const forensicTab = page.locator('text=Forensic').or(page.locator('text=forensic')).or(page.locator('[role="tab"] >> text=Forensic'));
  if (await forensicTab.isVisible()) {
    await forensicTab.click();
    await page.waitForTimeout(2000);
  }

  // Take screenshot after clicking tab
  await page.screenshot({ path: 'C:/tmp/trust-assessor-forensic.png', fullPage: true });

  // Check for KPI Dashboard elements
  const kpiDashboard = page.locator('text=School Intelligence Dashboard');
  const loadingSpinner = page.locator('text=Loading school intelligence');
  const diagnosticPanel = page.locator('text=School Intelligence Dashboard').or(page.locator('text=Waiting for LA benchmark'));

  console.log('KPI Dashboard visible:', await kpiDashboard.isVisible());
  console.log('Loading visible:', await loadingSpinner.isVisible());
  console.log('Diagnostic visible:', await diagnosticPanel.isVisible());

  // Get page text for debugging
  const pageText = await page.textContent('body');
  console.log('Page contains "KPI":', pageText?.includes('KPI'));
  console.log('Page contains "School Intelligence":', pageText?.includes('School Intelligence'));

  await page.screenshot({ path: 'C:/tmp/trust-assessor-final.png', fullPage: true });
});
