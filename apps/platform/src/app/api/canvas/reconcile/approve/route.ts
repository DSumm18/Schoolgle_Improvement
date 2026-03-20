/**
 * POST /api/canvas/reconcile/approve — Log Reconciliation Decisions
 *
 * Records the user's decisions on each conflict in the GDPR audit trail.
 * This is the legal shield: "David approved this reconciliation on this date."
 */

import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import type { ReconciliationDecision } from "@/lib/canvas/types";

interface ApproveRequest {
  sessionId: string;
  decisions: Array<{
    entityType: string;
    entityIdentifier: string;
    fieldName: string;
    sourceA: string;
    sourceAValue: string | null;
    sourceB: string;
    sourceBValue: string | null;
    resolution: string;
    resolvedValue?: string;
    reason: string;
  }>;
  createStandingRules?: boolean;
}

export const POST = protectedRoute(async (auth, request: NextRequest) => {
  const body = (await request.json()) as ApproveRequest;

  if (!body.decisions || body.decisions.length === 0) {
    return apiError("No decisions provided", 400);
  }

  const supabase = createServiceRoleClient();
  const now = new Date().toISOString();

  // 1. Log each decision in the reconciliation audit trail
  const logs = body.decisions.map((d) => ({
    organization_id: auth.organizationId,
    session_id: body.sessionId || null,
    entity_type: d.entityType,
    entity_identifier: d.entityIdentifier,
    field_name: d.fieldName,
    source_a: d.sourceA,
    source_a_value: d.sourceAValue,
    source_b: d.sourceB,
    source_b_value: d.sourceBValue,
    resolution: d.resolution,
    resolved_value: d.resolvedValue || null,
    resolution_reason: d.reason,
    gdpr_article: "Article 5(1)(d)",
    approved_by: auth.userId,
    approved_at: now,
  }));

  const { error: logError } = await supabase
    .from("canvas_reconciliation_log")
    .insert(logs);

  if (logError) {
    return apiError(`Failed to log reconciliation: ${logError.message}`, 500);
  }

  // 2. Optionally create standing rules for repeated patterns
  if (body.createStandingRules) {
    // Group decisions by entity_type + field_name + resolution pattern
    const ruleMap = new Map<
      string,
      {
        entityType: string;
        fieldName: string;
        preferred: string;
        override: string;
        count: number;
      }
    >();

    for (const d of body.decisions) {
      if (d.resolution === "deferred" || d.resolution === "dismissed") continue;

      const preferred = d.resolution === "accept_a" ? d.sourceA : d.sourceB;
      const override = d.resolution === "accept_a" ? d.sourceB : d.sourceA;
      const key = `${d.entityType}|${d.fieldName}|${preferred}|${override}`;

      const existing = ruleMap.get(key);
      if (existing) {
        existing.count++;
      } else {
        ruleMap.set(key, {
          entityType: d.entityType,
          fieldName: d.fieldName,
          preferred,
          override,
          count: 1,
        });
      }
    }

    // Create standing rules for patterns that appear 3+ times
    for (const rule of ruleMap.values()) {
      if (rule.count < 3) continue;

      await supabase.from("canvas_reconciliation_rules").upsert(
        {
          organization_id: auth.organizationId,
          entity_type: rule.entityType,
          field_name: rule.fieldName,
          preferred_source: rule.preferred,
          override_source: rule.override,
          auto_apply: false,
          requires_annual_review: true,
          approved_by: auth.userId,
          approved_at: now,
          is_active: true,
        },
        {
          onConflict:
            "organization_id,entity_type,field_name,preferred_source,override_source",
        },
      );
    }
  }

  // 3. Update session stage
  if (body.sessionId) {
    await supabase
      .from("canvas_sessions")
      .update({ stage: "RECONCILIATION_REVIEW" })
      .eq("id", body.sessionId)
      .eq("organization_id", auth.organizationId);
  }

  return apiSuccess({
    logged: logs.length,
    auditNote: `${logs.length} reconciliation decisions approved by ${auth.email} on ${now}`,
    gdprCompliance: "All decisions logged under GDPR Article 5(1)(d)",
  });
});
