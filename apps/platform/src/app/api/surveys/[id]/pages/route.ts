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

    return NextResponse.json({ ...page, questions: [] }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/surveys/[id]/pages:", error);
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
    const { pageId, title, description, sortOrder } = body;

    if (!pageId) {
      return NextResponse.json(
        { error: "pageId is required" },
        { status: 400 },
      );
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

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in PUT /api/surveys/[id]/pages:", error);
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
    const pageId = searchParams.get("pageId");

    if (!pageId) {
      return NextResponse.json(
        { error: "pageId is required" },
        { status: 400 },
      );
    }

    const { error } = await supabase
      .from("survey_pages")
      .delete()
      .eq("id", pageId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/surveys/[id]/pages:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
