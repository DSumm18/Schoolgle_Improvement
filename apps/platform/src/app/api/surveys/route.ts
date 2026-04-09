import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

export const GET = protectedRoute(async (auth, request) => {
  const supabase = createServiceRoleClient();
  const { searchParams } = new URL(request.url);
  // orgId MUST come from authenticated session — never from caller
  const organizationId = auth.organizationId;
  const isToolbox = searchParams.get("isToolbox") === "true";

  if (!isToolbox && !organizationId) {
    return apiError("organizationId is required", 400);
  }

  let query = supabase
    .from("surveys")
    .select(
      `
      *,
      survey_responses(count)
    `,
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (isToolbox) {
    query = query.eq("is_toolbox", true);
  } else {
    query = query.eq("organization_id", organizationId!);
  }

  const { data, error } = await query;
  if (error) throw error;

  const surveys = (data ?? []).map((s: any) => ({
    ...s,
    response_count: s.survey_responses?.[0]?.count ?? 0,
  }));

  return apiSuccess(surveys);
});

export const POST = protectedRoute(async (auth, request) => {
  const supabase = createServiceRoleClient();
  const body = await request.json();

  const { title, surveyType, audienceType, isToolbox } = body;

  if (!title) {
    return apiError("Title is required", 400);
  }

  // orgId MUST come from authenticated session — never from caller
  const orgId = auth.organizationId;

  // Generate slug
  const slug =
    title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 50) +
    "-" +
    Math.random().toString(36).slice(2, 8);

  const { data: survey, error: surveyError } = await supabase
    .from("surveys")
    .insert({
      organization_id: orgId || null,
      created_by: auth.userId || null,
      title,
      survey_type: surveyType || "standard",
      audience_type: audienceType || "mixed",
      is_toolbox: isToolbox || false,
      slug,
      settings: {
        show_progress_bar: true,
        locale: "en",
      },
    })
    .select()
    .single();

  if (surveyError) throw surveyError;

  // Create default first page
  const { data: page, error: pageError } = await supabase
    .from("survey_pages")
    .insert({
      survey_id: survey.id,
      title: "Page 1",
      sort_order: 0,
    })
    .select()
    .single();

  if (pageError) throw pageError;

  return apiSuccess({ ...survey, pages: [{ ...page, questions: [] }] }, 201);
});
