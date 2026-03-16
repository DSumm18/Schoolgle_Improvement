/**
 * Staff Training Records API
 *
 * GET  /api/staff/[id]/training — List training records
 * POST /api/staff/[id]/training — Add training record
 */

import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

function getStaffId(req: NextRequest): string {
  const segments = req.nextUrl.pathname.split("/");
  const idx = segments.indexOf("staff");
  return segments[idx + 1];
}

export const GET = protectedRoute(async (auth, req) => {
  const supabase = createServiceRoleClient();
  const staffId = getStaffId(req);

  const { data, error } = await supabase
    .from("staff_training_records")
    .select("*")
    .eq("staff_id", staffId)
    .eq("organization_id", auth.organizationId)
    .order("completion_date", { ascending: false });

  if (error) return apiError("Failed to fetch training records", 500);
  return apiSuccess({ training: data });
});

export const POST = protectedRoute(
  async (auth, req) => {
    const supabase = createServiceRoleClient();
    const staffId = getStaffId(req);
    const body = await req.json();

    const {
      training_name,
      training_category,
      provider,
      training_type,
      completion_date,
      expiry_date,
      refresh_frequency_months,
      hours_completed,
      cost,
      funded_by,
      certificate_url,
      is_mandatory,
      impact_notes,
      cpd_points,
      notes,
    } = body;

    if (!training_name || !training_category || !completion_date) {
      return apiError("Name, category, and completion date required", 400);
    }

    const { data, error } = await supabase
      .from("staff_training_records")
      .insert({
        organization_id: auth.organizationId,
        staff_id: staffId,
        training_name,
        training_category,
        provider,
        training_type: training_type || "face_to_face",
        completion_date,
        expiry_date,
        refresh_frequency_months,
        hours_completed,
        cost: cost || 0,
        funded_by,
        certificate_url,
        is_mandatory: is_mandatory || false,
        impact_notes,
        cpd_points,
        notes,
      })
      .select()
      .single();

    if (error) return apiError("Failed to add training record", 500);
    return apiSuccess({ training: data });
  },
  { requiredRole: "slt" },
);
