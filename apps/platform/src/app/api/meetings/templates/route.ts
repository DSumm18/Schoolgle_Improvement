import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/meetings/templates
 * List meeting templates (global + org custom)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const organizationId = searchParams.get("organizationId");
    const category = searchParams.get("category");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let query = supabase.from("meeting_templates").select("*").order("name");

    // Return global templates + org-specific custom templates
    if (organizationId) {
      query = query.or(
        `organization_id.is.null,organization_id.eq.${organizationId}`,
      );
    } else {
      query = query.is("organization_id", null);
    }

    if (category) {
      query = query.eq("category", category);
    }

    const { data: templates, error } = await query;

    if (error) {
      console.error("Error fetching templates:", error);
      return NextResponse.json(
        { error: "Failed to fetch templates" },
        { status: 500 },
      );
    }

    return NextResponse.json({ templates: templates || [] });
  } catch (error: any) {
    console.error("Templates API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/meetings/templates
 * Create a custom meeting template
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      organizationId,
      name,
      category,
      description,
      opening_script,
      closing_script,
      compliance_items,
      preparation_guide,
    } = body;

    if (!organizationId || !name || !category) {
      return NextResponse.json(
        { error: "Missing required fields: organizationId, name, category" },
        { status: 400 },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: template, error } = await supabase
      .from("meeting_templates")
      .insert({
        name,
        category,
        description: description || "",
        opening_script: opening_script || [],
        closing_script: closing_script || [],
        compliance_items: compliance_items || [],
        preparation_guide: preparation_guide || {},
        is_custom: true,
        organization_id: organizationId,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating template:", error);
      return NextResponse.json(
        { error: "Failed to create template" },
        { status: 500 },
      );
    }

    return NextResponse.json({ template }, { status: 201 });
  } catch (error: any) {
    console.error("Template creation error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
