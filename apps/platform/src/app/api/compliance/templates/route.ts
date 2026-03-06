import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/compliance/templates
 * List compliance templates, optionally filtered by type
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let query = supabase
      .from("compliance_templates")
      .select("*")
      .order("name", { ascending: true });

    if (type) {
      query = query.eq("template_type", type);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching templates:", error);
      return NextResponse.json(
        { error: "Failed to fetch templates" },
        { status: 500 },
      );
    }

    return NextResponse.json({ templates: data || [] });
  } catch (error: any) {
    console.error("Templates API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
