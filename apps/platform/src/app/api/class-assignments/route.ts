import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

// GET: List class assignments for current academic year
export const GET = protectedRoute(async (auth, req: NextRequest) => {
  const supabase = createServiceRoleClient();
  const url = req.nextUrl;
  const academicYear = url.searchParams.get("academicYear") || "2025-26";

  const { data, error } = await supabase
    .from("staff_class_assignments")
    .select("*")
    .eq("organization_id", auth.organizationId)
    .eq("academic_year", academicYear)
    .order("year_group", { ascending: true })
    .order("registration_group", { ascending: true });

  if (error) return apiError(error.message, 500);
  return apiSuccess({ assignments: data });
});

// POST: Create or update class assignment
export const POST = protectedRoute(async (auth, req: NextRequest) => {
  // Only SLT+ can manage assignments
  if (!["admin", "headteacher", "slt"].includes(auth.role || "")) {
    return apiError("Only SLT can manage class assignments", 403);
  }

  const supabase = createServiceRoleClient();
  const body = await req.json();

  const {
    staffId,
    userId,
    staffName,
    yearGroup,
    registrationGroup,
    role = "Class Teacher",
    fte = 1.0,
    term = "All Year",
    isPrimaryTeacher = true,
    academicYear = "2025-26",
    notes,
  } = body;

  if (!staffId || staffName === undefined || yearGroup === undefined) {
    return apiError("staffId, staffName, and yearGroup are required", 400);
  }

  const { data, error } = await supabase
    .from("staff_class_assignments")
    .upsert(
      {
        organization_id: auth.organizationId,
        staff_id: staffId,
        user_id: userId || null,
        staff_name: staffName,
        academic_year: academicYear,
        year_group: yearGroup,
        registration_group: registrationGroup || null,
        role,
        fte_for_class: fte,
        term,
        is_primary_teacher: isPrimaryTeacher,
        assigned_by: auth.email,
        notes: notes || null,
      },
      {
        onConflict:
          "organization_id,staff_id,academic_year,year_group,registration_group,role",
      },
    )
    .select()
    .single();

  if (error) return apiError(error.message, 500);
  return apiSuccess({ assignment: data });
});

// DELETE: Remove a class assignment
export const DELETE = protectedRoute(async (auth, req: NextRequest) => {
  if (!["admin", "headteacher", "slt"].includes(auth.role || "")) {
    return apiError("Only SLT can manage class assignments", 403);
  }

  const supabase = createServiceRoleClient();
  const id = req.nextUrl.searchParams.get("id");

  if (!id) return apiError("id is required", 400);

  const { error } = await supabase
    .from("staff_class_assignments")
    .delete()
    .eq("id", id)
    .eq("organization_id", auth.organizationId);

  if (error) return apiError(error.message, 500);
  return apiSuccess({ deleted: true });
});
