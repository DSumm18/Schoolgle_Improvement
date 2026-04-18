const { chromium } = require(require.resolve('playwright', { paths: [require('path').join(__dirname, '../../apps/platform')] }));
const fs = require('fs');

async function main() {
  const sessionFile = require('path').join(__dirname, '../../.dev/session.json');
  const session = JSON.parse(fs.readFileSync(sessionFile, 'utf8'));
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();
  
  await page.goto('http://localhost:3000');
  await page.evaluate((s: { accessToken: string; refreshToken: string; supabaseUrl: string }) => {
    const key = `sb-${new URL(s.supabaseUrl).hostname.split('.')[0]}-auth-token`;
    localStorage.setItem(key, JSON.stringify({
      access_token: s.accessToken,
      refresh_token: s.refreshToken,
      expires_at: Math.floor(Date.now() / 1000) + 7200,
      token_type: 'bearer',
    }));
  }, session);
  
  await page.goto('http://localhost:3000/dashboard/school-improvement/trust-assessor');
  await page.waitForTimeout(14000);
  
  const passportEl = await page.locator('text=Cohort Validation Passport').first();
  if (await passportEl.count() > 0) {
    await passportEl.scrollIntoViewIfNeeded();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/tmp/cohort-passport-section.png', fullPage: false });
    console.log('Scrolled to Cohort Passport and captured');
  } else {
    await page.screenshot({ path: '/tmp/cohort-passport-section.png' });
    console.log('Did not find element, captured current viewport');
  }
  
  await browser.close();
}

main().catch(console.error);
