import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

export const GET = protectedRoute(async (auth, request) => {
  const id = request.nextUrl.pathname.split("/surveys/")[1]?.split("/")[0];
  const supabase = createServiceRoleClient();

  const { data: survey, error } = await supabase
    .from("surveys")
    .select(
      `
      *,
      survey_pages (
        *,
        survey_questions (
          *,
          survey_choices (*)
        )
      ),
      survey_logic_rules (*),
      survey_responses(count)
    `,
    )
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return apiError("Survey not found", 404);
    }
    throw error;
  }

  // Sort pages and questions by sort_order
  if (survey.survey_pages) {
    survey.survey_pages.sort((a: any, b: any) => a.sort_order - b.sort_order);
    for (const page of survey.survey_pages) {
      if (page.survey_questions) {
        page.survey_questions.sort(
          (a: any, b: any) => a.sort_order - b.sort_order,
        );
        for (const q of page.survey_questions) {
          if (q.survey_choices) {
            q.survey_choices.sort(
              (a: any, b: any) => a.sort_order - b.sort_order,
            );
          }
        }
      }
    }
  }

  return apiSuccess({
    ...survey,
    pages: survey.survey_pages,
    logic_rules: survey.survey_logic_rules,
    response_count: survey.survey_responses?.[0]?.count ?? 0,
  });
});

export const PUT = protectedRoute(async (auth, request) => {
  const id = request.nextUrl.pathname.split("/surveys/")[1]?.split("/")[0];
  const supabase = createServiceRoleClient();
  const body = await request.json();

  const allowedFields = [
    "title",
    "description",
    "status",
    "survey_type",
    "audience_type",
    "is_anonymous",
    "settings",
    "branding",
    "scoring_config",
    "slug",
  ];

  const updates: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if (body[key] !== undefined) updates[key] = body[key];
  }

  const { data, error } = await supabase
    .from("surveys")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return apiSuccess(data);
});

export const DELETE = protectedRoute(async (auth, request) => {
  const id = request.nextUrl.pathname.split("/surveys/")[1]?.split("/")[0];
  const supabase = createServiceRoleClient();

  // Soft delete
  const { error } = await supabase
    .from("surveys")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;

  return apiSuccess({ success: true });
});
