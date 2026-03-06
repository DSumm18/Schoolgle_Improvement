import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/compliance/training/requirements
 * List training requirements for an organization
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

    const { data, error } = await supabase
      .from("compliance_training_requirements")
      .select("*, course:compliance_training_courses(*)")
      .eq("organization_id", organizationId)
      .order("role_key", { ascending: true });

    if (error) {
      console.error("Error fetching requirements:", error);
      return NextResponse.json(
        { error: "Failed to fetch requirements" },
        { status: 500 },
      );
    }

    return NextResponse.json({ requirements: data || [] });
  } catch (error: any) {
    console.error("Requirements API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/compliance/training/requirements
 * Set a training requirement for an organization
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      organizationId,
      trust_id,
      role_key,
      course_id,
      required,
      renewal_days,
    } = body;

    if (!organizationId || !role_key || !course_id) {
      return NextResponse.json(
        {
          error: "Missing required fields: organizationId, role_key, course_id",
        },
        { status: 400 },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Upsert: if same org+role+course exists, update
    const { data: existing } = await supabase
      .from("compliance_training_requirements")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("role_key", role_key)
      .eq("course_id", course_id)
      .maybeSingle();

    let requirement;
    let error;

    if (existing) {
      const result = await supabase
        .from("compliance_training_requirements")
        .update({ required: required ?? true, renewal_days, trust_id })
        .eq("id", existing.id)
        .select("*, course:compliance_training_courses(*)")
        .single();
      requirement = result.data;
      error = result.error;
    } else {
      const result = await supabase
        .from("compliance_training_requirements")
        .insert({
          organization_id: organizationId,
          trust_id,
          role_key,
          course_id,
          required: required ?? true,
          renewal_days,
        })
        .select("*, course:compliance_training_courses(*)")
        .single();
      requirement = result.data;
      error = result.error;
    }

    if (error) {
      console.error("Error setting requirement:", error);
      return NextResponse.json(
        { error: "Failed to set requirement" },
        { status: 500 },
      );
    }

    // Audit log
    await supabase.from("compliance_audit_log").insert({
      organization_id: organizationId,
      entity_type: "training_requirement",
      entity_id: requirement.id,
      action: existing ? "updated" : "created",
      metadata: { role_key, course_id, required },
    });

    return NextResponse.json({ requirement }, { status: existing ? 200 : 201 });
  } catch (error: any) {
    console.error("Requirement set error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
