import { protectedRoute, apiError, apiSuccess } from "@/lib/api-utils";
import { matchSendRowsToPupils } from "@/lib/send-pupil-matching";
import { parseSendStatusAssignmentsCsv, type SendImportIntent } from "@/lib/send-status-import";
import { createServiceRoleClient } from "@/lib/supabase-server";

type PupilMatchSourceRow = {
  pupil_id: string;
  pupil_ref: string | null;
  first_name: string | null;
  last_name: string | null;
  date_of_birth: string | null;
  year_group: string | null;
  current_class: string | null;
  class_name?: string | null;
};

export const POST = protectedRoute(async (auth, request) => {
  const body = await request.json();
  const intent = normaliseIntent(body.intent);
  const parsed = parseSendStatusAssignmentsCsv(String(body.csvText || body.csv || ""), { intent });

  if (parsed.errors.length > 0) {
    return apiError("SEND import has validation errors", 400, "INVALID_SEND_CSV", {
      errors: parsed.errors,
    });
  }

  if (parsed.rows.length === 0) {
    return apiError("No SEND rows found for the selected import intent", 400, "NO_SEND_ROWS", {
      excludedRows: parsed.excludedRows,
    });
  }

  const supabase = createServiceRoleClient();
  const now = new Date().toISOString();
  const { data: dataset, error: datasetError } = await supabase
    .from("send_status_import_datasets")
    .insert({
      organization_id: auth.organizationId,
      import_intent: intent,
      source_label: body.sourceLabel || "Arbor SEN Status Assignments",
      source_filename: body.filename || null,
      academic_year: body.academicYear || inferAcademicYear(),
      is_current_live: false,
      total_source_rows: parsed.rows.length + parsed.excludedRows.length,
      imported_pupils: parsed.rows.length,
      excluded_rows: parsed.excludedRows.length,
      errors: [],
      metadata: {
        excludedRows: parsed.excludedRows,
      },
      created_by: auth.userId,
      created_at: now,
    })
    .select("id")
    .single();

  if (datasetError) {
    if (isMissingSendImportTable(datasetError.message)) {
      return apiError(
        "SEND import storage is not set up yet. Apply the 20260608 SEND status import migration before importing SEND files.",
        500,
        "SEND_IMPORT_STORAGE_NOT_READY",
      );
    }
    return apiError(datasetError.message, 500);
  }

  const datasetId = dataset.id as string;
  const { data: pupilRows, error: pupilLoadError } = await supabase
    .from("pupils")
    .select("pupil_id,pupil_ref,first_name,last_name,date_of_birth,year_group,current_class,class_name")
    .eq("organization_id", auth.organizationId);

  if (pupilLoadError && !pupilLoadError.message.includes("Could not find the table")) {
    return apiError(pupilLoadError.message, 500);
  }

  const matchedSend = matchSendRowsToPupils({
    sendRows: parsed.rows,
    pupils: ((pupilRows ?? []) as PupilMatchSourceRow[]).map((pupil) => ({
      pupil_id: pupil.pupil_id,
      source_pupil_ref: pupil.pupil_ref,
      first_name: pupil.first_name,
      last_name: pupil.last_name,
      date_of_birth: pupil.date_of_birth,
      year_group: pupil.year_group,
      current_class: pupil.current_class,
      class_name: pupil.class_name,
    })),
  });

  if (intent === "historic_snapshot") {
    const rows = matchedSend.rows.map((row) => ({
      organization_id: auth.organizationId,
      dataset_id: datasetId,
      pupil_id: row.pupil_id,
      display_label: row.display_name || null,
      year_group: row.year_group,
      class_name: row.class_name,
      sen_status: row.sen_status,
      primary_need: row.primary_need,
      secondary_need: row.secondary_need,
      additional_needs: row.additional_needs,
      date_identified: row.date_identified,
      funded_hours: row.funded_hours,
      raw_send_needs: row.raw_needs,
      match_method: row.match_method,
      created_at: now,
    }));

    const { error } = await supabase
      .from("send_historic_cohort_snapshots")
      .upsert(rows, { onConflict: "organization_id,dataset_id,pupil_id" });

    if (error) return apiError(error.message, 500);

    return apiSuccess({
      datasetId,
      intent,
      imported: rows.length,
      unmatchedRows: matchedSend.unmatched,
      excludedRows: parsed.excludedRows,
    });
  }

  const registerRows = matchedSend.rows.map((row) => ({
    organization_id: auth.organizationId,
    pupil_id: row.pupil_id,
    year_group: row.year_group,
    class_name: row.class_name,
    sen_status: row.sen_status,
    primary_need: row.primary_need,
    secondary_need: row.secondary_need,
    date_identified: row.date_identified,
    date_placed_on_register: row.date_identified,
    has_ehcp: row.sen_status === "E",
    ehcp_start_date: row.sen_status === "E" ? row.date_identified : null,
    ehcp_funded_hours: row.funded_hours,
    funded_hours: row.funded_hours,
    source_pupil_ref: row.source_pupil_ref,
    raw_send_needs: row.raw_needs,
    send_import_dataset_id: datasetId,
    imported_at: now,
    updated_at: now,
  }));

  const { error } = await supabase
    .from("send_register")
    .upsert(registerRows, { onConflict: "organization_id,pupil_id" });

  if (error) return apiError(error.message, 500);

  await supabase
    .from("send_status_import_datasets")
    .update({ is_current_live: false })
    .eq("organization_id", auth.organizationId)
    .eq("import_intent", "live_register")
    .neq("id", datasetId);

  const { error: currentError } = await supabase
    .from("send_status_import_datasets")
    .update({ is_current_live: true })
    .eq("id", datasetId);

  if (currentError) return apiError(currentError.message, 500);

  return apiSuccess({
    datasetId,
    intent,
    imported: registerRows.length,
    unmatchedRows: matchedSend.unmatched,
    excludedRows: parsed.excludedRows,
    stats: {
      senSupport: parsed.rows.filter((row) => row.sen_status === "K").length,
      ehcp: parsed.rows.filter((row) => row.sen_status === "E").length,
      monitoring: parsed.rows.filter((row) => row.sen_status === "monitoring").length,
    },
  });
}, { requiredRole: "slt" });

function normaliseIntent(value: unknown): SendImportIntent {
  return value === "historic_snapshot" ? "historic_snapshot" : "live_register";
}

function inferAcademicYear() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const startYear = currentMonth >= 9 ? currentYear : currentYear - 1;
  return `${startYear}/${String(startYear + 1).slice(-2)}`;
}

function isMissingSendImportTable(message: string) {
  return (
    message.includes("Could not find the table 'public.send_status_import_datasets'") ||
    message.includes("relation \"send_status_import_datasets\" does not exist") ||
    (message.includes("send_status_import_datasets") && message.includes("schema cache"))
  );
}
