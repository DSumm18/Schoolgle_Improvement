import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  const clicks = [];
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Room') || text.includes('selected') || text.includes('clicked')) {
      console.log('📋', text);
      clicks.push(text);
    } else if (text.includes('Canvas') || text.includes('Error')) {
      console.log('📋', text);
    }
  });

  await page.goto('http://localhost:3000/dashboard/estates/building-3d', {timeout: 20000});
  await page.waitForTimeout(6000);

  // Try clicking on the canvas
  const clickResult = await page.evaluate(() => {
    const canvas = Array.from(document.querySelectorAll('canvas')).find(c => c.offsetWidth > 100);
    if (!canvas) return { error: 'No canvas' };

    const rect = canvas.getBoundingClientRect();

    // Click in center
    canvas.dispatchEvent(new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      clientX: rect.left + rect.width / 2,
      clientY: rect.top + rect.height / 3,
      button: 0
    }));

    return { clicked: true, x: rect.left + rect.width / 2, y: rect.top + rect.height / 3, rect };
  });

  console.log('Click result:', clickResult);
  await page.waitForTimeout(2000);

  await page.screenshot({path: 'building-click-test.png', fullPage: true});
  console.log('📸 building-click-test.png - Clicks detected:', clicks.length);
  console.log('Rooms are clickable:', clicks.length > 0 ? 'YES ✅' : 'NO ❌');

  await page.waitForTimeout(3000);
  await browser.close();
})();
