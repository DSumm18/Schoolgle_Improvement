import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
        return NextResponse.json(
          { error: "Survey not found" },
          { status: 404 },
        );
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

    return NextResponse.json({
      ...survey,
      pages: survey.survey_pages,
      logic_rules: survey.survey_logic_rules,
      response_count: survey.survey_responses?.[0]?.count ?? 0,
    });
  } catch (error) {
    console.error("Error in GET /api/surveys/[id]:", error);
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
    const { id } = await params;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
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

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in PUT /api/surveys/[id]:", error);
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
    const { id } = await params;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Soft delete
    const { error } = await supabase
      .from("surveys")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/surveys/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
