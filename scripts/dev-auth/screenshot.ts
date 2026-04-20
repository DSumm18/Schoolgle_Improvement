/**
 * Dev Screenshot — takes a full-page screenshot of any authenticated route.
 *
 * Usage:
 *   npx tsx scripts/dev-auth/screenshot.ts <path> <output-file> [--wait N]
 *   npx tsx scripts/dev-auth/screenshot.ts /dashboard/school-improvement/trust-assessor /tmp/ta.png
 *   npx tsx scripts/dev-auth/screenshot.ts /timeline /tmp/timeline.png --wait 5000
 *
 * Prerequisite: run scripts/dev-auth/bootstrap.ts first.
 *
 * Works by injecting the Supabase session tokens into localStorage before page load,
 * so Supabase auth context sees a valid session on hydration.
 */

// Resolve playwright from the platform app's node_modules (not installed at root)
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { chromium } = require(require.resolve('playwright', { paths: [require('path').join(__dirname, '../../apps/platform')] }));
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

if (process.env.NODE_ENV === 'production') {
  console.error('❌ Refusing to run in production.');
  process.exit(1);
}

const projectRoot = join(__dirname, '../..');
const SESSION_FILE = join(projectRoot, '.dev/session.json');

if (!existsSync(SESSION_FILE)) {
  console.error('❌ No session found. Run: npx tsx scripts/dev-auth/bootstrap.ts first.');
  process.exit(1);
}

// Load env
function parseEnv(): Record<string, string> {
  const text = readFileSync(join(projectRoot, 'apps/platform/.env.local'), 'utf8');
  const env: Record<string, string> = {};
  for (const line of text.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq === -1) continue;
    env[t.slice(0, eq).trim()] = t
      .slice(eq + 1)
      .trim()
      .replace(/^['"]|['"]$/g, '');
  }
  return env;
}

const env = parseEnv();
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;

// Parse args
const args = process.argv.slice(2);
const pathArg = args[0] || '/';
const outFile = args[1] || '/tmp/schoolgle-shot.png';
const waitIdx = args.indexOf('--wait');
const waitMs = waitIdx !== -1 ? parseInt(args[waitIdx + 1], 10) : 3000;
const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

async function main() {
  const session = JSON.parse(readFileSync(SESSION_FILE, 'utf8'));
  const url = baseUrl + pathArg;

  // Supabase v2 stores sessions under sb-<project-ref>-auth-token
  // Extract project ref from SUPABASE_URL (e.g. https://abc123.supabase.co → abc123)
  const projectRef = new URL(SUPABASE_URL).hostname.split('.')[0];
  const storageKey = `sb-${projectRef}-auth-token`;

  const storageValue = JSON.stringify({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at,
    expires_in: 3600,
    token_type: 'bearer',
    user: { id: session.user_id },
  });

  console.log(`Launching browser...`);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  // Inject session into localStorage before any page load
  await context.addInitScript((args: { key: string; value: string }) => {
    window.localStorage.setItem(args.key, args.value);
  }, { key: storageKey, value: storageValue });

  const page = await context.newPage();

  // Capture console errors for debugging
  page.on('console', (msg) => {
    if (msg.type() === 'error') console.log(`[browser:err] ${msg.text()}`);
  });
  page.on('pageerror', (err) => console.log(`[browser:pageerror] ${err.message}`));

  console.log(`Navigating to ${url} ...`);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  console.log(`Waiting ${waitMs}ms for hydration + data fetches...`);
  await page.waitForTimeout(waitMs);

  // Take full-page screenshot
  console.log(`Capturing screenshot → ${outFile}`);
  await page.screenshot({ path: outFile, fullPage: true });

  const title = await page.title();
  const finalUrl = page.url();
  console.log(`✅ Captured: ${outFile}`);
  console.log(`   Page title: ${title}`);
  console.log(`   Final URL:  ${finalUrl}`);

  // Quick auth check: if we redirected to signup/login, auth failed
  if (finalUrl.includes('/signup') || finalUrl.includes('/login') || finalUrl.includes('/auth')) {
    console.warn('⚠️  Auth may have failed — ended up on an auth page.');
    console.warn('    Try rerunning bootstrap.ts to refresh the session token.');
  }

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
