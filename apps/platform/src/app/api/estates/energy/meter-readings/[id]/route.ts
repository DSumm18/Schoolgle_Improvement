/**
 * Single Meter Reading API
 *
 * PATCH /api/estates/energy/meter-readings/[id]
 *
 * Body: { verified: true, notes?: string }
 *
 * Sets verified_by and verified_at on the reading.
 */

import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

export const PATCH = protectedRoute(async (auth, request: NextRequest) => {
  const supabase = createServiceRoleClient();
  const orgId = auth.organizationId;

  // Extract [id] from URL path
  const segments = request.nextUrl.pathname.split("/");
  const readingId = segments[segments.length - 1];

  if (!readingId) {
    return apiError("Reading ID is required", 400);
  }

  const body = await request.json();
  const { verified, notes } = body as { verified?: boolean; notes?: string };

  if (verified !== true) {
    return apiError("Only { verified: true } is supported", 400);
  }

  const updatePayload: Record<string, unknown> = {
    verified_by: auth.userId,
    verified_at: new Date().toISOString(),
  };

  if (notes !== undefined) {
    updatePayload.ai_notes = notes;
  }

  const { data, error } = await supabase
    .from("energy_meter_readings")
    .update(updatePayload)
    .eq("id", readingId)
    .eq("organization_id", orgId)
    .select("id, verified_by, verified_at")
    .single();

  if (error) {
    console.error("[meter-readings] Verify error:", error.message);
    if (error.code === "PGRST116") {
      return apiError("Reading not found", 404);
    }
    return apiError("Failed to verify reading", 500);
  }

  return apiSuccess({ reading: data });
});
