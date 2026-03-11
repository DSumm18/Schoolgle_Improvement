/**
 * Contractors API Routes
 *
 * GET    /api/estates/contractors              - List contractors
 * POST   /api/estates/contractors              - Create contractor
 */

import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { ContractorService } from "@/lib/estates-compliance/services/ContractorService";
import type { ContractorInput } from "@/types/estates-compliance";

/**
 * GET /api/estates/contractors
 *
 * Query params:
 * - status: 'active' | 'inactive' | 'restricted'
 * - preferred: boolean
 */
export const GET = protectedRoute(async (auth, request) => {
  const { organizationId } = auth;

  const searchParams = request.nextUrl.searchParams;

  // Parse filters
  const filters: {
    status?: "active" | "inactive" | "restricted";
    preferred?: boolean;
  } = {};

  if (searchParams.get("status")) {
    filters.status = searchParams.get("status") as
      | "active"
      | "inactive"
      | "restricted";
  }
  if (searchParams.get("preferred") !== null) {
    filters.preferred = searchParams.get("preferred") === "true";
  }

  const contractors = await ContractorService.listContractors(
    organizationId,
    filters,
  );

  return apiSuccess({ contractors, count: contractors.length });
});

/**
 * POST /api/estates/contractors
 *
 * Body: ContractorInput
 */
export const POST = protectedRoute(
  async (auth, request) => {
    const { organizationId } = auth;

    const body = await request.json();

    if (!body.company_name) {
      return apiError("company_name is required", 400);
    }

    const contractor = await ContractorService.createContractor(
      organizationId,
      body as ContractorInput,
    );

    return apiSuccess({ data: contractor }, 201);
  },
  { requiredRole: "caretaker" },
);
