const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    console.log('Navigating to create-school page...');
    await page.goto('http://localhost:3001/admin/create-school', { waitUntil: 'networkidle' });

    // Wait for page to load
    await page.waitForTimeout(3000);

    // Take screenshot
    await page.screenshot({ path: 'create-school-page.png', fullPage: true });
    console.log('Screenshot saved to create-school-page.png');

    // Get page title and some content
    const title = await page.title();
    const h1Text = await page.$eval('h1', el => el.textContent).catch(() => 'No H1 found');
    const bodyText = await page.$eval('body', el => el.innerText).catch(() => 'No body text');

    console.log('Page Title:', title);
    console.log('H1:', h1Text);
    console.log('Page contains "Create New School":', bodyText.includes('Create New School'));
    console.log('Page contains "Look Up School":', bodyText.includes('Look Up School'));
    console.log('Page contains "DEV MODE":', bodyText.includes('DEV MODE'));

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();
