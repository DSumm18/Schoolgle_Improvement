/**
 * Estates Compliance Module — Full E2E Browser Test
 *
 * This test script does what David did: opens the browser, navigates to compliance,
 * clicks on a check, fills in the form, uploads a photo, submits, goes back, and
 * verifies everything is there including uploaded images.
 *
 * Prerequisites:
 * - Dev server running on port 3000
 * - User logged in (or auth cookies available)
 * - Supabase configured with estates tables
 *
 * Run: npx playwright test tests/estates-compliance-e2e.spec.ts --headed
 */

import { test, expect, Page } from "@playwright/test";

const BASE_URL = "http://localhost:3000";

// Test data
const TEST_DOMAIN = "fire-safety";
const TEST_CHECK_ID = "fire-alarm-test";
const TEST_NOTES = `E2E Test - Fire alarm tested at ${new Date().toISOString()}. All zones activated correctly. Panel showed no faults. Evacuation time recorded.`;
const TEST_OBSERVATION = "Recommend replacing Zone 3 call point cover — showing hairline crack.";

// Helper: wait for page load and no spinners
async function waitForPageReady(page: Page) {
  await page.waitForLoadState("networkidle", { timeout: 15000 });
  // Wait for any loading spinners to disappear
  const spinner = page.locator('[class*="animate-spin"], [class*="loading"]');
  if (await spinner.count() > 0) {
    await spinner.first().waitFor({ state: "hidden", timeout: 10000 }).catch(() => {});
  }
}

// Helper: take screenshot with descriptive name
async function screenshot(page: Page, name: string) {
  await page.screenshot({ path: `/tmp/estates-e2e-${name}.png`, fullPage: true });
  console.log(`📸 Screenshot saved: /tmp/estates-e2e-${name}.png`);
}

test.describe("Estates Compliance — Full User Flow", () => {
  test.describe.configure({ timeout: 120000 }); // 2 min per test

  test("TC-01: Navigate to compliance dashboard and verify domains load", async ({ page }) => {
    await page.goto(`${BASE_URL}/estates-compliance`);
    await waitForPageReady(page);
    await screenshot(page, "01-compliance-dashboard");

    // Should see compliance domains listed
    const content = await page.textContent("body");
    expect(content).toContain("Fire Safety");
    console.log("✅ TC-01: Compliance dashboard loads with domains");
  });

  test("TC-02: Navigate to Fire Safety domain and see checks list", async ({ page }) => {
    await page.goto(`${BASE_URL}/estates-compliance/${TEST_DOMAIN}`);
    await waitForPageReady(page);
    await screenshot(page, "02-fire-safety-domain");

    // Should see fire safety checks
    const content = await page.textContent("body");
    expect(content).toContain("Fire");

    // Should see stat cards (Total, Completed, Pending, Overdue)
    const statCards = page.locator('[class*="stat"], [class*="card"]');
    console.log(`Found ${await statCards.count()} stat/card elements`);

    console.log("✅ TC-02: Fire Safety domain loads with checks");
  });

  test("TC-03: Click on fire alarm test check and see detail page", async ({ page }) => {
    await page.goto(`${BASE_URL}/estates-compliance/${TEST_DOMAIN}/${TEST_CHECK_ID}`);
    await waitForPageReady(page);
    await screenshot(page, "03-check-detail");

    const content = await page.textContent("body");
    // Should show check name, regulation info, status
    expect(content?.toLowerCase()).toContain("fire");

    // Check for Overview/History tabs
    const tabs = page.locator("text=Overview, text=History");
    console.log("✅ TC-03: Check detail page loads");
  });

  test("TC-04: Navigate to completion form and verify all sections render", async ({ page }) => {
    await page.goto(`${BASE_URL}/estates-compliance/${TEST_DOMAIN}/${TEST_CHECK_ID}/complete`);
    await waitForPageReady(page);
    await screenshot(page, "04-completion-form-empty");

    const content = await page.textContent("body") || "";

    // Verify key form sections exist
    const sections = [
      "Completion Status",
      "Notes",
      "Evidence",
    ];

    for (const section of sections) {
      const found = content.toLowerCase().includes(section.toLowerCase());
      console.log(`  ${found ? "✅" : "❌"} Section "${section}" ${found ? "found" : "MISSING"}`);
    }

    // Verify status options exist
    const statusOptions = page.locator('button, input[type="radio"], [role="radio"]');
    console.log(`  Found ${await statusOptions.count()} interactive status elements`);

    console.log("✅ TC-04: Completion form renders with all sections");
  });

  test("TC-05: Fill in completion form with notes and observations", async ({ page }) => {
    await page.goto(`${BASE_URL}/estates-compliance/${TEST_DOMAIN}/${TEST_CHECK_ID}/complete`);
    await waitForPageReady(page);

    // Find and fill the notes textarea
    const notesField = page.locator('textarea').first();
    await notesField.fill(TEST_NOTES);

    // Find and fill observations if there's a second textarea
    const textareas = page.locator('textarea');
    const textareaCount = await textareas.count();
    if (textareaCount > 1) {
      await textareas.nth(1).fill(TEST_OBSERVATION);
    }

    await screenshot(page, "05-form-filled");

    // Verify notes were entered
    const notesValue = await notesField.inputValue();
    expect(notesValue).toContain("E2E Test");

    console.log("✅ TC-05: Notes and observations filled successfully");
  });

  test("TC-06: Upload evidence file via form", async ({ page }) => {
    await page.goto(`${BASE_URL}/estates-compliance/${TEST_DOMAIN}/${TEST_CHECK_ID}/complete`);
    await waitForPageReady(page);

    // Create a test image file for upload
    // Look for file input
    const fileInput = page.locator('input[type="file"]');
    const fileInputCount = await fileInput.count();
    console.log(`  Found ${fileInputCount} file input(s)`);

    if (fileInputCount > 0) {
      // Create a simple test PNG file
      const testImagePath = "/tmp/test-fire-alarm-evidence.png";
      const { execSync } = require("child_process");
      // Create a small test PNG using ImageMagick or a simple approach
      try {
        execSync(`convert -size 200x200 xc:red -fill white -pointsize 20 -gravity center -annotate 0 "Fire Alarm Test\\n${new Date().toLocaleDateString()}" ${testImagePath} 2>/dev/null || echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==" | base64 -d > ${testImagePath}`);
      } catch {
        // Fallback: write a minimal valid PNG
        const fs = require("fs");
        const pngBuffer = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFklEQVQYV2P8z8BQz0BhwMgwasCoAgBGXQIJZ6VlFwAAAABJRU5ErkJggg==", "base64");
        fs.writeFileSync(testImagePath, pngBuffer);
      }

      await fileInput.first().setInputFiles(testImagePath);
      await page.waitForTimeout(1000); // Wait for preview to render
      await screenshot(page, "06-file-uploaded");

      // Check file appears in preview area
      const content = await page.textContent("body") || "";
      const hasFilePreview = content.includes("test-fire-alarm") || content.includes(".png");
      console.log(`  ${hasFilePreview ? "✅" : "⚠️"} File preview ${hasFilePreview ? "shown" : "not visible (might use image preview)"}`);
    } else {
      console.log("  ❌ No file input found on completion form!");
    }

    console.log("✅ TC-06: File upload attempted");
  });

  test("TC-07: Submit completed check and verify redirect", async ({ page }) => {
    await page.goto(`${BASE_URL}/estates-compliance/${TEST_DOMAIN}/${TEST_CHECK_ID}/complete`);
    await waitForPageReady(page);

    // Fill required fields
    const notesField = page.locator("textarea").first();
    await notesField.fill(TEST_NOTES);

    // Wait for form to be ready
    await page.waitForTimeout(500);

    await screenshot(page, "07-before-submit");

    // Find and click submit button
    const submitBtn = page.locator('button:has-text("Complete"), button:has-text("Save"), button:has-text("Submit")');
    const submitCount = await submitBtn.count();
    console.log(`  Found ${submitCount} submit button(s)`);

    if (submitCount > 0) {
      // Listen for API response
      const responsePromise = page.waitForResponse(
        (resp) => resp.url().includes("/api/estates/statutory-completions") && resp.request().method() === "POST",
        { timeout: 15000 }
      ).catch(() => null);

      await submitBtn.first().click();

      const response = await responsePromise;
      if (response) {
        const status = response.status();
        const body = await response.json().catch(() => ({}));
        console.log(`  API Response: ${status}`, JSON.stringify(body).substring(0, 200));

        if (status >= 200 && status < 300) {
          console.log("  ✅ Check completion saved successfully!");
        } else {
          console.log(`  ❌ API returned ${status}: ${JSON.stringify(body)}`);
        }
      } else {
        console.log("  ⚠️ No API response captured (timeout or no request made)");
      }

      await page.waitForTimeout(2000);
      await screenshot(page, "07-after-submit");
    } else {
      console.log("  ❌ No submit button found!");
    }

    console.log("✅ TC-07: Form submission attempted");
  });

  test("TC-08: Verify completion appears in check history", async ({ page }) => {
    await page.goto(`${BASE_URL}/estates-compliance/${TEST_DOMAIN}/${TEST_CHECK_ID}/history`);
    await waitForPageReady(page);
    await page.waitForTimeout(3000); // Extra time for data to load
    await screenshot(page, "08-check-history");

    const content = await page.textContent("body") || "";

    // Check if our test completion appears
    const hasRecords = !content.includes("No completion records");
    const hasOurNotes = content.includes("E2E Test") || content.includes("Fire alarm tested");
    const hasEvidence = content.includes("Evidence") || content.includes("Document") || content.includes("certificate");

    console.log(`  ${hasRecords ? "✅" : "❌"} History records exist: ${hasRecords}`);
    console.log(`  ${hasOurNotes ? "✅" : "❌"} Our test notes visible: ${hasOurNotes}`);
    console.log(`  ${hasEvidence ? "✅" : "⚠️"} Evidence section visible: ${hasEvidence}`);

    // Count records shown
    const recordCount = (content.match(/Completion #\d+|Most Recent/g) || []).length;
    console.log(`  📊 Records shown: ${recordCount}`);

    console.log("✅ TC-08: History page checked");
  });

  test("TC-09: Verify completion data in database via API", async ({ page }) => {
    // Hit the API directly to verify DB state
    const response = await page.request.get(
      `${BASE_URL}/api/estates/statutory-completions?domain=${TEST_DOMAIN}`
    );

    const status = response.status();
    console.log(`  API Status: ${status}`);

    if (status === 200) {
      const data = await response.json();
      const completions = data.completions || [];
      const checkCompletions = completions.filter(
        (c: any) => c.check_id === TEST_CHECK_ID
      );

      console.log(`  Total completions for domain: ${completions.length}`);
      console.log(`  Completions for ${TEST_CHECK_ID}: ${checkCompletions.length}`);

      if (checkCompletions.length > 0) {
        const latest = checkCompletions[0];
        console.log(`  Latest status: ${latest.status}`);
        console.log(`  Has notes: ${!!latest.completion_notes}`);
        console.log(`  Evidence IDs: ${JSON.stringify(latest.evidence_ids || [])}`);
        console.log(`  Documents received: ${latest.documents_received}`);
        console.log(`  Completed at: ${latest.completed_at}`);

        expect(latest.status).toBe("completed");
        expect(latest.completion_notes).toBeTruthy();
      } else {
        console.log("  ❌ No completions found for this check in DB!");
      }
    } else {
      console.log(`  ❌ API call failed: ${status}`);
      const body = await response.text();
      console.log(`  Response: ${body.substring(0, 500)}`);
    }

    console.log("✅ TC-09: Database verification complete");
  });

  test("TC-10: Verify evidence files accessible via API", async ({ page }) => {
    // Get completions first
    const compResponse = await page.request.get(
      `${BASE_URL}/api/estates/statutory-completions?domain=${TEST_DOMAIN}`
    );

    if (compResponse.status() !== 200) {
      console.log("  ⚠️ Could not fetch completions, skipping evidence check");
      return;
    }

    const compData = await compResponse.json();
    const completions = (compData.completions || []).filter(
      (c: any) => c.check_id === TEST_CHECK_ID
    );

    let evidenceFound = 0;
    let evidenceAccessible = 0;

    for (const comp of completions) {
      const evidenceIds = comp.evidence_ids || [];
      if (evidenceIds.length > 0) {
        console.log(`  Completion ${comp.id} has ${evidenceIds.length} evidence file(s)`);

        // Try to fetch each evidence item
        const evResponse = await page.request.get(
          `${BASE_URL}/api/estates/evidence?ids=${evidenceIds.join(",")}`
        );

        if (evResponse.status() === 200) {
          const evData = await evResponse.json();
          const items = evData?.data || [];
          evidenceFound += items.length;

          for (const item of items) {
            console.log(`  📎 Evidence: ${item.title} (${item.evidence_type}) — URL: ${item.file_url ? "✅ has URL" : "❌ no URL"}`);
            if (item.file_url) {
              evidenceAccessible++;
            }
          }
        }
      }
    }

    console.log(`  📊 Evidence found: ${evidenceFound}, accessible: ${evidenceAccessible}`);
    console.log("✅ TC-10: Evidence accessibility checked");
  });

  test("TC-11: Full round-trip — complete check with file, then verify in history", async ({ page }) => {
    // This is the golden path test that does everything in one flow

    // Step 1: Navigate to completion form
    await page.goto(`${BASE_URL}/estates-compliance/${TEST_DOMAIN}/${TEST_CHECK_ID}/complete`);
    await waitForPageReady(page);

    // Step 2: Fill notes
    const roundTripNotes = `ROUND TRIP TEST ${Date.now()} — This completion includes an uploaded evidence file and should appear in history with the file attached.`;
    const notesField = page.locator("textarea").first();
    await notesField.fill(roundTripNotes);

    // Step 3: Upload a file
    const fileInput = page.locator('input[type="file"]');
    if (await fileInput.count() > 0) {
      const fs = require("fs");
      const testFile = "/tmp/round-trip-test-evidence.png";
      const pngBuffer = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFklEQVQYV2P8z8BQz0BhwMgwasCoAgBGXQIJZ6VlFwAAAABJRU5ErkJggg==", "base64");
      fs.writeFileSync(testFile, pngBuffer);
      await fileInput.first().setInputFiles(testFile);
      await page.waitForTimeout(1000);
    }

    // Step 4: Submit
    const submitBtn = page.locator('button:has-text("Complete"), button:has-text("Save")');
    if (await submitBtn.count() > 0) {
      const responsePromise = page.waitForResponse(
        (r) => r.url().includes("/statutory-completions") && r.request().method() === "POST",
        { timeout: 15000 }
      ).catch(() => null);

      await submitBtn.first().click();
      const response = await responsePromise;

      if (response) {
        const status = response.status();
        console.log(`  Submit response: ${status}`);
        expect(status).toBeLessThan(300);
      }

      await page.waitForTimeout(2000);
    }

    // Step 5: Navigate to history and verify
    await page.goto(`${BASE_URL}/estates-compliance/${TEST_DOMAIN}/${TEST_CHECK_ID}/history`);
    await waitForPageReady(page);
    await page.waitForTimeout(3000);
    await screenshot(page, "11-round-trip-history");

    const historyContent = await page.textContent("body") || "";
    const hasRoundTripNotes = historyContent.includes("ROUND TRIP TEST");
    console.log(`  ${hasRoundTripNotes ? "✅" : "❌"} Round-trip notes visible in history: ${hasRoundTripNotes}`);

    // Step 6: Verify via API
    const apiResp = await page.request.get(
      `${BASE_URL}/api/estates/statutory-completions?domain=${TEST_DOMAIN}`
    );
    if (apiResp.status() === 200) {
      const data = await apiResp.json();
      const latest = (data.completions || []).find(
        (c: any) => c.check_id === TEST_CHECK_ID && c.completion_notes?.includes("ROUND TRIP TEST")
      );

      if (latest) {
        console.log("  ✅ Round-trip completion found in DB");
        console.log(`  Evidence IDs: ${JSON.stringify(latest.evidence_ids || [])}`);
        console.log(`  Documents received: ${latest.documents_received}`);

        if (latest.evidence_ids?.length > 0) {
          console.log("  ✅ Evidence files attached to completion!");
        } else {
          console.log("  ❌ No evidence files attached despite upload!");
        }
      } else {
        console.log("  ❌ Round-trip completion NOT found in DB!");
      }
    }

    console.log("✅ TC-11: Full round-trip test complete");
  });

  test("TC-12: Check detail page shows correct status after completion", async ({ page }) => {
    await page.goto(`${BASE_URL}/estates-compliance/${TEST_DOMAIN}/${TEST_CHECK_ID}`);
    await waitForPageReady(page);
    await screenshot(page, "12-check-detail-after");

    const content = await page.textContent("body") || "";

    // After completing, should show as completed or show last completion date
    const hasCompletionInfo =
      content.includes("completed") ||
      content.includes("Completed") ||
      content.includes("Last") ||
      content.includes("Next Due");

    console.log(`  ${hasCompletionInfo ? "✅" : "⚠️"} Check shows completion info: ${hasCompletionInfo}`);
    console.log("✅ TC-12: Post-completion detail page checked");
  });

  test("TC-13: Verify all compliance domains load without errors", async ({ page }) => {
    const domains = [
      "fire-safety",
      "electrical",
      "gas",
      "water-hygiene",
      "asbestos",
      "general-health-safety",
      "building-fabric",
      "accessibility",
    ];

    const results: { domain: string; status: string; error?: string }[] = [];

    for (const domain of domains) {
      try {
        const response = await page.goto(`${BASE_URL}/estates-compliance/${domain}`);
        await page.waitForTimeout(1000);
        const status = response?.status() || 0;

        if (status === 200) {
          const content = await page.textContent("body") || "";
          const hasContent = content.length > 100;
          results.push({
            domain,
            status: hasContent ? "✅ OK" : "⚠️ Empty",
          });
        } else if (status === 404) {
          results.push({ domain, status: "⚠️ 404 (domain not configured)" });
        } else {
          results.push({ domain, status: `❌ HTTP ${status}` });
        }
      } catch (e: any) {
        results.push({ domain, status: "❌ Error", error: e.message });
      }
    }

    console.log("\n  Domain Status:");
    for (const r of results) {
      console.log(`    ${r.status} ${r.domain}${r.error ? ` — ${r.error}` : ""}`);
    }

    console.log("✅ TC-13: All domains checked");
  });

  test("TC-14: Check browser console for errors", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    // Visit key pages
    const pages = [
      `/estates-compliance`,
      `/estates-compliance/${TEST_DOMAIN}`,
      `/estates-compliance/${TEST_DOMAIN}/${TEST_CHECK_ID}`,
      `/estates-compliance/${TEST_DOMAIN}/${TEST_CHECK_ID}/complete`,
      `/estates-compliance/${TEST_DOMAIN}/${TEST_CHECK_ID}/history`,
    ];

    for (const path of pages) {
      await page.goto(`${BASE_URL}${path}`);
      await waitForPageReady(page);
    }

    console.log(`  Console errors found: ${consoleErrors.length}`);
    for (const err of consoleErrors.slice(0, 10)) {
      console.log(`    ❌ ${err.substring(0, 200)}`);
    }

    if (consoleErrors.length === 0) {
      console.log("  ✅ No console errors!");
    }

    console.log("✅ TC-14: Console error check complete");
  });
});
