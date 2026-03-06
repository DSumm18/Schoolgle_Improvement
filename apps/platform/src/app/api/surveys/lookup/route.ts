import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");

    if (!slug) {
      return NextResponse.json({ error: "slug is required" }, { status: 400 });
    }

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
        )
      `,
      )
      .eq("slug", slug)
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

    // Sort pages and questions
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
    });
  } catch (error) {
    console.error("Error in GET /api/surveys/lookup:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
