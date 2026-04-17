import { NextRequest } from 'next/server';
import { protectedRoute, apiSuccess, apiError } from '@/lib/api-utils';
import { createServiceRoleClient } from '@/lib/supabase-server';
import {
  buildShadowComparison,
  getIntelligenceBrainMode,
  isDebugBrainRequest,
  persistShadowComparison,
} from '@/lib/intelligence-brain/orchestrator';
import {
  ALL_PENNINE_URNS, URN_PREDECESSORS, PENNINE_URNS,
  KS2Result, CensusRecord, DfEData, NationalPercentile, ThreeYearAverage,
} from '@/lib/trust-analysis/types';

/**
 * GET /api/trust-analysis
 * Authenticated route — fetches DfE KS2 results and census data for trust schools.
 * Includes predecessor URN data (pre-academy conversion) mapped to current URNs.
 */
export const GET = protectedRoute(async (auth, req: NextRequest) => {
  const brainMode = getIntelligenceBrainMode('trust-analysis');
  const debugBrain =
    isDebugBrainRequest(req.nextUrl.searchParams.get('debug_brain')) ||
    isDebugBrainRequest(req.headers.get('x-schoolgle-debug-brain'));
  const supabase = createServiceRoleClient();

  // Fetch for ALL URNs (current + predecessor)
  const { data: ks2Raw, error: ks2Error } = await supabase
    .from('ks2_results')
    .select(
      'urn, academic_year_end, subject, breakdown_topic, breakdown, ' +
        'expected_standard_pct, higher_standard_pct, average_scaled_score, progress_measure_score',
    )
    .in('urn', ALL_PENNINE_URNS)
    .order('urn', { ascending: true })
    .order('academic_year_end', { ascending: false });

  if (ks2Error) {
    return apiError(`Failed to fetch KS2 results: ${ks2Error.message}`, 500);
  }

  const { data: censusRaw, error: censusError } = await supabase
    .from('census')
    .select('urn, academic_year_end, number_on_roll, fsm_pct, eal_pct, sen_pct')
    .in('urn', ALL_PENNINE_URNS)
    .order('urn', { ascending: true })
    .order('academic_year_end', { ascending: false });

  if (censusError) {
    return apiError(`Failed to fetch census data: ${censusError.message}`, 500);
  }

  // Build reverse map: old URN → current URN
  const oldToNew = new Map<number, number>();
  for (const [currentUrn, { oldUrn }] of Object.entries(URN_PREDECESSORS)) {
    oldToNew.set(oldUrn, Number(currentUrn));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ks2Results: KS2Result[] = (ks2Raw as any[] ?? []).map((row) => {
    const rawUrn = Number(row.urn);
    const mappedUrn = oldToNew.get(rawUrn) ?? rawUrn;
    return {
      urn: mappedUrn,
      academicYearEnd: Number(row.academic_year_end),
      subject: row.subject as string,
      breakdownTopic: row.breakdown_topic as string,
      breakdown: row.breakdown as string,
      expectedStandardPct: row.expected_standard_pct != null ? Number(row.expected_standard_pct) : null,
      higherStandardPct: row.higher_standard_pct != null ? Number(row.higher_standard_pct) : null,
      averageScaledScore: row.average_scaled_score != null ? Number(row.average_scaled_score) : null,
      progressMeasureScore: row.progress_measure_score != null ? Number(row.progress_measure_score) : null,
    };
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const census: CensusRecord[] = (censusRaw as any[] ?? []).map((row) => {
    const rawUrn = Number(row.urn);
    const mappedUrn = oldToNew.get(rawUrn) ?? rawUrn;
    return {
      urn: mappedUrn,
      academicYearEnd: Number(row.academic_year_end),
      numberOnRoll: Number(row.number_on_roll),
      fsmPct: row.fsm_pct != null ? Number(row.fsm_pct) : null,
      ealPct: row.eal_pct != null ? Number(row.eal_pct) : null,
      senPct: row.sen_pct != null ? Number(row.sen_pct) : null,
    };
  });

  // ── Insight 1: National Percentile Rankings ──────────────────────────────
  // Use academicYearEnd=2024 (the 2023/24 academic year — most recent validated data)
  const { data: nationalKs2Raw } = await supabase
    .from('ks2_results')
    .select('urn, expected_standard_pct')
    .eq('subject', 'Reading, writing and maths')
    .eq('breakdown_topic', 'All pupils')
    .eq('breakdown', 'All pupils')
    .eq('academic_year_end', 2024)
    .eq('is_suppressed', false)
    .not('expected_standard_pct', 'is', null);

  const sortedPcts = ((nationalKs2Raw ?? []) as { urn: number; expected_standard_pct: number | string }[])
    .map(r => Number(r.expected_standard_pct))
    .filter(n => !isNaN(n) && isFinite(n))
    .sort((a, b) => a - b);

  const totalSchools = sortedPcts.length;

  const nationalPercentiles: Record<number, NationalPercentile> = {};
  for (const urn of PENNINE_URNS) {
    const schoolRecord = ((nationalKs2Raw ?? []) as { urn: number; expected_standard_pct: number | string }[])
      .find(r => Number(r.urn) === urn);
    if (!schoolRecord) continue;
    const pct = Number(schoolRecord.expected_standard_pct);
    if (isNaN(pct)) continue;
    const betterThan = sortedPcts.filter(p => p < pct).length;
    const percentile = totalSchools > 0 ? Math.round(100 * betterThan / totalSchools) : 0;
    nationalPercentiles[urn] = {
      urn,
      pct,
      percentile,
      betterThan,
      rank: totalSchools - betterThan,
      totalSchools,
    };
  }

  // ── Insight 2: Three-Year KS2 Averages ───────────────────────────────────
  const threeYearAverages: Record<number, ThreeYearAverage> = {};
  for (const urn of PENNINE_URNS) {
    const schoolKs2 = ks2Results.filter(r =>
      r.urn === urn &&
      r.subject === 'Reading, writing and maths' &&
      r.breakdownTopic === 'All pupils' &&
      r.breakdown === 'All pupils' &&
      r.expectedStandardPct !== null,
    );
    if (schoolKs2.length === 0) continue;
    const avg = schoolKs2.reduce((sum, r) => sum + (r.expectedStandardPct as number), 0) / schoolKs2.length;
    threeYearAverages[urn] = {
      urn,
      averagePct: Math.round(avg),
      yearsUsed: schoolKs2.length,
    };
  }

  const result: DfEData = { ks2Results, census };

  let shadowComparison:
    | ReturnType<typeof buildShadowComparison>
    | null = null;

  if (brainMode === 'shadow' || brainMode === 'primary') {
    const latestYear = Math.max(
      ...ks2Results.map((row) => row.academicYearEnd),
      ...census.map((row) => row.academicYearEnd),
      0,
    );

    const currentUrnSet = new Set(PENNINE_URNS);
    const ks2Current = ks2Results.filter((row) => currentUrnSet.has(row.urn));
    const censusCurrent = census.filter((row) => currentUrnSet.has(row.urn));

    const currentLatestYear = Math.max(
      ...ks2Current.map((row) => row.academicYearEnd),
      ...censusCurrent.map((row) => row.academicYearEnd),
      0,
    );

    shadowComparison = buildShadowComparison({
      route: 'trust-analysis',
      mode: brainMode,
      organizationId: auth.organizationId ?? 'trust-level-aggregate',
      candidateVersion: 'current-urn-scope-v1',
      baseline: {
        ks2_rows: ks2Results.length,
        census_rows: census.length,
        unique_schools: new Set([
          ...ks2Results.map((row) => row.urn),
          ...census.map((row) => row.urn),
        ]).size,
        latest_year: latestYear,
      },
      candidate: {
        ks2_rows: ks2Current.length,
        census_rows: censusCurrent.length,
        unique_schools: new Set([
          ...ks2Current.map((row) => row.urn),
          ...censusCurrent.map((row) => row.urn),
        ]).size,
        latest_year: currentLatestYear,
      },
    });

    await persistShadowComparison(supabase, shadowComparison);
  }

  if (debugBrain) {
    return apiSuccess({
      ...result,
      nationalPercentiles,
      threeYearAverages,
      _brainShadow: {
        mode: brainMode,
        comparison: shadowComparison,
      },
    });
  }

  return apiSuccess({ ...result, nationalPercentiles, threeYearAverages });
}, { orgOptional: true });
