import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Room selected') || text.includes('Canvas') || text.includes('Error')) {
      console.log('📋', text);
    }
  });

  console.log('🌐 Loading 3D viewer and interacting with it...\n');
  await page.goto('http://localhost:3003/dashboard/estates/building-3d', {
    waitUntil: 'domcontentloaded',
    timeout: 30000
  });

  console.log('⏳ Waiting 8 seconds for render...');
  await page.waitForTimeout(8000);

  // Get canvas info
  const canvasInfo = await page.evaluate(() => {
    const canvas = Array.from(document.querySelectorAll('canvas')).find(c => c.offsetWidth > 100);
    if (!canvas) return { error: 'No large canvas found' };

    return {
      width: canvas.width,
      height: canvas.height,
      offsetWidth: canvas.offsetWidth,
      offsetHeight: canvas.offsetHeight,
      getContext: canvas.getContext('webgl2') ? 'webgl2' : canvas.getContext('webgl') ? 'webgl' : 'none',
      parent: canvas.parentElement?.className,
      computedStyle: window.getComputedStyle(canvas).cssText
    };
  });
  console.log('\n🖼️ CANVAS INFO:', canvasInfo);

  // Try to click on the canvas to select a room
  console.log('\n🖱️  Attempting to interact with canvas...');
  const clickResult = await page.evaluate(() => {
    const canvas = Array.from(document.querySelectorAll('canvas')).find(c => c.offsetWidth > 100);
    if (!canvas) return { error: 'No canvas found' };

    // Click in the center
    canvas.dispatchEvent(new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      clientX: canvas.getBoundingClientRect().left + canvas.offsetWidth / 2,
      clientY: canvas.getBoundingClientRect().top + canvas.offsetHeight / 2
    }));

    return { clicked: true, canvasRect: canvas.getBoundingClientRect() };
  });
  console.log('Click result:', clickResult);

  // Wait a moment and take screenshot
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'interactive-test.png', fullPage: true });
  console.log('\n📸 Screenshot: interactive-test.png');

  // Check for any WebGL errors
  const webglStatus = await page.evaluate(() => {
    const canvas = Array.from(document.querySelectorAll('canvas')).find(c => c.offsetWidth > 100);
    if (!canvas) return { error: 'No canvas' };

    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return { error: 'No WebGL context' };

    return {
      webgl2: !!canvas.getContext('webgl2'),
      vendor: gl.getParameter(gl.VENDOR),
      renderer: gl.getParameter(gl.RENDERER),
      maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
      maxViewportDims: gl.getParameter(gl.MAX_VIEWPORT_DIMS),
      numExtensions: gl.getSupportedExtensions()?.length
    };
  });
  console.log('\n🎮 WEBGL STATUS:', webglStatus);

  console.log('\n⏳ Browser staying open for 15 seconds - try dragging/zooming!');
  await page.waitForTimeout(15000);

  await browser.close();
  console.log('\n✅ Inspection complete');
})();
