import { NextRequest } from 'next/server';
import { protectedRoute, apiSuccess, apiError } from '@/lib/api-utils';
import { createServiceRoleClient } from '@/lib/supabase-server';
import type { Checkpoint, CohortPathway, CohortPassportData, CheckpointStatus } from '@/components/trust-assessor/CohortPassport';

/**
 * GET /api/trust-analysis/cohort-passport?urn=148201
 *
 * Returns cohort validation passports for a school identified by URN.
 * Each cohort tracks 5 key external checkpoints:
 *   EYFS GLD, Phonics Y1, Phonics Y2 retake, KS1 SATs, MTC Y4, Mid-year, KS2
 *
 * Gracefully handles missing tables (phonics_results, mtc_results may not be populated yet).
 */
export const GET = protectedRoute(async (_auth, req: NextRequest) => {
  // Note: cohort passport reads only DfE public data (KS2, phonics, MTC) — no school PII
  // org is optional here; URN-scoped queries don't require tenant isolation
  const urn = Number(req.nextUrl.searchParams.get('urn') ?? '');
  if (!urn || !Number.isFinite(urn)) {
    return apiError('urn query parameter is required', 400);
  }

  const supabase = createServiceRoleClient();

  // ── Check which DfE tables are available ──────────────────────────────────
  let phonicsAvailable = false;
  let mtcAvailable = false;

  try {
    const { data: tableCheck } = await supabase
      .rpc('check_dfe_tables_available' as never)
      .single() as { data: { phonics: boolean; mtc: boolean } | null };

    if (tableCheck) {
      phonicsAvailable = tableCheck.phonics ?? false;
      mtcAvailable = tableCheck.mtc ?? false;
    }
  } catch {
    // Tables might not exist — check via information_schema alternative
    // We'll try querying them and see if they return data
  }

  // ── Fetch KS2 data (fully external — always available) ────────────────────
  // Fetch all subjects for this URN so we can find the combined/RWM metric regardless of label
  const { data: ks2Raw, error: ks2Error } = await supabase
    .from('ks2_results')
    .select('urn, academic_year_end, subject, breakdown_topic, breakdown, expected_standard_pct, higher_standard_pct')
    .eq('urn', urn)
    .eq('breakdown_topic', 'All pupils')
    .order('academic_year_end', { ascending: true });

  if (ks2Error) {
    return apiError(`KS2 query failed: ${ks2Error.message}`, 500);
  }

  // ── Fetch phonics data (external test — may not be populated) ─────────────
  let phonicsRaw: Array<{ urn: number; academic_year_end: number; year_group: number; pass_pct: number }> = [];
  try {
    const { data, error } = await supabase
      .from('phonics_results')
      .select('urn, academic_year_end, year_group, pass_pct')
      .eq('urn', urn)
      .order('academic_year_end', { ascending: true });

    if (!error && data && data.length > 0) {
      phonicsRaw = data as typeof phonicsRaw;
      phonicsAvailable = true;
    }
  } catch {
    // Table doesn't exist yet — swallow gracefully
  }

  // ── Fetch MTC data (external test — may not be populated) ─────────────────
  let mtcRaw: Array<{ urn: number; academic_year_end: number; pass_pct: number }> = [];
  try {
    const { data, error } = await supabase
      .from('mtc_results')
      .select('urn, academic_year_end, pass_pct')
      .eq('urn', urn)
      .order('academic_year_end', { ascending: true });

    if (!error && data && data.length > 0) {
      mtcRaw = data as typeof mtcRaw;
      mtcAvailable = true;
    }
  } catch {
    // Table doesn't exist yet — swallow gracefully
  }

  // ── Build cohort pathways ─────────────────────────────────────────────────
  // Current academic year 2025/26 → year_end = 2026
  // Current Y6 started Reception in 2019/20 → receptionYear = 2019
  // Current Y5 → 2020, Y4 → 2021, Y3 → 2022, Y2 → 2023

  const CURRENT_YEAR_END = 2026; // academic year 2025/26

  // Academic year 2025/26 = year_end 2026
  // Current Y6 (started Reception 2019/20): KS2 year_end = 2026 — sitting exams now
  // Previous Y6 (started Reception 2018/19): KS2 year_end = 2025 — completed, data available
  // We show 6 cohorts: last completed Y6 plus current Y6 through Y2
  const COHORTS: Array<{ receptionYear: number; currentYearGroup: string }> = [
    { receptionYear: 2018, currentYearGroup: 'Y6 2024/25 (KS2 done)' },
    { receptionYear: 2019, currentYearGroup: 'Current Y6' },
    { receptionYear: 2020, currentYearGroup: 'Current Y5' },
    { receptionYear: 2021, currentYearGroup: 'Current Y4' },
    { receptionYear: 2022, currentYearGroup: 'Current Y3' },
    { receptionYear: 2023, currentYearGroup: 'Current Y2' },
  ];

  // Helper: get KS2 combined pct for a given academic_year_end
  // DfE uses several labels: "Reading, writing and maths", "combined", "RWM" etc.
  function getKs2Combined(yearEnd: number): number | null {
    const combinedLabels = ['combined', 'reading, writing and maths', 'rwm'];
    const row = ks2Raw?.find(
      (r) =>
        r.academic_year_end === yearEnd &&
        combinedLabels.some((label) => r.subject?.toLowerCase().includes(label))
    );
    return row?.expected_standard_pct ?? null;
  }

  // Helper: get phonics pass pct for year group (1 or 2) in a given academic_year_end
  function getPhonics(yearEnd: number, yearGroup: 1 | 2): number | null {
    if (!phonicsAvailable) return null;
    const row = phonicsRaw.find(
      (r) => r.academic_year_end === yearEnd && r.year_group === yearGroup
    );
    return row?.pass_pct ?? null;
  }

  // Helper: get MTC pass pct for academic_year_end
  function getMtc(yearEnd: number): number | null {
    if (!mtcAvailable) return null;
    const row = mtcRaw.find((r) => r.academic_year_end === yearEnd);
    return row?.pass_pct ?? null;
  }

  function fmt(pct: number): string {
    return `${Math.round(pct)}%`;
  }

  function academicYearLabel(start: number): string {
    return `${start}/${String(start + 1).slice(2)}`;
  }

  function isFuture(yearEnd: number): boolean {
    return yearEnd > CURRENT_YEAR_END;
  }

  // KS1 validation: external until 2022/23 (year_end = 2023), self-reported after
  function ks1ValidationStatus(yearEnd: number): CheckpointStatus {
    if (isFuture(yearEnd)) return 'future';
    if (yearEnd <= 2023) return 'external'; // moderated KS1 SATs
    return 'self-reported'; // optional assessment post-2023
  }

  const cohorts: CohortPathway[] = COHORTS.map(({ receptionYear, currentYearGroup }) => {
    // Year end dates for each checkpoint
    const receptionYearEnd = receptionYear + 1;   // EYFS: academic_year_end = receptionYear + 1
    const y1YearEnd = receptionYear + 2;           // Phonics Y1
    const y2YearEnd = receptionYear + 3;           // Phonics Y2 retake + KS1
    const y4YearEnd = receptionYear + 5;           // MTC Y4
    const y6YearEnd = receptionYear + 7;           // KS2

    // ── EYFS GLD ──────────────────────────────────────────────────────────
    const eyfsFuture = isFuture(receptionYearEnd);
    const eyfsCheckpoint: Checkpoint = {
      id: 'eyfs-gld',
      label: 'EYFS GLD',
      yearGroup: 'Reception',
      academicYearLabel: academicYearLabel(receptionYear),
      validation: eyfsFuture ? 'future' : 'self-reported',
      value: null, // EYFS GLD % not in DfE school-level public data
      source: 'Teacher assessment, statutory moderated sample. DfE publish national % but not per-school in public dataset.',
      note: eyfsFuture ? undefined : 'Teacher-assessed. Moderated sample provides partial external check.',
    };

    // ── Phonics Y1 ────────────────────────────────────────────────────────
    const phonicsY1Future = isFuture(y1YearEnd);
    const phonicsY1Value = getPhonics(y1YearEnd, 1);
    const phonicsY1Checkpoint: Checkpoint = {
      id: 'phonics-y1',
      label: 'Phonics Y1',
      yearGroup: 'Year 1',
      academicYearLabel: academicYearLabel(receptionYear + 1),
      validation: phonicsY1Future
        ? 'future'
        : !phonicsAvailable
        ? 'loading'
        : phonicsY1Value !== null
        ? 'external'
        : 'no-data',
      value: phonicsY1Value !== null ? fmt(phonicsY1Value) : null,
      source: 'DfE phonics_results table (externally marked by DfE)',
      note: !phonicsAvailable && !phonicsY1Future ? 'External data loading from DfE sources' : undefined,
    };

    // ── Phonics Y2 retake ─────────────────────────────────────────────────
    const phonicsY2Future = isFuture(y2YearEnd);
    const phonicsY2Value = getPhonics(y2YearEnd, 2);
    const phonicsY2Checkpoint: Checkpoint = {
      id: 'phonics-y2',
      label: 'Phonics Y2 retake',
      yearGroup: 'Year 2',
      academicYearLabel: academicYearLabel(receptionYear + 2),
      validation: phonicsY2Future
        ? 'future'
        : !phonicsAvailable
        ? 'loading'
        : phonicsY2Value !== null
        ? 'external'
        : 'no-data',
      value: phonicsY2Value !== null ? fmt(phonicsY2Value) : null,
      source: 'DfE phonics_results table — Year 2 retake for pupils who did not pass Y1',
      note: !phonicsAvailable && !phonicsY2Future ? 'External data loading from DfE sources' : undefined,
    };

    // ── KS1 SATs ──────────────────────────────────────────────────────────
    const ks1Future = isFuture(y2YearEnd);
    const ks1Status = ks1ValidationStatus(y2YearEnd);
    const ks1Checkpoint: Checkpoint = {
      id: 'ks1',
      label: 'KS1 SATs',
      yearGroup: 'Year 2',
      academicYearLabel: academicYearLabel(receptionYear + 2),
      validation: ks1Status,
      value: null, // ks1_results table not yet populated — note this
      source: y2YearEnd <= 2023
        ? 'KS1 SATs externally standardised until 2022/23 (year ending 2023). DfE ks1_results table — import pending.'
        : 'KS1 became optional from 2023/24. Now a teacher assessment with no external moderation requirement.',
      note: ks1Status === 'external'
        ? 'Externally standardised — but DfE school-level KS1 data not yet in this dataset'
        : ks1Status === 'self-reported'
        ? 'Optional from 2023/24 — teacher assessment only, no external moderation'
        : undefined,
    };

    // ── MTC Y4 ────────────────────────────────────────────────────────────
    const mtcFuture = isFuture(y4YearEnd);
    const mtcValue = getMtc(y4YearEnd);
    const mtcCheckpoint: Checkpoint = {
      id: 'mtc-y4',
      label: 'MTC Y4',
      yearGroup: 'Year 4',
      academicYearLabel: academicYearLabel(receptionYear + 4),
      validation: mtcFuture
        ? 'future'
        : !mtcAvailable
        ? 'loading'
        : mtcValue !== null
        ? 'external'
        : 'no-data',
      value: mtcValue !== null ? fmt(mtcValue) : null,
      source: 'DfE mtc_results table — Multiplication Tables Check (externally administered online)',
      note: !mtcAvailable && !mtcFuture ? 'External data loading from DfE sources' : undefined,
    };

    // ── Mid-year (self-reported) ───────────────────────────────────────────
    // We mark this as self-reported — values come from the trust spreadsheet
    const midYearCheckpoint: Checkpoint = {
      id: 'mid-year',
      label: 'Mid-year assessments',
      yearGroup: 'Y3–Y5',
      academicYearLabel: `${academicYearLabel(receptionYear + 3)}–${academicYearLabel(receptionYear + 5)}`,
      validation: 'self-reported',
      value: null, // Spreadsheet values not piped to this API — shown from page-level data
      source: 'Trust internal assessment spreadsheet. No external moderation. Subject to assessment drift.',
      note: 'This is the four-year blind spot. Teacher judgement only.',
    };

    // ── KS2 ───────────────────────────────────────────────────────────────
    const ks2Future = isFuture(y6YearEnd);
    const ks2Value = ks2Future ? null : getKs2Combined(y6YearEnd);
    const ks2Checkpoint: Checkpoint = {
      id: 'ks2',
      label: 'KS2 SATs',
      yearGroup: 'Year 6',
      academicYearLabel: academicYearLabel(receptionYear + 6),
      validation: ks2Future ? 'future' : ks2Value !== null ? 'external' : 'no-data',
      value: ks2Value !== null ? fmt(ks2Value) : null,
      source: 'DfE ks2_results table — externally marked by markers independent of school',
    };

    return {
      receptionYear,
      cohortLabel: `${currentYearGroup} (started ${academicYearLabel(receptionYear)})`,
      currentYearGroup,
      checkpoints: [
        eyfsCheckpoint,
        phonicsY1Checkpoint,
        phonicsY2Checkpoint,
        ks1Checkpoint,
        mtcCheckpoint,
        midYearCheckpoint,
        ks2Checkpoint,
      ],
    };
  });

  const result: CohortPassportData = {
    cohorts,
    phonicsAvailable,
    mtcAvailable,
  };

  return apiSuccess(result);
}, { orgOptional: true });
