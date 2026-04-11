import { NextRequest } from 'next/server';
import { protectedRoute, apiSuccess, apiError } from '@/lib/api-utils';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { getByoConnectorRows } from '@/lib/data-connectors/byo/byo-store';

export const GET = protectedRoute(async (auth, req: NextRequest) => {
  const pathParts = req.nextUrl.pathname.split('/');
  const id = pathParts[pathParts.length - 2];
  if (!id) return apiError('Missing connector id', 400);

  const limit = parseInt(req.nextUrl.searchParams.get('limit') ?? '100', 10);
  const offset = parseInt(req.nextUrl.searchParams.get('offset') ?? '0', 10);

  const supabase = createServiceRoleClient();

  const { data: existing } = await supabase
    .from('byo_connectors')
    .select('id')
    .eq('id', id)
    .eq('organization_id', auth.organizationId)
    .single();

  if (!existing) return apiError('Connector not found', 404);

  const { rows, total } = await getByoConnectorRows(supabase, id, limit, offset);
  return apiSuccess({ rows, total, limit, offset });
});
