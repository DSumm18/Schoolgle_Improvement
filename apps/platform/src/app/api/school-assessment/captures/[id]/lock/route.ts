// POST /api/school-assessment/captures/:id/lock   — lock capture (immutable thereafter)
// POST /api/school-assessment/captures/:id/unlock — unlock (admin only)

import { NextRequest } from 'next/server';
import { protectedRoute, apiSuccess, apiError } from '@/lib/api-utils';
import { createServiceRoleClient } from '@/lib/supabase-server';

function extractId(req: NextRequest): string | null {
  const segments = req.nextUrl.pathname.split('/').filter(Boolean);
  const idx = segments.indexOf('captures');
  if (idx === -1 || idx + 1 >= segments.length) return null;
  return segments[idx + 1];
}

export const POST = protectedRoute(async (auth, req: NextRequest) => {
  const id = extractId(req);
  if (!id) return apiError('id required', 400);

  const supabase = createServiceRoleClient();
  const { data: capture } = await supabase
    .from('school_assessment_captures')
    .select('id, organization_id, status')
    .eq('id', id)
    .maybeSingle();
  if (!capture) return apiError('Capture not found', 404);

  const { data: mem } = await supabase
    .from('organization_members')
    .select('role')
    .eq('auth_id', auth.userId)
    .eq('organization_id', capture.organization_id)
    .maybeSingle();
  if (!mem) return apiError('Not a member', 403);

  const { error } = await supabase
    .from('school_assessment_captures')
    .update({
      status: 'locked',
      locked_at: new Date().toISOString(),
      locked_by: auth.userId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) return apiError(error.message, 500);
  return apiSuccess({ ok: true });
}, { orgOptional: true });
