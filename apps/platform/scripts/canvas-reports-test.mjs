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
await page.waitForTimeout(3000);
await page.screenshot({ path: "/tmp/ui-screenshots/reports-01-home.png" });
console.log("1. Home with report selector");

// Click Staff Overview
console.log("2. Loading Staff report...");
await page.getByText("Staff Overview").first().click();
await page.waitForTimeout(5000);
await page.screenshot({ path: "/tmp/ui-screenshots/reports-02-staff.png" });

// Click Attendance
console.log("3. Loading Attendance report...");
const attBtn = page.locator("button", { hasText: "Attendance" }).first();
await attBtn.click();
await page.waitForTimeout(5000);
await page.screenshot({
  path: "/tmp/ui-screenshots/reports-03-attendance.png",
});

console.log("Done!");
await browser.close();
