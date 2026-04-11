/**
 * Vision Analysis — REAL integration test (no mocks)
 *
 * Hits the live Gemini 2.5 Flash API. Skips automatically if no API key.
 * Run with: npx vitest run src/lib/vision/__tests__/integration-real.test.ts
 *
 * Requires a test image at /tmp/test-vision-image.jpg.
 */

import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync, existsSync, writeFileSync } from "fs";
import { resolve } from "path";
import { config as loadEnv } from "dotenv";

loadEnv({ path: resolve(__dirname, "../../../../.env.local") });

import { analyseImage, type VisionAnalysisResult } from "../analyse";

const TEST_IMAGE_PATH = "/tmp/test-vision-image.jpg";
const FLOOR_PLAN_PATH = resolve(
  __dirname,
  "../../../../public/site-plans/grove-house-ground-floor.png",
);
const RESULTS_PATH = "/tmp/vision-integration-results.json";

const hasKey = !!(process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY);
const describeIfKey = hasKey ? describe : describe.skip;

function assertValidResult(result: VisionAnalysisResult) {
  expect(result.items.length).toBeGreaterThan(0);
  // Note: Gemini occasionally reports a total_items value that doesn't match
  // items.length. The library passes this through unchanged (see analyse.ts
  // line 158). We only assert total_items is at least items.length.
  expect(result.total_items).toBeGreaterThanOrEqual(result.items.length);
  if (result.total_items !== result.items.length) {
    console.warn(
      `[vision] total_items (${result.total_items}) !== items.length (${result.items.length}) — Gemini miscount`,
    );
  }
  for (const item of result.items) {
    expect(item.name).toBeTruthy();
    expect(item.name.trim().length).toBeGreaterThan(0);
    expect(item.category).toBeTruthy();
    expect(typeof item.quantity).toBe("number");
    expect(item.confidence).toBeGreaterThanOrEqual(0);
    expect(item.confidence).toBeLessThanOrEqual(1);
  }
}

describeIfKey("analyseImage — REAL Gemini API", () => {
  let imageBase64: string;
  const allResults: Record<string, VisionAnalysisResult> = {};

  beforeAll(() => {
    if (!existsSync(TEST_IMAGE_PATH)) {
      throw new Error(
        `Test image missing at ${TEST_IMAGE_PATH}. Run: curl -sL -o /tmp/test-vision-image.jpg "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=800&q=80"`,
      );
    }
    imageBase64 = readFileSync(TEST_IMAGE_PATH).toString("base64");
  });

  it("analyses shelf image with Chemical Store context", async () => {
    const result = await analyseImage(imageBase64, "Chemical Store");
    allResults["Chemical Store"] = result;
    console.log(
      "\n[Chemical Store] summary:",
      result.summary,
      "\n  items:",
      result.items.length,
      "flags:",
      result.compliance_flags,
    );
    console.log(JSON.stringify(result, null, 2));
    assertValidResult(result);
  }, { timeout: 60_000, retry: 2 });

  it("analyses shelf image with General context", async () => {
    const result = await analyseImage(imageBase64, "General");
    allResults["General"] = result;
    console.log("\n[General] items:", result.items.length);
    assertValidResult(result);
  }, { timeout: 60_000, retry: 2 });

  it("analyses shelf image with Plant Room context", async () => {
    const result = await analyseImage(imageBase64, "Plant Room");
    allResults["Plant Room"] = result;
    console.log("\n[Plant Room] items:", result.items.length);
    assertValidResult(result);
  }, { timeout: 60_000, retry: 2 });

  it("analyses Grove House ground floor plan", async () => {
    expect(existsSync(FLOOR_PLAN_PATH)).toBe(true);
    const floorBase64 = readFileSync(FLOOR_PLAN_PATH).toString("base64");
    const result = await analyseImage(floorBase64, "General");
    allResults["Grove House Floor Plan"] = result;
    console.log(
      "\n[Grove House Floor Plan] summary:",
      result.summary,
      "\n  items:",
      result.items.length,
    );
    console.log(JSON.stringify(result, null, 2));
    expect(result.items.length).toBeGreaterThan(0);
    for (const item of result.items) {
      expect(item.name.trim().length).toBeGreaterThan(0);
    }
    writeFileSync(RESULTS_PATH, JSON.stringify(allResults, null, 2));
    console.log(`\nAll results written to ${RESULTS_PATH}`);
  }, { timeout: 180_000, retry: 2 });
});

if (!hasKey) {
  // eslint-disable-next-line no-console
  console.warn(
    "[vision integration] GOOGLE_AI_API_KEY/GEMINI_API_KEY not set — skipping real API tests.",
  );
}
