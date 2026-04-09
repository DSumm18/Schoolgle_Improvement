/**
 * GET /api/room-checks/schedule -- Get room check schedule
 * PUT /api/room-checks/schedule -- Update room check schedule
 */

import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

export const GET = protectedRoute(async (auth, request) => {
  const { searchParams } = new URL(request.url);
  // orgId MUST come from authenticated session — never from caller
  const organizationId = auth.organizationId;

  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("room_check_schedule")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: true });

  if (error) {
    return apiError(error.message, 500);
  }

  return apiSuccess({ schedule: data ?? [] });
});

export const PUT = protectedRoute(async (auth, request) => {
  const body = await request.json();
  const { assetId, ...updates } = body;

  // orgId MUST come from authenticated session — never from caller
  const orgId = auth.organizationId;

  if (!assetId) {
    return apiError("assetId required", 400);
  }

  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("room_check_schedule")
    .upsert(
      {
        organization_id: orgId,
        asset_id: assetId,
        am_check_required: updates.amCheckRequired ?? true,
        pm_check_required: updates.pmCheckRequired ?? true,
        am_deadline: updates.amDeadline ?? "08:00",
        pm_deadline: updates.pmDeadline ?? "18:00",
        default_checker_id: updates.defaultCheckerId ?? null,
        check_mode: updates.checkMode ?? "term",
        holiday_check_frequency: updates.holidayCheckFrequency ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "organization_id,asset_id" },
    )
    .select()
    .single();

  if (error) {
    return apiError(error.message, 500);
  }

  return apiSuccess({ success: true, schedule: data });
});
