import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/compliance/training
 * List courses, requirements, and completions for an organization
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const organizationId = searchParams.get("organizationId");

    if (!organizationId) {
      return NextResponse.json(
        { error: "Missing organizationId parameter" },
        { status: 400 },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Courses (global + org-specific)
    const { data: courses } = await supabase
      .from("compliance_training_courses")
      .select("*")
      .or(`is_global.eq.true,organization_id.eq.${organizationId}`)
      .order("title", { ascending: true });

    // Requirements for this org
    const { data: requirements } = await supabase
      .from("compliance_training_requirements")
      .select("*, course:compliance_training_courses(*)")
      .eq("organization_id", organizationId);

    // Completions for this org
    const { data: completions } = await supabase
      .from("compliance_training_completions")
      .select("*, course:compliance_training_courses(*)")
      .eq("organization_id", organizationId)
      .order("completed_at", { ascending: false });

    return NextResponse.json({
      courses: courses || [],
      requirements: requirements || [],
      completions: completions || [],
    });
  } catch (error: any) {
    console.error("Training API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/compliance/training
 * Record a training completion
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      organizationId,
      user_id,
      course_id,
      completed_at,
      expires_at,
      evidence_file_id,
      source,
      notes,
    } = body;

    if (!organizationId || !user_id || !course_id) {
      return NextResponse.json(
        {
          error: "Missing required fields: organizationId, user_id, course_id",
        },
        { status: 400 },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: completion, error } = await supabase
      .from("compliance_training_completions")
      .insert({
        organization_id: organizationId,
        user_id,
        course_id,
        completed_at: completed_at || new Date().toISOString(),
        expires_at,
        evidence_file_id,
        source: source || "manual",
        notes,
      })
      .select("*, course:compliance_training_courses(*)")
      .single();

    if (error) {
      console.error("Error recording training completion:", error);
      return NextResponse.json(
        { error: "Failed to record training completion" },
        { status: 500 },
      );
    }

    // Audit log
    await supabase.from("compliance_audit_log").insert({
      organization_id: organizationId,
      entity_type: "training_completion",
      entity_id: completion.id,
      action: "completed",
      actor_user_id: user_id,
      metadata: { course_id, completed_at: completion.completed_at },
    });

    return NextResponse.json({ completion }, { status: 201 });
  } catch (error: any) {
    console.error("Training completion error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
