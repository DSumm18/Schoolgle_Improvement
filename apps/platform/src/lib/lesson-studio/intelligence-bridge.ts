import { supabase } from "@/lib/supabase";

/**
 * Sync a verified lesson assessment into the Intelligence module.
 * Called after teacher clicks Agree or Override in the triangulation UI.
 *
 * This creates a record in pupil_analysis_insights so the Intelligence
 * dashboard can track assessment trends over time and flag discrepancies
 * for Ofsted readiness.
 *
 * Fire-and-forget — errors are logged but never propagated to the caller.
 */
export async function syncAssessmentToIntelligence(params: {
  organizationId: string;
  pupilId: string;
  lessonPlanId: string;
  subject: string;
  verifiedGrade: string;
  aiSuggestedGrade: string;
  wasOverridden: boolean;
  misconceptions: Array<{ description: string; severity: string }>;
  assessedAt: string;
}): Promise<void> {
  const {
    organizationId,
    pupilId,
    lessonPlanId,
    subject,
    verifiedGrade,
    aiSuggestedGrade,
    wasOverridden,
    misconceptions,
    assessedAt,
  } = params;

  const insightData = {
    organization_id: organizationId,
    pupil_id: pupilId,
    insight_type: "lesson_assessment",
    subject,
    data: {
      lesson_plan_id: lessonPlanId,
      verified_grade: verifiedGrade,
      ai_suggested_grade: aiSuggestedGrade,
      was_overridden: wasOverridden,
      misconceptions,
      assessed_at: assessedAt,
    },
    severity: wasOverridden ? "warning" : "info",
    created_at: new Date().toISOString(),
  };

  try {
    const { error } = await supabase
      .from("pupil_analysis_insights")
      .insert(insightData);

    if (error) {
      console.warn("[Intelligence Bridge] Insert failed:", error.message);
    }
  } catch (e) {
    console.warn("[Intelligence Bridge] Failed to write to pupil_analysis_insights:", e);
  }

  if (wasOverridden) {
    console.log(
      `[Intelligence Bridge] Grade override recorded: pupil=${pupilId} subject=${subject} AI=${aiSuggestedGrade} teacher=${verifiedGrade}`,
    );
  }
}
