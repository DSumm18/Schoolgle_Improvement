/**
 * Meter Readings List API
 *
 * GET /api/estates/energy/meter-readings
 *
 * Query params:
 *   meter_id  - optional filter by meter UUID
 *   limit     - max rows (default 50, max 200)
 *
 * Returns readings from energy_meter_readings joined with energy_meters
 * for meter label/location, ordered by reading_date DESC.
 */

import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

export const GET = protectedRoute(async (auth, request: NextRequest) => {
  const supabase = createServiceRoleClient();
  const orgId = auth.organizationId;

  const { searchParams } = request.nextUrl;
  const meterId = searchParams.get("meter_id");
  const limitParam = parseInt(searchParams.get("limit") ?? "50", 10);
  const limit = Math.min(Math.max(limitParam, 1), 200);

  let query = supabase
    .from("energy_meter_readings")
    .select(
      `
      id,
      meter_id,
      reading_value,
      reading_date,
      image_url,
      image_storage_path,
      submitted_by,
      ai_confidence,
      ai_meter_type,
      ai_notes,
      source,
      verified_by,
      verified_at,
      created_at,
      energy_meters (
        id,
        reference,
        meter_type,
        location,
        label
      )
    `,
    )
    .eq("organization_id", orgId)
    .order("reading_date", { ascending: false })
    .limit(limit);

  if (meterId) {
    query = query.eq("meter_id", meterId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[meter-readings] List error:", error.message);
    return apiError("Failed to fetch meter readings", 500);
  }

  return apiSuccess({ readings: data ?? [], count: data?.length ?? 0 });
});
