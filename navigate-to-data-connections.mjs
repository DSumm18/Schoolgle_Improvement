import { chromium } from 'playwright';

(async () => {
  console.log('🚀 Starting browser...');
  const browser = await chromium.launch({ 
    headless: false, 
    slowMo: 500 
  });
  
  const context = await browser.newContext({ 
    viewport: { width: 1920, height: 1080 } 
  });
  const page = await context.newPage();

  // Go to data connections page
  const url = 'http://localhost:3000/dashboard/settings/data-connections';
  console.log(`📍 Navigating to: ${url}`);
  
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  
  // Screenshot the page
  await page.screenshot({ path: 'data-connections-page.png', fullPage: true });
  console.log('✅ Screenshot saved: data-connections-page.png');
  
  // Look for Google Drive connection panel
  const pageText = await page.evaluate(() => document.body.innerText);
  
  console.log('\n🔍 Page Analysis:');
  console.log('  - Contains "Google Drive":', pageText.includes('Google Drive'));
  console.log('  - Contains "Connect":', pageText.includes('Connect'));
  console.log('  - Contains "not configured":', pageText.includes('not configured'));
  
  // Keep browser open for user to interact
  console.log('\n⏸️  Browser open - ready for you to connect Google Drive!');
  console.log('📋 Your folder link: https://drive.google.com/drive/folders/1iNg4wu2JqE76IDrdzT2hegoxzrv-Itqn');
  
  // Keep open for 2 minutes so user can interact
  await page.waitForTimeout(120000);
  
  await browser.close();
})();
