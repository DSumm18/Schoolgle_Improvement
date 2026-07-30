/**
 * API Route: Statutory Completions
 *
 * GET /api/estates/statutory-completions
 * POST /api/estates/statutory-completions
 */

import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import {
  getStatutoryCompletions,
  getDomainsCompletionSummary,
  completeStatutoryCheck,
  initializeAllStatutoryCompletions,
  recordDocumentationAction,
} from "@/lib/estates-compliance/database/statutory-completions";
import {
  DOMAIN_METADATA,
  getChecksForDomain,
  type ComplianceDomain,
} from "@/lib/estates-compliance/statutory-checks";
import { HelpdeskService } from "@/lib/estates-compliance/services/HelpdeskService";
import { EvidenceService } from "@/lib/estates-compliance/services/EvidenceService";
import { hasFailedComplianceMeasurement } from "@/lib/estates-compliance/measurement-evaluation";

/**
 * GET: Fetch statutory completions for an organization
 */
export const GET = protectedRoute(async (auth, request) => {
  const { organizationId } = auth;

  const { searchParams } = new URL(request.url);
  const domain = searchParams.get("domain") as ComplianceDomain | null;
  const summary = searchParams.get("summary") === "true";

  if (summary) {
    // Get completion summary for all domains
    const domains = Object.keys(DOMAIN_METADATA) as ComplianceDomain[];
    const domainSummaries = await getDomainsCompletionSummary(
      organizationId,
      domains,
    );

    return apiSuccess({
      organization_id: organizationId,
      domains: domainSummaries,
    });
  }

  // Get completions with optional domain filter
  const completions = await getStatutoryCompletions(
    organizationId,
    domain ? { domain } : undefined,
  );

  return apiSuccess({
    organization_id: organizationId,
    domain: domain || "all",
    completions,
  });
});

/**
 * POST: Create or update statutory completions
 */
export const POST = protectedRoute(
  async (auth, request) => {
    const { organizationId, userId } = auth;

    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case "complete": {
        // Complete a statutory check
        const { check_id, check_data } = data;

        if (!check_id) {
          return apiError("check_id is required for complete action", 400);
        }

        const hasFailedMeasurement = hasFailedComplianceMeasurement(
          check_data?.measurement_data,
        );

        const completion = await completeStatutoryCheck(
          organizationId,
          check_id,
          {
            ...check_data,
            status: hasFailedMeasurement ? "failed" : check_data?.status,
            completed_by: userId,
          },
        );

        let autoCreatedTicket: Awaited<ReturnType<typeof HelpdeskService.create>> | null = null;
        if (completion.status === "failed") {
          const check = getChecksForDomain(
            completion.compliance_domain as ComplianceDomain,
          ).find((item) => item.id === check_id);

          const createdTicket = await HelpdeskService.create(organizationId, {
            title: `Failed compliance check: ${check?.name || check_id}`,
            description:
              completion.completion_notes ||
              `The ${check?.name || check_id} compliance check failed and requires follow-up.`,
            category: "compliance",
            priority: check?.risk_level === "critical" ? "critical" : "high",
            reported_by: userId,
            assigned_to: completion.assigned_to || undefined,
            team_id: completion.team_id || undefined,
            compliance_domain: completion.compliance_domain,
            statutory_check_id: check_id,
            statutory_completion_id: completion.id,
            ticket_type: "compliance_scheduled",
            created_via: "auto_generated",
            evidence_urls: completion.evidence_ids || [],
          });
          autoCreatedTicket = createdTicket;

          await Promise.all(
            (completion.evidence_ids || []).map((evidenceId) =>
              EvidenceService.update(
                evidenceId,
                { ticket_id: createdTicket.id },
                organizationId,
              ),
            ),
          );
        }

        return apiSuccess({
          success: true,
          completion,
          auto_created_ticket: autoCreatedTicket,
        });
      }

      case "initialize": {
        // Initialize all statutory completions for an organization
        const result = await initializeAllStatutoryCompletions(organizationId);

        return apiSuccess({
          success: true,
          message: `Seeded ${result.totalSeeded} statutory completion records`,
          ...result,
        });
      }

      case "documentation_received":
      case "documentation_chased": {
        const { completion_id } = data;
        if (!completion_id) {
          return apiError("completion_id is required", 400);
        }
        const completion = await recordDocumentationAction(
          organizationId,
          completion_id,
          userId,
          action === "documentation_received" ? "received" : "chased",
        );
        return apiSuccess({ success: true, completion });
      }

      default:
        return apiError("Invalid action. Use: complete, initialize, documentation_received, documentation_chased", 400);
    }
  },
  { requiredRole: "caretaker" },
);
