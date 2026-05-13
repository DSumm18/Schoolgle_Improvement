import { protectedRoute, apiError, apiSuccess } from "@/lib/api-utils";
import { getMISDataServiceForOrg } from "@/lib/mis/data-service";
import type { MISPupil } from "@/lib/mis/types";
import { createServiceRoleClient } from "@/lib/supabase-server";

export const POST = protectedRoute(async (auth, request) => {
  const body = await request.json().catch(() => ({}));
  const service = await getMISDataServiceForOrg(auth.organizationId);
  const result = await service.read<MISPupil>(auth.organizationId, "pupils");
  const pupils = result.data.filter(
    (pupil) => pupil.enrolment_status !== "Leaver" && pupil.first_name && pupil.last_name,
  );

  if (pupils.length === 0) {
    return apiError(
      result.warnings?.[0] ||
        "No current pupils found in the MIS pupil roll. Upload a CSV pupil list instead.",
      404,
    );
  }

  const rows = pupils.map((pupil) => {
    const yearGroup = String(pupil.year_group);
    return {
      organization_id: auth.organizationId,
      school_id: body.schoolId || null,
      pupil_id:
        pupil.student_id ||
        pupil.upn ||
        `${yearGroup}-${pupil.registration_group}-${pupil.first_name}-${pupil.last_name}`
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, ""),
      pupil_ref: pupil.upn || null,
      first_name: pupil.preferred_name || pupil.first_name,
      last_name: pupil.last_name,
      date_of_birth: pupil.date_of_birth || null,
      year_group: yearGroup,
      class_name: pupil.registration_group || null,
      current_class: pupil.registration_group || null,
      gender: pupil.gender || null,
      is_pupil_premium: pupil.pupil_premium,
      is_eal: pupil.eal,
      sen_status: pupil.sen_status,
      send_status: pupil.sen_status,
      primary_need: pupil.sen_primary_need || null,
      fsm_eligible: pupil.fsm_eligible,
      ehcp: pupil.ehcp,
      is_active: true,
      import_source: `mis_${result.source.type}`,
      imported_at: new Date().toISOString(),
    };
  });

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("pupils")
    .upsert(rows, { onConflict: "organization_id,pupil_id" })
    .select("id, year_group, current_class");

  if (error) {
    if (error.message.includes("Could not find the table")) {
      return apiError("Class Builder pupil table is not available. Run the latest database migration first.", 500);
    }
    throw error;
  }

  return apiSuccess({
    imported: data?.length ?? rows.length,
    source: result.source,
    warnings: result.warnings,
    yearGroups: [...new Set(rows.map((row) => row.year_group))],
    classes: [
      ...new Set(
        rows
          .map((row) => row.current_class)
          .filter((value): value is string => Boolean(value)),
      ),
    ],
  });
});
