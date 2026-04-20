// GET /api/trust-analysis/school-summary?organizationId=X — fetch persisted summary
// POST — save/upsert parsed summary for an org
// DELETE — remove

import { NextRequest } from 'next/server';
import { protectedRoute, apiSuccess, apiError } from '@/lib/api-utils';
import { createServiceRoleClient } from '@/lib/supabase-server';

export const GET = protectedRoute(async (auth, req: NextRequest) => {
  const orgId = req.nextUrl.searchParams.get('organizationId') || auth.organizationId;
  if (!orgId) return apiError('organizationId required', 400);

  const supabase = createServiceRoleClient();
  // Verify membership
  const { data: mem } = await supabase
    .from('organization_members')
    .select('role')
    .eq('auth_id', auth.userId)
    .eq('organization_id', orgId)
    .maybeSingle();
  if (!mem) return apiError('Not a member of this organization', 403);

  const { data, error } = await supabase
    .from('school_data_summaries')
    .select('file_name, school_abbrev, parsed_data, uploaded_by, created_at, updated_at')
    .eq('organization_id', orgId)
    .maybeSingle();

  if (error) return apiError(error.message, 500);
  return apiSuccess(data || null);
});

export const POST = protectedRoute(async (auth, req: NextRequest) => {
  const body = await req.json().catch(() => ({}));
  const { organizationId, schoolAbbrev, fileName, parsedData } = body;
  const orgId = organizationId || auth.organizationId;

  if (!orgId) return apiError('organizationId required', 400);
  if (!schoolAbbrev || !fileName || !parsedData) {
    return apiError('schoolAbbrev, fileName and parsedData required', 400);
  }

  const supabase = createServiceRoleClient();
  const { data: mem } = await supabase
    .from('organization_members')
    .select('role')
    .eq('auth_id', auth.userId)
    .eq('organization_id', orgId)
    .maybeSingle();
  if (!mem) return apiError('Not a member of this organization', 403);

  const { error } = await supabase
    .from('school_data_summaries')
    .upsert({
      organization_id: orgId,
      school_abbrev: schoolAbbrev,
      file_name: fileName,
      parsed_data: parsedData,
      uploaded_by: auth.userId,
    }, { onConflict: 'organization_id' });

  if (error) return apiError(error.message, 500);
  return apiSuccess({ ok: true });
});

export const DELETE = protectedRoute(async (auth, req: NextRequest) => {
  const orgId = req.nextUrl.searchParams.get('organizationId') || auth.organizationId;
  if (!orgId) return apiError('organizationId required', 400);

  const supabase = createServiceRoleClient();
  const { data: mem } = await supabase
    .from('organization_members')
    .select('role')
    .eq('auth_id', auth.userId)
    .eq('organization_id', orgId)
    .maybeSingle();
  if (!mem) return apiError('Not a member of this organization', 403);

  const { error } = await supabase
    .from('school_data_summaries')
    .delete()
    .eq('organization_id', orgId);

  if (error) return apiError(error.message, 500);
  return apiSuccess({ ok: true });
});
