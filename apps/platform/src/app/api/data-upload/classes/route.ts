import { protectedRoute, apiError, apiSuccess } from "@/lib/api-utils";
import { inferKeyStage, parseClassUploadCsv, type ClassUploadRow } from "@/lib/class-upload";
import { createServiceRoleClient } from "@/lib/supabase-server";

type StaffLookup = {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  employee_id: string | null;
};

type LocationLookup = {
  id: string;
  room_code: string | null;
  name: string;
};

export const GET = protectedRoute(async (auth) => {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("ls_classes")
    .select(
      `
        id,
        year_group,
        class_name,
        key_stage,
        room,
        academic_year,
        pupil_count,
        updated_at,
        staff_class_assignments (
          id,
          staff_name,
          role,
          is_primary_teacher
        )
      `,
    )
    .eq("organization_id", auth.organizationId)
    .order("year_group")
    .order("class_name");

  if (error) return apiError(error.message, 500);

  return apiSuccess({
    classes: data ?? [],
  });
}, { requiredRole: "slt", rateLimit: false });

export const POST = protectedRoute(async (auth, request) => {
  const body = await request.json();
  const parsed = parseClassUploadCsv(String(body.csvText || body.csv || ""));
  if (parsed.errors.length > 0) {
    return apiError("Class upload has validation errors", 400, "INVALID_CSV", {
      errors: parsed.errors,
    });
  }
  if (parsed.classes.length === 0) return apiError("No class rows found", 400);

  const supabase = createServiceRoleClient();
  const { data: staffRows, error: staffError } = await supabase
    .from("staff_directory")
    .select("id,first_name,last_name,email,employee_id")
    .eq("organization_id", auth.organizationId)
    .eq("is_active", true);

  if (staffError) return apiError(staffError.message, 500);

  const staff = (staffRows ?? []) as StaffLookup[];
  const locationCodes = [...new Set(parsed.classes.map((classRow) => classRow.location_code).filter(Boolean))] as string[];
  const { data: locationRows, error: locationError } = locationCodes.length
    ? await supabase
        .from("estates_locations")
        .select("id,room_code,name")
        .eq("organization_id", auth.organizationId)
        .in("room_code", locationCodes)
    : { data: [], error: null };

  if (locationError) return apiError(locationError.message, 500);

  const locationsByCode = new Map<string, LocationLookup>(
    ((locationRows ?? []) as LocationLookup[])
      .filter((location) => location.room_code)
      .map((location) => [location.room_code!.toUpperCase(), location]),
  );
  const warnings: string[] = [];
  const rows = parsed.classes.map((classRow) => ({
    organization_id: auth.organizationId,
    year_group: classRow.year_group,
    class_name: classRow.class_name,
    key_stage: inferKeyStage(classRow.year_group),
    room: classRow.room || classRow.location_code,
    location_id: classRow.location_code ? locationsByCode.get(classRow.location_code)?.id ?? null : null,
    academic_year: classRow.academic_year,
    updated_at: new Date().toISOString(),
  }));

  const { data: classes, error } = await supabase
    .from("ls_classes")
    .upsert(rows, { onConflict: "organization_id,class_name,academic_year" })
    .select("id,year_group,class_name,academic_year");

  if (error) return apiError(error.message, 500);

  const classByKey = new Map(
    (classes ?? []).map((classRecord: any) => [
      `${classRecord.class_name.toLowerCase()}|${classRecord.academic_year}`,
      classRecord,
    ]),
  );
  for (const classRow of parsed.classes) {
    if (classRow.location_code && !locationsByCode.has(classRow.location_code)) {
      warnings.push(`${classRow.class_name} location ${classRow.location_code} was not found.`);
    }
  }
  let assignments = 0;

  for (const classRow of parsed.classes) {
    const classRecord = classByKey.get(`${classRow.class_name.toLowerCase()}|${classRow.academic_year}`);
    if (!classRecord) continue;

    assignments += await upsertAssignment({
      supabase,
      auth,
      classRow,
      classId: classRecord.id,
      staff,
      role: "Class Teacher",
      email: classRow.teacher_email,
      employeeId: classRow.teacher_employee_id,
      warnings,
      isPrimaryTeacher: true,
    });
    assignments += await upsertAssignment({
      supabase,
      auth,
      classRow,
      classId: classRecord.id,
      staff,
      role: "Teaching Assistant",
      email: classRow.ta_email,
      employeeId: classRow.ta_employee_id,
      warnings,
      isPrimaryTeacher: false,
    });
  }

  return apiSuccess({
    imported: classes?.length ?? rows.length,
    assignments,
    warnings,
    classes: [...new Set(rows.map((row) => row.class_name))],
  });
}, { requiredRole: "slt" });

async function upsertAssignment({
  supabase,
  auth,
  classRow,
  classId,
  staff,
  role,
  email,
  employeeId,
  warnings,
  isPrimaryTeacher,
}: {
  supabase: ReturnType<typeof createServiceRoleClient>;
  auth: { organizationId: string; email?: string | null };
  classRow: ClassUploadRow;
  classId: string;
  staff: StaffLookup[];
  role: string;
  email: string | null;
  employeeId: string | null;
  warnings: string[];
  isPrimaryTeacher: boolean;
}) {
  if (!email && !employeeId) return 0;
  const match = staff.find((staffMember) =>
    (email && staffMember.email?.toLowerCase() === email) ||
    (employeeId && staffMember.employee_id?.toLowerCase() === employeeId.toLowerCase()),
  );

  if (!match) {
    warnings.push(
      `${role} for ${classRow.class_name} was not assigned because ${email || employeeId} was not found in staff.`,
    );
    return 0;
  }

  const { error } = await supabase
    .from("staff_class_assignments")
    .upsert(
      {
        organization_id: auth.organizationId,
        staff_id: match.id,
        staff_name: `${match.first_name} ${match.last_name}`,
        academic_year: classRow.academic_year,
        year_group: classRow.year_group_number,
        registration_group: classRow.class_name,
        role,
        fte_for_class: 1,
        term: "All Year",
        is_primary_teacher: isPrimaryTeacher,
        ls_class_id: classId,
        assigned_by: auth.email,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict:
          "organization_id,staff_id,academic_year,year_group,registration_group,role",
      },
    );

  if (error) {
    warnings.push(`${role} for ${classRow.class_name} could not be assigned: ${error.message}`);
    return 0;
  }
  return 1;
}
