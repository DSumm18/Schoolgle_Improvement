import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { validateBody } from "@/lib/validation";
import { staffCreateSchema, staffUpdateSchema } from "@/lib/validation";
import { createServiceRoleClient } from "@/lib/supabase-server";

// GET /api/staff - List all staff for an organization
// Primary: reads from MIS (Drive/Wonde) — never stored. Fallback: Supabase for manual entries.
export const GET = protectedRoute(async (auth, request: NextRequest) => {
  const { searchParams } = request.nextUrl;
  const source = searchParams.get("source"); // "mis" | "db" | null (auto)

  // Try MIS resolver first (unless explicitly requesting DB)
  if (source !== "db") {
    try {
      const { resolveStaffList } = await import("@/lib/mis/staff-resolver");
      const result = await resolveStaffList(auth.organizationId);
      if (result.staff.length > 0) {
        return apiSuccess({
          staff: result.staff,
          source: result.source,
          count: result.staff.length,
          warnings: result.warnings,
          data_tier: "mis_read_only",
        });
      }
    } catch (e: any) {
      console.warn(
        "[Staff API] MIS resolver failed, falling back to DB:",
        e.message,
      );
    }
  }

  // Fallback: read from Supabase (manually-created staff or synced legacy data)
  const supabase = createServiceRoleClient();

  const { data: staff, error } = await supabase
    .from("staff_directory")
    .select(
      `
            id,
            salutation,
            first_name,
            last_name,
            display_name,
            email,
            phone,
            avatar_url,
            employee_id,
            job_title,
            role_category,
            is_super_user,
            is_active,
            import_source,
            imported_at,
            created_at,
            updated_at,
            staff_module_access (
                module
            )
        `,
    )
    .eq("organization_id", auth.organizationId)
    .order("last_name", { ascending: true });

  if (error) {
    console.error("Error fetching staff:", error);
    return apiError(error.message, 500);
  }

  const transformedStaff =
    staff?.map((s: any) => ({
      ...s,
      accessible_modules:
        s.staff_module_access?.map((ma: any) => ma.module) || [],
      staff_module_access: undefined,
    })) || [];

  return apiSuccess({
    staff: transformedStaff,
    source: "database",
    count: transformedStaff.length,
    data_tier: "supabase_stored",
  });
});

// POST /api/staff - Create a new staff member
export const POST = protectedRoute(
  async (auth, request) => {
    const body = await request.json();
    const validated = validateBody(body, staffCreateSchema);
    if (!validated.success) return validated.response;

    const supabase = createServiceRoleClient();
    const { accessible_modules, created_by, organizationId, ...staffData } =
      validated.data;

    const { data: staff, error: staffError } = await supabase
      .from("staff_directory")
      .insert({
        ...staffData,
        organization_id: auth.organizationId,
        import_source: "manual",
      })
      .select()
      .single();

    if (staffError) {
      console.error("Error creating staff:", staffError);
      return apiError(staffError.message, 500);
    }

    if (accessible_modules && accessible_modules.length > 0) {
      const moduleAccess = accessible_modules.map((module: string) => ({
        staff_id: staff.id,
        module,
        granted_by: auth.userId,
      }));

      const { error: moduleError } = await supabase
        .from("staff_module_access")
        .insert(moduleAccess);

      if (moduleError) {
        console.error("Error adding module access:", moduleError);
      }
    }

    return apiSuccess(staff, 201);
  },
  { requiredRole: "slt" },
);

// PUT /api/staff - Update a staff member
export const PUT = protectedRoute(
  async (auth, request) => {
    const body = await request.json();
    const validated = validateBody(body, staffUpdateSchema);
    if (!validated.success) return validated.response;

    const supabase = createServiceRoleClient();
    const { id, accessible_modules, ...updateData } = validated.data;

    const { data: staff, error: staffError } = await supabase
      .from("staff_directory")
      .update(updateData)
      .eq("id", id)
      .eq("organization_id", auth.organizationId)
      .select()
      .single();

    if (staffError) {
      console.error("Error updating staff:", staffError);
      return apiError(staffError.message, 500);
    }

    if (accessible_modules !== undefined) {
      await supabase.from("staff_module_access").delete().eq("staff_id", id);

      if (accessible_modules.length > 0) {
        const moduleAccess = accessible_modules.map((module: string) => ({
          staff_id: id,
          module,
        }));

        await supabase.from("staff_module_access").insert(moduleAccess);
      }
    }

    return apiSuccess(staff);
  },
  { requiredRole: "slt" },
);

// DELETE /api/staff - Delete a staff member
export const DELETE = protectedRoute(
  async (auth, request) => {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return apiError("Staff ID is required", 400, "MISSING_ID");
    }

    const supabase = createServiceRoleClient();

    const { error } = await supabase
      .from("staff_directory")
      .delete()
      .eq("id", id)
      .eq("organization_id", auth.organizationId);

    if (error) {
      console.error("Error deleting staff:", error);
      return apiError(error.message, 500);
    }

    return apiSuccess({ success: true });
  },
  { requiredRole: "admin" },
);
