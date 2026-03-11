import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

export const POST = protectedRoute(async (auth, request) => {
  const surveyId = request.nextUrl.pathname
    .split("/surveys/")[1]
    ?.split("/")[0];
  const supabase = createServiceRoleClient();
  const body = await request.json();

  const {
    pageId,
    questionType,
    title,
    description,
    isRequired,
    sortOrder,
    settings,
    choices,
  } = body;

  if (!pageId || !questionType || !title) {
    return apiError("pageId, questionType, and title are required", 400);
  }

  // Create question
  const { data: question, error: qError } = await supabase
    .from("survey_questions")
    .insert({
      page_id: pageId,
      survey_id: surveyId,
      question_type: questionType,
      title,
      description: description || null,
      is_required: isRequired ?? false,
      sort_order: sortOrder ?? 0,
      settings: settings || {},
    })
    .select()
    .single();

  if (qError) throw qError;

  // Create choices if provided
  if (choices && choices.length > 0) {
    const choiceRows = choices.map((c: any, i: number) => ({
      question_id: question.id,
      label: typeof c === "string" ? c : c.label,
      value: typeof c === "string" ? c : c.value || null,
      image_url: typeof c === "object" ? c.image_url || null : null,
      sort_order: i,
      is_other: typeof c === "object" ? c.is_other || false : false,
      score_value: typeof c === "object" ? c.score_value || null : null,
    }));

    const { data: createdChoices, error: cError } = await supabase
      .from("survey_choices")
      .insert(choiceRows)
      .select();

    if (cError) throw cError;
    question.choices = createdChoices;
  }

  return apiSuccess(question, 201);
});

export const PUT = protectedRoute(async (auth, request) => {
  const supabase = createServiceRoleClient();
  const body = await request.json();
  const {
    questionId,
    title,
    description,
    isRequired,
    sortOrder,
    settings,
    choices,
    pageId,
  } = body;

  if (!questionId) {
    return apiError("questionId is required", 400);
  }

  const updates: Record<string, unknown> = {};
  if (title !== undefined) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (isRequired !== undefined) updates.is_required = isRequired;
  if (sortOrder !== undefined) updates.sort_order = sortOrder;
  if (settings !== undefined) updates.settings = settings;
  if (pageId !== undefined) updates.page_id = pageId;

  const { data: question, error } = await supabase
    .from("survey_questions")
    .update(updates)
    .eq("id", questionId)
    .select()
    .single();

  if (error) throw error;

  // Update choices if provided
  if (choices !== undefined) {
    // Delete existing choices
    await supabase
      .from("survey_choices")
      .delete()
      .eq("question_id", questionId);

    if (choices.length > 0) {
      const choiceRows = choices.map((c: any, i: number) => ({
        question_id: questionId,
        label: typeof c === "string" ? c : c.label,
        value: typeof c === "string" ? c : c.value || null,
        image_url: typeof c === "object" ? c.image_url || null : null,
        sort_order: i,
        is_other: typeof c === "object" ? c.is_other || false : false,
        score_value: typeof c === "object" ? c.score_value || null : null,
      }));

      const { data: createdChoices } = await supabase
        .from("survey_choices")
        .insert(choiceRows)
        .select();

      question.choices = createdChoices;
    }
  }

  return apiSuccess(question);
});

export const DELETE = protectedRoute(async (auth, request) => {
  const supabase = createServiceRoleClient();
  const { searchParams } = new URL(request.url);
  const questionId = searchParams.get("questionId");

  if (!questionId) {
    return apiError("questionId is required", 400);
  }

  const { error } = await supabase
    .from("survey_questions")
    .delete()
    .eq("id", questionId);

  if (error) throw error;

  return apiSuccess({ success: true });
});
