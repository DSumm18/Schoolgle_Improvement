import { NextRequest } from 'next/server';
import { protectedRoute, apiSuccess, apiError } from '@/lib/api-utils';
import { createServiceRoleClient } from '@/lib/supabase-server';
import {
  ALL_PENNINE_URNS, URN_PREDECESSORS, PENNINE_URNS,
  KS2Result, CensusRecord, DfEData,
} from '@/lib/trust-analysis/types';

/**
 * GET /api/trust-analysis
 * Authenticated route — fetches DfE KS2 results and census data for trust schools.
 * Includes predecessor URN data (pre-academy conversion) mapped to current URNs.
 */
export const GET = protectedRoute(async (_auth, _req: NextRequest) => {
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

  const result: DfEData = { ks2Results, census };
  return apiSuccess(result);
});
