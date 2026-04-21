// Seed the 7 PAYMAT schools' in-app assessment captures from the existing
// trust_spreadsheets parsed_data. Creates 14 captures (7 schools × {autumn_term,
// mid_year}) and populates school_assessment_cells for each. Captures created
// as 'locked' since they're historical records. Idempotent — re-running updates
// cells in place without duplicating captures (thanks to the UNIQUE constraint).

// Usage (from repo root):
//   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
//   node apps/platform/scripts/seed/seed-school-captures.mjs
//
// Reads from trust_spreadsheets (autumn + mid-year captures for PAYMAT) and
// fans the data out into per-school school_assessment_captures + cells so each
// school's head sees only their own data on /dashboard/school-improvement/data-capture.

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running.');
  process.exit(1);
}
const PAYMAT_ORG_ID = '4a82a4ed-dbf0-453a-8066-963382471cd2';
const ACADEMIC_YEAR = '2025/26';

// Map school abbreviation (as used in the spreadsheet) → organization_id.
const SCHOOL_ORG_ID = {
  CVPS: '1bd5074c-bb77-4eda-a3bc-683893075a11',
  CHPS: 'da7e2172-b06d-48d9-a735-56240cf22dc0',
  FPS:  'bc226007-ca2c-44c0-be3d-b6d6aee5c0fa',
  GHPS: 'd9d1ac2c-5eff-4043-98f4-e1c43f616fd3',
  HPS:  'd1ffa408-73f1-473b-9034-51a02a78c27a',
  LPS:  '6ddc32cb-6211-4b4e-b8a9-0a75ea5f88c1',
  LGPS: 'e96fc93f-f824-4016-8417-0117f2d5d63b',
};

const YEAR_GROUPS = ['EYFS', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 6'];

// Valid metric keys per-section per-year-group. Mirrors metrics-config.ts —
// if you change one, change the other.
const COHORT_METRICS = ['number_in_cohort', 'number_send', 'ehcp', 'number_fsm'];

function attainmentMetricsFor(yg) {
  if (yg === 'EYFS') return ['gld'];
  const core = ['r_are', 'r_gd', 'w_are', 'w_gd', 'm_are', 'm_gd', 'c_are', 'c_gd'];
  if (yg === 'Year 1' || yg === 'Year 2') return [...core, 'phonics'];
  if (yg === 'Year 4') return [...core, 'mtc'];
  return core;
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// 1. Load both captures from trust_spreadsheets.
const { data: trustCaps, error: tsErr } = await supabase
  .from('trust_spreadsheets')
  .select('capture_period, file_name, parsed_data')
  .eq('trust_organization_id', PAYMAT_ORG_ID);

if (tsErr) { console.error(tsErr); process.exit(1); }
console.log(`Found ${trustCaps.length} trust captures`);

// 2. Get one PAYMAT member auth_id to attribute ownership.
const { data: member } = await supabase
  .from('organization_members')
  .select('auth_id')
  .eq('organization_id', PAYMAT_ORG_ID)
  .limit(1)
  .maybeSingle();
const attributedUser = member?.auth_id ?? null;
console.log(`Attributing seeded captures to auth_id: ${attributedUser}`);

let capturesCreated = 0, capturesUpdated = 0, cellsWritten = 0;

for (const trustCap of trustCaps) {
  const period = trustCap.capture_period; // 'autumn_term' | 'mid_year'
  const parsed = trustCap.parsed_data;
  if (!parsed?.data) {
    console.warn(`Skipping ${period} — no parsed_data.data`);
    continue;
  }

  console.log(`\n=== ${period.toUpperCase()} ===`);

  for (const [abbrev, orgId] of Object.entries(SCHOOL_ORG_ID)) {
    const schoolData = parsed.data[abbrev];
    if (!schoolData) {
      console.log(`  ${abbrev}: no data in this capture — skipping`);
      continue;
    }

    // Upsert the capture row itself.
    const { data: existing } = await supabase
      .from('school_assessment_captures')
      .select('id, status')
      .eq('organization_id', orgId)
      .eq('capture_period', period)
      .eq('academic_year', ACADEMIC_YEAR)
      .maybeSingle();

    let captureId;
    if (existing) {
      captureId = existing.id;
      capturesUpdated++;
      console.log(`  ${abbrev}: existing capture ${captureId.slice(0, 8)} — refreshing cells`);
    } else {
      const { data: inserted, error: insErr } = await supabase
        .from('school_assessment_captures')
        .insert({
          organization_id: orgId,
          capture_period: period,
          academic_year: ACADEMIC_YEAR,
          status: 'locked', // historical, already finalised
          notes: `Seeded from ${trustCap.file_name}`,
          created_by: attributedUser,
          locked_at: new Date().toISOString(),
          locked_by: attributedUser,
        })
        .select('id')
        .single();
      if (insErr) { console.error(`  ${abbrev}: insert failed`, insErr); continue; }
      captureId = inserted.id;
      capturesCreated++;
      console.log(`  ${abbrev}: created capture ${captureId.slice(0, 8)}`);
    }

    // Build cells.
    const cellRows = [];
    for (const yg of YEAR_GROUPS) {
      const ygData = schoolData[yg];
      if (!ygData) continue;

      // Cohort section
      for (const key of COHORT_METRICS) {
        const v = ygData.cohort?.[key];
        if (v !== null && v !== undefined) {
          cellRows.push({
            capture_id: captureId,
            year_group: yg,
            section: 'cohort',
            metric: key,
            value: v,
            updated_by: attributedUser,
          });
        }
      }

      // Attainment sections
      const attMetrics = attainmentMetricsFor(yg);
      for (const sectionKey of ['all_pupils', 'fsm6', 'not_fsm6']) {
        const src = ygData[sectionKey];
        if (!src) continue;
        for (const m of attMetrics) {
          const v = src[m];
          if (v !== null && v !== undefined) {
            cellRows.push({
              capture_id: captureId,
              year_group: yg,
              section: sectionKey,
              metric: m,
              value: v,
              updated_by: attributedUser,
            });
          }
        }
      }
    }

    if (cellRows.length > 0) {
      const { error: upErr } = await supabase
        .from('school_assessment_cells')
        .upsert(cellRows, { onConflict: 'capture_id,year_group,section,metric' });
      if (upErr) { console.error(`  ${abbrev}: cell upsert failed`, upErr); continue; }
      cellsWritten += cellRows.length;
    }
    console.log(`    → ${cellRows.length} cells`);
  }
}

console.log(`\n✅ Done.`);
console.log(`   Captures created: ${capturesCreated}`);
console.log(`   Captures updated: ${capturesUpdated}`);
console.log(`   Cells written:    ${cellsWritten}`);
