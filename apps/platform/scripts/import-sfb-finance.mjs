#!/usr/bin/env node
/**
 * Import DfE Schools Financial Benchmarking (SFB) into dfe_data.school_finance.
 *
 * Sources (downloaded from https://financial-benchmarking-and-insights-tool.education.gov.uk/data-sources):
 *   CFR_<year>.xlsx — Consistent Financial Reporting (LA maintained schools)
 *   AAR_<year>.xlsx — Academies Accounts Returns (academies / free schools)
 *
 * Year coverage available:
 *   CFR: 2014-15 .. 2024-25  (11 years)
 *   AAR: 2016-17 .. 2024-25  (9 years)
 *
 * Approach:
 *   - Open each workbook with xlsx
 *   - Locate the data sheet by name heuristic
 *   - Scan the first 6 rows for the header row (must contain "URN")
 *   - Map columns by header name (tolerant matching) — every year has slightly different headers,
 *     so we match by canonical keys and fall back to CFR code prefixes (E01..., BAE010...)
 *   - Compute derived per-pupil + average teacher cost
 *   - Skip rows with no URN
 *   - Filter to URNs present in dfe_data.schools (FK-ish: only import schools we know)
 *   - Bulk insert in batches of 1000 with ON CONFLICT DO NOTHING (safe to re-run)
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import dotenv from 'dotenv';
import XLSX from 'xlsx';

const { Client } = pg;
const __dirname = dirname(fileURLToPath(import.meta.url));

for (const p of [
  join(__dirname, '.env.local'),
  join(__dirname, '..', 'apps', 'platform', '.env.local'),
  join(__dirname, '..', '..', 'apps', 'platform', '.env.local'),
  join(process.cwd(), 'apps', 'platform', '.env.local'),
  join(process.cwd(), '.env.local'),
]) {
  dotenv.config({ path: p, override: false });
  if (process.env.DATABASE_URL) break;
}
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL missing from apps/platform/.env.local');
  process.exit(1);
}

const DATA_DIR = '/tmp/dfe_work';
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

/** Normalise string for loose header matching */
const norm = (s) => String(s ?? '').toLowerCase().replace(/\s+/g, ' ').replace(/[^a-z0-9 /]/g, '').trim();

/**
 * Find the header row index. Header row must contain "URN" and at least one
 * income/expenditure column signal.
 */
function findHeaderRow(rows) {
  for (let r = 0; r < 6; r++) {
    if (!rows[r]) continue;
    const hasUrn = rows[r].some((c) => typeof c === 'string' && c.trim() === 'URN');
    if (!hasUrn) continue;
    const rowText = rows[r].map((v) => String(v ?? '')).join('|').toLowerCase();
    if (/i01|bai010|e01 teaching|teaching staff|total income|total expenditure/.test(rowText)) return r;
  }
  return -1;
}

/**
 * Build a column-name -> index map tolerant of whitespace/newlines.
 */
function buildColMap(headerRow) {
  const map = new Map();
  headerRow.forEach((h, i) => {
    if (h == null || h === '') return;
    map.set(norm(h), i);
  });
  return map;
}

/** Lookup a column by trying a list of candidate labels (normalised). Returns column index or -1 */
function col(map, ...candidates) {
  for (const c of candidates) {
    const n = norm(c);
    if (map.has(n)) return map.get(n);
  }
  return -1;
}

/** Find any column where the normalised header starts with prefix */
function colStartsWith(map, prefix) {
  const n = norm(prefix);
  for (const [k, v] of map.entries()) if (k.startsWith(n)) return v;
  return -1;
}

/** Numeric parse — handles empty strings, commas, null */
function num(v) {
  if (v == null || v === '') return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  const cleaned = String(v).replace(/[£,\s]/g, '');
  if (cleaned === '' || cleaned === '-' || cleaned.toLowerCase() === 'n/a') return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

/** Academic year end: '2023-24' -> 2024 */
function academicYearEnd(fyLabel) {
  const m = fyLabel.match(/^(\d{4})-(\d{2})$/);
  if (!m) return null;
  const start = parseInt(m[1], 10);
  return start + 1;
}

/**
 * Extract one row of canonical financial data from a worksheet row.
 * Handles both CFR and AAR schemas via label-based lookup.
 */
function extractRow(row, map, source, fyLabel, sourceFile) {
  const urn = parseInt(row[col(map, 'URN')], 10);
  if (!Number.isFinite(urn) || urn <= 0) return null;

  // Common
  const schoolName = row[col(map, 'School Name')];
  const phase = row[col(map, 'Overall Phase', 'Phase')];
  const laCode = row[col(map, 'LA')];
  const laName = row[col(map, 'LA Name')];

  // Pupils / teachers (CFR: "No pupils", "FTE Number of teachers"; AAR: "Number of pupils in academy (FTE)")
  const pupils = num(row[col(map,
    'No pupils',
    'Number of pupils in academy (FTE)',
    'Number of pupils in academy (FTE) plus dual subsidiary registrations',
    'No Pupils',
    'Number of pupils'
  )]);
  // Also try starts-with for pupil count (covers year-to-year wording drift)
  let pupilsResolved = pupils;
  if (pupilsResolved == null) {
    for (const [k, v] of map.entries()) {
      if (k.startsWith('number of pupils in academy')) { pupilsResolved = num(row[v]); if (pupilsResolved != null) break; }
    }
  }
  const teachers = num(row[col(map, 'FTE Number of teachers', 'Number of teachers in academy (FTE)', 'No Teachers')]);

  let totalIncome, totalExp, teachingStaff, supplyStaff, educSupport, premisesStaff, adminStaff,
      cateringStaff, otherStaff, totalStaff, premises, maintenance, energy, cateringExp, learningResources,
      surplusDeficit, reserves, totalFunding, pupilPremium, senFunding, directGrants, selfGenerated;

  if (source === 'CFR') {
    // CFR raw codes
    teachingStaff = num(row[col(map, 'E01 Teaching staff')]);
    educSupport = num(row[col(map, 'E03 Education support staff')]);
    premisesStaff = num(row[col(map, 'E04 Premises staff')]);
    adminStaff = num(row[col(map, 'E05 Administrative and clerical staff')]);
    cateringStaff = num(row[col(map, 'E06 Catering staff')]);
    pupilPremium = num(row[col(map, 'I05 Pupil premium')]);
    senFunding = num(row[col(map, 'I03 SEN funding')]);
    energy = num(row[col(map, 'E16 Energy')]);
    learningResources = num(row[col(map, 'E19 Learning resources (not ICT equipment)')]);

    // Aggregate columns (these may or may not exist depending on year)
    totalIncome = num(row[col(map,
      'Total Income: I01:I18 - E30',
      'Total Income',
      'Total Income (I01:I18 - E30)'
    )]);
    if (totalIncome == null) {
      // fall back to starts-with match
      const idx = colStartsWith(map, 'total income');
      if (idx !== -1) totalIncome = num(row[idx]);
    }

    totalExp = num(row[col(map,
      'Total Expenditure: (E01:E29 + E31 + E32)',
      'Total Expenditure'
    )]);
    if (totalExp == null) {
      const idx = colStartsWith(map, 'total expenditure');
      if (idx !== -1) totalExp = num(row[idx]);
    }

    supplyStaff = num(row[col(map, 'Supply Staff: E02 + E10 + E26', 'Supply Staff')]);
    if (supplyStaff == null) {
      // derive from E02 + E10 + E26 if present
      const e02 = num(row[col(map, 'E02 Supply teaching staff')]);
      const e10 = num(row[col(map, 'E10 Supply teacher insurance')]);
      const e26 = num(row[col(map, 'E26 Agency supply teaching staff')]);
      if (e02 != null || e10 != null || e26 != null) supplyStaff = (e02 || 0) + (e10 || 0) + (e26 || 0);
    }

    otherStaff = num(row[col(map, 'Other Staff Costs: (E07:E09) + E11', 'Other Staff Costs')]);
    totalStaff = num(row[col(map, 'Staff Total: (E01:E03) + E05 + (E07: E11) + E26', 'Staff Total')]);
    if (totalStaff == null) totalStaff = colStartsWith(map, 'staff total') !== -1 ? num(row[colStartsWith(map, 'staff total')]) : null;

    premises = num(row[col(map, 'Premises: (E12:E14) + E04 + E28b', 'Premises')]);
    if (premises == null) { const i = colStartsWith(map, 'premises:'); if (i !== -1) premises = num(row[i]); }

    maintenance = num(row[col(map, 'Maintenance & Improvement: E12 + E13', 'Maintenance & Improvement')]);
    if (maintenance == null) { const i = colStartsWith(map, 'maintenance'); if (i !== -1) maintenance = num(row[i]); }

    cateringExp = num(row[col(map, 'Catering Expenses: E06 + E25', 'Catering Expenses')]);
    if (cateringExp == null) { const i = colStartsWith(map, 'catering expenses'); if (i !== -1) cateringExp = num(row[i]); }

    reserves = num(row[col(map, 'Revenue Reserve: B01 + B02 + B06', 'Revenue Reserve')]);
    if (reserves == null) { const i = colStartsWith(map, 'revenue reserve'); if (i !== -1) reserves = num(row[i]); }

    surplusDeficit = num(row[col(map,
      'In-year Balance: Total Income (I01:I18 - E30) - Total Expenditure (E01:E29 + E31 + E32)',
      'In-year Balance', 'In year balance'
    )]);
    if (surplusDeficit == null) { const i = colStartsWith(map, 'in-year balance') !== -1 ? colStartsWith(map, 'in-year balance') : colStartsWith(map, 'in year balance'); if (i !== -1) surplusDeficit = num(row[i]); }

    totalFunding = num(row[col(map, 'Grant Funding: (I01:I07) + I15 + I16 + I18a/b/c/d', 'Grant Funding')]);
    if (totalFunding == null) { const i = colStartsWith(map, 'grant funding'); if (i !== -1) totalFunding = num(row[i]); }

    directGrants = num(row[col(map, 'Direct Grants: I01:I02 + I06:I07', 'Direct Grants')]);
    if (directGrants == null) { const i = colStartsWith(map, 'direct grants'); if (i !== -1) directGrants = num(row[i]); }

    selfGenerated = num(row[col(map, 'Self Generated Funding: (I08a/b:I13) + I17', 'Self Generated Funding')]);
    if (selfGenerated == null) { const i = colStartsWith(map, 'self generated'); if (i !== -1) selfGenerated = num(row[i]); }

    // Sometimes aggregate columns are missing — fall back to alternate "teaching" column name.
    if (teachingStaff == null) {
      const idx = col(map, 'Teaching Staff E01', 'Teaching staff');
      if (idx !== -1) teachingStaff = num(row[idx]);
    }
    if (educSupport == null) {
      const idx = col(map, 'Education support staff: E03', 'Education support staff');
      if (idx !== -1) educSupport = num(row[idx]);
    }
  } else {
    // AAR — labels are descriptive (no code prefixes in the cell, but row 0 has codes)
    teachingStaff = num(row[col(map, 'Teaching staff')]);
    educSupport = num(row[col(map, 'Education support staff')]);
    premisesStaff = num(row[col(map, 'Premises staff')]);
    adminStaff = num(row[col(map, 'Administrative and clerical staff')]);
    cateringStaff = num(row[col(map, 'Catering staff')]);
    pupilPremium = null; // AAR doesn't break out pupil premium separately
    senFunding = num(row[col(map, 'SEN funding')]);
    energy = num(row[col(map, 'Energy')]);
    learningResources = num(row[col(map, 'Learning resources (not ICT equipment)')]);

    totalIncome = num(row[col(map, 'Total Income')]);
    totalExp = num(row[col(map, 'Total Expenditure')]);
    supplyStaff = num(row[col(map, 'Supply Staff Costs')]);
    if (supplyStaff == null) supplyStaff = num(row[col(map, 'Supply teaching staff')]);
    otherStaff = num(row[col(map, 'Other Staff Costs')]);
    totalStaff = num(row[col(map, 'Total Staff Costs')]);
    premises = num(row[col(map, 'Premises Costs')]);
    maintenance = num(row[col(map, 'Maintenance & Improvement Costs')]);
    cateringExp = num(row[col(map, 'Catering Expenses')]);
    reserves = num(row[col(map, 'Revenue Reserve')]);
    surplusDeficit = num(row[col(map, 'In year balance', 'In-year balance')]);
    totalFunding = num(row[col(map, 'Total Grant Funding')]);
    directGrants = num(row[col(map, 'Direct Grants')]);
    selfGenerated = num(row[col(map, 'Total Self Generated Funding')]);
  }

  // Per-pupil derived (uses resolved pupil count that covers 2024-25's renamed column)
  const p = pupilsResolved;
  const incomePerPupil = p && totalIncome != null ? totalIncome / p : null;
  const expPerPupil = p && totalExp != null ? totalExp / p : null;
  const teachingPerPupil = p && teachingStaff != null ? teachingStaff / p : null;
  const supportPerPupil = p && educSupport != null ? educSupport / p : null;
  const avgTeacherCost = teachers && teachers > 0 && teachingStaff != null ? teachingStaff / teachers : null;

  return {
    urn,
    financial_year: fyLabel,
    academic_year_end: academicYearEnd(fyLabel),
    source,
    number_of_pupils: pupilsResolved,
    fte_teachers: teachers,
    phase: phase ? String(phase).slice(0, 64) : null,
    la_code: laCode ? String(laCode) : null,
    la_name: laName ? String(laName).slice(0, 128) : null,
    school_name: schoolName ? String(schoolName).slice(0, 256) : null,
    total_income_gbp: totalIncome,
    total_funding_gbp: totalFunding,
    pupil_premium_income_gbp: pupilPremium,
    sen_funding_gbp: senFunding,
    grants_income_gbp: directGrants,
    self_generated_income_gbp: selfGenerated,
    total_expenditure_gbp: totalExp,
    teaching_staff_gbp: teachingStaff,
    supply_staff_gbp: supplyStaff,
    education_support_gbp: educSupport,
    premises_staff_gbp: premisesStaff,
    admin_staff_gbp: adminStaff,
    catering_staff_gbp: cateringStaff,
    other_staff_gbp: otherStaff,
    total_staff_gbp: totalStaff,
    premises_gbp: premises,
    maintenance_gbp: maintenance,
    energy_gbp: energy,
    catering_expenses_gbp: cateringExp,
    learning_resources_gbp: learningResources,
    surplus_deficit_gbp: surplusDeficit,
    reserves_gbp: reserves,
    income_per_pupil_gbp: incomePerPupil,
    expenditure_per_pupil_gbp: expPerPupil,
    teaching_per_pupil_gbp: teachingPerPupil,
    support_per_pupil_gbp: supportPerPupil,
    avg_teacher_cost_gbp: avgTeacherCost,
    source_file: sourceFile,
  };
}

/** Process one xlsx file, return array of canonical rows */
function processWorkbook(filePath, source, fyLabel) {
  log(`Opening ${filePath}`);
  const wb = XLSX.readFile(filePath, { cellDates: false });
  // Pick the data sheet
  const candidates = wb.SheetNames.filter((n) =>
    source === 'CFR'
      ? /^(cfr[_ ]?data|cfr[_ ]?output|raw[_ ]?cfr[_ ]?data|maintained)/i.test(n)
      : /^academies/i.test(n)
  );
  const dataSheetName = candidates[0] || wb.SheetNames.slice(-1)[0];
  const sh = wb.Sheets[dataSheetName];
  const rows = XLSX.utils.sheet_to_json(sh, { header: 1, defval: null });
  const hdrRow = findHeaderRow(rows);
  if (hdrRow === -1) {
    log(`  WARN: could not locate header row in ${filePath} (sheet ${dataSheetName}) — skipping`);
    return [];
  }
  const map = buildColMap(rows[hdrRow]);
  log(`  sheet=${dataSheetName} hdr@${hdrRow} cols=${map.size} rows=${rows.length - hdrRow - 1}`);
  const out = [];
  for (let r = hdrRow + 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.every((c) => c == null || c === '')) continue;
    const rec = extractRow(row, map, source, fyLabel, filePath.split('/').slice(-1)[0]);
    if (rec) out.push(rec);
  }
  log(`  extracted ${out.length.toLocaleString()} records`);
  return out;
}

async function main() {
  log('Connecting to Postgres…');
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    const replace = process.argv.includes('--replace');
    if (replace) {
      log('--replace: truncating dfe_data.school_finance first');
      await client.query('TRUNCATE TABLE dfe_data.school_finance');
    }

    // Load valid URNs from dfe_data.schools (so we only keep schools we track)
    log('Loading valid URNs from dfe_data.schools…');
    const { rows: urnRows } = await client.query('SELECT urn FROM dfe_data.schools');
    const validUrns = new Set(urnRows.map((r) => Number(r.urn)));
    log(`  ${validUrns.size.toLocaleString()} valid URNs`);

    // Discover xlsx files in DATA_DIR
    const all = readdirSync(DATA_DIR).filter((f) => /\.xlsx$/i.test(f));
    const files = [];
    for (const f of all) {
      const m = f.match(/^(CFR|AAR)_(\d{4}-\d{2})\.xlsx$/);
      if (!m) continue;
      files.push({ path: join(DATA_DIR, f), source: m[1], fyLabel: m[2] });
    }
    files.sort((a, b) => a.fyLabel.localeCompare(b.fyLabel) || a.source.localeCompare(b.source));
    log(`Found ${files.length} workbooks to process`);

    let totalExtracted = 0;
    let totalInserted = 0;
    let totalSkippedUrn = 0;
    const perYear = new Map();

    for (const { path, source, fyLabel } of files) {
      try {
        const recs = processWorkbook(path, source, fyLabel);
        totalExtracted += recs.length;

        // Filter to URNs we track
        const before = recs.length;
        const kept = recs.filter((r) => validUrns.has(r.urn));
        const dropped = before - kept.length;
        totalSkippedUrn += dropped;
        log(`  kept ${kept.length.toLocaleString()} (dropped ${dropped.toLocaleString()} not in dfe_data.schools)`);

        // Batch insert — 1000 rows per statement
        const BATCH = 1000;
        let insertedThisFile = 0;
        const cols = [
          'urn','financial_year','academic_year_end','source','number_of_pupils','fte_teachers',
          'phase','la_code','la_name','school_name',
          'total_income_gbp','total_funding_gbp','pupil_premium_income_gbp','sen_funding_gbp',
          'grants_income_gbp','self_generated_income_gbp','total_expenditure_gbp',
          'teaching_staff_gbp','supply_staff_gbp','education_support_gbp','premises_staff_gbp',
          'admin_staff_gbp','catering_staff_gbp','other_staff_gbp','total_staff_gbp',
          'premises_gbp','maintenance_gbp','energy_gbp','catering_expenses_gbp','learning_resources_gbp',
          'surplus_deficit_gbp','reserves_gbp','income_per_pupil_gbp','expenditure_per_pupil_gbp',
          'teaching_per_pupil_gbp','support_per_pupil_gbp','avg_teacher_cost_gbp','source_file',
        ];
        for (let i = 0; i < kept.length; i += BATCH) {
          const chunk = kept.slice(i, i + BATCH);
          const placeholders = [];
          const values = [];
          chunk.forEach((r, idx) => {
            const base = idx * cols.length;
            placeholders.push(`(${cols.map((_, j) => `$${base + j + 1}`).join(',')})`);
            for (const c of cols) values.push(r[c] ?? null);
          });
          const sql = `INSERT INTO dfe_data.school_finance (${cols.join(',')}) VALUES ${placeholders.join(',')}
                      ON CONFLICT (urn, financial_year) DO NOTHING`;
          const res = await client.query(sql, values);
          insertedThisFile += res.rowCount || 0;
          if ((i + BATCH) % 5000 < BATCH) log(`    batch ${i + chunk.length}/${kept.length} inserted=${insertedThisFile}`);
        }
        totalInserted += insertedThisFile;
        perYear.set(`${fyLabel}:${source}`, { extracted: recs.length, kept: kept.length, inserted: insertedThisFile });
        log(`  -> inserted ${insertedThisFile.toLocaleString()} new rows`);
      } catch (err) {
        log(`  ERROR processing ${path}: ${err.message}`);
      }
    }

    log('=== SUMMARY ===');
    log(`Total records extracted: ${totalExtracted.toLocaleString()}`);
    log(`Total skipped (URN not in dfe_data.schools): ${totalSkippedUrn.toLocaleString()}`);
    log(`Total rows inserted: ${totalInserted.toLocaleString()}`);
    for (const [k, v] of perYear.entries()) {
      log(`  ${k}: extracted=${v.extracted} kept=${v.kept} inserted=${v.inserted}`);
    }

    const { rows: [{ c }] } = await client.query('SELECT COUNT(*)::bigint AS c FROM dfe_data.school_finance');
    log(`\ndfe_data.school_finance now has ${Number(c).toLocaleString()} rows`);

    // Year coverage
    const { rows: yearCoverage } = await client.query(
      `SELECT financial_year, source, COUNT(*)::bigint AS n
         FROM dfe_data.school_finance
         GROUP BY financial_year, source
         ORDER BY financial_year, source`
    );
    log('\nYear coverage:');
    for (const y of yearCoverage) log(`  ${y.financial_year} ${y.source}: ${Number(y.n).toLocaleString()}`);

    // Pennine + Impact sample
    log('\nPennine + Impact Education sample:');
    const { rows: sample } = await client.query(
      `SELECT s.name, f.financial_year, f.source, f.number_of_pupils,
              f.teaching_staff_gbp::bigint AS teaching,
              ROUND((f.teaching_staff_gbp / NULLIF(f.number_of_pupils, 0))::numeric, 0)::text AS teaching_pp,
              f.total_income_gbp::bigint AS income,
              ROUND((f.total_income_gbp / NULLIF(f.number_of_pupils, 0))::numeric, 0)::text AS income_pp,
              ROUND(f.avg_teacher_cost_gbp::numeric, 0)::text AS avg_tchr_cost
         FROM dfe_data.school_finance f
         JOIN dfe_data.schools s ON s.urn = f.urn
         WHERE s.trust_name IN ('PENNINE ACADEMIES YORKSHIRE', 'IMPACT EDUCATION MULTI ACADEMY TRUST')
         ORDER BY s.name, f.financial_year DESC
         LIMIT 80`
    );
    for (const r of sample) {
      console.log(`  ${r.name.padEnd(45)} ${r.financial_year} ${r.source} pupils=${r.number_of_pupils} teach=£${r.teaching || '?'} pp=£${r.teaching_pp || '?'} income=£${r.income || '?'} pp=£${r.income_pp || '?'} avgT=£${r.avg_tchr_cost || '?'}`);
    }

    log('\nDone.');
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
