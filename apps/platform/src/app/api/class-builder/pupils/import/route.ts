import { protectedRoute, apiError, apiSuccess } from "@/lib/api-utils";
import { parseClassBuilderPupilCsv } from "@/lib/class-builder";
import { createServiceRoleClient } from "@/lib/supabase-server";

export const POST = protectedRoute(async (auth, request) => {
  const body = await request.json();
  const csvText = String(body.csvText || "");
  const parsed = parseClassBuilderPupilCsv(csvText);

  if (parsed.errors.length > 0) {
    return apiError("Pupil import has validation errors", 400, "INVALID_CSV", {
      errors: parsed.errors,
    });
  }

  if (parsed.pupils.length === 0) {
    return apiError("No pupil rows found", 400);
  }

  const supabase = createServiceRoleClient();
  const rows = parsed.pupils.map((pupil) => {
    const pupilId = [
      pupil.year_group,
      pupil.current_class || "class",
      pupil.first_name,
      pupil.last_name,
    ]
      .join("-")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    return {
      organization_id: auth.organizationId,
      school_id: body.schoolId || null,
      pupil_id: pupilId,
      first_name: pupil.first_name,
      last_name: pupil.last_name,
      year_group: pupil.year_group,
      class_name: pupil.current_class,
      current_class: pupil.current_class,
      gender: pupil.gender,
      sen_status: pupil.send_status,
      send_status: pupil.send_status,
      ehcp: pupil.ehcp,
      is_active: true,
      import_source: "class_builder_csv",
      imported_at: new Date().toISOString(),
    };
  });

  const { data, error } = await supabase
    .from("pupils")
    .upsert(rows, { onConflict: "organization_id,pupil_id" })
    .select("id");

  if (error) throw error;

  return apiSuccess({
    imported: data?.length ?? rows.length,
    yearGroups: [...new Set(parsed.pupils.map((pupil) => pupil.year_group))],
    classes: [
      ...new Set(
        parsed.pupils
          .map((pupil) => pupil.current_class)
          .filter((value): value is string => Boolean(value)),
      ),
    ],
  });
});
