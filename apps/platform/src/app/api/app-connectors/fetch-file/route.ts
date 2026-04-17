import { NextRequest } from 'next/server';
import { protectedRoute, apiSuccess, apiError } from '@/lib/api-utils';
import { createServiceRoleClient } from '@/lib/supabase-server';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

/**
 * GET /api/app-connectors/fetch-file?connector_id=xxx
 * Server-side fetch of a Drive file using the org's saved connector.
 * Returns the raw file content as binary (not JSON).
 * Uses the server-side Google API key, not the user's browser token.
 */
export const GET = protectedRoute(async (auth, req: NextRequest) => {
  const connectorId = req.nextUrl.searchParams.get('connector_id');

  if (!connectorId) return apiError('connector_id is required', 400);
  if (!GOOGLE_API_KEY) return apiError('Google API key not configured on server', 500);

  const supabase = createServiceRoleClient();

  // Get the connector record
  const { data: connector, error: connError } = await supabase
    .from('app_connectors')
    .select('*')
    .eq('id', connectorId)
    .eq('organization_id', auth.organizationId)
    .eq('status', 'active')
    .single();

  if (connError || !connector) {
    return apiError('Connector not found or not active', 404);
  }

  if (!connector.source_file_id) {
    return apiError('No file ID stored in this connector', 400);
  }

  try {
    // Fetch the file from Google Drive using server-side API key
    const driveRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${connector.source_file_id}?alt=media&key=${GOOGLE_API_KEY}`,
    );

    if (!driveRes.ok) {
      // Update connector status on error
      const errorMsg = driveRes.status === 404
        ? 'File not found in Google Drive — it may have been moved or deleted'
        : driveRes.status === 403
          ? 'Access denied — the file must be shared with the Schoolgle service account'
          : `Google Drive returned ${driveRes.status}`;

      await supabase
        .from('app_connectors')
        .update({ status: 'error', last_error: errorMsg, updated_at: new Date().toISOString() })
        .eq('id', connectorId);

      return apiError(errorMsg, driveRes.status);
    }

    // Update last sync time
    await supabase
      .from('app_connectors')
      .update({ last_sync_at: new Date().toISOString(), last_error: null, status: 'active', updated_at: new Date().toISOString() })
      .eq('id', connectorId);

    // Return the raw file content as NextResponse
    const arrayBuffer = await driveRes.arrayBuffer();
    const { NextResponse } = await import('next/server');
    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': connector.source_mime_type || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${connector.source_file_name || 'file'}"`,
      },
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to fetch from Drive';
    await supabase
      .from('app_connectors')
      .update({ status: 'error', last_error: errorMsg, updated_at: new Date().toISOString() })
      .eq('id', connectorId);

    return apiError(errorMsg, 500);
  }
}, { orgOptional: true });
