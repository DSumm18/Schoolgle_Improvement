#!/usr/bin/env node
/**
 * Test Ed sidebar chat — reuses exact auth from screenshot.mjs
 */
import { chromium } from "playwright";
import { readFileSync, mkdirSync } from "fs";
import { join } from "path";

const OUTPUT_DIR = "/tmp/ui-screenshots";
mkdirSync(OUTPUT_DIR, { recursive: true });

// Load env
const envPath = join(
  new URL(".", import.meta.url).pathname,
  "..",
  ".env.local",
);
const env = {};
try {
  const content = readFileSync(envPath, "utf-8");
  for (const rawLine of content.split("\n")) {
    const line = rawLine.replace(/\r$/, "").trim();
    if (!line || line.startsWith("#")) continue;
    const idx = line.indexOf("=");
    if (idx > 0) env[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
} catch {}

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const BASE_URL = "http://localhost:3002";

const browser = await chromium.launch({ headless: true });

// Auth — exact same as screenshot.mjs
const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
  method: "POST",
  headers: { apikey: ANON_KEY, "Content-Type": "application/json" },
  body: JSON.stringify({
    email: "ui-test@schoolgle.co.uk",
    password: "UIReview2026x",
  }),
});
const session = await res.json();
if (!session.access_token) {
  console.error("Auth failed:", session);
  process.exit(1);
}

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

// Build Supabase auth cookies (Next.js SSR reads these, not localStorage)
const cookieBase = `sb-${projectRef}-auth-token`;
const cookieChunks = [];
const chunkSize = 3500; // Supabase chunks large cookies
for (let i = 0; i < storageValue.length; i += chunkSize) {
  cookieChunks.push(storageValue.slice(i, i + chunkSize));
}
const authCookies = cookieChunks.map((chunk, i) => ({
  name: cookieChunks.length === 1 ? cookieBase : `${cookieBase}.${i}`,
  value: chunk,
  domain: "localhost",
  path: "/",
  httpOnly: false,
  secure: false,
  sameSite: "Lax",
}));

const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
  storageState: {
    cookies: authCookies,
    origins: [
      {
        origin: BASE_URL,
        localStorage: [{ name: storageKey, value: storageValue }],
      },
    ],
  },
});

console.log("Authenticated as " + session.user.email);
const page = await context.newPage();

// Navigate to dashboard
console.log("Navigating to dashboard...");
await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "load", timeout: 60000 });
await page.waitForTimeout(8000);

// Screenshot 1: Dashboard
await page.screenshot({ path: join(OUTPUT_DIR, "ed-1-dashboard.png") });
console.log("Screenshot 1 saved");

// Find and click Ask Ed (floating button with title="Ask Ed")
const edButton = page.locator('button[title="Ask Ed"]');
const visible = await edButton.isVisible().catch(() => false);
console.log("Ask Ed visible:", visible);

if (!visible) {
  // Maybe on login page - check
  const url = page.url();
  console.log("Current URL:", url);
  const buttons = await page.locator("button").allTextContents();
  console.log(
    "Buttons found:",
    buttons
      .filter((t) => t.trim())
      .slice(0, 10)
      .join(" | "),
  );
}

if (visible) {
  await edButton.click();
  console.log("Clicked! Waiting for chat greeting...");
  await page.waitForTimeout(12000);
  await page.screenshot({ path: join(OUTPUT_DIR, "ed-2-chat-open.png") });
  console.log("Screenshot 2: Chat panel saved");

  // Type a question
  const textarea = page.locator('textarea[placeholder="Ask Ed anything..."]');
  if (await textarea.isVisible().catch(() => false)) {
    await textarea.fill("What can you help me with?");
    const sendBtn = page.locator('button[title="Send"]');
    if (await sendBtn.isVisible().catch(() => false)) {
      await sendBtn.click();
      console.log("Sent question, waiting for AI response...");
      await page.waitForTimeout(20000);
      await page.screenshot({ path: join(OUTPUT_DIR, "ed-3-response.png") });
      console.log("Screenshot 3: Response saved");
    }
  }
}

await browser.close();
console.log("Done!");
