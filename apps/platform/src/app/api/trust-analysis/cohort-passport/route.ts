import { NextRequest } from 'next/server';
import { protectedRoute, apiSuccess, apiError } from '@/lib/api-utils';
import { createServiceRoleClient } from '@/lib/supabase-server';
import type { Checkpoint, CohortPathway, CohortPassportData, CheckpointStatus } from '@/components/trust-assessor/CohortPassport';

/**
 * GET /api/trust-analysis/cohort-passport?urn=148201
 *
 * Returns cohort validation passports for a school identified by URN.
 * Each cohort tracks 7 key checkpoints:
 *   EYFS GLD, Phonics Y1, Phonics Y2 retake, KS1 SATs, MTC Y4, Mid-year, KS2
 *
 * Phonics and KS1 data: DfE does NOT publish per-school phonics/MTC/KS1 data.
 * Schools hold this privately. We source it from pupil_assessments_pseudo (CTF uploads).
 * This is Schoolgle's moat — no competitor can show this without CTF ingestion.
 *
 * Validation tiers:
 *   'external'     — data comes from CTF/external test (school provided, externally administered)
 *   'self-reported' — teacher assessment only, no external moderation
 *   'locked'       — school has this data but hasn't connected CTF to Schoolgle yet (Tier 3 upsell)
 *   'no-data'      — data should exist but isn't available for any reason
 *   'future'       — cohort hasn't reached this checkpoint yet
 */
export const GET = protectedRoute(async (_auth, req: NextRequest) => {
  const urn = Number(req.nextUrl.searchParams.get('urn') ?? '');
  if (!urn || !Number.isFinite(urn)) {
    return apiError('urn query parameter is required', 400);
  }

  const supabase = createServiceRoleClient();

  // ── Resolve organization_id for this URN ──────────────────────────────────
  // We look up the org that has CTF data for this URN via the dfe_data.schools table
  // and then cross-reference with organizations that have uploaded CTF data.
  // For now: resolve org by checking which orgs have pupil_assessments_pseudo data
  // scoped to this URN's school. We use a lookup from dfe_data.schools → organizations.
  // Fallback: no org found → phonics/KS1 shows 'locked' (Tier 3 upsell).

  let ctfOrgId: string | null = null;

  try {
    // Find the organization that has uploaded CTF data that likely belongs to this URN.
    // We detect this by joining schools.urn against a known mapping.
    // In production, schools would register their URN when onboarding.
    // For the demo: Grove House URN 148201 maps to org d9d1ac2c-5eff-4043-98f4-e1c43f616fd3.
    const { data: orgMapping } = await supabase
      .from('organizations')
      .select('id, urn')
      .eq('urn', urn)
      .maybeSingle();

    if (orgMapping?.id) {
      // Org has registered this URN — check if they have CTF data
      const { count } = await supabase
        .from('pupil_assessments_pseudo')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgMapping.id)
        .eq('subject', 'phonics');

      if (count && count > 0) {
        ctfOrgId = orgMapping.id;
      }
    }
  } catch {
    // org lookup failed — swallow, fall through to locked state
  }

  // No hardcoded fallback — if the org→URN mapping above didn't find CTF data,
  // the passport simply reports "locked" for CTF-derived sections. Any school
  // that wants to unlock it uploads CTF data; we look up their org by URN.

  const hasCTF = ctfOrgId !== null;

  // ── Fetch CTF phonics data ────────────────────────────────────────────────
  // Keyed by (academic_year_start, year_group)
  type PhonicsAgg = { pass_pct: number; pupil_count: number };
  const phonicsMap = new Map<string, PhonicsAgg>();

  if (hasCTF && ctfOrgId) {
    try {
      const { data: phonicsRows } = await supabase
        .from('pupil_assessments_pseudo')
        .select('academic_year_start, year_group, scaled_score')
        .eq('organization_id', ctfOrgId)
        .eq('subject', 'phonics')
        .not('scaled_score', 'is', null);

      if (phonicsRows && phonicsRows.length > 0) {
        // Aggregate in JS — group by (academic_year_start, year_group)
        const groups = new Map<string, { total: number; passed: number }>();
        for (const row of phonicsRows) {
          const key = `${row.academic_year_start}_${row.year_group}`;
          if (!groups.has(key)) groups.set(key, { total: 0, passed: 0 });
          const g = groups.get(key)!;
          g.total++;
          if ((row.scaled_score as number) >= 32) g.passed++;
        }
        for (const [key, { total, passed }] of groups) {
          phonicsMap.set(key, {
            pass_pct: total > 0 ? Math.round((passed / total) * 100) : 0,
            pupil_count: total,
          });
        }
      }
    } catch {
      // swallow — CTF query failed, fall through to locked
    }
  }

  // ── Fetch CTF KS1 data ────────────────────────────────────────────────────
  // KS1 reading/writing/maths from pupil_assessments_pseudo (year_group=2)
  // Only meaningful for academic_year_start <= 2022 (last year KS1 was statutory/moderated)
  // After 2022/23 it's optional — still valuable as self-reported
  type KS1Agg = { reading_pct: number | null; writing_pct: number | null; maths_pct: number | null; pupil_count: number };
  const ks1Map = new Map<string, KS1Agg>();

  if (hasCTF && ctfOrgId) {
    try {
      const { data: ks1Rows } = await supabase
        .from('pupil_assessments_pseudo')
        .select('academic_year_start, subject, attainment_level')
        .eq('organization_id', ctfOrgId)
        .eq('year_group', 2)
        .in('subject', ['reading', 'writing', 'maths'])
        .not('attainment_level', 'is', null);

      if (ks1Rows && ks1Rows.length > 0) {
        // Group by academic_year_start, subject
        const groups = new Map<string, Map<string, { total: number; expected: number }>>();
        for (const row of ks1Rows) {
          const yearKey = String(row.academic_year_start);
          if (!groups.has(yearKey)) groups.set(yearKey, new Map());
          const subjects = groups.get(yearKey)!;
          if (!subjects.has(row.subject)) subjects.set(row.subject, { total: 0, expected: 0 });
          const s = subjects.get(row.subject)!;
          s.total++;
          if (['EXS', 'GDS'].includes(row.attainment_level as string)) s.expected++;
        }
        for (const [yearKey, subjects] of groups) {
          const reading = subjects.get('reading');
          const writing = subjects.get('writing');
          const maths = subjects.get('maths');
          // pupil count = max across subjects (same cohort)
          const pupilCount = Math.max(
            reading?.total ?? 0,
            writing?.total ?? 0,
            maths?.total ?? 0
          );
          ks1Map.set(yearKey, {
            reading_pct: reading ? Math.round((reading.expected / reading.total) * 100) : null,
            writing_pct: writing ? Math.round((writing.expected / writing.total) * 100) : null,
            maths_pct: maths ? Math.round((maths.expected / maths.total) * 100) : null,
            pupil_count: pupilCount,
          });
        }
      }
    } catch {
      // swallow
    }
  }

  // ── Fetch KS2 data (DfE public — always available) ───────────────────────
  const { data: ks2Raw, error: ks2Error } = await supabase
    .from('ks2_results')
    .select('urn, academic_year_end, subject, breakdown_topic, breakdown, expected_standard_pct, higher_standard_pct')
    .eq('urn', urn)
    .eq('breakdown_topic', 'All pupils')
    .order('academic_year_end', { ascending: true });

  if (ks2Error) {
    return apiError(`KS2 query failed: ${ks2Error.message}`, 500);
  }

  // ── Build cohort pathways ─────────────────────────────────────────────────
  const CURRENT_YEAR_END = 2026; // academic year 2025/26

  const COHORTS: Array<{ receptionYear: number; currentYearGroup: string }> = [
    { receptionYear: 2018, currentYearGroup: 'Y6 2024/25 (KS2 done)' },
    { receptionYear: 2019, currentYearGroup: 'Current Y6' },
    { receptionYear: 2020, currentYearGroup: 'Current Y5' },
    { receptionYear: 2021, currentYearGroup: 'Current Y4' },
    { receptionYear: 2022, currentYearGroup: 'Current Y3' },
    { receptionYear: 2023, currentYearGroup: 'Current Y2' },
  ];

  // Helper: get KS2 combined pct for a given academic_year_end
  function getKs2Combined(yearEnd: number): number | null {
    const combinedLabels = ['combined', 'reading, writing and maths', 'rwm'];
    const row = ks2Raw?.find(
      (r) =>
        r.academic_year_end === yearEnd &&
        combinedLabels.some((label) => r.subject?.toLowerCase().includes(label))
    );
    return row?.expected_standard_pct ?? null;
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

  // KS1 validation: external until 2022/23 (academic_year_start = 2022), self-reported after
  function ks1ValidationStatus(academicYearStart: number): CheckpointStatus {
    const yearEnd = academicYearStart + 1;
    if (isFuture(yearEnd)) return 'future';
    if (academicYearStart <= 2022) return 'external'; // moderated KS1 SATs
    return 'self-reported'; // optional assessment post-2022/23
  }

  const cohorts: CohortPathway[] = COHORTS.map(({ receptionYear, currentYearGroup }) => {
    // academic_year_start for each checkpoint
    const y1AcademicStart = receptionYear + 1;   // Phonics Y1 (child is in Y1 during this academic year)
    const y2AcademicStart = receptionYear + 2;   // Phonics Y2 retake + KS1

    // year_end equivalents for future detection
    const receptionYearEnd = receptionYear + 1;
    const y1YearEnd = receptionYear + 2;
    const y2YearEnd = receptionYear + 3;
    const y4YearEnd = receptionYear + 5;
    const y6YearEnd = receptionYear + 7;

    // ── EYFS GLD ──────────────────────────────────────────────────────────
    const eyfsFuture = isFuture(receptionYearEnd);
    const eyfsCheckpoint: Checkpoint = {
      id: 'eyfs-gld',
      label: 'EYFS GLD',
      yearGroup: 'Reception',
      academicYearLabel: academicYearLabel(receptionYear),
      validation: eyfsFuture ? 'future' : 'self-reported',
      value: null,
      source: 'Teacher assessment, statutory moderated sample. DfE publish national % but not per-school in public dataset.',
      note: eyfsFuture ? undefined : 'Teacher-assessed. Moderated sample provides partial external check.',
    };

    // ── Phonics Y1 ────────────────────────────────────────────────────────
    // DfE does NOT publish per-school phonics. Schools hold this via MTC Service / PAG.
    // We source from CTF (pupil_assessments_pseudo). This is Schoolgle's moat.
    const phonicsY1Future = isFuture(y1YearEnd);
    const phonicsY1Key = `${y1AcademicStart}_1`;
    const phonicsY1Data = phonicsMap.get(phonicsY1Key);

    let phonicsY1Status: CheckpointStatus;
    let phonicsY1Value: string | null = null;
    let phonicsY1Note: string | undefined;

    if (phonicsY1Future) {
      phonicsY1Status = 'future';
    } else if (phonicsY1Data) {
      phonicsY1Status = 'external';
      phonicsY1Value = `${fmt(phonicsY1Data.pass_pct)} (n=${phonicsY1Data.pupil_count})`;
      phonicsY1Note = 'Pass mark: 32/40. From CTF file — externally administered by DfE.';
    } else if (!hasCTF) {
      phonicsY1Status = 'locked';
      phonicsY1Note = 'Connect CTF files to unlock this checkpoint.';
    } else {
      phonicsY1Status = 'no-data';
      phonicsY1Note = 'CTF connected but no phonics data for this cohort year.';
    }

    const phonicsY1Checkpoint: Checkpoint = {
      id: 'phonics-y1',
      label: 'Phonics Y1',
      yearGroup: 'Year 1',
      academicYearLabel: academicYearLabel(y1AcademicStart),
      validation: phonicsY1Status,
      value: phonicsY1Value,
      source: 'DfE Phonics Screening Check — externally administered, NOT published per school. Schools hold results via Primary Assessment Gateway. Schoolgle surfaces this via CTF ingestion.',
      note: phonicsY1Note,
    };

    // ── Phonics Y2 retake ─────────────────────────────────────────────────
    const phonicsY2Future = isFuture(y2YearEnd);
    const phonicsY2Key = `${y2AcademicStart}_2`;
    const phonicsY2Data = phonicsMap.get(phonicsY2Key);

    let phonicsY2Status: CheckpointStatus;
    let phonicsY2Value: string | null = null;
    let phonicsY2Note: string | undefined;

    if (phonicsY2Future) {
      phonicsY2Status = 'future';
    } else if (phonicsY2Data) {
      phonicsY2Status = 'external';
      phonicsY2Value = `${fmt(phonicsY2Data.pass_pct)} (n=${phonicsY2Data.pupil_count})`;
      phonicsY2Note = 'Pass mark: 32/40. Y2 retake only — pupils who did not pass Y1.';
    } else if (!hasCTF) {
      phonicsY2Status = 'locked';
      phonicsY2Note = 'Connect CTF files to unlock this checkpoint.';
    } else {
      phonicsY2Status = 'no-data';
      phonicsY2Note = 'CTF connected but no phonics retake data for this cohort year.';
    }

    const phonicsY2Checkpoint: Checkpoint = {
      id: 'phonics-y2',
      label: 'Phonics Y2 retake',
      yearGroup: 'Year 2',
      academicYearLabel: academicYearLabel(y2AcademicStart),
      validation: phonicsY2Status,
      value: phonicsY2Value,
      source: 'DfE Phonics Screening Check Year 2 retake — NOT published per school. Sourced from CTF.',
      note: phonicsY2Note,
    };

    // ── KS1 SATs ──────────────────────────────────────────────────────────
    // KS1 became non-statutory from 2023/24 (academic_year_start = 2023).
    // Pre-2023: externally standardised, but DfE doesn't publish school-level data.
    // We source from CTF (pupil_assessments_pseudo year_group=2).
    const ks1Future = isFuture(y2YearEnd);
    const ks1AcademicYearStart = y2AcademicStart;
    const ks1Status = ks1ValidationStatus(ks1AcademicYearStart);
    const ks1Data = ks1Map.get(String(ks1AcademicYearStart));

    let ks1DisplayValue: string | null = null;
    let ks1Note: string | undefined;
    let ks1FinalStatus: CheckpointStatus = ks1Status;

    if (ks1Future) {
      ks1FinalStatus = 'future';
    } else if (ks1Data) {
      // Show R/W/M summary
      const parts: string[] = [];
      if (ks1Data.reading_pct !== null) parts.push(`R:${ks1Data.reading_pct}%`);
      if (ks1Data.writing_pct !== null) parts.push(`W:${ks1Data.writing_pct}%`);
      if (ks1Data.maths_pct !== null) parts.push(`M:${ks1Data.maths_pct}%`);
      ks1DisplayValue = parts.join(' ');
      ks1Note = ks1AcademicYearStart <= 2022
        ? 'Externally standardised until 2022/23. From CTF.'
        : 'Optional from 2023/24 — teacher assessment, no external moderation. From CTF.';
    } else if (!hasCTF && !ks1Future) {
      ks1FinalStatus = 'locked';
      ks1Note = 'Connect CTF files to unlock KS1 R/W/M data.';
    } else if (!ks1Future) {
      ks1FinalStatus = 'no-data';
      ks1Note = 'KS1 data not found in CTF for this cohort.';
    }

    const ks1Checkpoint: Checkpoint = {
      id: 'ks1',
      label: 'KS1 SATs',
      yearGroup: 'Year 2',
      academicYearLabel: academicYearLabel(ks1AcademicYearStart),
      validation: ks1FinalStatus,
      value: ks1DisplayValue,
      source: ks1AcademicYearStart <= 2022
        ? 'KS1 SATs externally standardised until 2022/23. DfE does NOT publish school-level KS1. Sourced from CTF.'
        : 'KS1 became optional from 2023/24. Teacher assessment only. Sourced from CTF if uploaded.',
      note: ks1Note,
    };

    // ── MTC Y4 ────────────────────────────────────────────────────────────
    // MTC: DfE explicitly states they don't publish school-level MTC results.
    // Would need CTF or MTC Service export. Currently no CTF data for MTC.
    const mtcFuture = isFuture(y4YearEnd);
    const mtcCheckpoint: Checkpoint = {
      id: 'mtc-y4',
      label: 'MTC Y4',
      yearGroup: 'Year 4',
      academicYearLabel: academicYearLabel(receptionYear + 4),
      validation: mtcFuture ? 'future' : hasCTF ? 'no-data' : 'locked',
      value: null,
      source: 'DfE Multiplication Tables Check — NOT published per school. Schools access results via MTC Service. Schoolgle could surface this via CTF or MTC export.',
      note: mtcFuture
        ? undefined
        : hasCTF
        ? 'MTC data not yet in CTF for this school. Ask school to export from MTC Service.'
        : 'Connect CTF or MTC Service export to unlock this checkpoint.',
    };

    // ── Mid-year (self-reported) ───────────────────────────────────────────
    const midYearCheckpoint: Checkpoint = {
      id: 'mid-year',
      label: 'Mid-year assessments',
      yearGroup: 'Y3–Y5',
      academicYearLabel: `${academicYearLabel(receptionYear + 3)}–${academicYearLabel(receptionYear + 5)}`,
      validation: 'self-reported',
      value: null,
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
      source: 'DfE ks2_results table — externally marked. Publicly available per school.',
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
    phonicsAvailable: hasCTF && phonicsMap.size > 0,
    mtcAvailable: false,
    hasCTF,
  };

  return apiSuccess(result);
}, { orgOptional: true });
