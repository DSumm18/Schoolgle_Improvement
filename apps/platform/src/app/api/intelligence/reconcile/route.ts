import { NextRequest } from 'next/server';
import { protectedRoute, apiSuccess, apiError } from '@/lib/api-utils';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { buildReconciliationResult } from '@/lib/smart-connectors/reconciliation-engine';

export const POST = protectedRoute(async (auth, req: NextRequest) => {
  const body = await req.json();
  const { urn } = body;

  if (!urn) {
    return apiError('Missing urn in request body', 400);
  }

  const urnNum = typeof urn === 'string' ? parseInt(urn, 10) : urn;
  if (isNaN(urnNum)) {
    return apiError('Invalid URN', 400);
  }

  const supabase = createServiceRoleClient();

  // Fetch GIAS data
  const { data: giasData, error: giasError } = await supabase
    .from('schools')
    .select('name, percentage_fsm, number_of_pupils')
    .eq('urn', urnNum)
    .single();

  if (giasError || !giasData) {
    return apiError('School not found in GIAS data', 404);
  }

  // Fetch latest census data
  const { data: censusData } = await supabase
    .from('census')
    .select('fsm_pct, number_on_roll, time_period')
    .eq('urn', urnNum)
    .order('time_period', { ascending: false })
    .limit(1)
    .single();

  const result = buildReconciliationResult(urnNum, giasData.name, {
    giasFsmPct: giasData.percentage_fsm ? parseFloat(giasData.percentage_fsm) : null,
    censusFsmPct: censusData?.fsm_pct ? parseFloat(censusData.fsm_pct) : null,
    giasRoll: giasData.number_of_pupils,
    censusRoll: censusData?.number_on_roll ?? null,
  });

  return apiSuccess(result);
});
