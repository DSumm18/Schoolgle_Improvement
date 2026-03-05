const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('Navigating to http://localhost:3000/estates-compliance...');
    await page.goto('http://localhost:3000/estates-compliance', { waitUntil: 'networkidle', timeout: 30000 });

    // Wait a bit for any dynamic content
    await page.waitForTimeout(3000);

    // Check current URL to see if redirected
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);

    // Get page title
    const title = await page.title();
    console.log('Page title:', title);

    // Check for any error messages or specific content
    const bodyText = await page.evaluate(() => document.body.innerText);
    console.log('Page text preview:', bodyText.substring(0, 500));

    // Create screenshots directory if it doesn't exist
    const fs = require('fs');
    const screenshotDir = 'C:\\Git\\Schoolgle_Improvement\\screenshots';
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }

    // Take full page screenshot
    const screenshotPath = `${screenshotDir}\\estates-compliance-after-fix.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`Screenshot saved to: ${screenshotPath}`);

  } catch (error) {
    console.error('Error:', error.message);
  }

  // Keep browser open for inspection
  console.log('Browser will remain open for 10 seconds for manual inspection...');
  await page.waitForTimeout(10000);
  await browser.close();
})();
