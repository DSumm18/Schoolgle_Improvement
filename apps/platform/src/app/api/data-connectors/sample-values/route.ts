import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase-server';

/**
 * Fetch the most recent row from a DfE table for a URN.
 * Public endpoint — all data is DfE published stats, zero PII.
 * Used by the report builder to show live sample values.
 */

const ALLOWED_TABLES = new Set([
  'attendance',
  'census',
  'ks2_results',
  'workforce',
  'exclusions',
  'ks4_results',
]);

export async function GET(req: NextRequest) {
  const table = req.nextUrl.searchParams.get('table');
  const urn = req.nextUrl.searchParams.get('urn');

  if (!table || !urn) {
    return NextResponse.json({ error: 'Missing table or urn' }, { status: 400 });
  }

  if (!ALLOWED_TABLES.has(table)) {
    return NextResponse.json({ error: `Table '${table}' not permitted` }, { status: 400 });
  }

  const urnNum = parseInt(urn, 10);
  if (isNaN(urnNum)) {
    return NextResponse.json({ error: 'Invalid URN' }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  try {
    // For attendance/exclusions/census, prefer 'Academic year' rows
    if (table === 'attendance' || table === 'exclusions' || table === 'census') {
      const { data: annual } = await supabase
        .from(table)
        .select('*')
        .eq('urn', urnNum)
        .in('term', ['Academic year', 'Annual', 'Full year'])
        .order('time_period', { ascending: false })
        .limit(1);
      if (annual && annual.length > 0) {
        return NextResponse.json({ data: { table, urn: urnNum, row: annual[0] } });
      }
    }

    // For KS2, get the RWM combined row
    if (table === 'ks2_results') {
      const { data: ks2 } = await supabase
        .from(table)
        .select('*')
        .eq('urn', urnNum)
        .eq('breakdown_topic', 'All pupils')
        .eq('subject', 'Reading, writing and maths')
        .order('time_period', { ascending: false })
        .limit(1);
      if (ks2 && ks2.length > 0) {
        return NextResponse.json({ data: { table, urn: urnNum, row: ks2[0] } });
      }
    }

    // Default: latest row
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('urn', urnNum)
      .order('time_period', { ascending: false })
      .limit(1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const row = data && data.length > 0 ? data[0] : null;
    return NextResponse.json({ data: { table, urn: urnNum, row } });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Fetch failed' },
      { status: 500 },
    );
  }
}
