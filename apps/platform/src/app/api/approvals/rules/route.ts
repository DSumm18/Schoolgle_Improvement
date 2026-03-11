/**
 * Approval Rules API
 *
 * GET /api/approvals/rules - Return current approval rules
 *
 * Returns the default ATH 2025 rules. In future, organisations can
 * store overrides in a `approval_rule_overrides` table; this endpoint
 * will merge defaults with org-specific customisations.
 */

import { protectedRoute, apiSuccess } from "@/lib/api-utils";
import { getApprovalRules, tierLabel, typeLabel } from "@/lib/approval-engine";

export const GET = protectedRoute(async () => {
  const rules = getApprovalRules();

  // Enrich with human-readable labels
  const enriched = rules.map((rule) => ({
    ...rule,
    requiredTierLabel: tierLabel(rule.requiredTier),
    typeLabel: typeLabel(rule.type),
  }));

  return apiSuccess({ rules: enriched });
});
