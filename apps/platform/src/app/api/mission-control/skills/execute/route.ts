import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, isMCAuthError } from "@/lib/mission-control/auth";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { logSkillExecution } from "@/lib/mission-control/audit";
import { SKILLS_REGISTRY } from "@/lib/mission-control/skills-registry";

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request, { minRole: "admin" });
  if (isMCAuthError(auth)) return auth;

  try {
    const body = await request.json();
    const { skillId, params } = body;

    if (!skillId) {
      return NextResponse.json(
        { error: "skillId is required" },
        { status: 400 },
      );
    }

    // Validate skill exists in registry
    const skill = SKILLS_REGISTRY.find((s) => s.id === skillId);
    if (!skill) {
      return NextResponse.json(
        { error: `Unknown skill: ${skillId}` },
        { status: 404 },
      );
    }

    if (skill.status !== "active") {
      return NextResponse.json(
        { error: `Skill "${skill.name}" is not active (status: ${skill.status})` },
        { status: 400 },
      );
    }

    const supabase = createServiceRoleClient();

    // Log the execution
    const { data, error } = await supabase
      .from("mc_skill_executions")
      .insert({
        skill_id: skillId,
        skill_name: skill.name,
        department: skill.department,
        execution_type: "manual",
        status: "pending",
        input_params: params || {},
        triggered_by: auth.email,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    await logSkillExecution(skill.name, "triggered", auth.email, {
      execution_id: data.id,
      skill_id: skillId,
    });

    // Phase 1: Return the execution record. Phase 2 will actually run the skill.
    return NextResponse.json({
      execution: data,
      message: `Skill "${skill.name}" execution logged. Actual execution will be available in Phase 2.`,
    });
  } catch (error: unknown) {
    console.error("[MC Skills Execute] Error:", error);
    return NextResponse.json(
      { error: "Failed to trigger skill execution" },
      { status: 500 },
    );
  }
}
