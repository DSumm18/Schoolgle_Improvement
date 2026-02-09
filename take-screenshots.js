const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function takeScreenshots() {
  const browser = await chromium.launch({
    headless: true
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  // Collect console errors
  const consoleErrors = [];
  const consoleLogs = [];

  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();

    if (type === 'error') {
      consoleErrors.push({
        text,
        location: msg.location()
      });
    }
    consoleLogs.push({ type, text });
  });

  // Also listen for page errors
  const pageErrors = [];
  page.on('pageerror', error => {
    pageErrors.push({
      message: error.message,
      stack: error.stack
    });
  });

  // Network errors
  const networkErrors = [];
  page.on('response', response => {
    if (response.status() >= 400) {
      networkErrors.push({
        url: response.url(),
        status: response.status(),
        statusText: response.statusText()
      });
    }
  });

  const results = {
    homepage: {
      screenshot: null,
      consoleErrors: [],
      pageErrors: [],
      networkErrors: [],
      description: null
    },
    estatesCompliance: {
      screenshot: null,
      consoleErrors: [],
      pageErrors: [],
      networkErrors: [],
      description: null
    }
  };

  // Screenshot directory
  const screenshotDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  try {
    console.log('Navigating to http://localhost:3000 ...');
    await page.goto('http://localhost:3000', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Wait a bit more for any dynamic content
    await page.waitForTimeout(3000);

    // Take screenshot
    const homepageScreenshot = path.join(screenshotDir, 'homepage.png');
    await page.screenshot({
      path: homepageScreenshot,
      fullPage: true
    });
    results.homepage.screenshot = homepageScreenshot;
    console.log(`Screenshot saved: ${homepageScreenshot}`);

    // Collect errors for homepage
    results.homepage.consoleErrors = [...consoleErrors];
    results.homepage.pageErrors = [...pageErrors];
    results.homepage.networkErrors = [...networkErrors];

    // Get page title and describe what's visible
    const title = await page.title();
    const bodyText = await page.evaluate(() => {
      return document.body.innerText;
    });

    // Get main visible elements
    const visibleElements = await page.evaluate(() => {
      const elements = [];
      const main = document.querySelector('main');
      if (main) {
        const headings = main.querySelectorAll('h1, h2, h3');
        headings.forEach(h => {
          elements.push(`${h.tagName}: ${h.textContent.trim()}`);
        });
      }
      return elements;
    });

    results.homepage.description = {
      title,
      visibleElements,
      bodyTextPreview: bodyText.substring(0, 500)
    };

  } catch (error) {
    results.homepage.error = error.message;
    console.error('Error on homepage:', error);
  }

  // Clear errors for next page
  consoleErrors.length = 0;
  pageErrors.length = 0;
  networkErrors.length = 0;

  try {
    console.log('Navigating to http://localhost:3000/estates-compliance ...');
    await page.goto('http://localhost:3000/estates-compliance', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    await page.waitForTimeout(3000);

    const estatesScreenshot = path.join(screenshotDir, 'estates-compliance.png');
    await page.screenshot({
      path: estatesScreenshot,
      fullPage: true
    });
    results.estatesCompliance.screenshot = estatesScreenshot;
    console.log(`Screenshot saved: ${estatesScreenshot}`);

    results.estatesCompliance.consoleErrors = [...consoleErrors];
    results.estatesCompliance.pageErrors = [...pageErrors];
    results.estatesCompliance.networkErrors = [...networkErrors];

    const title = await page.title();
    const bodyText = await page.evaluate(() => {
      return document.body.innerText;
    });

    const visibleElements = await page.evaluate(() => {
      const elements = [];
      const main = document.querySelector('main');
      if (main) {
        const headings = main.querySelectorAll('h1, h2, h3');
        headings.forEach(h => {
          elements.push(`${h.tagName}: ${h.textContent.trim()}`);
        });
      }
      return elements;
    });

    results.estatesCompliance.description = {
      title,
      visibleElements,
      bodyTextPreview: bodyText.substring(0, 500)
    };

  } catch (error) {
    results.estatesCompliance.error = error.message;
    console.error('Error on estates-compliance:', error);
  }

  await browser.close();

  return results;
}

takeScreenshots().then(results => {
  console.log('\n========== RESULTS ==========\n');
  console.log(JSON.stringify(results, null, 2));
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
