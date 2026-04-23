#!/usr/bin/env node
// Trust Assessor Multi-Tenant Lockdown — UI regression via Playwright.
// For each of (PAYMAT trust, Grove House, Rawdon) contexts, set David's
// user_metadata.organization_id to that org, sign in fresh, navigate to the
// Trust Assessor, scrape visible tabs, screenshot.

import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

const envText = readFileSync('/Users/jarvis/dev/Schoolgle_Improvement/apps/platform/.env.local', 'utf-8');
const env = Object.fromEntries(
  envText.split('\n')
    .filter(l => /^[A-Z_]+=/.test(l))
    .map(l => {
      const eq = l.indexOf('=');
      return [l.slice(0, eq).trim(), l.slice(eq + 1).trim().replace(/^["']|["']$/g, '')];
    })
);

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const APP = 'http://localhost:3000';

const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

const DAVID_EMAIL = 'dsummerscales46@gmail.com';
const DAVID_ID = 'd1640650-ed16-4fef-913e-244f984e093b';

const CONTEXTS = [
  { label: 'paymat-trust', orgId: '4a82a4ed-dbf0-453a-8066-963382471cd2', expectedTabs: ['Overview'] },
  { label: 'grove-house', orgId: 'd9d1ac2c-5eff-4043-98f4-e1c43f616fd3', expectedNotTabs: ['Overview'] },
  { label: 'rawdon', orgId: '7c5f74f5-0f8b-41b9-9e3a-6c3d7e8f9a0b', expectedNotTabs: ['Overview'] },
];

async function authenticateAs(context, orgId) {
  // Set David's active org via user_metadata
  const { error: updErr } = await admin.auth.admin.updateUserById(DAVID_ID, {
    user_metadata: { organization_id: orgId },
  });
  if (updErr) throw new Error('updateUserById: ' + updErr.message);

  // Generate a magic link, verify it with the anon client to get a session
  const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: DAVID_EMAIL,
  });
  if (linkErr) throw new Error('generateLink: ' + linkErr.message);

  const anon = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });
  const { data: verified, error: vErr } = await anon.auth.verifyOtp({
    type: 'magiclink',
    token_hash: linkData.properties.hashed_token,
  });
  if (vErr) throw new Error('verifyOtp: ' + vErr.message);

  const session = verified.session;
  if (!session) throw new Error('no session');

  // Inject session into browser storage using the supabase-js storage key format
  // Key format: sb-<project-ref>-auth-token
  const ref = new URL(SUPABASE_URL).hostname.split('.')[0];
  const storageKey = `sb-${ref}-auth-token`;

  await context.addInitScript(([k, v]) => {
    window.localStorage.setItem(k, v);
  }, [storageKey, JSON.stringify(session)]);
}

async function main() {
  const results = [];
  const browser = await chromium.launch({ headless: true });

  for (const ctx of CONTEXTS) {
    console.log(`\n━━━ ${ctx.label} (${ctx.orgId}) ━━━`);
    const browserContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await authenticateAs(browserContext, ctx.orgId);

    const page = await browserContext.newPage();
    // Navigate directly to Trust Assessor. Wait for dev compile + hydration.
    await page.goto(`${APP}/dashboard/school-improvement/trust-assessor`, { waitUntil: 'domcontentloaded' });

    // Wait for the 'Compiling' indicator to disappear and real content to render.
    // Dev server cold-compile of this 6800-line page can take 60-90s on first hit.
    try {
      await page.waitForFunction(
        () => {
          const body = document.body.innerText || '';
          return body.length > 200 && !/^Compiling/i.test(body.trim());
        },
        { timeout: 120000 },
      );
      // Extra settle for client-side data fetches
      await page.waitForTimeout(4000);
    } catch {
      console.log(`  ⚠ page never fully rendered within 120s`);
    }

    // Try to capture which tab bar is rendered. Tabs are <motion.button> inside a flex row.
    // Look for likely tab text.
    const tabTexts = await page.$$eval(
      'button',
      (btns) => btns.map(b => b.textContent?.trim()).filter(t => t && t.length > 0 && t.length < 60),
    );
    // Filter to likely tab labels (abbreviations or "Overview" or school-name tabs)
    const tabSignal = tabTexts.filter(t =>
      /^(CVPS|CHPS|FPS|GHPS|HPS|LPS|LGPS|Overview|Trust Overview|Rawdon)$/.test(t) ||
      /^(Trust Overview|Overview)$/i.test(t),
    );

    await page.screenshot({ path: `/tmp/ta-ui-${ctx.label}.png`, fullPage: false });

    console.log(`  tabs detected: ${JSON.stringify(Array.from(new Set(tabSignal)))}`);
    console.log(`  screenshot: /tmp/ta-ui-${ctx.label}.png`);

    // Assertion: school-level orgs should NOT show "Overview" tab
    const hasOverview = tabSignal.some(t => /overview/i.test(t));
    if (ctx.expectedNotTabs?.includes('Overview') && hasOverview) {
      console.log(`  ❌ LEAK: ${ctx.label} shows Overview tab`);
      results.push({ ctx: ctx.label, pass: false, reason: 'shows Overview tab' });
    } else if (ctx.expectedTabs?.includes('Overview') && !hasOverview) {
      console.log(`  ❌ MISSING: ${ctx.label} should show Overview tab but doesn't`);
      results.push({ ctx: ctx.label, pass: false, reason: 'missing Overview tab' });
    } else {
      console.log(`  ✅ tab visibility correct for org type`);
      results.push({ ctx: ctx.label, pass: true });
    }

    // Grove House specifically should not show CVPS/CHPS/FPS/HPS/LPS/LGPS tabs
    if (ctx.label === 'grove-house') {
      const banned = ['CVPS', 'CHPS', 'FPS', 'HPS', 'LPS', 'LGPS'];
      const leaked = tabSignal.filter(t => banned.includes(t));
      if (leaked.length > 0) {
        console.log(`  ❌ SIBLING LEAK: Grove House sees sibling tabs: ${leaked.join(', ')}`);
        results.push({ ctx: ctx.label + ' sibling-leak', pass: false, reason: 'sibling tabs visible' });
      } else {
        console.log(`  ✅ no sibling tabs visible`);
      }
    }

    await browserContext.close();
  }

  await browser.close();

  console.log('\n━━━ SUMMARY ━━━');
  for (const r of results) {
    console.log(`  ${r.pass ? '✅' : '❌'} ${r.ctx}${r.reason ? ' — ' + r.reason : ''}`);
  }
  const allPass = results.every(r => r.pass);
  console.log(`\n${allPass ? '✅ UI regression PASSED' : '❌ UI regression FAILED'}`);
  console.log('Screenshots: /tmp/ta-ui-paymat-trust.png, /tmp/ta-ui-grove-house.png, /tmp/ta-ui-rawdon.png');
  process.exit(allPass ? 0 : 1);
}

main().catch(err => {
  console.error('✖ crashed:', err);
  process.exit(2);
});
