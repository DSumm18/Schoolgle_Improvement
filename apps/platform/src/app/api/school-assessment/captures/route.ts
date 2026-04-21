// GET  /api/school-assessment/captures?organizationId=X    — list captures
// POST /api/school-assessment/captures                     — create new capture
//
// Model is free-form: each capture has a date (when the data was snapshotted)
// and a name (what the school calls it — "Autumn Term", "Easter half-term",
// "Pre-SATs practice", "Y6 writing moderation Mar 26", etc.). Unique per org
// by name. Schools assess on different cycles, so we don't enforce a fixed
// period enum.

import { NextRequest } from 'next/server';
import { protectedRoute, apiSuccess, apiError } from '@/lib/api-utils';
import { createServiceRoleClient } from '@/lib/supabase-server';

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

  const { data, error } = await supabase
    .from('school_assessment_captures')
    .select('id, capture_name, capture_date, status, notes, created_at, updated_at, locked_at')
    .eq('organization_id', orgId)
    .order('capture_date', { ascending: false });

  if (error) return apiError(error.message, 500);
  return apiSuccess(data ?? []);
});

export const POST = protectedRoute(async (auth, req: NextRequest) => {
  const body = await req.json().catch(() => ({}));
  const { organizationId, captureName, captureDate, notes } = body;
  const orgId = organizationId || auth.organizationId;

  if (!orgId) return apiError('organizationId required', 400);
  if (!captureName || typeof captureName !== 'string' || !captureName.trim()) {
    return apiError('captureName required', 400);
  }
  if (!captureDate || !/^\d{4}-\d{2}-\d{2}$/.test(captureDate)) {
    return apiError('captureDate required in format YYYY-MM-DD', 400);
  }

  const supabase = createServiceRoleClient();
  const { data: mem } = await supabase
    .from('organization_members')
    .select('role')
    .eq('auth_id', auth.userId)
    .eq('organization_id', orgId)
    .maybeSingle();
  if (!mem) return apiError('Not a member', 403);

  const { data, error } = await supabase
    .from('school_assessment_captures')
    .insert({
      organization_id: orgId,
      capture_name: captureName.trim(),
      capture_date: captureDate,
      notes: notes || null,
      created_by: auth.userId,
    })
    .select('id, capture_name, capture_date, status, notes, created_at')
    .single();

  if (error) {
    const code = (error as unknown as { code?: string })?.code;
    if (code === '23505') return apiError('You already have a capture with that name — give this one a different name.', 409);
    return apiError(error.message, 500);
  }

  return apiSuccess(data);
});
