import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/compliance/training/courses
 * List training courses (global + org-specific)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const organizationId = searchParams.get("organizationId");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let query = supabase
      .from("compliance_training_courses")
      .select("*")
      .order("title", { ascending: true });

    if (organizationId) {
      query = query.or(
        `is_global.eq.true,organization_id.eq.${organizationId}`,
      );
    } else {
      query = query.eq("is_global", true);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching courses:", error);
      return NextResponse.json(
        { error: "Failed to fetch courses" },
        { status: 500 },
      );
    }

    return NextResponse.json({ courses: data || [] });
  } catch (error: any) {
    console.error("Courses API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/compliance/training/courses
 * Create an org-specific training course
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      organizationId,
      title,
      description,
      provider_name,
      course_code,
      accreditation,
      validity_days,
      category,
    } = body;

    if (!organizationId || !title) {
      return NextResponse.json(
        { error: "Missing required fields: organizationId, title" },
        { status: 400 },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: course, error } = await supabase
      .from("compliance_training_courses")
      .insert({
        organization_id: organizationId,
        title,
        description,
        provider_name,
        course_code,
        accreditation,
        validity_days,
        category: category || "general",
        is_global: false,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating course:", error);
      return NextResponse.json(
        { error: "Failed to create course" },
        { status: 500 },
      );
    }

    // Audit log
    await supabase.from("compliance_audit_log").insert({
      organization_id: organizationId,
      entity_type: "training_course",
      entity_id: course.id,
      action: "created",
      metadata: { title },
    });

    return NextResponse.json({ course }, { status: 201 });
  } catch (error: any) {
    console.error("Course create error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
