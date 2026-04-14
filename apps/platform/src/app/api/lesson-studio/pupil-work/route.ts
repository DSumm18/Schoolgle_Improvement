import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { NextRequest } from "next/server";
import type { DifferentiationGroup, SENDAdaptation, WorksheetQuestion } from "@/types/lesson-studio";

const GROUP_LABELS: Record<string, string> = {
  deeper: "Deeper Thinkers",
  core: "Core Learners",
  scaffold: "Scaffold Support",
  guided: "Guided Group",
};

/**
 * Strip the "enc:" prefix from display_name_encrypted.
 * The field stores names as "enc:FirstName LastName" in Lesson Studio.
 */
function resolveDisplayName(raw: string | null): string {
  if (!raw) return "Unknown";
  return raw.startsWith("enc:") ? raw.slice(4) : raw;
}

/**
 * GET /api/lesson-studio/pupil-work?lessonPlanId=X&organizationId=Z
 * Returns class list for pupil picker.
 *
 * GET /api/lesson-studio/pupil-work?lessonPlanId=X&pupilId=Y&organizationId=Z
 * Returns the pupil's group, questions, adaptations.
 */
export const GET = protectedRoute(async (auth, req: NextRequest) => {
  const supabase = createServiceRoleClient();
  const { searchParams } = req.nextUrl;

  const lessonPlanId = searchParams.get("lessonPlanId");
  const pupilId = searchParams.get("pupilId");
  const orgId = searchParams.get("organizationId") ?? auth.organizationId;

  if (!lessonPlanId) return apiError("lessonPlanId required", 400);
  if (!orgId) return apiError("No organization", 400);

  // Load the lesson plan
  const { data: plan, error: planError } = await supabase
    .from("ls_lesson_plans")
    .select("*")
    .eq("id", lessonPlanId)
    .eq("organization_id", orgId)
    .single();

  if (planError || !plan) return apiError("Lesson plan not found", 404);

  const groups = (plan.differentiation_groups ?? []) as DifferentiationGroup[];

  // --- No pupilId: return class list for picker ---
  if (!pupilId) {
    // Load all pupils for this class
    const { data: pupils, error: pupilsError } = await supabase
      .from("ls_pupils")
      .select("id, display_name_encrypted, class_id")
      .eq("class_id", plan.class_id)
      .order("display_name_encrypted");

    if (pupilsError) return apiError(pupilsError.message, 500);

    // Map each pupil to their group by checking differentiation_groups[n].pupils (comma-separated names)
    const pupilList = (pupils ?? []).map((p) => {
      const name = resolveDisplayName(p.display_name_encrypted);
      const matchedGroup = groups.find((g) => {
        const groupNames = (g.pupils ?? "")
          .split(",")
          .map((n: string) => n.trim().toLowerCase());
        return groupNames.some(
          (gn: string) => gn === name.toLowerCase() || name.toLowerCase().includes(gn),
        );
      });
      const groupKey = matchedGroup
        ? matchedGroup.name.toLowerCase()
        : "core";

      return { id: p.id, name, group: groupKey };
    });

    return apiSuccess({
      lessonTitle: plan.title,
      subject: plan.subject,
      pupils: pupilList,
    });
  }

  // --- With pupilId: return full question set ---
  const { data: pupil, error: pupilError } = await supabase
    .from("ls_pupils")
    .select("*")
    .eq("id", pupilId)
    .eq("organization_id", orgId)
    .single();

  if (pupilError || !pupil) return apiError("Pupil not found", 404);

  const pupilName = resolveDisplayName(pupil.display_name_encrypted);

  // Determine which differentiation group the pupil belongs to
  const matchedGroup = groups.find((g) => {
    const groupNames = (g.pupils ?? "")
      .split(",")
      .map((n: string) => n.trim().toLowerCase());
    return groupNames.some(
      (gn: string) => gn === pupilName.toLowerCase() || pupilName.toLowerCase().includes(gn),
    );
  });

  // Default to "core" if not found in any group
  const groupKey = matchedGroup
    ? (matchedGroup.name.toLowerCase() as "deeper" | "core" | "scaffold" | "guided")
    : "core";

  // Extract worksheet questions for this group
  const worksheetQuestions =
    plan.generated_resources_json?.worksheetQuestions ?? {};
  const questions: WorksheetQuestion[] =
    worksheetQuestions[groupKey] ?? worksheetQuestions["core"] ?? [];

  // Find SEND adaptation for this pupil (if any)
  const sendAdaptations = (plan.send_adaptations ?? []) as SENDAdaptation[];
  const adaptation = sendAdaptations.find(
    (a) =>
      a.pupilName.toLowerCase() === pupilName.toLowerCase() ||
      pupilName.toLowerCase().includes(a.pupilName.toLowerCase()),
  );

  const totalMarks = questions.reduce((sum, q) => sum + (q.marks ?? 0), 0);

  return apiSuccess({
    lessonTitle: plan.title,
    subject: plan.subject,
    group: groupKey,
    groupLabel: GROUP_LABELS[groupKey] ?? groupKey,
    pupilName,
    questions,
    adaptations: adaptation?.adaptation ?? null,
    totalMarks,
  });
});
