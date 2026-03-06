import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId");
    const isToolbox = searchParams.get("isToolbox") === "true";

    if (!isToolbox && !organizationId) {
      return NextResponse.json(
        { error: "organizationId is required" },
        { status: 400 },
      );
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

    return NextResponse.json(surveys);
  } catch (error) {
    console.error("Error in GET /api/surveys:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await request.json();

    const {
      organizationId,
      title,
      surveyType,
      audienceType,
      isToolbox,
      userId,
    } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

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
        organization_id: organizationId || null,
        created_by: userId || null,
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

    return NextResponse.json(
      { ...survey, pages: [{ ...page, questions: [] }] },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error in POST /api/surveys:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
