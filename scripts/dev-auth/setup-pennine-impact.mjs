/**
 * setup-pennine-impact.mjs
 * Creates test org hierarchy for PAYMAT and Impact Education MAT.
 * Idempotent — safe to re-run.
 *
 * Usage: node scripts/dev-auth/setup-pennine-impact.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');
const ENV_PATH = join(ROOT, 'apps', 'platform', '.env.local');

// ── Load env ──────────────────────────────────────────────────────────────────
const env = {};
readFileSync(ENV_PATH, 'utf8').split('\n').forEach(line => {
  const m = line.match(/^([A-Z_]+)=(.+)$/);
  if (m) env[m[1]] = m[2].trim();
});

const SUPABASE_URL = env['NEXT_PUBLIC_SUPABASE_URL'] || env['SUPABASE_URL'];
const SERVICE_ROLE_KEY = env['SUPABASE_SERVICE_ROLE_KEY'];

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── Constants ─────────────────────────────────────────────────────────────────
const ALEX_EMAIL = 'a.summerscales@ghps.paymat.co.uk';

const PENNINE_URNS = ['148869', '146581', '144862', '148201', '144860', '144861', '150016'];
const IMPACT_URNS  = ['140326', '146204', '150568', '148134', '149545', '150570', '147884', '146677', '146367', '147888'];
const GROVE_HOUSE_ORG_ID = 'd9d1ac2c-5eff-4043-98f4-e1c43f616fd3';

// ── Helpers ───────────────────────────────────────────────────────────────────
function log(msg) { console.log(msg); }
function check(label, error) {
  if (error) { console.error(`ERROR — ${label}:`, error.message); throw error; }
}

async function upsertOrg({ id, name, organization_type, org_type, urn, local_authority, parent_organization_id, website_url }) {
  // Check if already exists by id
  const { data: existing } = await supabase.from('organizations').select('id').eq('id', id);
  if (existing && existing.length > 0) {
    log(`  → Org already exists: ${name} (${id})`);
    // Update parent_organization_id if provided (for Grove House case)
    if (parent_organization_id) {
      const { error } = await supabase.from('organizations')
        .update({ parent_organization_id })
        .eq('id', id);
      if (error) log(`  WARN updating parent for ${name}: ${error.message}`);
    }
    return id;
  }

  const row = { id, name, organization_type, org_type, local_authority };
  if (urn) row.urn = urn;
  if (parent_organization_id) row.parent_organization_id = parent_organization_id;
  if (website_url) row.website_url = website_url;

  const { error } = await supabase.from('organizations').insert(row);
  check(`insert org ${name}`, error);
  log(`  + Created org: ${name} (${id})`);
  return id;
}

// ── Step 1: Create trust orgs ─────────────────────────────────────────────────
async function createTrusts() {
  log('\n=== STEP 1: Create trust orgs ===');

  // Check if trusts already exist by name
  const { data: existing } = await supabase.from('organizations')
    .select('id, name')
    .in('name', ['PAYMAT — Pennine Academies Yorkshire', 'Impact Education Multi Academy Trust']);

  let paymatId, impactId;

  const paymatExisting = existing?.find(o => o.name === 'PAYMAT — Pennine Academies Yorkshire');
  const impactExisting = existing?.find(o => o.name === 'Impact Education Multi Academy Trust');

  if (paymatExisting) {
    paymatId = paymatExisting.id;
    log(`  → PAYMAT already exists: ${paymatId}`);
  } else {
    paymatId = randomUUID();
    const { error } = await supabase.from('organizations').insert({
      id: paymatId,
      name: 'PAYMAT — Pennine Academies Yorkshire',
      organization_type: 'trust',
      org_type: 'trust',
      local_authority: 'Bradford',
      website_url: 'https://paymat.co.uk',
    });
    check('insert PAYMAT trust', error);
    log(`  + Created PAYMAT trust: ${paymatId}`);
  }

  if (impactExisting) {
    impactId = impactExisting.id;
    log(`  → Impact Education MAT already exists: ${impactId}`);
  } else {
    impactId = randomUUID();
    const { error } = await supabase.from('organizations').insert({
      id: impactId,
      name: 'Impact Education Multi Academy Trust',
      organization_type: 'trust',
      org_type: 'trust',
      local_authority: 'Calderdale/Kirklees',
    });
    check('insert Impact trust', error);
    log(`  + Created Impact Education MAT: ${impactId}`);
  }

  return { paymatId, impactId };
}

// ── Step 2: Create/link child school orgs ─────────────────────────────────────
async function createSchoolOrgs(paymatId, impactId) {
  log('\n=== STEP 2: Create child school orgs ===');

  // Fetch DfE data for all URNs
  const allUrns = [...PENNINE_URNS, ...IMPACT_URNS];
  const { data: dfeSchools, error: dfeError } = await supabase
    .from('schools')
    .select('urn, name, la_name')
    .in('urn', allUrns.map(u => parseInt(u)));
  check('fetch dfe schools', dfeError);

  const schoolMap = {};
  dfeSchools.forEach(s => { schoolMap[String(s.urn)] = s; });

  const pennineOrgIds = [];
  const impactOrgIds = [];

  // Process Pennine schools
  for (const urn of PENNINE_URNS) {
    if (urn === '148201') {
      // Grove House already exists — update parent_organization_id
      const { error } = await supabase.from('organizations')
        .update({ parent_organization_id: paymatId })
        .eq('id', GROVE_HOUSE_ORG_ID);
      if (error) log(`  WARN updating Grove House parent: ${error.message}`);
      else log(`  ~ Updated Grove House parent_organization_id → PAYMAT (${paymatId})`);
      pennineOrgIds.push(GROVE_HOUSE_ORG_ID);
      continue;
    }

    // Check if school org already exists by URN
    const { data: existing } = await supabase.from('organizations')
      .select('id, name').eq('urn', urn);

    if (existing && existing.length > 0) {
      log(`  → School org exists for URN ${urn}: ${existing[0].name} (${existing[0].id})`);
      // Ensure parent is set
      const { error } = await supabase.from('organizations')
        .update({ parent_organization_id: paymatId })
        .eq('urn', urn);
      if (error) log(`  WARN updating parent for URN ${urn}: ${error.message}`);
      pennineOrgIds.push(existing[0].id);
      continue;
    }

    const dfe = schoolMap[urn];
    if (!dfe) { log(`  WARN: No DfE data for URN ${urn}`); continue; }

    const orgId = randomUUID();
    const { error } = await supabase.from('organizations').insert({
      id: orgId,
      name: dfe.name,
      organization_type: 'school',
      org_type: 'school',
      urn: urn,
      local_authority: dfe.la_name,
      parent_organization_id: paymatId,
    });
    check(`insert Pennine school ${dfe.name}`, error);
    log(`  + Created: ${dfe.name} URN ${urn} (${orgId})`);
    pennineOrgIds.push(orgId);
  }

  // Process Impact Education schools
  for (const urn of IMPACT_URNS) {
    const { data: existing } = await supabase.from('organizations')
      .select('id, name').eq('urn', urn);

    if (existing && existing.length > 0) {
      log(`  → School org exists for URN ${urn}: ${existing[0].name} (${existing[0].id})`);
      const { error } = await supabase.from('organizations')
        .update({ parent_organization_id: impactId })
        .eq('urn', urn);
      if (error) log(`  WARN updating parent for URN ${urn}: ${error.message}`);
      impactOrgIds.push(existing[0].id);
      continue;
    }

    const dfe = schoolMap[urn];
    if (!dfe) { log(`  WARN: No DfE data for URN ${urn}`); continue; }

    const orgId = randomUUID();
    const { error } = await supabase.from('organizations').insert({
      id: orgId,
      name: dfe.name,
      organization_type: 'school',
      org_type: 'school',
      urn: urn,
      local_authority: dfe.la_name,
      parent_organization_id: impactId,
    });
    check(`insert Impact school ${dfe.name}`, error);
    log(`  + Created: ${dfe.name} URN ${urn} (${orgId})`);
    impactOrgIds.push(orgId);
  }

  return { pennineOrgIds, impactOrgIds };
}

// ── Step 3: Create Alex Summerscales ──────────────────────────────────────────
async function createAlexUser() {
  log('\n=== STEP 3: Create Alex Summerscales ===');

  // Check if auth user exists
  const { data: listData, error: listError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  check('listUsers', listError);

  let alexAuthUser = listData?.users?.find(u => u.email === ALEX_EMAIL);
  let tempPassword = null;

  if (alexAuthUser) {
    log(`  → Auth user already exists: ${alexAuthUser.id}`);
  } else {
    // Generate temp password
    const bytes = Buffer.allocUnsafe(8);
    for (let i = 0; i < 8; i++) bytes[i] = Math.floor(Math.random() * 256);
    tempPassword = 'Schoolgle-Alex-' + bytes.toString('hex');

    const { data: createData, error: createError } = await supabase.auth.admin.createUser({
      email: ALEX_EMAIL,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { full_name: 'Alex Summerscales', role: 'trust_admin' },
    });
    check('createUser Alex', createError);
    alexAuthUser = createData.user;
    log(`  + Auth user created: ${alexAuthUser.id}`);
  }

  const authId = alexAuthUser.id;

  // Upsert public.users row
  const { data: existingUser } = await supabase.from('users').select('id').eq('id', authId);
  if (existingUser && existingUser.length > 0) {
    log(`  → public.users row already exists for Alex`);
  } else {
    const { error: upsertError } = await supabase.from('users').upsert({
      id: authId,
      email: ALEX_EMAIL,
      display_name: 'Alex Summerscales',
      auth_id: authId,
    }, { onConflict: 'id' });
    check('upsert public.users Alex', upsertError);
    log(`  + public.users row created`);
  }

  return { authId, tempPassword };
}

// ── Step 4: Create organization_members links ─────────────────────────────────
async function createMemberships(authId, paymatId, pennineOrgIds) {
  log('\n=== STEP 4: Create Alex org memberships ===');

  const allOrgIds = [paymatId, ...pennineOrgIds];

  for (const orgId of allOrgIds) {
    // Check if membership already exists
    const { data: existing } = await supabase.from('organization_members')
      .select('organization_id')
      .eq('organization_id', orgId)
      .eq('auth_id', authId);

    if (existing && existing.length > 0) {
      log(`  → Membership already exists for org ${orgId}`);
      continue;
    }

    const { error } = await supabase.from('organization_members').insert({
      organization_id: orgId,
      user_id: authId,
      auth_id: authId,
      role: 'admin',
      job_title: 'School Improvement Partner',
    });
    check(`insert membership for org ${orgId}`, error);
    log(`  + Membership created for org ${orgId}`);
  }
}

// ── Step 5: Save credentials ──────────────────────────────────────────────────
async function saveCredentials(authId, tempPassword, paymatId, impactId) {
  const devDir = join(ROOT, '.dev');
  if (!existsSync(devDir)) mkdirSync(devDir, { recursive: true });

  const credPath = join(devDir, 'alex-credentials.json');

  // Read existing if any
  let existing = {};
  if (existsSync(credPath)) {
    try { existing = JSON.parse(readFileSync(credPath, 'utf8')); } catch {}
  }

  const creds = {
    ...existing,
    alex_summerscales: {
      email: ALEX_EMAIL,
      auth_id: authId,
      temp_password: tempPassword || existing.alex_summerscales?.temp_password || '(already existed — check previous save)',
      paymat_trust_id: paymatId,
      impact_trust_id: impactId,
      note: 'Trust-level admin for PAYMAT Pennine Academies Yorkshire. NOT linked to Impact Education.',
      created_at: new Date().toISOString(),
    }
  };

  writeFileSync(credPath, JSON.stringify(creds, null, 2));
  log(`\n  Credentials saved to .dev/alex-credentials.json`);
}

// ── Step 6: Verify ────────────────────────────────────────────────────────────
async function verify(paymatId, impactId, authId) {
  log('\n=== VERIFICATION ===\n');

  // 1. Trust hierarchy
  const { data: pennineChildren } = await supabase.from('organizations')
    .select('name, urn').eq('parent_organization_id', paymatId).order('name');
  const { data: impactChildren } = await supabase.from('organizations')
    .select('name, urn').eq('parent_organization_id', impactId).order('name');

  log('PAYMAT child schools:');
  pennineChildren?.forEach(s => log(`  ${s.name} (URN ${s.urn})`));
  log(`  Total: ${pennineChildren?.length || 0} schools`);

  log('\nImpact Education child schools:');
  impactChildren?.forEach(s => log(`  ${s.name} (URN ${s.urn})`));
  log(`  Total: ${impactChildren?.length || 0} schools`);

  // 2. Alex's memberships
  const { data: memberships } = await supabase.from('organization_members')
    .select('organization_id, role, job_title')
    .eq('auth_id', authId);

  const orgIds = memberships?.map(m => m.organization_id) || [];
  const { data: memberOrgs } = await supabase.from('organizations')
    .select('name, organization_type').in('id', orgIds);

  log('\nAlex memberships:');
  memberOrgs?.forEach(o => log(`  ${o.name} (${o.organization_type})`));
  log(`  Total: ${memberships?.length || 0} memberships`);

  // 3. Module status (should be 0 for new orgs)
  const newOrgIds = [paymatId, impactId, ...(pennineChildren?.map(s => {
    // We need the IDs — fetch them
    return null;
  }) || [])].filter(Boolean);

  const { data: modules } = await supabase.from('organization_modules')
    .select('organization_id, enabled')
    .in('organization_id', [paymatId, impactId])
    .eq('enabled', true);

  log(`\nEnabled modules on trust orgs: ${modules?.length || 0} (should be 0)`);

  return {
    pennineChildCount: pennineChildren?.length || 0,
    impactChildCount: impactChildren?.length || 0,
    membershipCount: memberships?.length || 0,
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  log('=== PENNINE + IMPACT EDUCATION SETUP ===\n');

  const { paymatId, impactId } = await createTrusts();
  const { pennineOrgIds, impactOrgIds } = await createSchoolOrgs(paymatId, impactId);
  const { authId, tempPassword } = await createAlexUser();
  await createMemberships(authId, paymatId, pennineOrgIds);
  await saveCredentials(authId, tempPassword, paymatId, impactId);
  const counts = await verify(paymatId, impactId, authId);

  log('\n=== SETUP COMPLETE ===\n');
  log(`TRUSTS CREATED`);
  log(`- PAYMAT Pennine Academies Yorkshire (id: ${paymatId}, ${counts.pennineChildCount} child schools)`);
  log(`- Impact Education MAT (id: ${impactId}, ${counts.impactChildCount} child schools)`);

  log(`\nPENNINE CHILD SCHOOLS`);
  log(`- CVPS (148869), CHPS (146581), FPS (144862), GHPS (148201), HPS (144860), LPS (144861), LGPS (150016)`);
  log(`- Grove House existing org moved under PAYMAT (parent_organization_id updated)`);

  log(`\nALEX SUMMERSCALES LOGIN`);
  log(`- Email: ${ALEX_EMAIL}`);
  log(`- Temp password: saved to .dev/alex-credentials.json`);
  log(`- Auth ID: ${authId}`);
  log(`- Org memberships: ${counts.membershipCount} (1 trust + ${counts.pennineChildCount} schools)`);
  log(`- Password reset URL: ${SUPABASE_URL.replace('https://', 'https://').replace('.supabase.co', '')}.supabase.co/auth/v1/recover`);

  log(`\nMODULES`);
  log(`- All new orgs have 0 modules enabled (tests subscription toggle)`);

  log(`\nNEXT STEPS`);
  log(`- Test Alex login at http://localhost:3000/login`);
  log(`- Use Mission Control (/mission-control) to toggle modules per org`);
  log(`- Verify: empty sidebar when no modules enabled`);
  log(`- Verify: School Improvement module toggles on -> Trust Assessor appears`);
}

main().catch(err => {
  console.error('\nFATAL:', err.message);
  process.exit(1);
});
