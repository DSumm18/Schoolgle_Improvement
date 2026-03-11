/**
 * Single Contractor API Routes
 *
 * GET    /api/estates/contractors/[id]  - Get contractor
 * PUT    /api/estates/contractors/[id]  - Update contractor
 * DELETE /api/estates/contractors/[id]  - Delete contractor
 */

import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { ContractorService } from "@/lib/estates-compliance/services/ContractorService";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/estates/contractors/[id]
 */
export const GET = protectedRoute(async (auth, request) => {
  const url = new URL(request.url);
  const segments = url.pathname.split("/");
  const id = segments[segments.length - 1];

  const contractor = await ContractorService.getContractor(id);

  if (!contractor) {
    return apiError("Contractor not found", 404);
  }

  return apiSuccess({ data: contractor });
});

/**
 * PUT /api/estates/contractors/[id]
 */
export const PUT = protectedRoute(
  async (auth, request) => {
    const url = new URL(request.url);
    const segments = url.pathname.split("/");
    const id = segments[segments.length - 1];

    const updates = await request.json();

    const contractor = await ContractorService.updateContractor(id, updates);

    return apiSuccess({ data: contractor });
  },
  { requiredRole: "caretaker" },
);

/**
 * DELETE /api/estates/contractors/[id]
 */
export const DELETE = protectedRoute(
  async (auth, request) => {
    const url = new URL(request.url);
    const segments = url.pathname.split("/");
    const id = segments[segments.length - 1];

    await ContractorService.deleteContractor(id);

    return apiSuccess({ success: true });
  },
  { requiredRole: "caretaker" },
);
