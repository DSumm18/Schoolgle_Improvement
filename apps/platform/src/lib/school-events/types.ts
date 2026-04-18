import type { SchoolEventCategory, SchoolEventSeverity, SchoolEventSource } from './registry';

// ─── Database row shape ───────────────────────────────────────────────────────

export interface SchoolEvent {
  id: string;
  organization_id: string;

  event_type: string;
  event_category: SchoolEventCategory;
  severity: SchoolEventSeverity;

  occurred_at: string; // ISO string
  recorded_at: string;

  title: string;
  description: string | null;
  impact_summary: string | null;

  source_app: SchoolEventSource;
  source_entity_type: string | null;
  source_entity_id: string | null;
  triggered_by_event_id: string | null;
  related_action_id: string | null;

  actor_id: string | null;
  actor_name: string | null;

  evidence: Record<string, unknown> | null;
  metadata: Record<string, unknown>;
  tags: string[];

  created_at: string;
}

// ─── Insert shape (all optional fields optional) ─────────────────────────────

export type SchoolEventInsert = Omit<SchoolEvent,
  | 'id'
  | 'recorded_at'
  | 'created_at'
> & {
  recorded_at?: string;
};

// ─── Filter params for API queries ───────────────────────────────────────────

export interface SchoolEventFilters {
  organizationId: string;
  category?: SchoolEventCategory;
  severity?: SchoolEventSeverity;
  source_app?: SchoolEventSource;
  from?: string;
  to?: string;
  tags?: string[];
  school_urn?: number; // matched against metadata->>'school_urn'
  limit?: number;
  offset?: number;
}
