/**
 * Staff Personnel Record API
 *
 * GET /api/staff/[id]/personnel — Full personnel record for a staff member
 * Includes: emergency contacts, DBS, qualifications, training, right to work, medical
 */

import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

export const GET = protectedRoute(async (auth, req: NextRequest) => {
  const supabase = createServiceRoleClient();
  const segments = req.nextUrl.pathname.split("/");
  const staffIdx = segments.indexOf("staff");
  const staffId = segments[staffIdx + 1];

  if (!staffId) return apiError("Staff ID required", 400);

  // Fetch staff member
  const { data: staff, error: staffErr } = await supabase
    .from("staff_directory")
    .select("*")
    .eq("id", staffId)
    .eq("organization_id", auth.organizationId)
    .single();

  if (staffErr || !staff) return apiError("Staff member not found", 404);

  // Fetch all personnel records in parallel
  const [
    contacts,
    dbs,
    qualifications,
    training,
    rightToWork,
    medical,
    contract,
  ] = await Promise.all([
    supabase
      .from("staff_emergency_contacts")
      .select("*")
      .eq("staff_id", staffId)
      .order("priority_order"),
    supabase
      .from("staff_dbs_records")
      .select("*")
      .eq("staff_id", staffId)
      .order("issue_date", { ascending: false })
      .limit(1),
    supabase
      .from("staff_qualifications")
      .select("*")
      .eq("staff_id", staffId)
      .order("date_achieved", { ascending: false }),
    supabase
      .from("staff_training_records")
      .select("*")
      .eq("staff_id", staffId)
      .order("completion_date", { ascending: false }),
    supabase
      .from("staff_right_to_work")
      .select("*")
      .eq("staff_id", staffId)
      .eq("is_current", true)
      .limit(1),
    supabase
      .from("staff_medical_info")
      .select("*")
      .eq("staff_id", staffId)
      .limit(1),
    supabase
      .from("staff_contracts")
      .select("*")
      .eq("staff_id", staffId)
      .eq("is_current", true)
      .limit(1),
  ]);

  return apiSuccess({
    staff,
    contract: contract.data?.[0] || null,
    emergency_contacts: contacts.data || [],
    dbs: dbs.data?.[0] || null,
    qualifications: qualifications.data || [],
    training: training.data || [],
    right_to_work: rightToWork.data?.[0] || null,
    medical: medical.data?.[0] || null,
  });
});
