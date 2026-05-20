import { protectedRoute, apiError, apiSuccess } from "@/lib/api-utils";
import {
  classYearGroupNumberForAssignment,
  inferKeyStage,
  parseClassUploadCsv,
  uniqueClassesForRegisterUpsert,
  type ClassUploadRow,
} from "@/lib/class-upload";
import { createServiceRoleClient } from "@/lib/supabase-server";

type StaffLookup = {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  employee_id: string | null;
  job_title?: string | null;
  role_category?: string | null;
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
          staff_id,
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

  const staffIds = [
    ...new Set(
      (data ?? []).flatMap((classRecord: any) =>
        (classRecord.staff_class_assignments ?? [])
          .map((assignment: any) => assignment.staff_id)
          .filter(Boolean),
      ),
    ),
  ];

  const { data: staffRows, error: staffError } = staffIds.length
    ? await supabase
        .from("staff_directory")
        .select("id,job_title,role_category")
        .eq("organization_id", auth.organizationId)
        .in("id", staffIds)
    : { data: [], error: null };

  if (staffError) return apiError(staffError.message, 500);

  const staffById = new Map(
    ((staffRows ?? []) as Array<{ id: string; job_title: string | null; role_category: string | null }>)
      .map((staffMember) => [staffMember.id, staffMember]),
  );

  const classes = (data ?? []).map((classRecord: any) => ({
    ...classRecord,
    staff_class_assignments: (classRecord.staff_class_assignments ?? []).map((assignment: any) => {
      const staffMember = assignment.staff_id ? staffById.get(assignment.staff_id) : null;
      return {
        ...assignment,
        staff_job_title: staffMember?.job_title ?? null,
        staff_role_category: staffMember?.role_category ?? null,
      };
    }),
  }));

  return apiSuccess({
    classes,
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
    .select("id,first_name,last_name,email,employee_id,job_title,role_category")
    .eq("organization_id", auth.organizationId)
    .eq("is_active", true);

  if (staffError) return apiError(staffError.message, 500);

  const staff = (staffRows ?? []) as StaffLookup[];
  const registerClasses = uniqueClassesForRegisterUpsert(parsed.classes);
  const locationCodes = [...new Set(registerClasses.map((classRow) => classRow.location_code).filter(Boolean))] as string[];
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
  const rows = registerClasses.map((classRow) => ({
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

export const PATCH = protectedRoute(async (auth, request) => {
  const body = await request.json();
  const classId = String(body.classId || "");
  const staffId = String(body.staffId || "");
  const role = String(body.role || "Class Teacher").trim();
  const isPrimaryTeacher = Boolean(body.isPrimaryTeacher ?? role.toLowerCase().includes("teacher"));

  if (!classId || !staffId) return apiError("Class and staff member are required", 400, "MISSING_FIELDS");
  if (!role) return apiError("Class role is required", 400, "MISSING_ROLE");

  const supabase = createServiceRoleClient();
  const { data: classRecord, error: classError } = await supabase
    .from("ls_classes")
    .select("id,year_group,class_name,academic_year")
    .eq("id", classId)
    .eq("organization_id", auth.organizationId)
    .single();

  if (classError || !classRecord) return apiError(classError?.message || "Class not found", 404);

  const { data: staffMember, error: staffError } = await supabase
    .from("staff_directory")
    .select("id,first_name,last_name,job_title,role_category")
    .eq("id", staffId)
    .eq("organization_id", auth.organizationId)
    .single();

  if (staffError || !staffMember) return apiError(staffError?.message || "Staff member not found", 404);

  const yearGroupNumber = classYearGroupNumberForAssignment(classRecord.year_group);
  if (yearGroupNumber === null) return apiError("Class year group cannot be used for assignment", 400);

  const { data: assignment, error } = await supabase
    .from("staff_class_assignments")
    .upsert(
      {
        organization_id: auth.organizationId,
        staff_id: staffMember.id,
        staff_name: `${staffMember.first_name} ${staffMember.last_name}`,
        academic_year: classRecord.academic_year || "2025-26",
        year_group: yearGroupNumber,
        registration_group: classRecord.class_name,
        role,
        fte_for_class: 1,
        term: "All Year",
        is_primary_teacher: isPrimaryTeacher,
        ls_class_id: classRecord.id,
        assigned_by: auth.email,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict:
          "organization_id,staff_id,academic_year,year_group,registration_group,role",
      },
    )
    .select("id,staff_id,staff_name,role,is_primary_teacher")
    .single();

  if (error) return apiError(error.message, 500);

  return apiSuccess({
    assignment: {
      ...assignment,
      staff_job_title: staffMember.job_title,
      staff_role_category: staffMember.role_category,
    },
  });
}, { requiredRole: "slt", rateLimit: false });

export const DELETE = protectedRoute(async (auth, request) => {
  const body = await request.json().catch(() => ({}));
  const assignmentId = String(body.assignmentId || "");
  if (!assignmentId) return apiError("Assignment ID is required", 400, "MISSING_ASSIGNMENT_ID");

  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from("staff_class_assignments")
    .delete()
    .eq("id", assignmentId)
    .eq("organization_id", auth.organizationId);

  if (error) return apiError(error.message, 500);

  return apiSuccess({ success: true });
}, { requiredRole: "slt", rateLimit: false });

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
  const match = email
    ? staff.find((staffMember) => staffMember.email?.toLowerCase() === email)
    : staff.find((staffMember) => employeeId && staffMember.employee_id?.toLowerCase() === employeeId.toLowerCase());

  if (!match) {
    warnings.push(
      `${role} for ${classRow.class_name} was not assigned because ${email || employeeId} was not found in staff.`,
    );
    return 0;
  }

  if (email && employeeId && match.employee_id && match.employee_id.toLowerCase() !== employeeId.toLowerCase()) {
    warnings.push(
      `${role} for ${classRow.class_name} was assigned by email to ${match.first_name} ${match.last_name}; employee ID ${employeeId} did not match that staff record.`,
    );
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
