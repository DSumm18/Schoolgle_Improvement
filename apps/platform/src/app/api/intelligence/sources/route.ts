import { NextRequest } from 'next/server';
import { protectedRoute, apiSuccess, apiError } from '@/lib/api-utils';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { DATA_SOURCES } from '@/lib/smart-connectors/source-registry';
import type { SourceConnectionStatus } from '@/lib/smart-connectors/types';

export const GET = protectedRoute(async (auth, req: NextRequest) => {
  const url = new URL(req.url);
  const urn = url.searchParams.get('urn');

  if (!urn) {
    return apiError('Missing urn parameter', 400);
  }

  const urnNum = parseInt(urn, 10);
  if (isNaN(urnNum)) {
    return apiError('Invalid URN', 400);
  }

  const supabase = createServiceRoleClient();
  const results: SourceConnectionStatus[] = [];

  for (const source of DATA_SOURCES) {
    try {
      // Get latest time_period for this school in this table
      const { data: latestRows } = await supabase
        .from(source.table)
        .select('time_period')
        .eq('urn', urnNum)
        .order('time_period', { ascending: false })
        .limit(1);

      // Get total row count
      const { count } = await supabase
        .from(source.table)
        .select('*', { count: 'exact', head: true })
        .eq('urn', urnNum);

      // Get earliest time_period
      const { data: earliestRows } = await supabase
        .from(source.table)
        .select('time_period')
        .eq('urn', urnNum)
        .order('time_period', { ascending: true })
        .limit(1);

      const latestPeriod = latestRows?.[0]?.time_period ?? null;
      const earliestPeriod = earliestRows?.[0]?.time_period ?? null;

      const yearRange = earliestPeriod && latestPeriod && earliestPeriod !== latestPeriod
        ? `${formatTimePeriod(earliestPeriod)}-${formatTimePeriod(latestPeriod)}`
        : latestPeriod ? formatTimePeriod(latestPeriod) : null;

      results.push({
        source,
        connected: (count ?? 0) > 0,
        rowCount: count ?? 0,
        yearRange,
        latestTimePeriod: latestPeriod,
      });
    } catch {
      results.push({
        source,
        connected: false,
        rowCount: 0,
        yearRange: null,
        latestTimePeriod: null,
      });
    }
  }

  const connectedCount = results.filter(r => r.connected).length;

  return apiSuccess({
    urn: urnNum,
    sources: results,
    connectedCount,
    totalSources: DATA_SOURCES.length,
  });
});

function formatTimePeriod(tp: string): string {
  if (tp.length === 6) {
    return `20${tp.slice(0, 2)}/${tp.slice(2, 4)}`;
  }
  return tp;
}
