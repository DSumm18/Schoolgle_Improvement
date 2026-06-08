import { protectedRoute, apiError, apiSuccess } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

type PupilRetentionRow = {
  id: string;
  year_group: string | null;
  pupil_record_status: string | null;
  archive_candidate: boolean | null;
  not_in_latest_import: boolean | null;
  is_active: boolean | null;
};

export const GET = protectedRoute(async (auth) => {
  const supabase = createServiceRoleClient();
  const { data: datasets, error: datasetError } = await supabase
    .from("pupil_import_datasets")
    .select("id,import_type,source_label,source_filename,academic_year,is_current,total_rows,imported_rows,archive_candidate_rows,created_at")
    .eq("organization_id", auth.organizationId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (datasetError) {
    if (isMissingRetentionTables(datasetError.message)) {
      return apiSuccess({
        setupRequired: true,
        message: "GDPR data retention storage is not set up yet. Apply the 20260608 pupil import dataset retention migration.",
        datasets: [],
        cohorts: [],
      });
    }
    return apiError(datasetError.message, 500);
  }

  const { data: pupils, error: pupilError } = await supabase
    .from("pupils")
    .select("id,year_group,pupil_record_status,archive_candidate,not_in_latest_import,is_active")
    .eq("organization_id", auth.organizationId);

  if (pupilError) return apiError(pupilError.message, 500);

  return apiSuccess({
    setupRequired: false,
    datasets: datasets ?? [],
    cohorts: buildCohorts((pupils ?? []) as PupilRetentionRow[]),
  });
}, { requiredRole: "slt" });

export const POST = protectedRoute(async (auth, request) => {
  const body = await request.json();
  const action = String(body.action || "");
  const yearGroup = String(body.yearGroup || "");
  const reason = String(body.reason || "");

  if (!["archive", "delete"].includes(action)) {
    return apiError("Unsupported retention action", 400, "UNSUPPORTED_RETENTION_ACTION");
  }
  if (!yearGroup) return apiError("yearGroup is required", 400, "MISSING_YEAR_GROUP");

  if (action === "delete" && body.confirmText !== "DELETE FROM SCHOOLGLE") {
    return apiError("Deletion requires exact confirmation text", 400, "DELETE_CONFIRMATION_REQUIRED");
  }

  const supabase = createServiceRoleClient();
  const now = new Date().toISOString();
  const { data: candidates, error: candidateError } = await supabase
    .from("pupils")
    .select("id")
    .eq("organization_id", auth.organizationId)
    .eq("year_group", yearGroup);

  if (candidateError) return apiError(candidateError.message, 500);

  const affectedRows = candidates?.length ?? 0;
  if (affectedRows === 0) {
    return apiSuccess({ action, yearGroup, affectedRows: 0 });
  }

  if (action === "archive") {
    const { error } = await supabase
      .from("pupils")
      .update({
        pupil_record_status: "archived",
        is_active: false,
        archive_candidate: false,
        not_in_latest_import: false,
        archived_at: now,
        archived_by: auth.userId,
        archive_reason: reason || "Archived from GDPR Data Retention settings",
        updated_at: now,
      })
      .eq("organization_id", auth.organizationId)
      .eq("year_group", yearGroup);

    if (error) return apiError(error.message, 500);
  }

  if (action === "delete") {
    const { error } = await supabase
      .from("pupils")
      .delete()
      .eq("organization_id", auth.organizationId)
      .eq("year_group", yearGroup);

    if (error) return apiError(error.message, 500);
  }

  await supabase
    .from("pupil_data_retention_actions")
    .insert({
      organization_id: auth.organizationId,
      action_type: action,
      scope_type: "year_group",
      scope_value: yearGroup,
      affected_rows: affectedRows,
      reason,
      impact_summary: {
        warning:
          action === "delete"
            ? "Identifiable pupil rows were deleted from Schoolgle and cannot be restored unless re-imported."
            : "Pupil rows were removed from live operational screens and retained as archived records.",
      },
      created_by: auth.userId,
      created_at: now,
    });

  return apiSuccess({ action, yearGroup, affectedRows });
}, { requiredRole: "slt" });

function buildCohorts(pupils: PupilRetentionRow[]) {
  const cohorts = new Map<string, {
    yearGroup: string;
    total: number;
    current: number;
    archiveCandidates: number;
    archived: number;
    inactive: number;
  }>();

  pupils.forEach((pupil) => {
    const yearGroup = pupil.year_group || "No year group";
    const cohort = cohorts.get(yearGroup) ?? {
      yearGroup,
      total: 0,
      current: 0,
      archiveCandidates: 0,
      archived: 0,
      inactive: 0,
    };
    cohort.total += 1;
    if (pupil.pupil_record_status === "archived") cohort.archived += 1;
    else if (pupil.archive_candidate || pupil.not_in_latest_import) cohort.archiveCandidates += 1;
    else if (pupil.is_active === false) cohort.inactive += 1;
    else cohort.current += 1;
    cohorts.set(yearGroup, cohort);
  });

  return [...cohorts.values()].sort((a, b) => a.yearGroup.localeCompare(b.yearGroup, undefined, { numeric: true }));
}

function isMissingRetentionTables(message: string) {
  return (
    message.includes("Could not find the table 'public.pupil_import_datasets'") ||
    message.includes("relation \"pupil_import_datasets\" does not exist") ||
    (message.includes("pupil_import_datasets") && message.includes("schema cache"))
  );
}
