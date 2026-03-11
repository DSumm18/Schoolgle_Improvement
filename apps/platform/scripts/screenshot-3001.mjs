#!/usr/bin/env node
/**
 * UI Screenshot Tool — fully autonomous, no manual login needed.
 *
 * Usage:
 *   node scripts/screenshot.mjs <url-path> [output-name]
 *   node scripts/screenshot.mjs --batch /path1 /path2 /path3
 *
 * Example:
 *   node scripts/screenshot.mjs /dashboard/hr/meetings meetings-list
 */

import { chromium } from "playwright";
import { mkdirSync, readFileSync } from "fs";
import { join } from "path";

const OUTPUT_DIR = "/tmp/ui-screenshots";
mkdirSync(OUTPUT_DIR, { recursive: true });

// Load env from .env.local relative to this script
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
    const idx = line.indexOf("=");
    if (idx > 0 && !line.startsWith("#")) {
      env[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
    }
  }
} catch (e) {
  console.error("Failed to read .env.local:", e.message);
}

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !ANON_KEY) {
  console.error(
    "Missing SUPABASE_URL or ANON_KEY. Env keys found:",
    Object.keys(env).join(", "),
  );
  process.exit(1);
}
const BASE_URL = "http://localhost:3001";

const TEST_EMAIL = "ui-test@schoolgle.co.uk";
const TEST_PASSWORD = "UIReview2026x";

async function getSession() {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      apikey: ANON_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
  });
  const data = await res.json();
  if (!data.access_token)
    throw new Error("Auth failed: " + JSON.stringify(data));
  return data;
}

async function createAuthContext(browser) {
  const session = await getSession();

  // Build the localStorage key Supabase uses
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

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    storageState: {
      cookies: [],
      origins: [
        {
          origin: BASE_URL,
          localStorage: [{ name: storageKey, value: storageValue }],
        },
      ],
    },
  });

  console.log("Authenticated as " + session.user.email);
  return context;
}

async function capturePage(page, urlPath, outputName) {
  const outputFile = join(OUTPUT_DIR, `${outputName}.png`);
  const fullUrl = `${BASE_URL}${urlPath}`;
  console.log(`  ${fullUrl}`);
  await page.goto(fullUrl, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: outputFile, fullPage: true });
  console.log(`  → ${outputFile}`);
  return outputFile;
}

// ─── Main ────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);

if (args[0] === "--batch") {
  const paths = args.slice(1);
  if (paths.length === 0) {
    console.log("Usage: --batch /path1 /path2 /path3");
    process.exit(1);
  }
  const browser = await chromium.launch({ headless: true });
  const context = await createAuthContext(browser);
  const page = await context.newPage();

  for (const urlPath of paths) {
    const name = urlPath
      .replace(/\//g, "-")
      .replace(/^-/, "")
      .replace(/-$/, "");
    await capturePage(page, urlPath, name);
  }
  await browser.close();
  console.log(`\nDone. ${paths.length} screenshots in ${OUTPUT_DIR}/`);
} else {
  const urlPath = args[0] || "/";
  const outputName =
    args[1] ||
    urlPath.replace(/\//g, "-").replace(/^-/, "").replace(/-$/, "") ||
    "home";

  const browser = await chromium.launch({ headless: true });
  const context = await createAuthContext(browser);
  const page = await context.newPage();
  await capturePage(page, urlPath, outputName);
  await browser.close();
}
