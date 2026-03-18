#!/usr/bin/env node
/**
 * Canvas Demo — Automated walkthrough of Smart Ingest
 */

import { chromium } from "playwright";
import { mkdirSync, readFileSync } from "fs";
import { join } from "path";

const OUTPUT_DIR = "/tmp/ui-screenshots";
mkdirSync(OUTPUT_DIR, { recursive: true });

const envPath = join(
  new URL(".", import.meta.url).pathname,
  "..",
  ".env.local",
);
const env = {};
try {
  for (const rawLine of readFileSync(envPath, "utf-8").split("\n")) {
    const line = rawLine.replace(/\r$/, "").trim();
    const idx = line.indexOf("=");
    if (idx > 0 && !line.startsWith("#")) {
      env[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
    }
  }
} catch {}

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const BASE = "http://localhost:3002";

async function run() {
  // Auth
  console.log("Authenticating...");
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: ANON_KEY },
    body: JSON.stringify({
      email: "ui-test@schoolgle.co.uk",
      password: "UIReview2026x",
    }),
  });
  const session = await res.json();
  if (!session.access_token) {
    console.error("Auth failed:", session);
    return;
  }
  console.log("Authenticated.");

  const projectRef = SUPABASE_URL.match(/https:\/\/(\w+)\./)?.[1] || "";
  const storageKey = `sb-${projectRef}-auth-token`;
  const storageValue = JSON.stringify({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: Math.floor(Date.now() / 1000) + session.expires_in,
    expires_in: session.expires_in,
    token_type: "bearer",
    user: session.user,
  });

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    storageState: {
      cookies: [],
      origins: [
        {
          origin: BASE,
          localStorage: [{ name: storageKey, value: storageValue }],
        },
      ],
    },
  });
  const page = await ctx.newPage();

  // 1. Canvas Home
  console.log("1. Canvas Home...");
  await page.goto(`${BASE}/dashboard/canvas`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${OUTPUT_DIR}/canvas-01-home.png` });
  console.log("  -> canvas-01-home.png");

  // 2. Smart Ingest tab
  console.log("2. Smart Ingest tab...");
  await page.getByText("Smart Ingest").click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${OUTPUT_DIR}/canvas-02-ingest.png` });
  console.log("  -> canvas-02-ingest.png");

  // 3. Upload CSV
  console.log("3. Uploading arbor_staff_export.csv...");
  await page
    .locator('input[type="file"]')
    .setInputFiles("/Users/david/Desktop/arbor_staff_export.csv");
  console.log("  Waiting for analysis...");
  await page.waitForTimeout(8000);
  await page.screenshot({ path: `${OUTPUT_DIR}/canvas-03-results.png` });
  console.log("  -> canvas-03-results.png");

  // 4. Scroll to field mappings
  await page.evaluate(() => window.scrollTo(0, 400));
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUTPUT_DIR}/canvas-04-mappings.png` });
  console.log("  -> canvas-04-mappings.png");

  // 5. Scroll to confirm bar
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUTPUT_DIR}/canvas-05-confirm.png` });
  console.log("  -> canvas-05-confirm.png");

  // 6. Data Reconciliation tab
  console.log("6. Data Reconciliation tab...");
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.getByText("Data Reconciliation").click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${OUTPUT_DIR}/canvas-06-recon.png` });
  console.log("  -> canvas-06-recon.png");

  console.log("\nDone!");
  await browser.close();
}

run().catch(console.error);
