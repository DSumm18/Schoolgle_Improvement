import { chromium } from "playwright";
import { readFileSync, mkdirSync } from "fs";
import { join } from "path";

const envPath = join(new URL(".", import.meta.url).pathname, "..", "Schoolgle_Improvement/apps/platform/.env.local");
const env = {};
try {
  const content = readFileSync("/Users/david/Schoolgle_Improvement/apps/platform/.env.local", "utf-8");
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

// Authenticate
const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
  method: "POST",
  headers: { "Content-Type": "application/json", apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
  body: JSON.stringify({ email: "ui-test@schoolgle.co.uk", password: "TestPassword123!" }),
});
const { access_token, refresh_token, expires_in, user } = await res.json();
const projectRef = SUPABASE_URL.match(/https:\/\/(\w+)\./)?.[1] || "";
const storageKey = `sb-${projectRef}-auth-token`;
const storageValue = JSON.stringify({ access_token, refresh_token, expires_in, token_type: "bearer", user });

const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
  storageState: { cookies: [], origins: [{ origin: BASE_URL, localStorage: [{ name: storageKey, value: storageValue }] }] },
});

const page = await context.newPage();
console.log("Authenticated, navigating...");

await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "load", timeout: 60000 });
await page.waitForTimeout(5000);

// Click "Ask Ed" button
const edButton = page.locator('button:has-text("Ask Ed")');
if (await edButton.isVisible()) {
  console.log("Found Ask Ed button, clicking...");
  await edButton.click();
  await page.waitForTimeout(8000); // Wait for greeting response
  await page.screenshot({ path: "/tmp/ui-screenshots/ed-chat-open.png", fullPage: false });
  console.log("Screenshot saved: /tmp/ui-screenshots/ed-chat-open.png");
} else {
  console.log("Ask Ed button NOT visible!");
  await page.screenshot({ path: "/tmp/ui-screenshots/ed-no-button.png" });
}

await browser.close();
