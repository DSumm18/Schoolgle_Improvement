/**
 * API Route: Statutory Completions
 *
 * GET /api/estates/statutory-completions
 * POST /api/estates/statutory-completions
 */

import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import {
  getStatutoryCompletions,
  getDomainsCompletionSummary,
  completeStatutoryCheck,
  initializeAllStatutoryCompletions,
} from "@/lib/estates-compliance/database/statutory-completions";
import {
  DOMAIN_METADATA,
  getChecksForDomain,
  type ComplianceDomain,
} from "@/lib/estates-compliance/statutory-checks";

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

        const completion = await completeStatutoryCheck(
          organizationId,
          check_id,
          {
            ...check_data,
            completed_by: userId,
          },
        );

        return apiSuccess({
          success: true,
          completion,
        });
      }

      case "initialize": {
        // Initialize all statutory completions for an organization
        const domains = Object.keys(DOMAIN_METADATA) as ComplianceDomain[];
        const domainCheckIds: Record<string, string[]> = {};

        for (const domain of domains) {
          const checks = getChecksForDomain(domain);
          domainCheckIds[domain] = checks.map((c) => c.id);
        }

        await initializeAllStatutoryCompletions(
          organizationId,
          domains,
          domainCheckIds,
        );

        return apiSuccess({
          success: true,
          message: "Statutory completions initialized",
        });
      }

      default:
        return apiError("Invalid action. Use: complete, initialize", 400);
    }
  },
  { requiredRole: "caretaker" },
);
