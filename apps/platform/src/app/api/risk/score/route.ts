/**
 * Risk Score Recalculation API
 *
 * POST /api/risk/score - Recalculate risk scores for one or all risks in an org
 *
 * Body:
 *   - organizationId (optional, falls back to auth)
 *   - riskId (optional - if omitted, recalculates all open risks in the org)
 */

import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import {
  calculateResidualScore,
  checkMitigationStatus,
  shouldEscalateToTrust,
} from "@/lib/risk-engine";
import type { Risk, Mitigation } from "@/lib/risk-engine";

export const POST = protectedRoute(async (auth, request) => {
  const body = await request.json();
  const { organizationId: bodyOrgId, riskId } = body;
  const organizationId = bodyOrgId || auth.organizationId;

  if (!organizationId) {
    return apiError("organizationId is required", 400);
  }

  const supabase = createServiceRoleClient();

  // Fetch risks to recalculate
  let risksQuery = supabase
    .from("risk_register")
    .select("*")
    .eq("organization_id", organizationId)
    .neq("status", "closed");

  if (riskId) {
    risksQuery = risksQuery.eq("id", riskId);
  }

  const { data: risks, error: risksError } = await risksQuery;

  if (risksError) {
    console.error("Error fetching risks for scoring:", risksError);
    return apiError("Failed to fetch risks", 500);
  }

  if (!risks || risks.length === 0) {
    return apiSuccess({
      message: "No risks to recalculate",
      updated: 0,
    });
  }

  const results: Array<{
    risk_id: string;
    risk_ref: string;
    previous_score: number | null;
    new_score: number;
    risk_band: string;
    escalated: boolean;
    flags: string[];
  }> = [];

  for (const riskRow of risks) {
    // Fetch mitigations for this risk
    const { data: rawMitigations } = await supabase
      .from("risk_mitigations")
      .select("*")
      .eq("risk_id", riskRow.id);

    // Check and update mitigation statuses based on frequency/last_operated_at
    const mitigations: Mitigation[] = (rawMitigations || []).map((m: any) => {
      const checked = checkMitigationStatus(m as Mitigation);
      return { ...m, ...checked };
    });

    // Update mitigation records if status changed
    for (let i = 0; i < mitigations.length; i++) {
      const original = rawMitigations![i];
      const updated = mitigations[i];
      if (
        original.is_operating !== updated.is_operating ||
        original.overdue !== updated.overdue ||
        original.effectiveness !== updated.effectiveness
      ) {
        await supabase
          .from("risk_mitigations")
          .update({
            is_operating: updated.is_operating,
            overdue: updated.overdue,
            effectiveness: updated.effectiveness,
          })
          .eq("id", updated.id);
      }
    }

    // Get previous effective score
    const previousScore = riskRow.effective_residual_score ?? null;

    // Build the Risk object for the engine
    const risk: Risk = {
      id: riskRow.id,
      risk_ref: riskRow.risk_ref,
      title: riskRow.title,
      description: riskRow.description,
      tier: riskRow.tier,
      status: riskRow.status,
      risk_categories: riskRow.risk_categories || [],
      source_module: riskRow.source_module,
      inherent_likelihood: riskRow.inherent_likelihood,
      inherent_impact: riskRow.inherent_impact,
      impact_by_category: riskRow.impact_by_category || {},
      system_residual_likelihood: riskRow.system_residual_likelihood,
      system_residual_impact: riskRow.system_residual_impact,
      override_residual_likelihood: riskRow.override_residual_likelihood,
      override_residual_impact: riskRow.override_residual_impact,
      override_expires_at: riskRow.override_expires_at,
      target_score: riskRow.target_score,
      risk_appetite_threshold: riskRow.risk_appetite_threshold,
    };

    // Calculate residual score
    const scoreResult = calculateResidualScore(
      risk,
      mitigations,
      previousScore ?? undefined,
    );

    // Update the risk_register with new system scores
    const updatePayload: Record<string, any> = {
      system_residual_likelihood: scoreResult.residual_likelihood,
      system_residual_impact: scoreResult.residual_impact,
      effective_residual_score: scoreResult.effective_score,
      above_appetite: scoreResult.above_appetite,
      direction_of_travel: scoreResult.direction_of_travel,
    };

    const { error: updateError } = await supabase
      .from("risk_register")
      .update(updatePayload)
      .eq("id", riskRow.id);

    if (updateError) {
      console.error(`Error updating risk ${riskRow.id} scores:`, updateError);
      continue;
    }

    // Insert score history record
    await supabase.from("risk_score_history").insert({
      risk_id: riskRow.id,
      organization_id: organizationId,
      score_type: "system_calculated",
      system_likelihood: scoreResult.residual_likelihood,
      system_impact: scoreResult.residual_impact,
      system_score: scoreResult.residual_score,
      recorded_likelihood: scoreResult.residual_likelihood,
      recorded_impact: scoreResult.residual_impact,
      recorded_score: scoreResult.effective_score,
      trigger_type: "scheduled_review",
    });

    // Check for trust escalation
    const escalated = shouldEscalateToTrust(risk, scoreResult);

    if (escalated && !riskRow.trust_organization_id) {
      // Look up parent trust organization
      const { data: org } = await supabase
        .from("organizations")
        .select("parent_organization_id")
        .eq("id", organizationId)
        .single();

      if (org?.parent_organization_id) {
        await supabase
          .from("risk_register")
          .update({
            trust_organization_id: org.parent_organization_id,
          })
          .eq("id", riskRow.id);
      }
    }

    results.push({
      risk_id: riskRow.id,
      risk_ref: riskRow.risk_ref,
      previous_score: previousScore,
      new_score: scoreResult.effective_score,
      risk_band: scoreResult.risk_band,
      escalated,
      flags: scoreResult.flags,
    });
  }

  return apiSuccess({
    message: `Recalculated ${results.length} risk(s)`,
    updated: results.length,
    results,
  });
});
