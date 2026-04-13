import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { NextRequest } from "next/server";
import { computeTriangulation } from "@/lib/lesson-studio/grading-pipeline";

type ReviewAction = "agree" | "override" | "flag";

/* ── POST: Teacher reviews an AI assessment ─────────────────────── */

export const POST = protectedRoute(async (auth, req: NextRequest) => {
  const supabase = createServiceRoleClient();
  const orgId = auth.organizationId;
  if (!orgId) return apiError("No organization", 400);

  const body = await req.json();
  const {
    assessmentId,
    action,
    teacherGrade,
    overrideReason,
    flagReason,
  }: {
    assessmentId: string;
    action: ReviewAction;
    teacherGrade?: string;
    overrideReason?: string;
    flagReason?: string;
  } = body;

  if (!assessmentId) return apiError("assessmentId required", 400);
  if (!action || !["agree", "override", "flag"].includes(action)) {
    return apiError("action must be one of: agree, override, flag", 400);
  }

  // Load the existing assessment
  const { data: assessment, error: fetchError } = await supabase
    .from("ls_assessments")
    .select("*")
    .eq("id", assessmentId)
    .eq("organization_id", orgId)
    .single();

  if (fetchError || !assessment) {
    return apiError("Assessment not found", 404);
  }

  if (action === "agree") {
    // Teacher agrees with AI grade
    const finalTeacherGrade = assessment.ai_suggested_grade;
    const triangulationStatus = computeTriangulation(
      finalTeacherGrade,
      assessment.ai_suggested_grade,
      assessment.moderator_grade ?? null,
    );

    const { data: updated, error: updateError } = await supabase
      .from("ls_assessments")
      .update({
        teacher_grade: finalTeacherGrade,
        teacher_agreed: true,
        teacher_override_reason: null,
        triangulation_status: triangulationStatus,
        status: "reviewed",
      })
      .eq("id", assessmentId)
      .select()
      .single();

    if (updateError) return apiError(updateError.message, 500);

    // Update work submission status to 'reviewed' if linked
    if (assessment.work_submission_id) {
      await supabase
        .from("ls_work_submissions")
        .update({ status: "reviewed" })
        .eq("id", assessment.work_submission_id);
    }

    return apiSuccess({ assessment: updated, action: "agree", triangulationStatus });
  }

  if (action === "override") {
    if (!teacherGrade) return apiError("teacherGrade required for override", 400);

    const triangulationStatus = computeTriangulation(
      teacherGrade,
      assessment.ai_suggested_grade,
      assessment.moderator_grade ?? null,
    );

    const { data: updated, error: updateError } = await supabase
      .from("ls_assessments")
      .update({
        teacher_grade: teacherGrade,
        teacher_agreed: false,
        teacher_override_reason: overrideReason ?? null,
        triangulation_status: triangulationStatus,
        status: "reviewed",
      })
      .eq("id", assessmentId)
      .select()
      .single();

    if (updateError) return apiError(updateError.message, 500);

    // Update work submission status to 'reviewed' if linked
    if (assessment.work_submission_id) {
      await supabase
        .from("ls_work_submissions")
        .update({ status: "reviewed" })
        .eq("id", assessment.work_submission_id);
    }

    return apiSuccess({ assessment: updated, action: "override", triangulationStatus });
  }

  if (action === "flag") {
    // Create moderation queue entry
    const { data: moderationItem, error: modError } = await supabase
      .from("ls_moderation_queue")
      .insert({
        organization_id: orgId,
        assessment_id: assessmentId,
        flagged_by: auth.userId,
        flagged_reason: flagReason ?? null,
        teacher_grade: assessment.teacher_grade ?? assessment.ai_suggested_grade,
        ai_grade: assessment.ai_suggested_grade,
        status: "pending",
      })
      .select()
      .single();

    if (modError) {
      console.error("[review] Moderation queue insert error:", modError);
      return apiError(`Failed to create moderation entry: ${modError.message}`, 500);
    }

    // Set assessment triangulation_status to 'disputed'
    const { data: updated, error: updateError } = await supabase
      .from("ls_assessments")
      .update({
        triangulation_status: "disputed",
      })
      .eq("id", assessmentId)
      .select()
      .single();

    if (updateError) return apiError(updateError.message, 500);

    return apiSuccess({
      assessment: updated,
      action: "flag",
      moderationItem,
      triangulationStatus: "disputed",
    });
  }

  return apiError("Unhandled action", 400);
});
