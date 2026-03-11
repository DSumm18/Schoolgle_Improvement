import { chromium } from "playwright";
import { readFileSync } from "fs";
import { join } from "path";

const envPath = join(process.cwd(), ".env.local");
const env = {};
const content = readFileSync(envPath, "utf-8");
for (const rawLine of content.split("\n")) {
  const line = rawLine.replace(/\r$/, "").trim();
  const idx = line.indexOf("=");
  if (idx > 0 && !line.startsWith("#")) {
    env[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
}

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
  method: "POST",
  headers: { apikey: ANON_KEY, "Content-Type": "application/json" },
  body: JSON.stringify({ email: "ui-test@schoolgle.co.uk", password: "UIReview2026x" }),
});
const session = await res.json();

const projectRef = SUPABASE_URL.match(/https:\/\/(\w+)\./)?.[1] || "";
const storageKey = `sb-${projectRef}-auth-token`;

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  storageState: {
    cookies: [],
    origins: [{ origin: "http://localhost:3002", localStorage: [{ name: storageKey, value: JSON.stringify({
      access_token: session.access_token, refresh_token: session.refresh_token,
      expires_at: Math.floor(Date.now()/1000) + session.expires_in,
      expires_in: session.expires_in, token_type: "bearer", user: session.user,
    })}]}],
  },
});

const page = await context.newPage();

// Log all 404s with full URL
page.on("response", resp => {
  if (resp.status() === 404) console.log("404:", resp.url());
});
page.on("console", msg => { if (msg.type() === "error" && !msg.text().includes("404")) console.log("ERR:", msg.text().slice(0, 300)); });

await page.goto("http://localhost:3002/dashboard", { waitUntil: "domcontentloaded", timeout: 30000 });
await page.waitForTimeout(8000);

console.log("Final URL:", page.url());
const html = await page.evaluate(() => document.documentElement.outerHTML.slice(0, 2000));
console.log("HTML:", html.slice(0, 1000));

await page.screenshot({ path: "/tmp/ui-screenshots/debug2.png", fullPage: true });
await browser.close();
