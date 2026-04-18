import { NextRequest } from 'next/server';
import { protectedRoute, apiSuccess, apiError } from '@/lib/api-utils';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { isValidEventType } from '@/lib/school-events/registry';
import type { SchoolEventInsert } from '@/lib/school-events/types';

// ─── POST /api/events/batch ───────────────────────────────────────────────────
// Insert multiple school events at once (used by Trust Assessor, ~8–12 per school).
// Body: { events: SchoolEventInsert[] }

export const POST = protectedRoute(async (auth, req: NextRequest) => {
  const organizationId = auth.organizationId;
  if (!organizationId) {
    return apiError('No organisation found for this user', 400);
  }

  let body: { events: Partial<SchoolEventInsert>[] };
  try {
    body = await req.json();
  } catch {
    return apiError('Invalid JSON body', 400);
  }

  if (!Array.isArray(body?.events) || body.events.length === 0) {
    return apiError('Body must contain a non-empty "events" array', 400);
  }

  if (body.events.length > 100) {
    return apiError('Batch size limit is 100 events per request', 400);
  }

  // Validate each event
  const validationErrors: string[] = [];
  for (let i = 0; i < body.events.length; i++) {
    const e = body.events[i];
    if (!e.event_type || !e.event_category || !e.title || !e.occurred_at || !e.source_app) {
      validationErrors.push(`Event[${i}]: missing required fields (event_type, event_category, title, occurred_at, source_app)`);
    } else if (!isValidEventType(e.event_type)) {
      validationErrors.push(`Event[${i}]: unknown event_type "${e.event_type}"`);
    }
  }

  if (validationErrors.length > 0) {
    return apiError(`Validation failed: ${validationErrors.join('; ')}`, 400);
  }

  const supabase = createServiceRoleClient();

  const rows = body.events.map((e) => ({
    ...e,
    organization_id: organizationId,
  }));

  const { data, error } = await supabase
    .from('school_timeline_events')
    .insert(rows)
    .select();

  if (error) {
    console.error('[POST /api/events/batch] Supabase error:', error);
    return apiError('Failed to insert events batch', 500);
  }

  return apiSuccess({ inserted: data?.length ?? 0, events: data ?? [] }, 201);
});
