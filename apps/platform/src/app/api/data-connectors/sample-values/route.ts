import { NextRequest } from 'next/server';
import { protectedRoute, apiSuccess, apiError } from '@/lib/api-utils';
import { createServiceRoleClient } from '@/lib/supabase-server';

/**
 * Fetch the most recent row from a given Supabase table for a URN so the
 * report builder can show live sample values next to each field name.
 * Read-only, row-limited, no pagination.
 */
export const GET = protectedRoute(async (_auth, req: NextRequest) => {
  const url = new URL(req.url);
  const table = url.searchParams.get('table');
  const urn = url.searchParams.get('urn');

  if (!table || !urn) {
    return apiError('Missing table or urn', 400);
  }

  // Whitelist the tables we'll serve — anything outside this list is rejected.
  const ALLOWED_TABLES = new Set([
    'attendance',
    'census',
    'ks2_results',
    'workforce',
    'exclusions',
    'ks4_results',
    'school_contextual_factors',
  ]);

  if (!ALLOWED_TABLES.has(table)) {
    return apiError(`Table '${table}' not permitted for sample values`, 400);
  }

  const urnNum = parseInt(urn, 10);
  if (isNaN(urnNum)) return apiError('Invalid URN', 400);

  const supabase = createServiceRoleClient();

  try {
    // Prefer 'Academic year' rows when the table has a term column; fall back to newest row.
    let query = supabase
      .from(table)
      .select('*')
      .eq('urn', urnNum)
      .order('time_period', { ascending: false })
      .limit(1);

    if (table === 'attendance' || table === 'exclusions' || table === 'census') {
      // Try academic year term first
      const { data: annual } = await supabase
        .from(table)
        .select('*')
        .eq('urn', urnNum)
        .in('term', ['Academic year', 'Annual', 'Full year'])
        .order('time_period', { ascending: false })
        .limit(1);
      if (annual && annual.length > 0) {
        return apiSuccess({ table, urn: urnNum, row: annual[0] });
      }
    }

    if (table === 'ks2_results') {
      // Pick the RWM combined row for the latest period
      const { data: ks2 } = await supabase
        .from(table)
        .select('*')
        .eq('urn', urnNum)
        .eq('breakdown_topic', 'All pupils')
        .eq('subject', 'Reading, writing and maths')
        .order('time_period', { ascending: false })
        .limit(1);
      if (ks2 && ks2.length > 0) {
        return apiSuccess({ table, urn: urnNum, row: ks2[0] });
      }
      // Fallback: first All pupils row
      query = supabase
        .from(table)
        .select('*')
        .eq('urn', urnNum)
        .eq('breakdown_topic', 'All pupils')
        .order('time_period', { ascending: false })
        .limit(1);
    }

    const { data, error } = await query;
    if (error) return apiError(error.message, 500);
    const row = data && data.length > 0 ? data[0] : null;
    return apiSuccess({ table, urn: urnNum, row });
  } catch (err) {
    return apiError(err instanceof Error ? err.message : 'Fetch failed', 500);
  }
});
