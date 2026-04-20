import { NextRequest } from 'next/server';
import { protectedRoute, apiSuccess, apiError } from '@/lib/api-utils';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { isValidEventType } from '@/lib/school-events/registry';
import type { SchoolEventInsert } from '@/lib/school-events/types';

// ─── GET /api/events ─────────────────────────────────────────────────────────
// Returns paginated school events ordered by occurred_at DESC.
// Query params: organizationId, category, severity, source_app, from, to, school_urn, limit, offset

export const GET = protectedRoute(async (auth, req: NextRequest) => {
  const { searchParams } = req.nextUrl;

  // Org scoping — use authenticated user's org unless an admin override is provided
  const organizationId = auth.organizationId;
  if (!organizationId) {
    return apiError('No organisation found for this user', 400);
  }

  const supabase = createServiceRoleClient();

  let query = supabase
    .from('school_timeline_events')
    .select('*')
    .eq('organization_id', organizationId)
    .order('occurred_at', { ascending: false });

  // Optional filters
  const category = searchParams.get('category');
  if (category) query = query.eq('event_category', category);

  const severity = searchParams.get('severity');
  if (severity) query = query.eq('severity', severity);

  const sourceApp = searchParams.get('source_app');
  if (sourceApp) query = query.eq('source_app', sourceApp);

  const from = searchParams.get('from');
  if (from) query = query.gte('occurred_at', from);

  const to = searchParams.get('to');
  if (to) query = query.lte('occurred_at', to);

  const schoolUrn = searchParams.get('school_urn');
  if (schoolUrn) {
    // JSONB filter via @> operator — reliable for nested field matching
    query = query.contains('metadata', { school_urn: schoolUrn });
  }

  const limit = Math.min(parseInt(searchParams.get('limit') ?? '100', 10), 500);
  const offset = parseInt(searchParams.get('offset') ?? '0', 10);

  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('[GET /api/events] Supabase error:', error);
    return apiError('Failed to fetch events', 500);
  }

  return apiSuccess({ events: data ?? [], total: count ?? 0, limit, offset });
});

// ─── POST /api/events ────────────────────────────────────────────────────────
// Create a single school event. Body: SchoolEventInsert

export const POST = protectedRoute(async (auth, req: NextRequest) => {
  const organizationId = auth.organizationId;
  if (!organizationId) {
    return apiError('No organisation found for this user', 400);
  }

  let body: Partial<SchoolEventInsert>;
  try {
    body = await req.json();
  } catch {
    return apiError('Invalid JSON body', 400);
  }

  if (!body.event_type || !body.event_category || !body.title || !body.occurred_at || !body.source_app) {
    return apiError('Missing required fields: event_type, event_category, title, occurred_at, source_app', 400);
  }

  if (!isValidEventType(body.event_type)) {
    return apiError(`Unknown event_type: ${body.event_type}`, 400);
  }

  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('school_timeline_events')
    .insert({
      ...body,
      organization_id: organizationId,
    })
    .select()
    .single();

  if (error) {
    console.error('[POST /api/events] Supabase error:', error);
    return apiError('Failed to create event', 500);
  }

  return apiSuccess({ event: data }, 201);
});
