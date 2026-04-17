import { NextRequest, NextResponse } from 'next/server';
import { protectedRoute, apiSuccess, apiError } from '@/lib/api-utils';
import { createServiceRoleClient } from '@/lib/supabase-server';

// Trust spreadsheet figures for Grove House (mid-year / reported)
const SPREADSHEET_FIGURES: Record<string, { r: number; w: number; m: number; c?: number }> = {
  Y1: { r: 39, w: 54, m: 59, c: 44 },
  Y2: { r: 66, w: 69, m: 74, c: 62 },
  Y6: { r: 57, w: 54, m: 51, c: 43 },
};

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
        year: year + 1,
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

      return { year: year + 1, areas };
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
      return { year: year + 1, pupils, subjects };
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
        year: currYear + 1,
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

      return { year: year + 1, pupils, total, passed, passPct: total > 0 ? Math.round(100 * passed / total) : 0, scoreBands };
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
          year: (r.academic_year_start as number) + 1,
          yearGroup: r.year_group as number,
          subject: r.subject as string,
          level: r.attainment_level as string ?? 'unknown',
        }))
        .sort((a, b) => a.year - b.year || a.yearGroup - b.yearGroup);

      if (journey.length > 0) {
        cohortJourneys.push({
          pupilId: hash.slice(0, 8) + '...',
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
        pupilId: hash.slice(0, 8) + '...',
        demographics: {
          isFsm: records.some(r => r.pupil_hash === hash && r.is_fsm === true),
          isSend: records.some(r => r.pupil_hash === hash && r.is_send === true),
          isEal: records.some(r => r.pupil_hash === hash && r.is_eal === true),
          gender: (records.find(r => r.pupil_hash === hash && r.gender)?.gender as string) ?? 'unknown',
        },
        journey: pupilRecords
          .map(r => ({
            year: (r.academic_year_start as number) + 1,
            yearGroup: r.year_group as number,
            subject: r.subject as string,
            level: r.attainment_level as string ?? 'unknown',
            scaledScore: r.scaled_score ? Number(r.scaled_score) : undefined,
          }))
          .sort((a, b) => a.year - b.year || a.yearGroup - b.yearGroup),
      };
    }

    // ─── 8. CTF vs Spreadsheet comparison ───────────────────────────
    // Build CTF percentages for Y1 (year_group=1), Y2 (year_group=2), Y6 (year_group=6)
    // Use most recent year for each
    const latestYear = Math.max(...records.map(r => r.academic_year_start as number));

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

    const spreadsheetComparison = {
      latestYear: latestYear + 1,
      rows: [
        {
          yearGroup: 'Y1',
          ctf: buildCtfPct(1),
          spreadsheet: SPREADSHEET_FIGURES.Y1,
        },
        {
          yearGroup: 'Y2',
          ctf: buildCtfPct(2),
          spreadsheet: SPREADSHEET_FIGURES.Y2,
        },
        {
          yearGroup: 'Y6',
          ctf: buildCtfPct(6),
          spreadsheet: SPREADSHEET_FIGURES.Y6,
        },
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
        yearsSpan: yearsSpan.map(y => y + 1),
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
    });
  } catch (err) {
    return apiError(err instanceof Error ? err.message : 'Internal server error', 500);
  }
}, { orgOptional: true });
