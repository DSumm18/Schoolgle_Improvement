/**
 * Individual Evidence API Routes
 *
 * GET    /api/estates/evidence/[id]         - Get evidence by ID
 * PUT    /api/estates/evidence/[id]         - Update evidence
 * DELETE /api/estates/evidence/[id]         - Delete evidence
 */

import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { EvidenceService } from "@/lib/estates-compliance/services/EvidenceService";

/**
 * GET /api/estates/evidence/[id]
 */
export const GET = protectedRoute(async (auth, request) => {
  const url = new URL(request.url);
  const segments = url.pathname.split("/");
  const id = segments[segments.length - 1];

  const evidence = await EvidenceService.get(id);

  if (!evidence) {
    return apiError("Evidence not found", 404);
  }

  return apiSuccess({ data: evidence });
});

/**
 * PUT /api/estates/evidence/[id]
 */
export const PUT = protectedRoute(
  async (auth, request) => {
    const url = new URL(request.url);
    const segments = url.pathname.split("/");
    const id = segments[segments.length - 1];

    const updates = await request.json();

    const evidence = await EvidenceService.update(id, updates);

    return apiSuccess({ data: evidence });
  },
  { requiredRole: "caretaker" },
);

/**
 * DELETE /api/estates/evidence/[id]
 */
export const DELETE = protectedRoute(
  async (auth, request) => {
    const url = new URL(request.url);
    const segments = url.pathname.split("/");
    const id = segments[segments.length - 1];

    await EvidenceService.delete(id);

    return apiSuccess({ success: true });
  },
  { requiredRole: "caretaker" },
);
