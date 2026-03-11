import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

export const POST = protectedRoute(async (auth, request) => {
  const surveyId = request.nextUrl.pathname
    .split("/surveys/")[1]
    ?.split("/")[0];
  const supabase = createServiceRoleClient();
  const body = await request.json();

  // Get current max sort order
  const { data: existing } = await supabase
    .from("survey_pages")
    .select("sort_order")
    .eq("survey_id", surveyId)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextOrder = (existing?.[0]?.sort_order ?? -1) + 1;

  const { data: page, error } = await supabase
    .from("survey_pages")
    .insert({
      survey_id: surveyId,
      title: body.title || `Page ${nextOrder + 1}`,
      description: body.description || null,
      sort_order: nextOrder,
    })
    .select()
    .single();

  if (error) throw error;

  return apiSuccess({ ...page, questions: [] }, 201);
});

export const PUT = protectedRoute(async (auth, request) => {
  const supabase = createServiceRoleClient();
  const body = await request.json();
  const { pageId, title, description, sortOrder } = body;

  if (!pageId) {
    return apiError("pageId is required", 400);
  }

  const updates: Record<string, unknown> = {};
  if (title !== undefined) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (sortOrder !== undefined) updates.sort_order = sortOrder;

  const { data, error } = await supabase
    .from("survey_pages")
    .update(updates)
    .eq("id", pageId)
    .select()
    .single();

  if (error) throw error;

  return apiSuccess(data);
});

export const DELETE = protectedRoute(async (auth, request) => {
  const supabase = createServiceRoleClient();
  const { searchParams } = new URL(request.url);
  const pageId = searchParams.get("pageId");

  if (!pageId) {
    return apiError("pageId is required", 400);
  }

  const { error } = await supabase
    .from("survey_pages")
    .delete()
    .eq("id", pageId);

  if (error) throw error;

  return apiSuccess({ success: true });
});
