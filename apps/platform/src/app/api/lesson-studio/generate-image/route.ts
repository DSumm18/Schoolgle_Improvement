import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { generateLessonImageSet } from "@/lib/lesson-studio/image-generator";
import { NextRequest } from "next/server";

export const POST = protectedRoute(async (auth, req: NextRequest) => {
  const supabase = createServiceRoleClient();
  const body = await req.json();
  const { lessonPlanId } = body as { lessonPlanId: string };

  if (!lessonPlanId) return apiError("lessonPlanId required", 400);

  // Fetch the plan, scoped to the authenticated organisation
  const { data: plan, error } = await supabase
    .from("ls_lesson_plans")
    .select("*")
    .eq("id", lessonPlanId)
    .eq("organization_id", auth.organizationId)
    .single();

  if (error || !plan) return apiError("Plan not found", 404);

  // Get the class year group
  const { data: cls } = await supabase
    .from("ls_classes")
    .select("year_group")
    .eq("id", plan.class_id)
    .single();

  // Extract plain vocabulary strings from the stored structure
  const vocab: string[] = Array.isArray(plan.key_vocabulary)
    ? plan.key_vocabulary.map(
        (v: { word?: string } | string) =>
          typeof v === "string" ? v : v.word ?? "",
      ).filter(Boolean)
    : [];

  try {
    const images = await generateLessonImageSet({
      title: plan.title,
      subject: plan.subject,
      yearGroup: cls?.year_group ?? "Year 6",
      keyVocabulary: vocab,
      teachConcept: plan.learning_objective,
    });

    const imageCount = Object.keys(images).length;

    // Persist images alongside existing generated resources
    const currentResources =
      (plan.generated_resources_json as Record<string, unknown>) ?? {};

    const { error: updateError } = await supabase
      .from("ls_lesson_plans")
      .update({
        generated_resources_json: {
          ...currentResources,
          images,
          imagesGeneratedAt: new Date().toISOString(),
        },
      })
      .eq("id", lessonPlanId);

    if (updateError) {
      return apiError(`Failed to save images: ${updateError.message}`, 500);
    }

    return apiSuccess({ images, count: imageCount });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Image generation failed";
    return apiError(message, 500);
  }
});
