// Ed Form Skills API
// Execute form RPA skills and manage approvals

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

/**
 * GET /api/ed/form-skills
 * List available form skills for a school
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's organization
    const { data: orgData } = await supabase
      .from("user_organizations")
      .select("organization_id")
      .eq("user_id", user.id)
      .single();

    if (!orgData) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 },
      );
    }

    // Get organization details for LA matching
    const { data: org } = await supabase
      .from("organizations")
      .select("local_authority")
      .eq("id", orgData.organization_id)
      .single();

    // Get available skills using the database function
    const { data: skills, error } = await supabase.rpc(
      "get_school_rpa_skills",
      {
        school_org_id: orgData.organization_id,
        school_local_authority: org?.local_authority || null,
      },
    );

    if (error) {
      console.error("[Form Skills API] Error fetching skills:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      skills: skills || [],
      count: skills?.length || 0,
    });
  } catch (error) {
    console.error("[Form Skills API] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/ed/form-skills
 * Execute a form skill
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { skill_id, parameters } = body;

    if (!skill_id) {
      return NextResponse.json(
        { error: "skill_id is required" },
        { status: 400 },
      );
    }

    // Get user's organization
    const { data: orgData } = await supabase
      .from("user_organizations")
      .select("organization_id, role")
      .eq("user_id", user.id)
      .single();

    if (!orgData) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 },
      );
    }

    // Get the skill
    const { data: skill, error: skillError } = await supabase
      .from("ed_rpa_skills")
      .select("*")
      .eq("id", skill_id)
      .single();

    if (skillError || !skill) {
      return NextResponse.json({ error: "Skill not found" }, { status: 404 });
    }

    // Check if user has permission (role-based)
    const eligibleRoles = skill.eligible_roles || [];
    if (eligibleRoles.length > 0 && !eligibleRoles.includes(orgData.role)) {
      return NextResponse.json(
        {
          error: `This skill requires one of these roles: ${eligibleRoles.join(", ")}`,
        },
        { status: 403 },
      );
    }

    // Import form skills handler
    const { executeFormSkill } =
      await import("@schoolgle/ed-agents/skills/handlers/form-skills");

    // Build context
    const context = {
      supabase,
      orgId: orgData.organization_id,
      userId: user.id,
      userRole: orgData.role,
      subscription: {
        plan: "schools",
        features: [],
        creditsRemaining: 1000,
        creditsUsed: 0,
      },
    };

    // Execute the skill
    const result = await executeFormSkill(
      skill.skill_key,
      parameters || {},
      context as any,
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("[Form Skills API] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
