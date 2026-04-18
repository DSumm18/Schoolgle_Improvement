import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api-utils';

/**
 * POST /api/trust-assessor/generate-report/save-edits
 *
 * Persists headteacher edits to a governor report.
 * v1: localStorage is the source of truth — this endpoint is a fire-and-forget
 *     call so edits can later be synced server-side (Supabase report_edits table).
 *
 * Body: { shareToken: string, edits: Record<string, string> }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { shareToken, edits } = body;

    if (!shareToken || typeof shareToken !== 'string') {
      return apiError('shareToken is required', 400);
    }

    if (!edits || typeof edits !== 'object') {
      return apiError('edits must be an object', 400);
    }

    // v1: Log and return success. In v2 this will write to Supabase report_edits table.
    // The client treats localStorage as the source of truth; this endpoint is bonus persistence.
    console.log('[save-edits] Received edits for token', shareToken, '— field count:', Object.keys(edits).length);

    // TODO v2: Insert into report_edits table
    // await supabase.from('report_edits').upsert({
    //   share_token: shareToken,
    //   edits: edits,
    //   updated_at: new Date().toISOString(),
    // }, { onConflict: 'share_token' });

    return apiSuccess({ saved: true, fieldCount: Object.keys(edits).length });
  } catch (err) {
    console.error('[save-edits] Error:', err);
    return apiError('Failed to save edits', 500);
  }
}
