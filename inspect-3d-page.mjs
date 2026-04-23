import { chromium } from 'playwright';
import fs from 'fs';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  const logs = [];
  const errors = [];

  // Capture ALL console output
  page.on('console', msg => {
    const text = msg.text();
    logs.push({ type: msg.type(), text });
    console.log(`[${msg.type()}]`, text);
  });

  page.on('pageerror', error => {
    errors.push(error.message);
    console.log('❌ Page error:', error.message);
  });

  try {
    console.log('=== NAVIGATING TO 3D BUILDING VIEWER ===\n');
    await page.goto('http://localhost:3000/dashboard/estates/building-3d', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    console.log('\n⏳ Waiting 10 seconds for full render...');
    await page.waitForTimeout(10000);

    // INSPECT THE PAGE
    console.log('\n=== DOM INSPECTION ===');

    // Check body
    const bodyInfo = await page.evaluate(() => {
      const body = document.body;
      return {
        innerHTML: body.innerHTML.substring(0, 1000),
        classList: Array.from(body.classList),
        style: window.getComputedStyle(body).cssText,
        offsetHeight: body.offsetHeight,
        offsetWidth: body.offsetWidth
      };
    });
    console.log('Body:', bodyInfo);

    // Check ALL canvas elements
    const canvasInfo = await page.evaluate(() => {
      const canvases = Array.from(document.querySelectorAll('canvas'));
      return canvases.map((c, i) => ({
        index: i,
        id: c.id,
        width: c.width,
        height: c.height,
        offsetWidth: c.offsetWidth,
        offsetHeight: c.offsetHeight,
        style: c.getAttribute('style'),
        classList: Array.from(c.classList),
        parent: c.parentElement?.className,
        grandparent: c.parentElement?.parentElement?.className,
        rect: c.getBoundingClientRect()
      }));
    });
    console.log('\n🖼️ CANVAS ELEMENTS:', JSON.stringify(canvasInfo, null, 2));

    // Check main container
    const mainContainer = await page.evaluate(() => {
      const main = document.querySelector('main') || document.querySelector('[class*="building"]');
      if (!main) return null;
      return {
        tagName: main.tagName,
        classList: Array.from(main.classList),
        innerHTML: main.innerHTML.substring(0, 500),
        style: window.getComputedStyle(main).cssText,
        offsetHeight: main.offsetHeight,
        offsetWidth: main.offsetWidth
      };
    });
    console.log('\n📦 MAIN CONTAINER:', mainContainer);

    // Look for 3D viewer wrapper
    const viewerWrapper = await page.evaluate(() => {
      const wrappers = Array.from(document.querySelectorAll('[class*="viewer"], [class*="canvas"], [class*="3d"]'))
        .map(el => ({
          tag: el.tagName,
          classList: Array.from(el.classList),
          offsetHeight: el.offsetHeight,
          offsetWidth: el.offsetWidth,
          children: el.children.length
        }));
      return wrappers;
    });
    console.log('\n🎯 WRAPPER ELEMENTS:', viewerWrapper);

    // Check if React rendered anything
    const reactState = await page.evaluate(() => {
      // Look for React roots
      const roots = Array.from(document.querySelectorAll('[data-reactroot]'));
      return {
        reactRoots: roots.length,
        hasReact: !!window.__REACT__,
        hasReactFiber: !!window.__REACT_DEVTOOLS_GLOBAL_HOOK__
      };
    });
    console.log('\n⚛️  REACT STATE:', reactState);

    // Screenshot
    await page.screenshot({ path: 'inspection-screenshot.png', fullPage: true });
    console.log('\n📸 Screenshot saved: inspection-screenshot.png');

    // Get HTML for inspection
    const html = await page.content();
    fs.writeFileSync('page-dump.html', html);
    console.log('📄 Full HTML saved: page-dump.html');

    console.log('\n=== CONSOLE SUMMARY ===');
    console.log(`Total logs: ${logs.length}`);
    console.log(`Errors: ${errors.length}`);
    if (errors.length > 0) {
      console.log('Error details:', errors);
    }

  } catch (error) {
    console.error('❌ FATAL ERROR:', error.message);
    console.error(error.stack);
  }

  console.log('\n⏳ Keeping browser open for 15 seconds for your inspection...');
  await page.waitForTimeout(15000);

  await browser.close();
  console.log('\n✅ Inspection complete!');
})();
