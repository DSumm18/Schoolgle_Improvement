import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  const logs = [];
  page.on('console', msg => {
    logs.push(msg.text());
    console.log('📋', msg.text());
  });

  await page.goto('http://localhost:3000/dashboard/estates/building-3d', {timeout: 20000});
  await page.waitForTimeout(6000);

  console.log('\n=== SUMMARY ===');
  console.log('SimpleBuildingViewer:', logs.filter(l => l.includes('SimpleBuildingViewer')).length);
  console.log('Canvas:', logs.filter(l => l.includes('Canvas created')).length);
  console.log('Scene:', logs.filter(l => l.includes('Scene rendering')).length);
  console.log('Total logs:', logs.length);

  await browser.close();
})();
