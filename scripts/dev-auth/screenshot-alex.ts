/**
 * Screenshot as Alex Summerscales (trust admin).
 * Uses .dev/alex-session.json (created by update-alex-pw script).
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Resolve playwright from platform app
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { chromium } = require(require.resolve('playwright', { paths: [require('path').join(__dirname, '../../apps/platform')] }));

const projectRoot = join(__dirname, '../..');
const SESSION_FILE = join(projectRoot, '.dev/alex-session.json');

if (!existsSync(SESSION_FILE)) {
  console.error('❌ Alex session not found. Run the password update script first.');
  process.exit(1);
}

function parseEnv(): Record<string, string> {
  const text = readFileSync(join(projectRoot, 'apps/platform/.env.local'), 'utf8');
  const env: Record<string, string> = {};
  for (const line of text.split('\n')) {
    const t = line.trim(); if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('='); if (eq === -1) continue;
    env[t.slice(0, eq).trim()] = t.slice(eq + 1).trim().replace(/^['"]|['"]$/g, '');
  }
  return env;
}

const env = parseEnv();
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const pathArg = process.argv[2] || '/';
const outFile = process.argv[3] || '/tmp/alex-shot.png';
const waitMs = process.argv.includes('--wait') ? parseInt(process.argv[process.argv.indexOf('--wait') + 1]!, 10) : 5000;

async function main() {
  const session = JSON.parse(readFileSync(SESSION_FILE, 'utf8'));
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

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript((args: { key: string; value: string }) => {
    window.localStorage.setItem(args.key, args.value);
  }, { key: storageKey, value: storageValue });

  const page = await ctx.newPage();
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push('PAGEERROR: ' + err.message));
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push('CONSOLE: ' + msg.text().slice(0, 200)); });

  const url = (process.env.BASE_URL || 'http://localhost:3000') + pathArg;
  console.log('Loading', url, 'as Alex...');
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(waitMs);

  await page.screenshot({ path: outFile, fullPage: true });
  console.log('✅ Captured:', outFile);
  console.log('   Title:', await page.title());
  console.log('   Final URL:', page.url());
  if (errors.length) {
    console.log('\n⚠ Errors captured:');
    errors.slice(0, 5).forEach((e) => console.log('  -', e));
  }
  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
