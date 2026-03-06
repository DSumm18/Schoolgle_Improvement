import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: surveyId } = await params;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
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
      return NextResponse.json(
        { error: "pageId, questionType, and title are required" },
        { status: 400 },
      );
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

    return NextResponse.json(question, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/surveys/[id]/questions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
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
      return NextResponse.json(
        { error: "questionId is required" },
        { status: 400 },
      );
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

    return NextResponse.json(question);
  } catch (error) {
    console.error("Error in PUT /api/surveys/[id]/questions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { searchParams } = new URL(request.url);
    const questionId = searchParams.get("questionId");

    if (!questionId) {
      return NextResponse.json(
        { error: "questionId is required" },
        { status: 400 },
      );
    }

    const { error } = await supabase
      .from("survey_questions")
      .delete()
      .eq("id", questionId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/surveys/[id]/questions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
