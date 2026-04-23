import { chromium } from 'playwright';
import fs from 'fs';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Capture console logs and errors
  const logs = [];
  const errors = [];

  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    logs.push({ type, text });
    if (type === 'error') {
      console.log('❌ Console Error:', text);
      errors.push(text);
    }
  });

  page.on('pageerror', error => {
    console.log('⚠️ Page Error:', error.message);
    errors.push(error.message);
  });

  page.on('response', response => {
    if (response.status() >= 400) {
      console.log('⚠️ HTTP Error:', response.url(), response.status());
    }
  });

  try {
    console.log('🌐 Navigating to main 3D page...');
    // Don't wait for networkidle - just load and wait
    await page.goto('http://localhost:3000/dashboard/estates/building-3d', {
      waitUntil: 'domcontentloaded',
      timeout: 15000
    });

    console.log('⏳ Waiting 8 seconds for rendering...');
    await page.waitForTimeout(8000);

    // Take screenshot
    await page.screenshot({ path: 'building-3d-main.png', fullPage: true });
    console.log('📸 Screenshot saved: building-3d-main.png');

    // Check what's actually on the page
    const bodyText = await page.locator('body').innerText();
    console.log('📝 Page text:', bodyText.substring(0, 300));

    // Check for canvas
    const canvasCount = await page.locator('canvas').count();
    console.log('🖼️ Canvas elements:', canvasCount);

    // Get all logs
    console.log('\n=== ALL CONSOLE OUTPUT ===');
    logs.forEach(log => console.log(`[${log.type}] ${log.text}`));

    // Check if there are any loading spinners
    const hasSpinner = await page.locator('[class*="spinner"], [class*="loading"], svg.animate-spin').count();
    console.log('🔄 Loading spinners found:', hasSpinner);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  console.log('\n⏳ Keeping browser open for 5 seconds...');
  await page.waitForTimeout(5000);

  await browser.close();
  console.log('\n✅ Check building-3d-main.png to see what rendered');
})();
