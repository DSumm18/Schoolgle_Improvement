/**
 * Test Ed Browser Extension autonomously using Playwright
 * Run: npx playwright test test-extension.spec.js
 */

const { test } = require("@playwright/test");
const path = require("path");

const EXTENSION_PATH = path.join(__dirname, "dist");

test("Ed extension - read page", async ({ page }) => {
  // Note: Playwright can't fully test extensions in the same way Chrome does
  // But we can test the content script logic directly

  await page.goto("https://example.com");

  // Inject and test content script directly
  const contentScript = await require("fs").promises.readFile(
    path.join(__dirname, "dist", "content.js"),
    "utf8"
  );

  await page.evaluate(contentScript);

  const result = await page.evaluate(() => {
    return window.edReadPage ? window.edReadPage() : null;
  });

  console.log("Read page result:", result);
});

test("content script - click and type", async ({ page }) => {
  await page.setContent(`
    <input id="test-input" type="text" />
    <button id="test-btn">Click Me</button>
  `);

  // Inject content script
  const contentScript = await require("fs").promises.readFile(
    path.join(__dirname, "dist", "content.js"),
    "utf8"
  );
  await page.evaluate(contentScript);

  // Test type
  const typeResult = await page.evaluate(async () => {
    if (window.edTypeInField) {
      return await window.edTypeInField("#test-input", "Hello Ed");
    }
    return { error: "Function not found" };
  });
  console.log("Type result:", typeResult);

  const inputValue = await page.$eval("#test-input", (el) => el.value);
  console.log("Input value after type:", inputValue);

  // Test click
  const clickResult = await page.evaluate(async () => {
    if (window.edClickElement) {
      return await window.edClickElement("#test-btn");
    }
    return { error: "Function not found" };
  });
  console.log("Click result:", clickResult);
});
