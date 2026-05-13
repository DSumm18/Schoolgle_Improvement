import { NextRequest } from "next/server";
import { apiError, apiSuccess, protectedRoute } from "@/lib/api-utils";
import { buildManualSnapshotInsertPayload, mapPupilAssessmentEventToInsert } from "@/lib/assessment-intelligence/manual-snapshot";
import { createServiceRoleClient } from "@/lib/supabase-server";

export const POST = protectedRoute(async (auth, req: NextRequest) => {
  const body = await req.json().catch(() => ({}));

  let payload: ReturnType<typeof buildManualSnapshotInsertPayload>;
  try {
    payload = buildManualSnapshotInsertPayload(body, {
      authOrganizationId: auth.organizationId,
      lockedBy: auth.userId,
    });
  } catch (error) {
    return apiError(error instanceof Error ? error.message : "Invalid manual snapshot", 400);
  }

  const supabase = createServiceRoleClient();
  const { data: membership } = await supabase
    .from("organization_members")
    .select("role")
    .eq("auth_id", auth.userId)
    .eq("organization_id", payload.batchInsert.organization_id)
    .maybeSingle();

  if (!membership) return apiError("Not a member", 403);

  const { data: batch, error: batchError } = await supabase
    .from("assessment_source_batches")
    .insert(payload.batchInsert)
    .select("id, source_label, source_kind, validation_tier, created_at")
    .single();

  if (batchError || !batch?.id) {
    return apiError(batchError?.message || "Could not create assessment source batch", 500);
  }

  const eventInserts = payload.eventDrafts.map((event) => mapPupilAssessmentEventToInsert(event, batch.id));
  const { error: eventError } = await supabase.from("pupil_assessment_events").insert(eventInserts);

  if (eventError) {
    return apiError(eventError.message, 500);
  }

  const atExpectedCount = eventInserts.filter((event) => event.is_at_expected).length;
  const needsModerationCount = eventInserts.filter((event) => event.uncertainty_flag).length;
  const atExpectedPct = eventInserts.length > 0 ? Math.round((atExpectedCount / eventInserts.length) * 1000) / 10 : null;

  const { error: timelineError } = await supabase.from("school_timeline_events").insert({
    organization_id: payload.batchInsert.organization_id,
    event_type: "assessment.snapshot-locked",
    event_category: "assessment",
    severity: needsModerationCount > 0 ? "medium" : "info",
    occurred_at: payload.batchInsert.locked_at,
    title: `${payload.batchInsert.raw_snapshot.className || "Class"} assessment snapshot locked`,
    description: `${eventInserts.length} ${payload.batchInsert.raw_snapshot.subject || "assessment"} judgement${eventInserts.length === 1 ? "" : "s"} locked for ${payload.batchInsert.assessment_period}.`,
    impact_summary: `${atExpectedPct ?? "n/a"}% at expected or above. ${needsModerationCount} judgement${needsModerationCount === 1 ? "" : "s"} flagged for moderation.`,
    source_app: "assessment-intelligence",
    source_entity_type: "assessment_source_batch",
    source_entity_id: batch.id,
    actor_id: auth.userId,
    actor_name: null,
    evidence: {
      source_label: batch.source_label,
      validation_tier: payload.batchInsert.validation_tier,
      event_count: eventInserts.length,
    },
    metadata: {
      school_urn: String(payload.batchInsert.school_urn),
      school_urn_number: payload.batchInsert.school_urn,
      school_name: payload.batchInsert.raw_snapshot.schoolName,
      class_id: payload.batchInsert.raw_snapshot.classId,
      class_name: payload.batchInsert.raw_snapshot.className,
      subject: payload.batchInsert.raw_snapshot.subject,
      assessment_period: payload.batchInsert.assessment_period,
      academic_year_start: payload.batchInsert.academic_year_start,
      at_expected_pct: atExpectedPct,
      needs_moderation_count: needsModerationCount,
    },
    tags: ["assessment-intelligence", "teacher-locked", "ofsted-evidence"],
  });

  if (timelineError) {
    console.warn("[assessment-intelligence/manual-snapshots] Timeline event insert failed:", timelineError.message);
  }

  return apiSuccess({
    batch,
    sourceLabel: payload.eventDrafts[0]?.sourceLabel ?? null,
    eventCount: eventInserts.length,
  });
});
