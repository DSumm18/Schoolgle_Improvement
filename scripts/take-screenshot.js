const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function takeScreenshot() {
  const browser = await chromium.launch({
    headless: true
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  // Listen for console messages
  const consoleMessages = [];
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error' || type === 'warning') {
      consoleMessages.push(`[${type.toUpperCase()}] ${text}`);
    }
  });

  // Listen for page errors
  const pageErrors = [];
  page.on('pageerror', error => {
    pageErrors.push(error.message);
  });

  try {
    console.log('Navigating to http://localhost:3000...');
    await page.goto('http://localhost:3000', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Wait a bit for any dynamic content to load
    await page.waitForTimeout(3000);

    // Take full page screenshot
    const screenshotPath = path.join('C:\\Git\\Schoolgle_Improvement\\screenshots', 'homepage-after-fix.png');
    await page.screenshot({
      path: screenshotPath,
      fullPage: true
    });

    console.log(`Screenshot saved to: ${screenshotPath}`);

    // Get page title
    const title = await page.title();
    console.log(`Page title: ${title}`);

    // Get body text for analysis
    const bodyText = await page.evaluate(() => {
      return document.body.innerText;
    });

    // Check for visible elements
    const visibleElements = await page.evaluate(() => {
      const result = {
        headingCount: document.querySelectorAll('h1, h2, h3, h4, h5, h6').length,
        buttonCount: document.querySelectorAll('button, a[role="button"]').length,
        imageCount: document.querySelectorAll('img').length,
        linkCount: document.querySelectorAll('a').length,
        hasNavbar: !!document.querySelector('nav'),
        hasFooter: !!document.querySelector('footer'),
        bodyBackground: window.getComputedStyle(document.body).backgroundColor,
        bodyColor: window.getComputedStyle(document.body).color
      };
      return result;
    });

    console.log('\n=== PAGE ANALYSIS ===');
    console.log(`Title: ${title}`);
    console.log(`\nVisible Elements:`);
    console.log(`  - Headings: ${visibleElements.headingCount}`);
    console.log(`  - Buttons: ${visibleElements.buttonCount}`);
    console.log(`  - Images: ${visibleElements.imageCount}`);
    console.log(`  - Links: ${visibleElements.linkCount}`);
    console.log(`  - Has Navbar: ${visibleElements.hasNavbar}`);
    console.log(`  - Has Footer: ${visibleElements.hasFooter}`);
    console.log(`\nStyling:`);
    console.log(`  - Body background: ${visibleElements.bodyBackground}`);
    console.log(`  - Body color: ${visibleElements.bodyColor}`);

    // Sample of body text (first 500 chars)
    console.log(`\nBody text preview:`);
    console.log(bodyText.substring(0, 500) + (bodyText.length > 500 ? '...' : ''));

    if (consoleMessages.length > 0) {
      console.log(`\n=== CONSOLE MESSAGES (${consoleMessages.length}) ===`);
      consoleMessages.slice(0, 10).forEach(msg => console.log(msg));
      if (consoleMessages.length > 10) {
        console.log(`... and ${consoleMessages.length - 10} more`);
      }
    }

    if (pageErrors.length > 0) {
      console.log(`\n=== PAGE ERRORS (${pageErrors.length}) ===`);
      pageErrors.slice(0, 5).forEach(err => console.log(err));
      if (pageErrors.length > 5) {
        console.log(`... and ${pageErrors.length - 5} more`);
      }
    }

  } catch (error) {
    console.error('Error taking screenshot:', error.message);
  } finally {
    await browser.close();
  }
}

takeScreenshot();
