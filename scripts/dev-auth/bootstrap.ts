/**
 * Dev Auth Bootstrap — creates a test admin user for Claude to test with.
 *
 * Run once: `npx tsx scripts/dev-auth/bootstrap.ts`
 *
 * Produces:
 *   - A user in auth.users with email `claude-dev@schoolgle.local`, password auto-generated
 *   - Membership in David's org with role=admin
 *   - Credentials saved to .dev/credentials.json (gitignored)
 *   - Session JWT saved to .dev/session.json (gitignored)
 *
 * Subsequent runs: regenerate session, reuse existing user.
 *
 * SECURITY: Refuses to run if NODE_ENV=production.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { randomBytes } from 'crypto';

// Safety: never run this in production
if (process.env.NODE_ENV === 'production') {
  console.error('❌ Refusing to run in production.');
  process.exit(1);
}

// Load env from apps/platform/.env.local
const projectRoot = join(__dirname, '../..');
const envPath = join(projectRoot, 'apps/platform/.env.local');

function parseEnv(): Record<string, string> {
  const text = readFileSync(envPath, 'utf8');
  const env: Record<string, string> = {};
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const k = trimmed.slice(0, eq).trim();
    let v = trimmed.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    env[k] = v;
  }
  return env;
}

const env = parseEnv();
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !ANON_KEY) {
  console.error('❌ Missing Supabase env vars in apps/platform/.env.local');
  process.exit(1);
}

const TEST_EMAIL = 'claude-dev@schoolgle.local';
const ORG_ID = 'd9d1ac2c-5eff-4043-98f4-e1c43f616fd3'; // David's Schoolgle org
const DEV_DIR = join(projectRoot, '.dev');
const CREDENTIALS_FILE = join(DEV_DIR, 'credentials.json');
const SESSION_FILE = join(DEV_DIR, 'session.json');

function ensureDir(path: string) {
  mkdirSync(dirname(path), { recursive: true });
}

async function main() {
  console.log('Dev auth bootstrap starting...');

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Reuse existing password if bootstrap has run before, else generate
  let password: string;
  if (existsSync(CREDENTIALS_FILE)) {
    const existing = JSON.parse(readFileSync(CREDENTIALS_FILE, 'utf8'));
    password = existing.password;
    console.log('→ Reusing existing password from .dev/credentials.json');
  } else {
    password = `claude-dev-${randomBytes(12).toString('hex')}`;
    console.log('→ Generated new password');
  }

  // Check if user already exists
  const { data: list, error: listErr } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (listErr) {
    console.error('listUsers error:', listErr.message);
    process.exit(1);
  }

  let userId: string;
  const existing = list?.users?.find((u) => u.email === TEST_EMAIL);

  if (existing) {
    userId = existing.id;
    console.log(`→ Found existing user: ${userId}`);
    // Update password in case it was different
    await admin.auth.admin.updateUserById(userId, { password, email_confirm: true });
    console.log('→ Password synced');
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email: TEST_EMAIL,
      password,
      email_confirm: true,
      user_metadata: { full_name: 'Claude Dev', purpose: 'dev-test-user' },
    });
    if (error || !data?.user) {
      console.error('createUser error:', error?.message);
      process.exit(1);
    }
    userId = data.user.id;
    console.log(`→ Created user: ${userId}`);
  }

  // Ensure profile row (required by app)
  const { error: profileErr } = await admin
    .from('users')
    .upsert(
      {
        id: userId,
        email: TEST_EMAIL,
        full_name: 'Claude Dev',
      },
      { onConflict: 'id' },
    );
  if (profileErr && !profileErr.message.includes('duplicate')) {
    console.warn('profile upsert warning:', profileErr.message);
  }

  // Ensure org membership as admin
  const { error: memberErr } = await admin.from('organization_members').upsert(
    {
      organization_id: ORG_ID,
      user_id: userId,
      auth_id: userId,
      role: 'admin',
    },
    { onConflict: 'organization_id,auth_id' },
  );
  if (memberErr) {
    console.warn('member upsert warning:', memberErr.message);
  } else {
    console.log('→ Org membership ensured');
  }

  // Generate a session using anon client (password flow)
  const anon = createClient(SUPABASE_URL, ANON_KEY);
  const { data: signIn, error: signErr } = await anon.auth.signInWithPassword({
    email: TEST_EMAIL,
    password,
  });

  if (signErr || !signIn?.session) {
    console.error('signIn error:', signErr?.message);
    console.error('Password auth may not be enabled on this Supabase project.');
    console.error('Enable it via: Supabase Dashboard → Authentication → Providers → Email');
    process.exit(1);
  }

  console.log('→ Signed in, obtained session JWT');

  // Persist everything
  ensureDir(CREDENTIALS_FILE);
  writeFileSync(
    CREDENTIALS_FILE,
    JSON.stringify(
      {
        email: TEST_EMAIL,
        password,
        userId,
        orgId: ORG_ID,
        note: 'DEV ONLY. Never commit. Created by scripts/dev-auth/bootstrap.ts',
      },
      null,
      2,
    ),
  );

  writeFileSync(
    SESSION_FILE,
    JSON.stringify(
      {
        access_token: signIn.session.access_token,
        refresh_token: signIn.session.refresh_token,
        expires_at: signIn.session.expires_at,
        user_id: userId,
      },
      null,
      2,
    ),
  );

  console.log('✅ Bootstrap complete.');
  console.log(`   Credentials: .dev/credentials.json`);
  console.log(`   Session: .dev/session.json`);
  console.log(`   User ID: ${userId}`);
  console.log(`   Email: ${TEST_EMAIL}`);
  console.log('');
  console.log('Next: npx tsx scripts/dev-auth/screenshot.ts /dashboard/school-improvement/trust-assessor /tmp/shot.png');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
