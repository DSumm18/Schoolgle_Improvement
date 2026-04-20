// ─── GIAS History → Timeline Event Emitter ───────────────────────────────────
// Reads dated events from dfe_data.school_history (populated weekly from the
// GIAS bulk download) and converts the significant ones into school_timeline_events
// rows for a given URN.
//
// Only DATED events (actual historical occurrences) are emitted — "_current"
// baseline rows are treated as snapshots, not events, and are ignored here.
// When the weekly delta job runs, it will emit new *_current rows with
// old_value != new_value, which we DO convert into timeline events.
//
// Usage (server-side):
//   import { buildGiasTimelineEvents } from '@/lib/school-events/emit-from-gias-history';
//   const events = await buildGiasTimelineEvents({ supabase, urn: 148201, organizationId });
//   // events is SchoolEventInsert[] ready for insert via /api/events batch.

import type { SupabaseClient } from '@supabase/supabase-js';
import type { SchoolEventInsert } from './types';
import type { SchoolEventCategory, SchoolEventSeverity } from './registry';

export interface BuildGiasTimelineParams {
  supabase: SupabaseClient;
  urn: number;
  organizationId: string;
  schoolName?: string;
  /** When provided, only events strictly after this date are returned (for delta runs). */
  sinceDate?: string; // YYYY-MM-DD
}

interface HistoryRow {
  urn: number;
  snapshot_date: string;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
}

// Map of GIAS field_name -> timeline event metadata
// Only fields listed here become timeline events. Baseline "_current" fields are
// intentionally excluded — they only become events when we DETECT a change via the
// weekly delta job, which emits them with both old_value AND new_value populated.
const FIELD_TO_EVENT: Record<string, {
  event_type: string;
  event_category: SchoolEventCategory;
  severity: SchoolEventSeverity;
  /** Generate title from row. */
  title: (r: HistoryRow) => string;
  /** Generate description from row. */
  description: (r: HistoryRow) => string;
  tags: string[];
}> = {
  // ── Dated lifecycle events (always present on import) ────────────────────
  establishment_opened: {
    event_type: 'dfe.academy-conversion', // closest existing type; really a generic "opened"
    event_category: 'governance',
    severity: 'info',
    title: () => 'School opened on DfE register',
    description: (r) => r.new_value || 'Establishment opened',
    tags: ['gias', 'lifecycle', 'opened'],
  },
  establishment_closed: {
    event_type: 'dfe.academy-conversion',
    event_category: 'governance',
    severity: 'medium',
    title: () => 'School closed on DfE register',
    description: (r) => r.new_value || r.old_value || 'Establishment closed',
    tags: ['gias', 'lifecycle', 'closed'],
  },
  trust_joined: {
    event_type: 'dfe.academy-conversion',
    event_category: 'governance',
    severity: 'info',
    title: (r) => `Joined MAT: ${shortenValue(r.new_value)}`,
    description: (r) => `School joined the multi-academy trust ${r.new_value}`,
    tags: ['gias', 'trust', 'joined'],
  },
  trust_left: {
    event_type: 'dfe.academy-conversion',
    event_category: 'governance',
    severity: 'medium',
    title: (r) => `Left MAT: ${shortenValue(r.old_value)}`,
    description: (r) => `School left the multi-academy trust ${r.old_value}`,
    tags: ['gias', 'trust', 'left'],
  },
  predecessor_link: {
    event_type: 'dfe.academy-conversion',
    event_category: 'governance',
    severity: 'info',
    title: () => 'Predecessor school linked',
    description: (r) => r.new_value || 'Predecessor established',
    tags: ['gias', 'lifecycle', 'predecessor'],
  },
  successor_link: {
    event_type: 'dfe.academy-conversion',
    event_category: 'governance',
    severity: 'info',
    title: () => 'Successor school linked',
    description: (r) => r.new_value || 'Successor established',
    tags: ['gias', 'lifecycle', 'successor'],
  },
  establishment_link: {
    event_type: 'dfe.academy-conversion',
    event_category: 'governance',
    severity: 'info',
    title: () => 'Establishment link recorded',
    description: (r) => r.new_value || 'Link recorded',
    tags: ['gias', 'lifecycle', 'link'],
  },

  // ── Delta-only events (only meaningful when old_value AND new_value differ) ──
  // These fields live in school_history as "_current" baselines; the weekly delta
  // job will re-insert them with an old_value when it detects a change. Only those
  // rows (where old_value != null AND old_value != new_value) produce timeline events.
  head_current: {
    event_type: 'staff.leadership-change',
    event_category: 'leadership',
    severity: 'medium',
    title: (r) => `Headteacher changed: ${shortenValue(r.old_value)} → ${shortenValue(r.new_value)}`,
    description: (r) => `New headteacher recorded on the DfE register (was: ${r.old_value || 'unknown'}; now: ${r.new_value || 'unknown'}).`,
    tags: ['gias', 'leadership', 'headteacher'],
  },
  establishment_name_current: {
    event_type: 'dfe.academy-conversion',
    event_category: 'governance',
    severity: 'medium',
    title: (r) => `School renamed: "${shortenValue(r.old_value)}" → "${shortenValue(r.new_value)}"`,
    description: (r) => `School name changed on the DfE register from "${r.old_value}" to "${r.new_value}".`,
    tags: ['gias', 'rename'],
  },
  trust_name_current: {
    event_type: 'dfe.academy-conversion',
    event_category: 'governance',
    severity: 'medium',
    title: (r) => `MAT changed: ${shortenValue(r.old_value)} → ${shortenValue(r.new_value)}`,
    description: (r) => `School moved from MAT "${r.old_value}" to "${r.new_value}".`,
    tags: ['gias', 'trust', 'changed'],
  },
  establishment_status_current: {
    event_type: 'dfe.academy-conversion',
    event_category: 'governance',
    severity: 'high',
    title: (r) => `Status changed: ${r.old_value} → ${r.new_value}`,
    description: (r) => `DfE establishment status flipped from "${r.old_value}" to "${r.new_value}".`,
    tags: ['gias', 'status'],
  },
  phase_of_education_current: {
    event_type: 'dfe.academy-conversion',
    event_category: 'governance',
    severity: 'medium',
    title: (r) => `Phase changed: ${r.old_value} → ${r.new_value}`,
    description: (r) => `Phase of education changed from "${r.old_value}" to "${r.new_value}".`,
    tags: ['gias', 'phase'],
  },
  type_of_establishment_current: {
    event_type: 'dfe.academy-conversion',
    event_category: 'governance',
    severity: 'medium',
    title: (r) => `Establishment type changed: ${r.old_value} → ${r.new_value}`,
    description: (r) => `Type of establishment changed from "${r.old_value}" to "${r.new_value}".`,
    tags: ['gias', 'type'],
  },
};

function shortenValue(v: string | null | undefined): string {
  if (!v) return 'unknown';
  const s = String(v).trim();
  return s.length > 60 ? `${s.slice(0, 57)}...` : s;
}

/**
 * Read dfe_data.school_history rows for a URN and emit only the rows that
 * represent actual CHANGE events (never baseline snapshots).
 */
export async function buildGiasTimelineEvents(params: BuildGiasTimelineParams): Promise<Partial<SchoolEventInsert>[]> {
  const { supabase, urn, organizationId, schoolName, sinceDate } = params;

  let q = supabase
    .schema('dfe_data')
    .from('school_history')
    .select('urn, snapshot_date, field_name, old_value, new_value')
    .eq('urn', urn)
    .order('snapshot_date', { ascending: true });

  if (sinceDate) q = q.gt('snapshot_date', sinceDate);

  const { data, error } = await q;
  if (error) throw error;
  if (!data || data.length === 0) return [];

  const out: Partial<SchoolEventInsert>[] = [];

  for (const row of data as HistoryRow[]) {
    const mapping = FIELD_TO_EVENT[row.field_name];
    if (!mapping) continue;

    // For "_current" baseline fields we ONLY emit when a real change is recorded
    // (old_value populated AND differs from new_value). On first import old_value
    // is always null for these fields — those are baselines and should be skipped.
    if (row.field_name.endsWith('_current')) {
      if (!row.old_value || row.old_value === row.new_value) continue;
    }

    const occurredAt = new Date(`${row.snapshot_date}T00:00:00Z`).toISOString();

    out.push({
      organization_id: organizationId,
      event_type: mapping.event_type,
      event_category: mapping.event_category,
      severity: mapping.severity,
      occurred_at: occurredAt,
      title: mapping.title(row),
      description: mapping.description(row),
      impact_summary: null,
      source_app: 'system',
      source_entity_type: 'gias_school_history',
      source_entity_id: null,
      triggered_by_event_id: null,
      related_action_id: null,
      actor_id: null,
      actor_name: 'DfE GIAS',
      evidence: {
        urn: row.urn,
        field_name: row.field_name,
        old_value: row.old_value,
        new_value: row.new_value,
        snapshot_date: row.snapshot_date,
      },
      metadata: {
        school_urn: row.urn,
        school_name: schoolName ?? null,
        source: 'dfe.gias',
      },
      tags: mapping.tags,
    });
  }

  return out;
}

/**
 * Helper used by API routes: fetch the history, build the events, and upsert into
 * school_timeline_events for a single URN. Returns the count of NEW events inserted.
 */
export async function syncGiasTimelineForSchool(
  supabase: SupabaseClient,
  opts: { urn: number; organizationId: string; schoolName?: string; sinceDate?: string }
): Promise<{ built: number; inserted: number }> {
  const events = await buildGiasTimelineEvents({ supabase, ...opts });
  if (events.length === 0) return { built: 0, inserted: 0 };

  // Best-effort dedup: check which (source_entity_type, occurred_at, event_type) combos already exist
  const { data: existing } = await supabase
    .from('school_timeline_events')
    .select('event_type, occurred_at, title')
    .eq('organization_id', opts.organizationId)
    .eq('source_entity_type', 'gias_school_history')
    .contains('metadata', { school_urn: opts.urn });

  const existingKeys = new Set(
    (existing ?? []).map((e) => `${e.event_type}|${e.occurred_at}|${e.title}`)
  );

  const toInsert = events.filter(
    (e) => !existingKeys.has(`${e.event_type}|${e.occurred_at}|${e.title}`)
  );

  if (toInsert.length === 0) return { built: events.length, inserted: 0 };

  const { error } = await supabase.from('school_timeline_events').insert(toInsert);
  if (error) throw error;
  return { built: events.length, inserted: toInsert.length };
}
