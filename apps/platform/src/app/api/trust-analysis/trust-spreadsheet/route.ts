// GET/POST/DELETE the trust-level parsed spreadsheet for the user's current org.
// Resolves to the trust org (parent or self) so any child school sees its parent trust's data.

import { NextRequest } from 'next/server';
import { protectedRoute, apiSuccess, apiError } from '@/lib/api-utils';
import { createServiceRoleClient } from '@/lib/supabase-server';

async function resolveTrustOrg(
  supabase: ReturnType<typeof createServiceRoleClient>,
  organizationId: string,
): Promise<string> {
  const { data: org } = await supabase
    .from('organizations')
    .select('id, parent_organization_id')
    .eq('id', organizationId)
    .maybeSingle();
  if (!org) return organizationId;
  return org.parent_organization_id || org.id;
}

export const GET = protectedRoute(async (auth, req: NextRequest) => {
  const orgId = req.nextUrl.searchParams.get('organizationId') || auth.organizationId;
  if (!orgId) return apiError('organizationId required', 400);

  const supabase = createServiceRoleClient();
  const { data: mem } = await supabase
    .from('organization_members')
    .select('role')
    .eq('auth_id', auth.userId)
    .eq('organization_id', orgId)
    .maybeSingle();
  if (!mem) return apiError('Not a member', 403);

  const trustId = await resolveTrustOrg(supabase, orgId);
  const { data, error } = await supabase
    .from('trust_spreadsheets')
    .select('file_name, parsed_data, uploaded_by, created_at, updated_at')
    .eq('trust_organization_id', trustId)
    .maybeSingle();

  if (error) return apiError(error.message, 500);
  return apiSuccess(data || null);
});

export const POST = protectedRoute(async (auth, req: NextRequest) => {
  const body = await req.json().catch(() => ({}));
  const { organizationId, fileName, parsedData } = body;
  const orgId = organizationId || auth.organizationId;
  if (!orgId) return apiError('organizationId required', 400);
  if (!fileName || !parsedData) return apiError('fileName and parsedData required', 400);

  const supabase = createServiceRoleClient();
  const { data: mem } = await supabase
    .from('organization_members')
    .select('role')
    .eq('auth_id', auth.userId)
    .eq('organization_id', orgId)
    .maybeSingle();
  if (!mem) return apiError('Not a member', 403);

  const trustId = await resolveTrustOrg(supabase, orgId);
  const { error } = await supabase
    .from('trust_spreadsheets')
    .upsert({
      trust_organization_id: trustId,
      file_name: fileName,
      parsed_data: parsedData,
      uploaded_by: auth.userId,
    }, { onConflict: 'trust_organization_id' });

  if (error) return apiError(error.message, 500);
  return apiSuccess({ ok: true, trust_organization_id: trustId });
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
  if (!mem) return apiError('Not a member', 403);

  const trustId = await resolveTrustOrg(supabase, orgId);
  const { error } = await supabase
    .from('trust_spreadsheets')
    .delete()
    .eq('trust_organization_id', trustId);

  if (error) return apiError(error.message, 500);
  return apiSuccess({ ok: true });
});
