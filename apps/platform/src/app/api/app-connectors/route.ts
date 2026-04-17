import { NextRequest } from 'next/server';
import { protectedRoute, apiSuccess, apiError } from '@/lib/api-utils';
import { createServiceRoleClient } from '@/lib/supabase-server';

/**
 * GET /api/app-connectors?app_id=trust-assessor
 * Returns all active data connectors for the user's org, optionally filtered by app.
 * These are file-to-app mappings (e.g. "this Drive spreadsheet feeds Trust Assessor").
 */
export const GET = protectedRoute(async (auth, req: NextRequest) => {
  const supabase = createServiceRoleClient();
  const appId = req.nextUrl.searchParams.get('app_id');

  let query = supabase
    .from('app_connectors')
    .select('*')
    .eq('organization_id', auth.organizationId)
    .neq('status', 'disconnected')
    .order('created_at', { ascending: false });

  if (appId) {
    query = query.eq('app_id', appId);
  }

  const { data, error } = await query;
  if (error) return apiError(error.message, 500);

  return apiSuccess(data ?? []);
});

/**
 * POST /api/app-connectors
 * Create or update a connector linking a data source to an app.
 * Body: { app_id, source_type, source_file_id, source_file_name, connector_name, ... }
 */
export const POST = protectedRoute(async (auth, req: NextRequest) => {
  const supabase = createServiceRoleClient();
  const body = await req.json();

  const {
    app_id,
    source_type,
    source_file_id,
    source_file_name,
    source_path,
    source_mime_type,
    connector_name,
    connector_group,
    data_categories,
    processing_purpose,
  } = body;

  console.log('[app-connectors] POST:', { app_id, source_type, source_file_id, connector_name, org: auth.organizationId });

  if (!app_id || !source_type || !connector_name) {
    return apiError('app_id, source_type, and connector_name are required', 400);
  }

  // If this exact file is already connected to this app, just update sync time
  if (source_file_id) {
    const { data: existing } = await supabase
      .from('app_connectors')
      .select('id')
      .eq('organization_id', auth.organizationId)
      .eq('app_id', app_id)
      .eq('source_file_id', source_file_id)
      .eq('status', 'active')
      .limit(1);

    if (existing && existing.length > 0) {
      const { data: updated, error: updateError } = await supabase
        .from('app_connectors')
        .update({
          last_sync_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          source_file_name: source_file_name ?? undefined,
        })
        .eq('id', existing[0].id)
        .select()
        .single();

      if (updateError) return apiError(updateError.message, 500);
      return apiSuccess(updated);
    }
  }

  // Create new connector
  const { data, error } = await supabase
    .from('app_connectors')
    .insert({
      organization_id: auth.organizationId,
      app_id,
      source_type,
      source_file_id,
      source_file_name,
      source_path,
      source_mime_type,
      connector_name: connector_name || source_file_name || 'Unnamed connector',
      connector_group,
      data_categories: data_categories ?? [],
      processing_purpose: processing_purpose ?? `Data source for ${app_id}`,
      legal_basis: 'legitimate_interest',
      retention_policy: 'until_disconnected',
      status: 'active',
      connected_by: auth.userId,
      last_sync_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) return apiError(error.message, 500);
  return apiSuccess(data);
});

/**
 * DELETE /api/app-connectors?id=<connector-id>
 * Disconnect a connector (soft-delete — sets status to 'disconnected').
 */
export const DELETE = protectedRoute(async (auth, req: NextRequest) => {
  const supabase = createServiceRoleClient();
  const connectorId = req.nextUrl.searchParams.get('id');

  if (!connectorId) return apiError('Connector ID is required', 400);

  const { error } = await supabase
    .from('app_connectors')
    .update({ status: 'disconnected', updated_at: new Date().toISOString() })
    .eq('id', connectorId)
    .eq('organization_id', auth.organizationId);

  if (error) return apiError(error.message, 500);
  return apiSuccess({ disconnected: true });
});
