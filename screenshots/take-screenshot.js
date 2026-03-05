/**
 * Screenshot script for estates-compliance page
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function takeScreenshot() {
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
    ],
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });

  const page = await context.newPage();

  // Listen for console messages
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push({ type: msg.type(), text: msg.text() });
    console.log(`[Browser Console ${msg.type()}]`, msg.text());
  });

  // Listen for errors
  const pageErrors = [];
  page.on('pageerror', error => {
    pageErrors.push(error.message);
    console.error('[Browser Error]', error.message);
  });

  // Track navigation
  const navigationLog = [];

  try {
    console.log('Navigating to http://localhost:3000/estates-compliance...');
    navigationLog.push('Navigating to estates-compliance page');

    const response = await page.goto('http://localhost:3000/estates-compliance', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    console.log('Response status:', response?.status());
    navigationLog.push(`Response status: ${response?.status()}`);

    // Wait a bit for any dynamic content
    await page.waitForTimeout(3000);

    // Get page title
    const title = await page.title();
    console.log('Page title:', title);
    navigationLog.push(`Page title: ${title}`);

    // Get current URL (may have redirected)
    const url = page.url();
    console.log('Current URL:', url);
    navigationLog.push(`Current URL: ${url}`);

    // Check for login redirect
    const isLoginPage = url.includes('/login') || url.includes('/sign-in');
    console.log('Is login page?', isLoginPage);
    navigationLog.push(`Is login page: ${isLoginPage}`);

    // Get page content for analysis
    const content = await page.content();

    // Look for specific elements
    const checks = {
      hasTodayTasksCard: content.includes('Today') && (content.includes('Tasks') || content.includes('task')),
      hasStatutoryChecks: content.includes('statutory') || content.includes('Statutory'),
      hasOverdueItems: content.includes('overdue') || content.includes('Overdue'),
      hasDueTodayItems: content.includes('due today') || content.includes('Due today'),
      hasComplianceContent: content.includes('compliance') || content.includes('Compliance'),
      hasDashboardElements: content.includes('dashboard') || content.includes('Dashboard'),
    };

    console.log('Element checks:', checks);
    navigationLog.push(`Element checks: ${JSON.stringify(checks)}`);

    // Look for any visible text content
    const bodyText = await page.evaluate(() => {
      return document.body?.innerText?.substring(0, 500) || '';
    });
    console.log('Page body preview:', bodyText.substring(0, 200));

    // Take screenshot
    const screenshotDir = 'C:\\Git\\Schoolgle_Improvement\\screenshots';
    const screenshotPath = path.join(screenshotDir, 'estates-compliance-logged-in.png');

    console.log('Taking screenshot...');
    await page.screenshot({
      path: screenshotPath,
      fullPage: true,
      type: 'png',
    });

    console.log('Screenshot saved to:', screenshotPath);

    // Compile report
    const report = {
      timestamp: new Date().toISOString(),
      url: url,
      originalUrl: 'http://localhost:3000/estates-compliance',
      responseStatus: response?.status(),
      pageTitle: title,
      isLoginPage: isLoginPage,
      contentChecks: checks,
      consoleMessages: consoleMessages,
      pageErrors: pageErrors,
      navigationLog: navigationLog,
      screenshotPath: screenshotPath,
    };

    // Save report
    const reportPath = path.join(screenshotDir, 'estates-compliance-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log('Report saved to:', reportPath);

  } catch (error) {
    console.error('Error taking screenshot:', error);
  } finally {
    await browser.close();
  }
}

takeScreenshot().catch(console.error);
