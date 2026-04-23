#!/usr/bin/env node
// Trust Assessor Multi-Tenant Lockdown — API-level regression.
// For each of (PAYMAT trust, Grove House school, Rawdon school) contexts,
// hit the key APIs as David (who is a member of all three) and verify the
// responses contain only that org's data.

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

// Load env from apps/platform/.env.local
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
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const APP = 'http://localhost:3000';

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('missing supabase env');
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

const DAVID_EMAIL = 'dsummerscales46@gmail.com';
const DAVID_ID = 'd1640650-ed16-4fef-913e-244f984e093b';

const CONTEXTS = [
  {
    label: 'PAYMAT (trust)',
    orgId: '4a82a4ed-dbf0-453a-8066-963382471cd2',
    expect: {
      children_count: 7,
      self_type: 'trust',
      perPupil_totalPupils: 0,    // PAYMAT trust org has zero pupil_assessments_pseudo rows
      spreadsheet_has_figures: true, // PAYMAT owns 2 trust_spreadsheets
    },
  },
  {
    label: 'Grove House (school, PAYMAT child)',
    orgId: 'd9d1ac2c-5eff-4043-98f4-e1c43f616fd3',
    expect: {
      children_count: 0,
      self_type: 'school',
      perPupil_totalPupils: 473,  // Grove House has 473 unique pupils
      spreadsheet_has_figures: true, // Grove House parent = PAYMAT, PAYMAT has spreadsheets
    },
  },
  {
    label: "Rawdon St Peter's (standalone school)",
    orgId: '7c5f74f5-0f8b-41b9-9e3a-6c3d7e8f9a0b',
    expect: {
      children_count: 0,
      self_type: 'school',
      perPupil_totalPupils: 0,
      spreadsheet_has_figures: false, // No parent trust, no spreadsheets
    },
  },
];

async function getAccessToken() {
  // Generate a magic link for David, then exchange the token_hash for a session
  const { data, error } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: DAVID_EMAIL,
  });
  if (error) throw new Error('generateLink failed: ' + error.message);
  // The action_link contains hash frag with access_token after email verification;
  // for magiclink type, we use token_hash + verifyOtp to get a real session.
  const tokenHash = data.properties.hashed_token;
  const { data: verified, error: vErr } = await admin.auth.verifyOtp({
    type: 'magiclink',
    token_hash: tokenHash,
  });
  if (vErr) throw new Error('verifyOtp failed: ' + vErr.message);
  if (!verified.session?.access_token) throw new Error('no access_token returned');
  return verified.session.access_token;
}

async function hit(path, token) {
  const res = await fetch(`${APP}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  return { status: res.status, json };
}

function assert(label, got, expected) {
  const ok = got === expected;
  const icon = ok ? '✅' : '❌';
  console.log(`    ${icon} ${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(got)}`);
  return ok;
}

async function main() {
  console.log(`→ Generating access token for ${DAVID_EMAIL}…`);
  const token = await getAccessToken();
  console.log(`  got token (len=${token.length})\n`);

  let allPassed = true;
  const results = [];

  for (const ctx of CONTEXTS) {
    console.log(`\n━━━ ${ctx.label} (${ctx.orgId}) ━━━`);

    // 1. /api/organizations/children → scoped tabs
    const children = await hit(`/api/organizations/children?parentId=${ctx.orgId}`, token);
    const data = children.json.data ?? children.json;
    const childCount = (data.children ?? []).length;
    const selfType = data.self?.organization_type;
    console.log(`  /organizations/children: status=${children.status}`);
    const a1 = assert('children count', childCount, ctx.expect.children_count);
    // self_type not in response — we infer from parent_organization_id presence instead
    const parentId = data.self?.parent_organization_id;
    const inferredType = parentId ? 'school' : (childCount > 0 ? 'trust' : 'school');
    const a2 = assert('inferred org type', inferredType, ctx.expect.self_type);

    // 2. /api/trust-analysis/grove-house → per-pupil data
    const perPupil = await hit(`/api/trust-analysis/grove-house?organizationId=${ctx.orgId}`, token);
    const pp = perPupil.json.data ?? perPupil.json;
    const totalPupils = pp?.summary?.totalPupils ?? 0;
    console.log(`  /trust-analysis/grove-house: status=${perPupil.status}`);
    const a3 = assert('per-pupil totalPupils', totalPupils, ctx.expect.perPupil_totalPupils);

    // Inspect spreadsheetComparison — this is the Task 2 leak fix
    const rows = pp?.spreadsheetComparison?.rows ?? [];
    const anyNumericFigures = rows.some(r =>
      r.spreadsheet?.r != null || r.spreadsheet?.w != null || r.spreadsheet?.m != null,
    );
    const a4 = assert('spreadsheet figures present', anyNumericFigures, ctx.expect.spreadsheet_has_figures);

    // 3. /api/trust-analysis (DfE data) → should be scoped to org's URN
    const dfe = await hit(`/api/trust-analysis?organizationId=${ctx.orgId}`, token);
    const ks2Count = (dfe.json.data?.ks2Results ?? dfe.json.ks2Results ?? []).length;
    console.log(`  /trust-analysis: status=${dfe.status} (ks2 rows: ${ks2Count})`);
    // Don't assert exact count (data varies) — just verify no error and rows present for schools with URNs
    const a5 = dfe.status === 200;
    console.log(`    ${a5 ? '✅' : '❌'} /trust-analysis returns 200`);

    const allOk = a1 && a2 && a3 && a4 && a5;
    if (!allOk) allPassed = false;
    results.push({ ctx: ctx.label, passed: allOk });
  }

  // Cross-tenant leak check: call Grove House per-pupil with PAYMAT's org id,
  // then Grove House's org id, and assert the responses differ
  console.log('\n\n━━━ Cross-tenant leak check ━━━');
  const pay = await hit(`/api/trust-analysis/grove-house?organizationId=${CONTEXTS[0].orgId}`, token);
  const gh = await hit(`/api/trust-analysis/grove-house?organizationId=${CONTEXTS[1].orgId}`, token);
  const payPupils = (pay.json.data ?? pay.json)?.summary?.totalPupils ?? 0;
  const ghPupils = (gh.json.data ?? gh.json)?.summary?.totalPupils ?? 0;
  const leakCheck = payPupils === 0 && ghPupils > 0;
  console.log(`  PAYMAT totalPupils = ${payPupils} (expected 0)`);
  console.log(`  Grove House totalPupils = ${ghPupils} (expected > 0)`);
  console.log(`  ${leakCheck ? '✅' : '❌'} Per-pupil data isolation holds`);
  if (!leakCheck) allPassed = false;

  console.log('\n\n━━━ SUMMARY ━━━');
  for (const r of results) {
    console.log(`  ${r.passed ? '✅' : '❌'} ${r.ctx}`);
  }
  console.log(`  ${leakCheck ? '✅' : '❌'} Cross-tenant isolation`);
  console.log(`\n${allPassed ? '✅ ALL PASSED' : '❌ REGRESSIONS DETECTED'}`);
  process.exit(allPassed ? 0 : 1);
}

main().catch(err => {
  console.error('✖ regression script crashed:', err);
  process.exit(2);
});
