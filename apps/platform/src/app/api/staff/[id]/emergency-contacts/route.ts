/**
 * Staff Emergency Contacts API
 *
 * GET  /api/staff/[id]/emergency-contacts — List contacts for a staff member
 * POST /api/staff/[id]/emergency-contacts — Add a new emergency contact
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
    .from("staff_emergency_contacts")
    .select("*")
    .eq("staff_id", staffId)
    .eq("organization_id", auth.organizationId)
    .order("priority_order");

  if (error) return apiError("Failed to fetch contacts", 500);
  return apiSuccess({ contacts: data });
});

export const POST = protectedRoute(
  async (auth, req) => {
    const supabase = createServiceRoleClient();
    const staffId = getStaffId(req);
    const body = await req.json();

    const {
      contact_name,
      relationship,
      phone_primary,
      phone_secondary,
      email,
      address,
      is_next_of_kin,
      priority_order,
      notes,
    } = body;

    if (!contact_name || !relationship || !phone_primary) {
      return apiError("Name, relationship, and phone are required", 400);
    }

    const { data, error } = await supabase
      .from("staff_emergency_contacts")
      .insert({
        organization_id: auth.organizationId,
        staff_id: staffId,
        contact_name,
        relationship,
        phone_primary,
        phone_secondary,
        email,
        address,
        is_next_of_kin: is_next_of_kin || false,
        priority_order: priority_order || 1,
        notes,
      })
      .select()
      .single();

    if (error) return apiError("Failed to add contact", 500);
    return apiSuccess({ contact: data });
  },
  { requiredRole: "slt" },
);
