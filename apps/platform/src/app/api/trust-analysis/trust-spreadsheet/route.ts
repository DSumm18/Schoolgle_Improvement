// GET/POST/DELETE the parsed spreadsheet for the user's current org.
// Trust orgs store trust-wide captures. School orgs store school-only captures.
// Do not resolve child schools to their parent trust here: that would leak
// trust-wide school lists into a standalone school view.
//
// Supports multiple capture_period snapshots per trust (autumn_term, mid_year, end_of_year,
// summer_term). GET without ?capturePeriod returns the full map keyed by period; with it,
// returns just that one (back-compat with old callers that expect a single object).

import { NextRequest } from 'next/server';
import { protectedRoute, apiSuccess, apiError } from '@/lib/api-utils';
import { createServiceRoleClient } from '@/lib/supabase-server';

type CapturePeriod = 'autumn_term' | 'mid_year' | 'end_of_year' | 'summer_term';
const VALID_PERIODS: CapturePeriod[] = ['autumn_term', 'mid_year', 'end_of_year', 'summer_term'];

function detectCapturePeriod(fileName: string, parsedDataHeader?: string | null): CapturePeriod {
  const src = `${fileName ?? ''} ${parsedDataHeader ?? ''}`.toLowerCase();
  if (/mid[\s_-]*year|midyear/.test(src)) return 'mid_year';
  if (/autumn/.test(src)) return 'autumn_term';
  if (/end[\s_-]*of[\s_-]*year|eoy/.test(src)) return 'end_of_year';
  if (/summer/.test(src)) return 'summer_term';
  return 'mid_year'; // safe default — most current captures are mid-year
}

export const GET = protectedRoute(async (auth, req: NextRequest) => {
  const orgId = req.nextUrl.searchParams.get('organizationId') || auth.organizationId;
  const requestedPeriod = req.nextUrl.searchParams.get('capturePeriod') as CapturePeriod | null;
  if (!orgId) return apiError('organizationId required', 400);

  const supabase = createServiceRoleClient();
  const { data: mem } = await supabase
    .from('organization_members')
    .select('role')
    .eq('auth_id', auth.userId)
    .eq('organization_id', orgId)
    .maybeSingle();
  if (!mem) return apiError('Not a member', 403);

  const query = supabase
    .from('trust_spreadsheets')
    .select('file_name, parsed_data, uploaded_by, created_at, updated_at, capture_period')
    .eq('trust_organization_id', orgId);

  if (requestedPeriod) {
    const { data, error } = await query.eq('capture_period', requestedPeriod).maybeSingle();
    if (error) return apiError(error.message, 500);
    return apiSuccess(data || null);
  }

  // Return all captures for this trust, keyed by period
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) return apiError(error.message, 500);

  const byPeriod: Partial<Record<CapturePeriod, unknown>> = {};
  const rows = data ?? [];
  for (const row of rows) {
    const period = row.capture_period as CapturePeriod;
    if (VALID_PERIODS.includes(period) && !byPeriod[period]) byPeriod[period] = row;
  }

  // Pick the most recent capture as the "current" for back-compat
  // Priority: mid_year > end_of_year > summer_term > autumn_term
  const priority: CapturePeriod[] = ['mid_year', 'end_of_year', 'summer_term', 'autumn_term'];
  const currentKey = priority.find((p) => byPeriod[p]) ?? null;
  const current = currentKey ? byPeriod[currentKey] : null;

  return apiSuccess({
    captures: byPeriod,
    current,
    currentPeriod: currentKey,
  });
});

export const POST = protectedRoute(async (auth, req: NextRequest) => {
  const body = await req.json().catch(() => ({}));
  const { organizationId, fileName, parsedData, capturePeriod } = body;
  const orgId = organizationId || auth.organizationId;
  if (!orgId) return apiError('organizationId required', 400);
  if (!fileName || !parsedData) return apiError('fileName and parsedData required', 400);

  // Determine capture period — caller-provided > filename detection > default mid_year
  let period: CapturePeriod;
  if (capturePeriod && VALID_PERIODS.includes(capturePeriod)) {
    period = capturePeriod;
  } else {
    const header = typeof parsedData?.header === 'string' ? parsedData.header : null;
    period = detectCapturePeriod(fileName, header);
  }

  const supabase = createServiceRoleClient();
  const { data: mem } = await supabase
    .from('organization_members')
    .select('role')
    .eq('auth_id', auth.userId)
    .eq('organization_id', orgId)
    .maybeSingle();
  if (!mem) return apiError('Not a member', 403);

  const { error } = await supabase
    .from('trust_spreadsheets')
    .upsert({
      trust_organization_id: orgId,
      file_name: fileName,
      parsed_data: parsedData,
      uploaded_by: auth.userId,
      capture_period: period,
    }, { onConflict: 'trust_organization_id,capture_period' });

  if (error) return apiError(error.message, 500);
  return apiSuccess({ ok: true, trust_organization_id: orgId, capture_period: period });
});

export const DELETE = protectedRoute(async (auth, req: NextRequest) => {
  const orgId = req.nextUrl.searchParams.get('organizationId') || auth.organizationId;
  const capturePeriod = req.nextUrl.searchParams.get('capturePeriod') as CapturePeriod | null;
  if (!orgId) return apiError('organizationId required', 400);

  const supabase = createServiceRoleClient();
  const { data: mem } = await supabase
    .from('organization_members')
    .select('role')
    .eq('auth_id', auth.userId)
    .eq('organization_id', orgId)
    .maybeSingle();
  if (!mem) return apiError('Not a member', 403);

  let q = supabase.from('trust_spreadsheets').delete().eq('trust_organization_id', orgId);
  if (capturePeriod) q = q.eq('capture_period', capturePeriod);

  const { error } = await q;
  if (error) return apiError(error.message, 500);
  return apiSuccess({ ok: true });
});
