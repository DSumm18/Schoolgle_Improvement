import { chromium } from "playwright";
import { mkdirSync, readFileSync } from "fs";
import { join } from "path";

const OUTPUT_DIR = "/tmp/ui-screenshots/builder";
mkdirSync(OUTPUT_DIR, { recursive: true });
const env = {};
const content = readFileSync("/Users/david/Schoolgle_Improvement/apps/platform/.env.local", "utf-8");
for (const rawLine of content.split("\n")) {
  const line = rawLine.replace(/\r$/, "").trim();
  const idx = line.indexOf("=");
  if (idx > 0 && !line.startsWith("#")) env[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
}
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const BASE_URL = "http://localhost:3001";

const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
  method: "POST",
  headers: { apikey: ANON_KEY, "Content-Type": "application/json" },
  body: JSON.stringify({ email: "ui-test@schoolgle.co.uk", password: "UIReview2026x" }),
});
const session = await res.json();
const projectRef = SUPABASE_URL.match(/https:\/\/(\w+)\./)?.[1] || "";

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2,
  storageState: { cookies: [], origins: [{ origin: BASE_URL, localStorage: [{ name: `sb-${projectRef}-auth-token`, value: JSON.stringify({
    access_token: session.access_token, refresh_token: session.refresh_token,
    expires_at: Math.floor(Date.now() / 1000) + session.expires_in, expires_in: session.expires_in,
    token_type: "bearer", user: session.user })}]}] },
});
const page = await context.newPage();

async function shot(name) {
  await page.screenshot({ path: join(OUTPUT_DIR, `${name}.png`), fullPage: true });
  console.log(`  → ${name}.png`);
}

await page.goto(`${BASE_URL}/dashboard/canvas`, { waitUntil: "load", timeout: 60000 });
await page.waitForTimeout(5000);

// 1. Staff bar chart
console.log("1. Staff Directory");
await page.locator("button", { hasText: "Staff Directory" }).first().click();
await page.waitForTimeout(8000);
await shot("01-staff-bar");

// 2. Staff pie chart
await page.locator("button", { hasText: "Pie" }).first().click();
await page.waitForTimeout(2000);
await shot("02-staff-pie");

// 3. Switch to Finance via double-click in sidebar
console.log("2. Finance");
const finSidebar = page.locator("button").filter({ hasText: /Finance/ }).first();
await finSidebar.dblclick();
await page.waitForTimeout(8000);
await shot("03-finance-bar");

// 4. Finance pie (should cap at 8 + Other)
await page.locator("button", { hasText: "Pie" }).first().click();
await page.waitForTimeout(2000);
await shot("04-finance-pie-capped");

// 5. Switch to Risk Register
console.log("3. Risk Register");
const riskSidebar = page.locator("button").filter({ hasText: /Risk Register/ }).first();
await riskSidebar.dblclick();
await page.waitForTimeout(8000);
await shot("05-risk-bar");

// 6. Switch to Estates
console.log("4. Estates");
const estatesSidebar = page.locator("button").filter({ hasText: /Estates/ }).first();
await estatesSidebar.dblclick();
await page.waitForTimeout(8000);
await shot("06-estates-bar");

// 7. Finance by Date (monthly trend)
console.log("5. Finance by Date");
const finSidebar2 = page.locator("button").filter({ hasText: /Finance/ }).first();
await finSidebar2.click();
await page.waitForTimeout(1000);
// Click Date dimension
const dateField = page.locator("button", { hasText: "Date" }).first();
if (await dateField.count() > 0) {
  await dateField.click();
  await page.waitForTimeout(1000);
}
// Remove Category dimension if present (click the X on it)
const catPill = page.locator("text=Category (CFR)").locator("xpath=..").locator("button").last();
// Switch to line
await page.locator("button", { hasText: "Line" }).first().click();
await page.waitForTimeout(6000);
await shot("07-finance-monthly-line");

await browser.close();
console.log("\nDone — screenshots in /tmp/ui-screenshots/builder/");
