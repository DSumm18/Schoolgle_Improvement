import { NextRequest, NextResponse } from 'next/server';
import { protectedRoute, apiSuccess, apiError } from '@/lib/api-utils';
import { createServiceRoleClient } from '@/lib/supabase-server';

// Generate a friendly pseudonym from a hash — deterministic so same hash = same name
const COLOURS = ['Red', 'Blue', 'Green', 'Gold', 'Silver', 'Amber', 'Coral', 'Jade', 'Rose', 'Sage', 'Teal', 'Plum', 'Ruby', 'Onyx', 'Fern', 'Dove', 'Wren', 'Lark', 'Clay', 'Dusk'];
const ANIMALS = ['Robin', 'Falcon', 'Otter', 'Badger', 'Heron', 'Swift', 'Finch', 'Wren', 'Lark', 'Fox', 'Deer', 'Owl', 'Jay', 'Bear', 'Wolf', 'Hawk', 'Pike', 'Seal', 'Moth', 'Bee'];

function pseudonymFromHash(hash: string): string {
  const n = parseInt(hash.slice(0, 8), 16);
  const colour = COLOURS[n % COLOURS.length];
  const animal = ANIMALS[Math.floor(n / COLOURS.length) % ANIMALS.length];
  // Append a short numeric suffix from later hash bytes to avoid collisions
  const suffix = parseInt(hash.slice(8, 12), 16) % 100;
  return `${colour} ${animal} ${suffix}`;
}

/**
 * GET /api/trust-analysis/grove-house
 * Authenticated route — returns per-pupil aggregated analytics from CTF assessment data.
 * Scoped to the logged-in user's organization.
 * All data is pseudonymised — no PII returned.
 */
export const GET = protectedRoute(async (auth, _req: NextRequest) => {
  try {
    const supabase = createServiceRoleClient();
    // Use the authenticated user's organization, not a hardcoded ID
    const ORG_ID = auth.organizationId;

    // Paginated fetch — override default 1000-row Supabase limit
    let allRecords: Record<string, unknown>[] = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data: batch, error: batchError } = await supabase
        .from('pupil_assessments_pseudo')
        .select('pupil_hash, year_group, subject, attainment_level, scaled_score, is_fsm, is_send, is_eal, gender, academic_year_start, assessment_period')
        .eq('organization_id', ORG_ID)
        .order('academic_year_start')
        .order('year_group')
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (batchError) {
        return apiError(batchError.message, 500);
      }

      allRecords = allRecords.concat(batch ?? []);
      hasMore = (batch?.length ?? 0) === pageSize;
      page++;
    }

    const records = allRecords;

    // ─── 1. EYFS GLD Trend ───────────────────────────────────────────
    const eyfsYears = [...new Set(records.filter(r => r.year_group === 0).map(r => r.academic_year_start as number))].sort();

    const eyfsGld = eyfsYears.map(year => {
      const yearRecords = records.filter(r => r.year_group === 0 && r.academic_year_start === year);
      const pupils = [...new Set(yearRecords.map(r => r.pupil_hash as string))];
      const pupilLevels = pupils.map(hash => {
        const pupilRecords = yearRecords.filter(r => r.pupil_hash === hash);
        const allExpected = pupilRecords.every(r => r.attainment_level === '2');
        return { hash, gld: allExpected, assessments: pupilRecords.length };
      });
      const gldCount = pupilLevels.filter(p => p.gld).length;
      return {
        year: year,
        pupils: pupils.length,
        gldCount,
        gldPct: pupils.length > 0 ? Math.round(100 * gldCount / pupils.length) : 0,
      };
    });

    // ─── 2. EYFS Area Breakdown ─────────────────────────────────────
    const EYFS_AREAS = [
      'communication_and_language',
      'literacy',
      'maths',
      'personal_social_emotional',
      'physical_development',
      'understanding_the_world',
      'expressive_arts',
    ];

    const eyfsAreas = eyfsYears.map(year => {
      const yearRecords = records.filter(r => r.year_group === 0 && r.academic_year_start === year);
      const areas: Record<string, { expected: number; emerging: number; total: number; pctExpected: number }> = {};

      for (const area of EYFS_AREAS) {
        // Match by subject — CTF subjects may be abbreviated; try both full and shorthand
        const areaRecords = yearRecords.filter(r => {
          const s = (r.subject as string ?? '').toLowerCase();
          return s === area || s === area.split('_')[0] || area.startsWith(s);
        });

        if (areaRecords.length === 0) {
          areas[area] = { expected: 0, emerging: 0, total: 0, pctExpected: 0 };
          continue;
        }

        const expected = areaRecords.filter(r => r.attainment_level === '2').length;
        const emerging = areaRecords.filter(r => r.attainment_level === '1').length;
        const total = areaRecords.length;

        areas[area] = {
          expected,
          emerging,
          total,
          pctExpected: total > 0 ? Math.round(100 * expected / total) : 0,
        };
      }

      return { year: year, areas };
    });

    // ─── 3. KS1 by year and subject ─────────────────────────────────
    const ks1Years = [...new Set(
      records
        .filter(r => r.year_group === 2 && ['reading', 'writing', 'maths'].includes(r.subject as string))
        .map(r => r.academic_year_start as number)
    )].sort();

    const ks1Data = ks1Years.map(year => {
      const subjects: Record<string, { total: number; wts: number; exs: number; gds: number }> = {};
      for (const subj of ['reading', 'writing', 'maths']) {
        const subjRecords = records.filter(r => r.year_group === 2 && r.subject === subj && r.academic_year_start === year);
        subjects[subj] = {
          total: subjRecords.length,
          wts: subjRecords.filter(r => ['WTS', 'WT', 'PK1', 'PK2', 'PK3', 'PK4'].includes(r.attainment_level as string ?? '')).length,
          exs: subjRecords.filter(r => r.attainment_level === 'EXS').length,
          gds: subjRecords.filter(r => r.attainment_level === 'GDS').length,
        };
      }
      const pupils = [...new Set(
        records
          .filter(r => r.year_group === 2 && ['reading', 'writing', 'maths'].includes(r.subject as string) && r.academic_year_start === year)
          .map(r => r.pupil_hash as string)
      )].length;
      return { year: year, pupils, subjects };
    });

    // ─── 4. KS1 Year-over-Year Movement ─────────────────────────────
    // For each pupil who has KS1 data in consecutive years, track level movement
    const ks1Movement: {
      year: number;
      writing: { wtsToExs: number; exsToGds: number; stayedWts: number; stayedExs: number; regression: number };
      reading: { wtsToExs: number; exsToGds: number; stayedWts: number; stayedExs: number; regression: number };
      maths:   { wtsToExs: number; exsToGds: number; stayedWts: number; stayedExs: number; regression: number };
    }[] = [];

    for (let i = 1; i < ks1Years.length; i++) {
      const prevYear = ks1Years[i - 1];
      const currYear = ks1Years[i];
      const movement: typeof ks1Movement[number] = {
        year: currYear,
        writing: { wtsToExs: 0, exsToGds: 0, stayedWts: 0, stayedExs: 0, regression: 0 },
        reading: { wtsToExs: 0, exsToGds: 0, stayedWts: 0, stayedExs: 0, regression: 0 },
        maths:   { wtsToExs: 0, exsToGds: 0, stayedWts: 0, stayedExs: 0, regression: 0 },
      };

      for (const subj of ['writing', 'reading', 'maths'] as const) {
        const prevRecords = records.filter(r => r.year_group === 2 && r.subject === subj && r.academic_year_start === prevYear);
        const currRecords = records.filter(r => r.year_group === 2 && r.subject === subj && r.academic_year_start === currYear);
        const prevMap = new Map(prevRecords.map(r => [r.pupil_hash as string, r.attainment_level as string]));

        for (const curr of currRecords) {
          const prev = prevMap.get(curr.pupil_hash as string);
          if (!prev) continue;
          const levelOf = (l: string) => l === 'GDS' ? 2 : l === 'EXS' ? 1 : 0;
          const pl = levelOf(prev);
          const cl = levelOf(curr.attainment_level as string ?? '');

          if (pl === 0 && cl === 1) movement[subj].wtsToExs++;
          else if (pl === 1 && cl === 2) movement[subj].exsToGds++;
          else if (pl === 0 && cl === 0) movement[subj].stayedWts++;
          else if (pl === 1 && cl === 1) movement[subj].stayedExs++;
          else if (cl < pl) movement[subj].regression++;
        }
      }

      ks1Movement.push(movement);
    }

    // ─── 5. Phonics with score bands ────────────────────────────────
    const phonicsRecords = records.filter(r => r.subject === 'phonics');
    const phonicsYears = [...new Set(phonicsRecords.map(r => r.academic_year_start as number))].sort();

    const phonicsData = phonicsYears.map(year => {
      const yearRecords = phonicsRecords.filter(r => r.academic_year_start === year);
      const pupils = [...new Set(yearRecords.map(r => r.pupil_hash as string))].length;
      const passed = yearRecords.filter(r => {
        const score = Number(r.scaled_score);
        if (!isNaN(score)) return score >= 32;
        // Fallback: attainment_level not WT/WTS = pass
        return r.attainment_level !== 'WT' && r.attainment_level !== 'WTS' && r.attainment_level !== null;
      }).length;
      const total = yearRecords.length;

      // Score bands
      const scoreBands = { band0to19: 0, band20to31: 0, band32plus: 0, noScore: 0 };
      for (const r of yearRecords) {
        const score = Number(r.scaled_score);
        if (isNaN(score)) { scoreBands.noScore++; continue; }
        if (score < 20) scoreBands.band0to19++;
        else if (score < 32) scoreBands.band20to31++;
        else scoreBands.band32plus++;
      }

      return { year: year, pupils, total, passed, passPct: total > 0 ? Math.round(100 * passed / total) : 0, scoreBands };
    });

    // ─── 6. Cohort journey tracking ─────────────────────────────────
    const pupilYears = new Map<string, { years: number[]; yearGroups: number[] }>();
    for (const r of records) {
      const existing = pupilYears.get(r.pupil_hash as string);
      if (existing) {
        if (!existing.years.includes(r.academic_year_start as number)) existing.years.push(r.academic_year_start as number);
        if (!existing.yearGroups.includes(r.year_group as number)) existing.yearGroups.push(r.year_group as number);
      } else {
        pupilYears.set(r.pupil_hash as string, { years: [r.academic_year_start as number], yearGroups: [r.year_group as number] });
      }
    }

    // ─── 6b. Cohort Milestones — assessment milestones approach ──────
    // National benchmarks (approximate, hardcoded)
    const NATIONAL_BENCHMARKS: Record<string, number> = {
      'EYFS GLD': 66,
      'Y1 Phonics': 79,
      'Y2 KS1 Reading': 67,
      'Y2 KS1 Writing': 58,
      'Y2 KS1 Maths': 68,
    };

    // Find all Reception years (year_group = 0)
    const receptionYears = [...new Set(records.filter(r => r.year_group === 0).map(r => r.academic_year_start as number))].sort();

    const cohortMilestones: {
      cohortLabel: string;
      startYear: number;
      currentYearGroup: number;
      milestones: {
        label: string;
        yearGroup: number;
        academicYear: number;
        percentAt: number | null;
        pupilCount: number;
        nationalBenchmark: number | null;
      }[];
    }[] = [];

    for (const receptionYear of receptionYears) {
      // Get pupils in Reception that year
      const receptionPupils = [...new Set(
        records.filter(r => r.year_group === 0 && r.academic_year_start === receptionYear)
          .map(r => r.pupil_hash as string)
      )];
      if (receptionPupils.length < 5) continue;

      const milestones: typeof cohortMilestones[number]['milestones'] = [];

      // Milestone 1: EYFS GLD (year_group=0, same year as reception)
      const eyfsPupilRecords = records.filter(r => r.pupil_hash !== undefined && receptionPupils.includes(r.pupil_hash as string) && r.year_group === 0 && r.academic_year_start === receptionYear);
      const eyfsUniquePupils = [...new Set(eyfsPupilRecords.map(r => r.pupil_hash as string))];
      if (eyfsUniquePupils.length >= 5) {
        // GLD = all areas at level 2
        const gldCount = eyfsUniquePupils.filter(hash => {
          const pr = eyfsPupilRecords.filter(r => r.pupil_hash === hash);
          return pr.length > 0 && pr.every(r => r.attainment_level === '2');
        }).length;
        milestones.push({
          label: 'EYFS GLD',
          yearGroup: 0,
          academicYear: receptionYear,
          percentAt: Math.round(100 * gldCount / eyfsUniquePupils.length),
          pupilCount: eyfsUniquePupils.length,
          nationalBenchmark: NATIONAL_BENCHMARKS['EYFS GLD'],
        });
      }

      // Milestone 2: Y1 Phonics (year_group=1, one year later)
      const phonicsYear = receptionYear + 1;
      const phonicsPupilRecords = records.filter(r => r.pupil_hash !== undefined && receptionPupils.includes(r.pupil_hash as string) && r.year_group === 1 && r.subject === 'phonics' && r.academic_year_start === phonicsYear);
      const phonicsUniquePupils = [...new Set(phonicsPupilRecords.map(r => r.pupil_hash as string))];
      if (phonicsUniquePupils.length >= 5) {
        const phonicsPass = phonicsPupilRecords.filter(r => {
          const score = Number(r.scaled_score);
          if (!isNaN(score)) return score >= 32;
          return r.attainment_level !== 'WT' && r.attainment_level !== 'WTS' && r.attainment_level !== null;
        }).length;
        milestones.push({
          label: 'Y1 Phonics',
          yearGroup: 1,
          academicYear: phonicsYear,
          percentAt: Math.round(100 * phonicsPass / phonicsUniquePupils.length),
          pupilCount: phonicsUniquePupils.length,
          nationalBenchmark: NATIONAL_BENCHMARKS['Y1 Phonics'],
        });
      }

      // Milestone 3: Y2 KS1 Reading / Writing / Maths (year_group=2, two years later)
      const ks1Year = receptionYear + 2;
      for (const [subj, label] of [['reading', 'Y2 KS1 Reading'], ['writing', 'Y2 KS1 Writing'], ['maths', 'Y2 KS1 Maths']] as const) {
        const ks1Recs = records.filter(r => r.pupil_hash !== undefined && receptionPupils.includes(r.pupil_hash as string) && r.year_group === 2 && r.subject === subj && r.academic_year_start === ks1Year);
        const ks1Pupils = [...new Set(ks1Recs.map(r => r.pupil_hash as string))];
        if (ks1Pupils.length >= 5) {
          const atExpected = ks1Recs.filter(r => ['EXS', 'GDS', '2'].includes(r.attainment_level as string ?? '')).length;
          milestones.push({
            label,
            yearGroup: 2,
            academicYear: ks1Year,
            percentAt: Math.round(100 * atExpected / ks1Recs.length),
            pupilCount: ks1Pupils.length,
            nationalBenchmark: NATIONAL_BENCHMARKS[label],
          });
        }
      }

      if (milestones.length === 0) continue;

      const currentYearGroup = (2025 - receptionYear);
      cohortMilestones.push({
        cohortLabel: `Started Reception ${receptionYear}/${String(receptionYear + 1).slice(2)}`,
        startYear: receptionYear,
        currentYearGroup,
        milestones,
      });
    }

    // Sort cohorts by start year
    cohortMilestones.sort((a, b) => a.startYear - b.startYear);

    const cohortJourneys: {
      pupilId: string;
      demographics: { isFsm: boolean; isSend: boolean; isEal: boolean; gender: string };
      journey: { year: number; yearGroup: number; subject: string; level: string }[];
    }[] = [];

    for (const [hash, info] of pupilYears.entries()) {
      if (info.years.length < 2) continue;
      const pupilRecords = records.filter(r => r.pupil_hash === hash);
      const journey = pupilRecords
        .filter(r => ['reading', 'writing', 'maths', 'phonics', 'literacy'].includes(r.subject as string))
        .map(r => ({
          year: (r.academic_year_start as number),
          yearGroup: r.year_group as number,
          subject: r.subject as string,
          level: r.attainment_level as string ?? 'unknown',
        }))
        .sort((a, b) => a.year - b.year || a.yearGroup - b.yearGroup);

      if (journey.length > 0) {
        cohortJourneys.push({
          pupilId: pseudonymFromHash(hash),
          journey,
          demographics: {
            isFsm: records.some(r => r.pupil_hash === hash && r.is_fsm === true),
            isSend: records.some(r => r.pupil_hash === hash && r.is_send === true),
            isEal: records.some(r => r.pupil_hash === hash && r.is_eal === true),
            gender: (records.find(r => r.pupil_hash === hash && r.gender)?.gender as string) ?? 'unknown',
          },
        });
      }
    }

    // ─── 7. Pupil Spotlight — random trackable pupil ─────────────────
    const trackableEntries = [...pupilYears.entries()].filter(([, v]) => v.years.length >= 2);
    let spotlightPupil: {
      pupilId: string;
      demographics: { isFsm: boolean; isSend: boolean; isEal: boolean; gender: string };
      journey: { year: number; yearGroup: number; subject: string; level: string; scaledScore?: number }[];
    } | null = null;

    if (trackableEntries.length > 0) {
      // Pick a deterministic "random" pupil — use index based on total count to avoid re-randomising each request
      const idx = Math.floor(trackableEntries.length / 3);
      const [hash] = trackableEntries[idx];
      const pupilRecords = records.filter(r => r.pupil_hash === hash);
      spotlightPupil = {
        pupilId: pseudonymFromHash(hash),
        demographics: {
          isFsm: records.some(r => r.pupil_hash === hash && r.is_fsm === true),
          isSend: records.some(r => r.pupil_hash === hash && r.is_send === true),
          isEal: records.some(r => r.pupil_hash === hash && r.is_eal === true),
          gender: (records.find(r => r.pupil_hash === hash && r.gender)?.gender as string) ?? 'unknown',
        },
        journey: pupilRecords
          .map(r => ({
            year: (r.academic_year_start as number),
            yearGroup: r.year_group as number,
            subject: r.subject as string,
            level: r.attainment_level as string ?? 'unknown',
            scaledScore: r.scaled_score ? Number(r.scaled_score) : undefined,
          }))
          .sort((a, b) => a.year - b.year || a.yearGroup - b.yearGroup),
      };
    }

    // Compute latestYear once — used by sections 8, 9, 10
    const latestYear = Math.max(...records.map(r => r.academic_year_start as number));

    // ─── 9. Cohort Tracking — legacy (kept for backward compat, now empty) ───
    // Replaced by cohortMilestones above. Return empty array.
    const cohortTracking: {
      cohortLabel: string;
      startYear: number;
      startYearGroup: number;
      dataPoints: { yearGroup: number; year: number; reading: number | null; writing: number | null; maths: number | null; pupils: number }[];
    }[] = [];

    // ─── 10. Demographic Disaggregation — "what if we remove group X" ──
    // For most recent year, compute attainment with/without each demographic group
    const latestRecords = records.filter(r => r.academic_year_start === latestYear);
    const latestPupilHashes = [...new Set(latestRecords.map(r => r.pupil_hash as string))];

    const computeAttainment = (pupilHashes: string[]) => {
      const result: Record<string, { atExpected: number; total: number; pct: number }> = {};
      for (const subj of ['reading', 'writing', 'maths']) {
        const subjRecords = latestRecords.filter(r => pupilHashes.includes(r.pupil_hash as string) && r.subject === subj);
        const atExpected = subjRecords.filter(r => ['EXS', 'GDS', '2'].includes(r.attainment_level as string ?? '')).length;
        result[subj] = { atExpected, total: subjRecords.length, pct: subjRecords.length > 0 ? Math.round(100 * atExpected / subjRecords.length) : 0 };
      }
      return result;
    };

    const fsmHashes = latestPupilHashes.filter(h => latestRecords.some(r => r.pupil_hash === h && r.is_fsm === true));
    const sendHashes = latestPupilHashes.filter(h => latestRecords.some(r => r.pupil_hash === h && r.is_send === true));
    const ealHashes = latestPupilHashes.filter(h => latestRecords.some(r => r.pupil_hash === h && r.is_eal === true));

    const demographicDisaggregation = {
      all: { count: latestPupilHashes.length, attainment: computeAttainment(latestPupilHashes) },
      withoutFsm: { removed: fsmHashes.length, remaining: latestPupilHashes.length - fsmHashes.length, attainment: computeAttainment(latestPupilHashes.filter(h => !fsmHashes.includes(h))) },
      withoutSend: { removed: sendHashes.length, remaining: latestPupilHashes.length - sendHashes.length, attainment: computeAttainment(latestPupilHashes.filter(h => !sendHashes.includes(h))) },
      withoutEal: { removed: ealHashes.length, remaining: latestPupilHashes.length - ealHashes.length, attainment: computeAttainment(latestPupilHashes.filter(h => !ealHashes.includes(h))) },
      fsmOnly: { count: fsmHashes.length, attainment: computeAttainment(fsmHashes) },
      sendOnly: { count: sendHashes.length, attainment: computeAttainment(sendHashes) },
      ealOnly: { count: ealHashes.length, attainment: computeAttainment(ealHashes) },
    };

    // ─── 8. CTF vs Spreadsheet comparison ───────────────────────────
    // Build CTF percentages for Y1 (year_group=1), Y2 (year_group=2), Y6 (year_group=6)
    // Use most recent year for each (latestYear computed above)

    const buildCtfPct = (yearGroup: number) => {
      const result: Record<string, number | null> = { r: null, w: null, m: null };
      for (const [subj, key] of [['reading', 'r'], ['writing', 'w'], ['maths', 'm']] as const) {
        const recs = records.filter(r => r.year_group === yearGroup && r.subject === subj && r.academic_year_start === latestYear);
        if (recs.length === 0) continue;
        const atExpected = recs.filter(r => ['EXS', 'GDS', '2'].includes(r.attainment_level as string ?? '')).length;
        result[key] = Math.round(100 * atExpected / recs.length);
      }
      return result;
    };

    // Fetch the org's own most-recent trust-spreadsheet (if any) so the CTF-vs-spreadsheet
    // comparison uses real self-reported figures, not hardcoded constants.
    // Resolve to the trust org first (mirrors the trust-spreadsheet route logic).
    const { data: orgRow } = await supabase
      .from('organizations')
      .select('id, parent_organization_id')
      .eq('id', ORG_ID)
      .maybeSingle();
    const trustOrgId = orgRow?.parent_organization_id || ORG_ID;

    const { data: spreadsheetRow } = await supabase
      .from('trust_spreadsheets')
      .select('parsed_data, created_at')
      .eq('trust_organization_id', trustOrgId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    type SpreadsheetRow = {
      r: number | null;
      w: number | null;
      m: number | null;
      c: number | null;
    };
    const emptyRow: SpreadsheetRow = { r: null, w: null, m: null, c: null };

    const buildSpreadsheetRow = (yg: string): SpreadsheetRow => {
      const parsed = spreadsheetRow?.parsed_data as
        | {
            schools?: string[];
            data?: Record<
              string,
              Record<
                string,
                { all_pupils?: { r_are?: number | null; w_are?: number | null; m_are?: number | null; c_are?: number | null } }
              >
            >;
          }
        | undefined;
      if (!parsed?.data || !parsed.schools?.length) return emptyRow;
      // First school in the list. For a school-level org this should be the only
      // one; for a trust, this per-pupil route is typically called at per-school
      // granularity anyway.
      const firstAbbrev = parsed.schools[0];
      const yearData = parsed.data[firstAbbrev]?.[yg]?.all_pupils;
      if (!yearData) return emptyRow;
      return {
        r: yearData.r_are ?? null,
        w: yearData.w_are ?? null,
        m: yearData.m_are ?? null,
        c: yearData.c_are ?? null,
      };
    };

    const spreadsheetComparison = {
      latestYear,
      rows: [
        { yearGroup: 'Y1', ctf: buildCtfPct(1), spreadsheet: buildSpreadsheetRow('Year 1') },
        { yearGroup: 'Y2', ctf: buildCtfPct(2), spreadsheet: buildSpreadsheetRow('Year 2') },
        { yearGroup: 'Y6', ctf: buildCtfPct(6), spreadsheet: buildSpreadsheetRow('Year 6') },
      ],
    };

    // ─── Summary ─────────────────────────────────────────────────────
    const totalPupils = [...new Set(records.map(r => r.pupil_hash as string))].length;
    const totalRecords = records.length;
    const yearsSpan = [...new Set(records.map(r => r.academic_year_start as number))].sort();
    const trackablePupilsCount = [...pupilYears.values()].filter(v => v.years.length > 1).length;

    return apiSuccess({
      summary: {
        totalPupils,
        totalRecords,
        yearsSpan: yearsSpan.map(y => y),
        trackablePupils: trackablePupilsCount,
      },
      eyfsGld,
      eyfsAreas,
      ks1Data,
      ks1Movement,
      phonicsData,
      cohortJourneys: cohortJourneys.slice(0, 50),
      spotlightPupil,
      spreadsheetComparison,
      cohortTracking,
      cohortMilestones,
      demographicDisaggregation,
    });
  } catch (err) {
    return apiError(err instanceof Error ? err.message : 'Internal server error', 500);
  }
}, { orgOptional: true });
