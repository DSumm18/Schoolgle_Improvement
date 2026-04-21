// PUT /api/school-assessment/captures/:id/cells
// Bulk upsert of cells for a capture. Body: { cells: [{year_group, section, metric, value}, ...] }
// Blocked if the capture is locked.

import { NextRequest } from 'next/server';
import { protectedRoute, apiSuccess, apiError } from '@/lib/api-utils';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { validateCell, YEAR_GROUP_METRICS, COHORT_METRICS, type MetricKey, type YearGroup } from '@/lib/school-assessment/metrics-config';

function extractCaptureId(req: NextRequest): string | null {
  const segments = req.nextUrl.pathname.split('/').filter(Boolean);
  const idx = segments.indexOf('captures');
  if (idx === -1 || idx + 1 >= segments.length) return null;
  return segments[idx + 1];
}

export const PUT = protectedRoute(async (auth, req: NextRequest) => {
  const captureId = extractCaptureId(req);
  if (!captureId) return apiError('captureId required', 400);

  const body = await req.json().catch(() => ({}));
  const incoming = Array.isArray(body.cells) ? body.cells : [];
  if (incoming.length === 0) return apiSuccess({ ok: true, updated: 0 });

  const supabase = createServiceRoleClient();
  const { data: capture } = await supabase
    .from('school_assessment_captures')
    .select('id, organization_id, status')
    .eq('id', captureId)
    .maybeSingle();
  if (!capture) return apiError('Capture not found', 404);
  if (capture.status === 'locked') return apiError('Cannot edit a locked capture', 400);

  const { data: mem } = await supabase
    .from('organization_members')
    .select('role')
    .eq('auth_id', auth.userId)
    .eq('organization_id', capture.organization_id)
    .maybeSingle();
  if (!mem) return apiError('Not a member', 403);

  // Validate every cell against the metrics config. Reject the whole batch on first error.
  const metricLookup = new Map<string, ReturnType<typeof lookupMetric>>();
  function lookupMetric(yg: YearGroup, section: string, metric: MetricKey) {
    if (section === 'cohort') return COHORT_METRICS.find(m => m.key === metric);
    const list = YEAR_GROUP_METRICS[yg];
    return list?.find(m => m.key === metric);
  }

  // First pass — build a cohort-size lookup for count validation.
  const cohortByYg = new Map<string, number>();
  for (const c of incoming) {
    if (c.section === 'cohort' && c.metric === 'number_in_cohort' && typeof c.value === 'number') {
      cohortByYg.set(c.year_group, c.value);
    }
  }

  const rows: Array<{ capture_id: string; year_group: string; section: string; metric: string; value: number | null; updated_by: string }> = [];
  for (const c of incoming) {
    if (!c || typeof c.year_group !== 'string' || typeof c.section !== 'string' || typeof c.metric !== 'string') {
      return apiError('Each cell must include year_group, section, metric', 400);
    }
    const def = lookupMetric(c.year_group as YearGroup, c.section, c.metric as MetricKey);
    if (!def) {
      return apiError(`Unknown metric ${c.section}/${c.metric} for ${c.year_group}`, 400);
    }
    const err = validateCell(def, c.value, cohortByYg.get(c.year_group));
    if (err) return apiError(`${c.year_group} / ${def.label}: ${err}`, 400);

    const numeric = (c.value === null || c.value === undefined || c.value === '')
      ? null
      : (typeof c.value === 'number' ? c.value : Number(String(c.value).replace(/[%,\s]/g, '')));

    rows.push({
      capture_id: captureId,
      year_group: c.year_group,
      section: c.section,
      metric: c.metric,
      value: numeric,
      updated_by: auth.userId,
    });
    metricLookup.set(`${c.year_group}:${c.section}:${c.metric}`, def);
  }

  const { error } = await supabase
    .from('school_assessment_cells')
    .upsert(rows, { onConflict: 'capture_id,year_group,section,metric' });
  if (error) return apiError(error.message, 500);

  await supabase
    .from('school_assessment_captures')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', captureId);

  return apiSuccess({ ok: true, updated: rows.length });
});
