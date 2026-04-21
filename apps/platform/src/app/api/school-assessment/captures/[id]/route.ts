// GET    /api/school-assessment/captures/:id                    — full capture + all cells
// PATCH  /api/school-assessment/captures/:id                    — update notes / capture metadata
// DELETE /api/school-assessment/captures/:id                    — delete (only if draft)

import { NextRequest } from 'next/server';
import { protectedRoute, apiSuccess, apiError } from '@/lib/api-utils';
import { createServiceRoleClient } from '@/lib/supabase-server';

function extractId(req: NextRequest): string | null {
  // /api/school-assessment/captures/[id] — id is segment at index 4 after leading slash split
  const segments = req.nextUrl.pathname.split('/').filter(Boolean);
  const idx = segments.indexOf('captures');
  if (idx === -1 || idx + 1 >= segments.length) return null;
  return segments[idx + 1];
}

async function assertMembership(supabase: ReturnType<typeof createServiceRoleClient>, captureId: string, userId: string) {
  const { data: capture } = await supabase
    .from('school_assessment_captures')
    .select('id, organization_id, status')
    .eq('id', captureId)
    .maybeSingle();
  if (!capture) return { capture: null, error: 'Capture not found' as const, status: 404 };

  const { data: mem } = await supabase
    .from('organization_members')
    .select('role')
    .eq('auth_id', userId)
    .eq('organization_id', capture.organization_id)
    .maybeSingle();
  if (!mem) return { capture: null, error: 'Not a member' as const, status: 403 };

  return { capture, error: null, status: 200 };
}

export const GET = protectedRoute(async (auth, req: NextRequest) => {
  const id = extractId(req);
  if (!id) return apiError('id required', 400);

  const supabase = createServiceRoleClient();
  const check = await assertMembership(supabase, id, auth.userId);
  if (check.error) return apiError(check.error, check.status);

  const { data: cells, error: cellsErr } = await supabase
    .from('school_assessment_cells')
    .select('year_group, section, metric, value, updated_at')
    .eq('capture_id', id);
  if (cellsErr) return apiError(cellsErr.message, 500);

  return apiSuccess({
    capture: check.capture,
    cells: cells ?? [],
  });
});

export const PATCH = protectedRoute(async (auth, req: NextRequest) => {
  const id = extractId(req);
  if (!id) return apiError('id required', 400);

  const body = await req.json().catch(() => ({}));
  const { notes } = body;

  const supabase = createServiceRoleClient();
  const check = await assertMembership(supabase, id, auth.userId);
  if (check.error) return apiError(check.error, check.status);

  const { error } = await supabase
    .from('school_assessment_captures')
    .update({ notes: notes ?? null, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) return apiError(error.message, 500);
  return apiSuccess({ ok: true });
});

export const DELETE = protectedRoute(async (auth, req: NextRequest) => {
  const id = extractId(req);
  if (!id) return apiError('id required', 400);

  const supabase = createServiceRoleClient();
  const check = await assertMembership(supabase, id, auth.userId);
  if (check.error) return apiError(check.error, check.status);
  if (check.capture!.status === 'locked') return apiError('Cannot delete a locked capture', 400);

  const { error } = await supabase
    .from('school_assessment_captures')
    .delete()
    .eq('id', id);
  if (error) return apiError(error.message, 500);
  return apiSuccess({ ok: true });
});
