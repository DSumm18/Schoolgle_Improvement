import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase-server';

const ORG_ID = 'd9d1ac2c-5eff-4043-98f4-e1c43f616fd3';

/**
 * GET /api/trust-analysis/grove-house
 * Returns per-pupil aggregated analytics from CTF assessment data.
 * All data is pseudonymised — no PII returned.
 */
export async function GET(_req: NextRequest) {
  try {
    const supabase = createServiceRoleClient();

    // Get all assessments for Grove House
    // Fetch all records — override default 1000 row limit
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
        return NextResponse.json({ error: batchError.message }, { status: 500 });
      }

      allRecords = allRecords.concat(batch ?? []);
      hasMore = (batch?.length ?? 0) === pageSize;
      page++;
    }

    const raw = allRecords;
    const error = null;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const records = raw ?? [];

    // ─── Aggregate: EYFS GLD by year ────────────────────────────────
    const eyfsYears = [...new Set(records.filter(r => r.year_group === 0).map(r => r.academic_year_start))].sort();
    const eyfsGld = eyfsYears.map(year => {
      const yearRecords = records.filter(r => r.year_group === 0 && r.academic_year_start === year);
      const pupils = [...new Set(yearRecords.map(r => r.pupil_hash))];
      // GLD = all 7 ELGs at expected (level 2). A pupil has GLD if ALL their subjects are level 2
      const pupilLevels = pupils.map(hash => {
        const pupilRecords = yearRecords.filter(r => r.pupil_hash === hash);
        const allExpected = pupilRecords.every(r => r.attainment_level === '2');
        return { hash, gld: allExpected, assessments: pupilRecords.length };
      });
      const gldCount = pupilLevels.filter(p => p.gld).length;
      return {
        year: year + 1, // academic_year_start 2022 = 2022/23
        pupils: pupils.length,
        gldCount,
        gldPct: pupils.length > 0 ? Math.round(100 * gldCount / pupils.length) : 0,
      };
    });

    // ─── Aggregate: KS1 by year and subject ─────────────────────────
    const ks1Years = [...new Set(records.filter(r => r.year_group === 2 && ['reading', 'writing', 'maths'].includes(r.subject)).map(r => r.academic_year_start))].sort();
    const ks1Data = ks1Years.map(year => {
      const subjects: Record<string, { total: number; wts: number; exs: number; gds: number }> = {};
      for (const subj of ['reading', 'writing', 'maths']) {
        const subjRecords = records.filter(r => r.year_group === 2 && r.subject === subj && r.academic_year_start === year);
        subjects[subj] = {
          total: subjRecords.length,
          wts: subjRecords.filter(r => ['WTS', 'WT', 'PK1', 'PK2', 'PK3', 'PK4'].includes(r.attainment_level ?? '')).length,
          exs: subjRecords.filter(r => r.attainment_level === 'EXS').length,
          gds: subjRecords.filter(r => r.attainment_level === 'GDS').length,
        };
      }
      const pupils = [...new Set(records.filter(r => r.year_group === 2 && ['reading', 'writing', 'maths'].includes(r.subject) && r.academic_year_start === year).map(r => r.pupil_hash))].length;
      return { year: year + 1, pupils, subjects };
    });

    // ─── Aggregate: Phonics by year ─────────────────────────────────
    const phonicsRecords = records.filter(r => r.subject === 'phonics');
    const phonicsYears = [...new Set(phonicsRecords.map(r => r.academic_year_start))].sort();
    const phonicsData = phonicsYears.map(year => {
      const yearRecords = phonicsRecords.filter(r => r.academic_year_start === year);
      const pupils = [...new Set(yearRecords.map(r => r.pupil_hash))].length;
      // Phonics pass: attainment_level is typically a score or 'WT'/'WTS' for working towards
      const passed = yearRecords.filter(r => r.attainment_level !== 'WT' && r.attainment_level !== 'WTS' && r.attainment_level !== null).length;
      const total = yearRecords.length;
      return {
        year: year + 1,
        pupils,
        total,
        passed,
        passPct: total > 0 ? Math.round(100 * passed / total) : 0,
      };
    });

    // ─── Pupil Cohort Tracking: pupils seen across multiple years ────
    const pupilYears = new Map<string, { years: number[]; yearGroups: number[] }>();
    for (const r of records) {
      const existing = pupilYears.get(r.pupil_hash);
      if (existing) {
        if (!existing.years.includes(r.academic_year_start)) existing.years.push(r.academic_year_start);
        if (!existing.yearGroups.includes(r.year_group)) existing.yearGroups.push(r.year_group);
      } else {
        pupilYears.set(r.pupil_hash, { years: [r.academic_year_start], yearGroups: [r.year_group] });
      }
    }

    const trackablePupils = [...pupilYears.entries()]
      .filter(([, v]) => v.years.length > 1)
      .map(([hash, v]) => ({
        pupilHash: hash.slice(0, 8) + '...', // truncate for display
        yearsSeen: v.years.length,
        years: v.years.sort(),
        yearGroups: v.yearGroups.sort(),
      }));

    // ─── Cohort journey: track attainment progression per pupil ──────
    // For pupils who went EYFS → Y1 → Y2, show their progression
    const cohortJourneys: {
      pupilId: string;
      journey: { year: number; yearGroup: number; subject: string; level: string }[];
    }[] = [];

    for (const [hash, info] of pupilYears.entries()) {
      if (info.years.length < 2) continue;
      const pupilRecords = records.filter(r => r.pupil_hash === hash);
      const journey = pupilRecords
        .filter(r => ['reading', 'writing', 'maths', 'phonics', 'literacy', 'maths'].includes(r.subject))
        .map(r => ({
          year: r.academic_year_start + 1,
          yearGroup: r.year_group,
          subject: r.subject,
          level: r.attainment_level ?? 'unknown',
        }))
        .sort((a, b) => a.year - b.year || a.yearGroup - b.yearGroup);

      if (journey.length > 0) {
        cohortJourneys.push({
          pupilId: hash.slice(0, 8) + '...',
          journey,
        });
      }
    }

    // ─── Summary stats ──────────────────────────────────────────────
    const totalPupils = [...new Set(records.map(r => r.pupil_hash))].length;
    const totalRecords = records.length;
    const yearsSpan = [...new Set(records.map(r => r.academic_year_start))].sort();

    return NextResponse.json({
      summary: {
        totalPupils,
        totalRecords,
        yearsSpan: yearsSpan.map(y => y + 1),
        trackablePupils: trackablePupils.length,
        totalTrackable: trackablePupils.length,
      },
      eyfsGld,
      ks1Data,
      phonicsData,
      trackablePupils: trackablePupils.slice(0, 50), // limit for display
      cohortJourneys: cohortJourneys.slice(0, 30), // limit for display
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 },
    );
  }
}
