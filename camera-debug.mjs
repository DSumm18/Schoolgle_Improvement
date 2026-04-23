import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Room') || text.includes('Canvas') || text.includes('position') || text.includes('visible')) {
      console.log('📋', text);
    }
  });

  console.log('🌐 Loading 3D viewer...');
  await page.goto('http://localhost:3000/dashboard/estates/building-3d', {
    waitUntil: 'domcontentloaded',
    timeout: 30000
  });

  console.log('⏳ Waiting for render...');
  await page.waitForTimeout(5000);

  // Test multiple camera positions to find where objects are
  const testPositions = [
    { name: "Top-down view", pos: [0, 50, 0], target: [0, 0, 0] },
    { name: "Front view", pos: [0, 5, 30], target: [0, 0, 0] },
    { name: "Side view", pos: [30, 5, 0], target: [0, 0, 0] },
    { name: "Far corner", pos: [40, 40, 40], target: [0, 0, 0] },
    { name: "Very high", pos: [0, 100, 1], target: [0, 0, 0] },
    { name: "Original", pos: [0, 20, 30], target: [0, 0, 0] }
  ];

  for (const test of testPositions) {
    console.log(`\n🎬 Testing: ${test.name}`);
    console.log(`   Camera at: [${test.pos}], looking at: [${test.target}]`);

    // Try to update camera position in the Three.js scene
    const result = await page.evaluate((testPos) => {
      // Find the camera and controls
      const canvas = Array.from(document.querySelectorAll('canvas')).find(c => c.offsetWidth > 100);
      if (!canvas) return { error: 'No canvas' };

      // Try to access the Three.js scene through React Three Fiber internals
      // The camera should be accessible via the fiber's internal state
      const sceneRoot = canvas.__fiber;
      if (!sceneRoot) return { error: 'No fiber root' };

      // Try to find the camera
      let camera = null;
      let controls = null;

      // Search for camera in the fiber tree
      const findCamera = (fiber) => {
        if (!fiber) return;
        if (fiber.stateNode && fiber.stateNode.isCamera) {
          camera = fiber.stateNode;
        }
        if (fiber.stateNode && fiber.stateNode.controls) {
          controls = fiber.stateNode.controls;
        }
        findCamera(fiber.child);
        findCamera(fiber.sibling);
      };

      findCamera(sceneRoot);

      if (!camera) return { error: 'Camera not found in fiber tree' };

      // Update camera position
      camera.position.set(testPos.pos[0], testPos.pos[1], testPos.pos[2]);
      camera.lookAt(testPos.target[0], testPos.target[1], testPos.target[2]);

      // Update controls if available
      if (controls) {
        controls.target.set(testPos.target[0], testPos.target[1], testPos.target[2]);
        controls.update();
      }

      return {
        success: true,
        cameraPosition: { x: camera.position.x, y: camera.position.y, z: camera.position.z },
        hasControls: !!controls
      };
    }, test);

    console.log('   Result:', result);

    // Wait for render and screenshot
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `camera-test-${test.name.replace(/\s+/g, '-')}.png`, fullPage: true });
    console.log('   📸 Screenshot saved');
  }

  // Try to get list of all objects in the scene
  console.log('\n🔍 Analyzing scene contents...');
  const sceneAnalysis = await page.evaluate(() => {
    const canvas = Array.from(document.querySelectorAll('canvas')).find(c => c.offsetWidth > 100);
    if (!canvas) return { error: 'No canvas' };

    const sceneRoot = canvas.__fiber;
    if (!sceneRoot) return { error: 'No fiber root' };

    // Try to find the scene and list all objects
    const objects = [];

    const traverseScene = (fiber, depth = 0) => {
      if (!fiber || depth > 20) return;

      const obj = fiber.stateNode;
      if (obj) {
        const info = {
          type: obj.type?.name || obj.constructor?.name || 'Unknown',
          position: obj.position ? { x: obj.position.x, y: obj.position.y, z: obj.position.z } : null,
          visible: obj.visible !== false,
          depth: depth
        };

        if (obj.type && obj.type.name) {
          objects.push(info);
        }
      }

      traverseScene(fiber.child, depth + 1);
      traverseScene(fiber.sibling, depth);
    };

    traverseScene(sceneRoot);

    return { objects: objects.slice(0, 50) }; // Limit output
  });

  console.log('Scene objects:', JSON.stringify(sceneAnalysis, null, 2));

  console.log('\n⏳ Browser staying open for 10 seconds for manual inspection...');
  await page.waitForTimeout(10000);

  await browser.close();
  console.log('\n✅ Camera debugging complete!');
})();
