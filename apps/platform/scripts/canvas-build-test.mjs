#!/usr/bin/env node
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
  console.error("Auth failed:", session);
  process.exit(1);
}
console.log("Authenticated.\n");

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

await page.goto(`${BASE}/dashboard/canvas`, { waitUntil: "networkidle" });
await page.waitForTimeout(2000);

console.log("1. Build tab — default (Attendance bar chart)");
await page.getByRole("button", { name: "Build", exact: true }).click();
await page.waitForTimeout(2000);
await page.screenshot({
  path: "/tmp/ui-screenshots/build-01-attendance-bar.png",
});

console.log("2. Switch to SEND Register");
await page.getByText("SEND Register by Year Group").click();
await page.waitForTimeout(1000);
await page.screenshot({ path: "/tmp/ui-screenshots/build-02-send-bar.png" });

console.log("3. Switch to Line Chart");
await page.locator("button", { hasText: "Line Chart" }).click();
await page.waitForTimeout(1000);
await page.screenshot({ path: "/tmp/ui-screenshots/build-03-send-line.png" });

console.log("4. Energy + Area");
await page.getByText("Energy Consumption (Monthly)").click();
await page.waitForTimeout(500);
await page.locator("button", { hasText: "Area Chart" }).click();
await page.waitForTimeout(1000);
await page.screenshot({ path: "/tmp/ui-screenshots/build-04-energy-area.png" });

console.log("5. Staff Composition + Pie");
await page.getByText("Staff Composition").click();
await page.waitForTimeout(500);
await page.locator("button", { hasText: "Pie Chart" }).click();
await page.waitForTimeout(1000);
await page.screenshot({ path: "/tmp/ui-screenshots/build-05-staff-pie.png" });

console.log("6. Budget + Bar → Save");
await page.getByText("Budget vs Actual").first().click();
await page.waitForTimeout(500);
await page.locator("button", { hasText: "Bar Chart" }).click();
await page.waitForTimeout(1000);
await page.locator("button", { hasText: "Save" }).first().click();
await page.waitForTimeout(2000);
await page.screenshot({
  path: "/tmp/ui-screenshots/build-06-budget-saved.png",
});

console.log("7. My Canvases tab");
await page.getByRole("button", { name: "My Canvases" }).click();
await page.waitForTimeout(2000);
await page.screenshot({ path: "/tmp/ui-screenshots/build-07-my-canvases.png" });

console.log("8. Data table toggle");
await page.getByRole("button", { name: "Build", exact: true }).click();
await page.waitForTimeout(1000);
// Click the table icon button (accessibility toggle)
const tableBtn = page.locator('button[title="Data table view"]');
if (await tableBtn.isVisible()) {
  await tableBtn.click();
  await page.waitForTimeout(1000);
  await page.screenshot({
    path: "/tmp/ui-screenshots/build-08-data-table.png",
  });
  console.log("   Data table toggle works!");
}

console.log("\nAll done!");
await browser.close();
