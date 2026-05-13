import { NextRequest } from "next/server";
import { apiError, apiSuccess, protectedRoute } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

type BatchRow = {
  id: string;
  school_urn: number | null;
  source_kind: string;
  source_label: string;
  validation_tier: string;
  assessment_period: string;
  academic_year_start: number;
  assessment_date: string | null;
  locked_at: string | null;
  locked_by: string | null;
  raw_snapshot: Record<string, unknown> | null;
  created_at: string;
};

type EventRow = {
  source_batch_id: string;
  pupil_hash: string;
  class_id: string | null;
  class_name: string | null;
  year_group_at_assessment: string | null;
  subject: string | null;
  raw_level: string | null;
  canonical_level: string | null;
  is_at_expected: boolean | null;
  is_greater_depth: boolean | null;
  teacher_comment: string | null;
  voice_transcript: string | null;
  uncertainty_flag: boolean | null;
  moderation_status: string | null;
  evidence_confidence: string | null;
};

export const GET = protectedRoute(async (auth, req: NextRequest) => {
  const orgId = auth.organizationId;
  if (!orgId) return apiError("No organization", 400);

  const url = new URL(req.url);
  const classId = url.searchParams.get("classId");
  const subject = url.searchParams.get("subject");
  const academicYearStart = Number(url.searchParams.get("academicYearStart") || new Date().getFullYear());

  const supabase = createServiceRoleClient();
  const { data: batches, error: batchError } = await supabase
    .from("assessment_source_batches")
    .select("id, school_urn, source_kind, source_label, validation_tier, assessment_period, academic_year_start, assessment_date, locked_at, locked_by, raw_snapshot, created_at")
    .eq("organization_id", orgId)
    .eq("academic_year_start", academicYearStart)
    .order("created_at", { ascending: false })
    .limit(200);

  if (batchError) return apiError(batchError.message, 500);

  const batchRows = (batches ?? []) as BatchRow[];
  const batchIds = batchRows.map((batch) => batch.id);
  const { data: events, error: eventError } = batchIds.length > 0
    ? await supabase
        .from("pupil_assessment_events")
        .select("source_batch_id, pupil_hash, class_id, class_name, year_group_at_assessment, subject, raw_level, canonical_level, is_at_expected, is_greater_depth, teacher_comment, voice_transcript, uncertainty_flag, moderation_status, evidence_confidence")
        .in("source_batch_id", batchIds)
    : { data: [], error: null };

  if (eventError) return apiError(eventError.message, 500);

  const eventRows = (events ?? []) as EventRow[];
  const byBatch = new Map<string, EventRow[]>();
  for (const event of eventRows) {
    if (classId && event.class_id !== classId) continue;
    if (subject && event.subject !== subject) continue;
    const current = byBatch.get(event.source_batch_id) ?? [];
    current.push(event);
    byBatch.set(event.source_batch_id, current);
  }

  const submissions = batchRows
    .map((batch) => {
      const batchEvents = byBatch.get(batch.id) ?? [];
      if ((classId || subject) && batchEvents.length === 0) return null;
      const firstEvent = batchEvents[0];
      const atExpectedCount = batchEvents.filter((event) => event.is_at_expected).length;
      const greaterDepthCount = batchEvents.filter((event) => event.is_greater_depth).length;
      const needsModerationCount = batchEvents.filter((event) => event.uncertainty_flag).length;

      return {
        id: batch.id,
        sourceKind: batch.source_kind,
        sourceLabel: batch.source_label,
        validationTier: batch.validation_tier,
        assessmentPeriod: batch.assessment_period,
        academicYearStart: batch.academic_year_start,
        assessmentDate: batch.assessment_date,
        lockedAt: batch.locked_at,
        lockedBy: batch.locked_by,
        classId: firstEvent?.class_id ?? stringFromRaw(batch.raw_snapshot, "classId"),
        className: firstEvent?.class_name ?? stringFromRaw(batch.raw_snapshot, "className"),
        subject: firstEvent?.subject ?? stringFromRaw(batch.raw_snapshot, "subject"),
        eventCount: batchEvents.length,
        pupilCount: new Set(batchEvents.map((event) => event.pupil_hash)).size,
        atExpectedPct: pct(atExpectedCount, batchEvents.length),
        greaterDepthPct: pct(greaterDepthCount, batchEvents.length),
        needsModerationCount,
        events: batchEvents
          .sort((a, b) => a.pupil_hash.localeCompare(b.pupil_hash))
          .map((event) => ({
            pupilHash: event.pupil_hash,
            classId: event.class_id,
            className: event.class_name,
            yearGroupAtAssessment: event.year_group_at_assessment,
            subject: event.subject,
            rawLevel: event.raw_level,
            canonicalLevel: event.canonical_level,
            isAtExpected: event.is_at_expected,
            isGreaterDepth: event.is_greater_depth,
            teacherComment: event.teacher_comment,
            voiceTranscript: event.voice_transcript,
            uncertaintyFlag: event.uncertainty_flag,
            moderationStatus: event.moderation_status,
            evidenceConfidence: event.evidence_confidence,
          })),
      };
    })
    .filter(Boolean);

  return apiSuccess({
    organizationId: orgId,
    academicYearStart,
    filters: { classId, subject },
    submissions,
  });
}, { requiredRole: "teacher", rateLimit: false });

function pct(numerator: number, denominator: number) {
  return denominator > 0 ? Math.round((numerator / denominator) * 1000) / 10 : null;
}

function stringFromRaw(raw: Record<string, unknown> | null, key: string) {
  const value = raw?.[key];
  return typeof value === "string" ? value : null;
}
