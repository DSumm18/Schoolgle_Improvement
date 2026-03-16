/**
 * Staff Qualifications API
 *
 * GET  /api/staff/[id]/qualifications — List qualifications
 * POST /api/staff/[id]/qualifications — Add qualification
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
    .from("staff_qualifications")
    .select("*")
    .eq("staff_id", staffId)
    .eq("organization_id", auth.organizationId)
    .order("date_achieved", { ascending: false });

  if (error) return apiError("Failed to fetch qualifications", 500);
  return apiSuccess({ qualifications: data });
});

export const POST = protectedRoute(
  async (auth, req) => {
    const supabase = createServiceRoleClient();
    const staffId = getStaffId(req);
    const body = await req.json();

    const {
      qualification_type,
      qualification_name,
      awarding_body,
      reference_number,
      date_achieved,
      expiry_date,
      is_mandatory,
      document_url,
      notes,
    } = body;

    if (!qualification_type || !qualification_name) {
      return apiError("Type and name are required", 400);
    }

    const { data, error } = await supabase
      .from("staff_qualifications")
      .insert({
        organization_id: auth.organizationId,
        staff_id: staffId,
        qualification_type,
        qualification_name,
        awarding_body,
        reference_number,
        date_achieved,
        expiry_date,
        is_mandatory: is_mandatory || false,
        document_url,
        notes,
      })
      .select()
      .single();

    if (error) return apiError("Failed to add qualification", 500);
    return apiSuccess({ qualification: data });
  },
  { requiredRole: "slt" },
);
