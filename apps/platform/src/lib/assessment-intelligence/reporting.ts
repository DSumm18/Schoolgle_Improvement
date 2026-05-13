import type { SupabaseClient } from "@supabase/supabase-js";

export interface AssessmentIntelligenceSnapshotSummary {
  batchId: string;
  schoolUrn: number | null;
  sourceLabel: string;
  className: string | null;
  subject: string | null;
  assessmentPeriod: string;
  academicYearStart: number;
  assessmentDate: string | null;
  createdAt: string;
  eventCount: number;
  atExpectedCount: number;
  atExpectedPct: number | null;
  greaterDepthCount: number;
  greaterDepthPct: number | null;
  needsModerationCount: number;
  levelBreakdown: Record<string, number>;
}

export interface AssessmentIntelligenceReportingSummary {
  source: string;
  caveat: string;
  batchCount: number;
  eventCount: number;
  pupilCount: number;
  latestSourceLabel: string | null;
  latestAssessmentPeriod: string | null;
  latestAcademicYearStart: number | null;
  latestSnapshot: AssessmentIntelligenceSnapshotSummary | null;
  snapshots: AssessmentIntelligenceSnapshotSummary[];
}

interface BatchRow {
  id: string;
  school_urn: number | null;
  source_label: string;
  assessment_period: string;
  academic_year_start: number;
  assessment_date: string | null;
  raw_snapshot: Record<string, unknown> | null;
  created_at: string;
}

interface EventRow {
  source_batch_id: string;
  pupil_hash: string;
  subject: string | null;
  canonical_level: string | null;
  is_at_expected: boolean | null;
  is_greater_depth: boolean | null;
  uncertainty_flag: boolean | null;
}

export async function buildAssessmentIntelligenceReportingSummary(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    includeChildOrganizations?: boolean;
    schoolUrn?: number | null;
    limit?: number;
  },
): Promise<AssessmentIntelligenceReportingSummary> {
  const organizationIds = [input.organizationId];
  if (input.includeChildOrganizations) {
    const { data: childOrganizations } = await supabase
      .from("organizations")
      .select("id")
      .eq("parent_organization_id", input.organizationId);

    for (const child of childOrganizations ?? []) {
      if (typeof child.id === "string" && !organizationIds.includes(child.id)) {
        organizationIds.push(child.id);
      }
    }
  }

  let batchQuery = supabase
    .from("assessment_source_batches")
    .select("id, school_urn, source_label, assessment_period, academic_year_start, assessment_date, raw_snapshot, created_at")
    .in("organization_id", organizationIds)
    .order("created_at", { ascending: false })
    .limit(input.limit ?? 10);

  if (input.schoolUrn) {
    batchQuery = batchQuery.eq("school_urn", input.schoolUrn);
  }

  const { data: batchData, error: batchError } = await batchQuery;
  if (batchError || !batchData?.length) {
    return emptyAssessmentIntelligenceSummary();
  }

  const batches = batchData as BatchRow[];
  const batchIds = batches.map((batch) => batch.id);
  const { data: eventData, error: eventError } = await supabase
    .from("pupil_assessment_events")
    .select("source_batch_id, pupil_hash, subject, canonical_level, is_at_expected, is_greater_depth, uncertainty_flag")
    .in("source_batch_id", batchIds);

  if (eventError) {
    return emptyAssessmentIntelligenceSummary();
  }

  const events = (eventData ?? []) as EventRow[];
  const eventsByBatch = new Map<string, EventRow[]>();
  for (const event of events) {
    const current = eventsByBatch.get(event.source_batch_id) ?? [];
    current.push(event);
    eventsByBatch.set(event.source_batch_id, current);
  }

  const snapshots = batches.map((batch) => {
    const batchEvents = eventsByBatch.get(batch.id) ?? [];
    const atExpectedCount = batchEvents.filter((event) => event.is_at_expected).length;
    const greaterDepthCount = batchEvents.filter((event) => event.is_greater_depth).length;
    const needsModerationCount = batchEvents.filter((event) => event.uncertainty_flag).length;
    const levelBreakdown = batchEvents.reduce<Record<string, number>>((acc, event) => {
      const key = event.canonical_level || "unknown";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});
    const subject = batchEvents.find((event) => event.subject)?.subject ?? null;

    return {
      batchId: batch.id,
      schoolUrn: batch.school_urn,
      sourceLabel: batch.source_label,
      className: typeof batch.raw_snapshot?.className === "string" ? batch.raw_snapshot.className : null,
      subject,
      assessmentPeriod: batch.assessment_period,
      academicYearStart: batch.academic_year_start,
      assessmentDate: batch.assessment_date,
      createdAt: batch.created_at,
      eventCount: batchEvents.length,
      atExpectedCount,
      atExpectedPct: pct(atExpectedCount, batchEvents.length),
      greaterDepthCount,
      greaterDepthPct: pct(greaterDepthCount, batchEvents.length),
      needsModerationCount,
      levelBreakdown,
    };
  });

  return {
    source: "assessment_source_batches + pupil_assessment_events",
    caveat: "Teacher-locked Schoolgle assessment evidence. This is live school assessment intelligence, not DfE validated public outcomes.",
    batchCount: batches.length,
    eventCount: events.length,
    pupilCount: new Set(events.map((event) => event.pupil_hash)).size,
    latestSourceLabel: snapshots[0]?.sourceLabel ?? null,
    latestAssessmentPeriod: snapshots[0]?.assessmentPeriod ?? null,
    latestAcademicYearStart: snapshots[0]?.academicYearStart ?? null,
    latestSnapshot: snapshots[0] ?? null,
    snapshots,
  };
}

function emptyAssessmentIntelligenceSummary(): AssessmentIntelligenceReportingSummary {
  return {
    source: "assessment_source_batches + pupil_assessment_events",
    caveat: "No teacher-locked assessment intelligence snapshots found for this scope.",
    batchCount: 0,
    eventCount: 0,
    pupilCount: 0,
    latestSourceLabel: null,
    latestAssessmentPeriod: null,
    latestAcademicYearStart: null,
    latestSnapshot: null,
    snapshots: [],
  };
}

function pct(numerator: number, denominator: number) {
  return denominator > 0 ? Math.round((numerator / denominator) * 1000) / 10 : null;
}
