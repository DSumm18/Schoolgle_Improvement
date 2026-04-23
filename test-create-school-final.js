const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('🧪 Testing Create School Flow...\n');

    await page.goto('http://localhost:3003/admin/create-school', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Step 1: Enter URN
    console.log('Step 1: Entering URN 123456');
    const input = page.locator('input[type="text"]');
    await input.click();
    await page.keyboard.type('123456');
    await page.waitForTimeout(500);

    const inputVal = await input.inputValue();
    console.log(`  ✅ URN input: "${inputVal}"`);

    // Click Look Up button
    const btn = page.locator('button:has-text("Look Up")');
    const btnDisabled = await btn.isDisabled();
    console.log(`  Button disabled: ${btnDisabled}`);

    await btn.click();
    await page.waitForTimeout(2000);

    // Step 2: Check results
    const step2 = await page.locator('text=Step 2 of 5').count();
    const grove = await page.locator('text=Grove House Primary School').count();
    const eastSussex = await page.locator('text=East Sussex').count();
    const postcode = await page.locator('text=BN21 1AA').count();

    console.log('\nStep 2 Results:');
    console.log(`  Moved to Step 2: ${step2 > 0 ? '✅' : '❌'}`);
    console.log(`  School name found: ${grove > 0 ? '✅' : '❌'}`);
    console.log(`  Location found: ${eastSussex > 0 ? '✅' : '❌'}`);
    console.log(`  Postcode found: ${postcode > 0 ? '✅' : '❌'}`);

    if (step2 > 0 && grove > 0) {
      console.log('\n🎉 CREATE SCHOOL FORM IS WORKING!');
      console.log('\nYou can now test manually in your browser at:');
      console.log('http://localhost:3003/admin/create-school');
    } else {
      console.log('\n⚠️  Something needs fixing');
    }

    await page.screenshot({ path: 'create-school-final-test.png' });
    console.log('\nScreenshot saved: create-school-final-test.png');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();
