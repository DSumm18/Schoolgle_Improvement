import { NextRequest } from 'next/server';
import { protectedRoute, apiSuccess, apiError } from '@/lib/api-utils';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { deleteByoConnector, connectorRecordToConnector } from '@/lib/data-connectors/byo/byo-store';

export const GET = protectedRoute(async (auth, req: NextRequest) => {
  const id = req.nextUrl.pathname.split('/').at(-1);
  if (!id) return apiError('Missing connector id', 400);

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('byo_connectors')
    .select('*')
    .eq('id', id)
    .eq('organization_id', auth.organizationId)
    .single();

  if (error || !data) return apiError('Connector not found', 404);
  return apiSuccess({ connector: connectorRecordToConnector(data) });
});

export const DELETE = protectedRoute(async (auth, req: NextRequest) => {
  const id = req.nextUrl.pathname.split('/').at(-1);
  if (!id) return apiError('Missing connector id', 400);

  const supabase = createServiceRoleClient();

  const { data: existing } = await supabase
    .from('byo_connectors')
    .select('id')
    .eq('id', id)
    .eq('organization_id', auth.organizationId)
    .single();

  if (!existing) return apiError('Connector not found', 404);

  await deleteByoConnector(supabase, id);
  return apiSuccess({ deleted: true });
});
