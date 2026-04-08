import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { NextRequest } from "next/server";

/**
 * GET /api/send/register/[id]
 * Get a single pupil with graduated approach cycles, provisions, and referrals
 */
export const GET = protectedRoute(async (auth, request) => {
  const { organizationId } = auth;
  const supabase = createServiceRoleClient();
  const id = request.nextUrl.pathname.split("/").pop();

  // Get pupil
  const { data: pupil, error: pupilError } = await supabase
    .from("send_register")
    .select("*")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .single();

  if (pupilError || !pupil) {
    return apiError("Pupil not found", 404);
  }

  // Get graduated approach cycles
  const { data: cycles } = await supabase
    .from("send_graduated_approach")
    .select("*")
    .eq("pupil_id", id)
    .eq("organization_id", organizationId)
    .order("cycle_number", { ascending: false });

  // Get provisions
  const { data: provisions } = await supabase
    .from("send_provision_map")
    .select("*")
    .eq("pupil_id", id)
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  // Get referrals
  const { data: referrals } = await supabase
    .from("send_referrals")
    .select("*")
    .eq("pupil_id", id)
    .eq("organization_id", organizationId)
    .order("referral_date", { ascending: false });

  return apiSuccess({
    ...pupil,
    graduated_approach_cycles: cycles || [],
    provisions: provisions || [],
    referrals: referrals || [],
  });
});

/**
 * PUT /api/send/register/[id]
 * Update a pupil on the SEN register
 */
export const PUT = protectedRoute(async (auth, request) => {
  const { organizationId, userId } = auth;
  const supabase = createServiceRoleClient();
  const id = request.nextUrl.pathname.split("/").pop();
  const body = await request.json();

  // PII fields explicitly excluded: first_name, last_name — never persisted
  const allowedFields = [
    "pupil_code",
    "year_group",
    "sen_status",
    "primary_need",
    "secondary_need",
    "date_identified",
    "ehcp_status",
    "class_name",
    "key_worker",
    "notes",
  ];

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updates[field] = body[field];
    }
  }

  const { data, error } = await supabase
    .from("send_register")
    .update(updates)
    .eq("id", id)
    .eq("organization_id", organizationId)
    .select()
    .single();

  if (error) {
    console.error("[SEND Register PUT]", error);
    return apiError("Failed to update pupil", 500);
  }

  if (!data) {
    return apiError("Pupil not found", 404);
  }

  return apiSuccess(data);
});
