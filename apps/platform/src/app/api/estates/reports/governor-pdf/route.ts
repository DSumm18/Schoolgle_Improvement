/**
 * Governor PDF Report API
 *
 * Returns a structured JSON payload with the full premises compliance
 * report data, ready for the print-friendly governor report page.
 */

import { protectedRoute, apiSuccess } from "@/lib/api-utils";
import { getDomainsCompletionSummary } from "@/lib/estates-compliance/database/statutory-completions";
import {
  DOMAIN_METADATA,
  type ComplianceDomain,
} from "@/lib/estates-compliance/statutory-checks";

export const GET = protectedRoute(async (auth) => {
  const { organizationId } = auth;

  const domains = Object.keys(DOMAIN_METADATA) as ComplianceDomain[];
  const summaries = await getDomainsCompletionSummary(organizationId, domains);

  const totalChecks = summaries.reduce((s, d) => s + d.totalChecks, 0);
  const completedChecks = summaries.reduce((s, d) => s + d.completedChecks, 0);
  const overdueChecks = summaries.reduce((s, d) => s + d.overdueChecks, 0);

  const overallStatus =
    overdueChecks > 0
      ? "action_required"
      : completedChecks === totalChecks
        ? "fully_compliant"
        : "in_progress";

  return apiSuccess({
    reportTitle: "Premises Compliance Report",
    generatedAt: new Date().toISOString(),
    summary: {
      totalChecks,
      completedChecks,
      overdueChecks,
      pendingChecks: totalChecks - completedChecks - overdueChecks,
      compliancePercentage:
        totalChecks > 0 ? Math.round((completedChecks / totalChecks) * 100) : 0,
      overallStatus,
    },
    domains: summaries.map((d) => ({
      domain: d.domain,
      name: DOMAIN_METADATA[d.domain]?.name ?? d.domain,
      icon: DOMAIN_METADATA[d.domain]?.icon ?? "",
      totalChecks: d.totalChecks,
      completedChecks: d.completedChecks,
      overdueChecks: d.overdueChecks,
      pendingChecks: d.pendingChecks,
      status: d.status,
      overdueItems: d.completions
        .filter((c) => c.status === "overdue")
        .map((c) => ({
          checkId: c.check_id,
          nextDue: c.next_due_date,
        })),
    })),
  });
});
