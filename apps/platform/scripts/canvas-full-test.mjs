#!/usr/bin/env node
/**
 * Canvas FULL E2E test — click every source, check for errors, screenshot everything
 */
import { chromium } from "playwright";
import { readFileSync } from "fs";
import { join } from "path";

const envPath = join(
  new URL(".", import.meta.url).pathname,
  "..",
  ".env.local",
);
const env = {};
try {
  for (const line of readFileSync(envPath, "utf-8").split("\n")) {
    const idx = line.indexOf("=");
    if (idx > 0 && !line.startsWith("#"))
      env[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
} catch {}

const BASE = "http://localhost:3002";
const res = await fetch(
  `${env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=password`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      email: "ui-test@schoolgle.co.uk",
      password: "UIReview2026x",
    }),
  },
);
const session = await res.json();
if (!session.access_token) {
  console.error("Auth failed");
  process.exit(1);
}

const ref = env.NEXT_PUBLIC_SUPABASE_URL.match(/https:\/\/(\w+)\./)?.[1] || "";
const storageKey = `sb-${ref}-auth-token`;
const storageVal = JSON.stringify({
  access_token: session.access_token,
  refresh_token: session.refresh_token,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  expires_in: 3600,
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
      { origin: BASE, localStorage: [{ name: storageKey, value: storageVal }] },
    ],
  },
});
const page = await ctx.newPage();

// Track errors
const errors = [];
page.on("console", (msg) => {
  if (msg.type() === "error" && !msg.text().includes("preloaded")) {
    errors.push(msg.text());
  }
});
page.on("response", (res) => {
  if (res.status() >= 400 && res.url().includes("/api/canvas")) {
    errors.push(`API ${res.status()}: ${res.url()}`);
  }
});

console.log("═══ CANVAS FULL E2E TEST ═══\n");

// 1. Load home page
await page.goto(`${BASE}/dashboard/canvas`, { waitUntil: "networkidle" });
await page.waitForTimeout(3000);
await page.screenshot({ path: "/tmp/ui-screenshots/test-01-home.png" });

// Check home loaded
const sourceCards = await page.locator("text=Explore data").count();
const emptyCards = await page.locator("text=Import data").count();
const driveCards = await page.locator("text=Pick file").count();
const dfeCards = await page.locator("text=Explore national").count();
console.log(
  `HOME: ${sourceCards} active sources, ${emptyCards} empty, ${driveCards} Drive folders, ${dfeCards} DfE datasets`,
);

// 2. Click Staff Directory (36 records)
console.log("\n--- Staff Directory ---");
errors.length = 0;
await page.getByText("Staff Directory").click();
await page.waitForTimeout(4000);
await page.screenshot({ path: "/tmp/ui-screenshots/test-02-staff.png" });
const staffTitle = await page.locator("h1").first().textContent();
console.log(`Title: ${staffTitle}`);
const staffErrors = [...errors];
if (staffErrors.length > 0) console.log(`ERRORS: ${staffErrors.join(", ")}`);
else console.log("OK — no errors");

// Check for chart or empty state
const hasChart = await page.locator(".recharts-wrapper").count();
const hasEmpty = await page.locator("text=No staff records").count();
const hasInfo = await page.locator("text=No data").count();
console.log(
  `Chart: ${hasChart > 0 ? "YES" : "NO"}, Empty state: ${hasEmpty > 0 || hasInfo > 0 ? "YES" : "NO"}`,
);

// Check filters rendered
const filterDropdowns = await page.locator("select").count();
console.log(`Filter dropdowns: ${filterDropdowns}`);

// 3. Go back and click Finance
console.log("\n--- Finance Transactions ---");
errors.length = 0;
await page
  .locator("text=←")
  .first()
  .click()
  .catch(() =>
    page
      .getByRole("button")
      .filter({ has: page.locator("svg") })
      .first()
      .click(),
  );
await page.waitForTimeout(1000);
// Try the back button
const backBtn = page.locator("button").filter({ hasText: "" }).first();
try {
  await page.goBack();
} catch {}
await page.goto(`${BASE}/dashboard/canvas`, { waitUntil: "networkidle" });
await page.waitForTimeout(2000);
await page.getByText("Finance Transactions").click();
await page.waitForTimeout(4000);
await page.screenshot({ path: "/tmp/ui-screenshots/test-03-finance.png" });
const finTitle = await page.locator("h1").first().textContent();
console.log(`Title: ${finTitle}`);
const finChart = await page.locator(".recharts-wrapper").count();
const finEmpty =
  (await page.locator("text=No finance data").count()) +
  (await page.locator("text=No data").count());
console.log(
  `Chart: ${finChart > 0 ? "YES" : "NO"}, Empty: ${finEmpty > 0 ? "YES" : "NO"}`,
);
if (errors.length > 0) console.log(`ERRORS: ${errors.join(", ")}`);
else console.log("OK — no errors");

// 4. Risk Register
console.log("\n--- Risk Register ---");
errors.length = 0;
await page.goto(`${BASE}/dashboard/canvas`, { waitUntil: "networkidle" });
await page.waitForTimeout(2000);
await page.getByText("Risk Register").first().click();
await page.waitForTimeout(4000);
await page.screenshot({ path: "/tmp/ui-screenshots/test-04-risk.png" });
const riskTitle = await page.locator("h1").first().textContent();
console.log(`Title: ${riskTitle}`);
if (errors.length > 0) console.log(`ERRORS: ${errors.join(", ")}`);
else console.log("OK — no errors");

// 5. Estates
console.log("\n--- Estates ---");
errors.length = 0;
await page.goto(`${BASE}/dashboard/canvas`, { waitUntil: "networkidle" });
await page.waitForTimeout(2000);
await page.getByText("Estates & Premises").click();
await page.waitForTimeout(4000);
await page.screenshot({ path: "/tmp/ui-screenshots/test-05-estates.png" });
if (errors.length > 0) console.log(`ERRORS: ${errors.join(", ")}`);
else console.log("OK — no errors");

// 6. DfE Attendance
console.log("\n--- DfE Attendance ---");
errors.length = 0;
await page.goto(`${BASE}/dashboard/canvas`, { waitUntil: "networkidle" });
await page.waitForTimeout(2000);
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(500);
await page.getByText("DfE Attendance Statistics").click();
await page.waitForTimeout(4000);
await page.screenshot({
  path: "/tmp/ui-screenshots/test-06-dfe-attendance.png",
});
if (errors.length > 0) console.log(`ERRORS: ${errors.join(", ")}`);
else console.log("OK — no errors");

// Summary
console.log("\n═══ TEST COMPLETE ═══");
await browser.close();
