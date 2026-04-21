// GET    /api/school-assessment/captures?organizationId=X    — list captures
// POST   /api/school-assessment/captures                     — create new capture

import { NextRequest } from 'next/server';
import { protectedRoute, apiSuccess, apiError } from '@/lib/api-utils';
import { createServiceRoleClient } from '@/lib/supabase-server';

const VALID_PERIODS = ['autumn_term', 'mid_year', 'end_of_year'] as const;
type CapturePeriod = typeof VALID_PERIODS[number];

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
    .select('id, capture_period, academic_year, status, notes, created_at, updated_at, locked_at')
    .eq('organization_id', orgId)
    .order('academic_year', { ascending: false })
    .order('capture_period', { ascending: true });

  if (error) return apiError(error.message, 500);
  return apiSuccess(data ?? []);
});

export const POST = protectedRoute(async (auth, req: NextRequest) => {
  const body = await req.json().catch(() => ({}));
  const { organizationId, capturePeriod, academicYear, notes } = body;
  const orgId = organizationId || auth.organizationId;

  if (!orgId) return apiError('organizationId required', 400);
  if (!capturePeriod || !VALID_PERIODS.includes(capturePeriod as CapturePeriod)) {
    return apiError(`capturePeriod must be one of: ${VALID_PERIODS.join(', ')}`, 400);
  }
  if (!academicYear || !/^\d{4}\/\d{2}$/.test(academicYear)) {
    return apiError('academicYear required in format "2025/26"', 400);
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
      capture_period: capturePeriod,
      academic_year: academicYear,
      notes: notes || null,
      created_by: auth.userId,
    })
    .select('id, capture_period, academic_year, status, notes, created_at')
    .single();

  if (error) {
    // 23505 = unique violation
    const code = (error as unknown as { code?: string })?.code;
    if (code === '23505') return apiError('A capture for this period + academic year already exists', 409);
    return apiError(error.message, 500);
  }

  return apiSuccess(data);
});
