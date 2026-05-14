const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const outDir = process.env.OUT_DIR;
const pages = [
  { name: '01-trust-assessor-overview', url: 'http://localhost:3000/dashboard/school-improvement/trust-assessor' },
  { name: '02-assessment-intelligence', url: 'http://localhost:3000/dashboard/school-improvement/assessment-intelligence' },
  { name: '03-ofsted-readiness', url: 'http://localhost:3000/dashboard/ofsted-readiness' },
  { name: '04-policies-compliance', url: 'http://localhost:3000/dashboard/compliance/policies' },
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const results = [];
  for (const item of pages) {
    try {
      await page.goto(item.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(3500);
      const title = await page.title().catch(() => '');
      const text = (await page.locator('body').innerText({ timeout: 5000 }).catch(() => '')).slice(0, 700).replace(/\s+/g, ' ');
      const file = path.join(outDir, `${item.name}.png`);
      await page.screenshot({ path: file, fullPage: false });
      results.push({ name: item.name, finalUrl: page.url(), title, text, file });
    } catch (error) {
      results.push({ name: item.name, error: error.message });
    }
  }
  await browser.close();
  fs.writeFileSync(path.join(outDir, 'capture-results.json'), JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
})();
