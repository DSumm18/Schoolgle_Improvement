import { NextResponse } from "next/server";
import { protectedRoute, apiError, apiSuccess } from "@/lib/api-utils";
import {
  buildPassIdentity,
  createPupilAccessToken,
  decryptPupilAccessToken,
  encryptPupilAccessToken,
  hashPupilAccessToken,
  parsePupilUploadCsv,
  pupilUploadTemplate,
} from "@/lib/pupil-pass";
import { buildPupilImportReconciliation, type ReconciliationPupil } from "@/lib/pupil-import-reconciliation";
import { createServiceRoleClient } from "@/lib/supabase-server";

type StoredPupilRow = {
  id: string;
  pupil_id: string;
  pupil_ref: string | null;
  first_name: string | null;
  last_name: string | null;
  date_of_birth: string | null;
  year_group: string | null;
  current_class: string | null;
  class_name: string | null;
  gender: string | null;
  send_status: string | null;
  sen_status: string | null;
  ehcp: boolean | null;
  primary_need: string | null;
  fsm_eligible: boolean | null;
  is_pupil_premium: boolean | null;
  is_eal: boolean | null;
  is_active: boolean | null;
  pass_colour: string | null;
  pass_animal: string | null;
  pass_badge: string | null;
  pass_codename: string | null;
  pupil_access_token_encrypted: string | null;
  pass_revoked_at: string | null;
  updated_at: string | null;
};

type ExistingPupilPassRow = Pick<
  StoredPupilRow,
  | "pupil_id"
  | "pupil_ref"
  | "first_name"
  | "last_name"
  | "year_group"
  | "current_class"
  | "class_name"
  | "is_active"
  | "pass_colour"
  | "pass_animal"
  | "pass_badge"
  | "pass_codename"
  | "pupil_access_token_encrypted"
> & {
  pupil_access_token_hash: string | null;
};

export const GET = protectedRoute(async (auth, request) => {
  const template = request.nextUrl.searchParams.get("template") === "true";
  if (template) {
    return new NextResponse(pupilUploadTemplate(), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="schoolgle-pupil-upload-template.csv"',
      },
    });
  }

  const includePassUrls = request.nextUrl.searchParams.get("includePassUrls") === "true";
  const className = request.nextUrl.searchParams.get("class");
  const yearGroup = request.nextUrl.searchParams.get("yearGroup");
  const supabase = createServiceRoleClient();

  let query = supabase
    .from("pupils")
    .select(
      "id,pupil_id,pupil_ref,first_name,last_name,date_of_birth,year_group,current_class,class_name,gender,send_status,sen_status,ehcp,primary_need,fsm_eligible,is_pupil_premium,is_eal,is_active,pass_colour,pass_animal,pass_badge,pass_codename,pupil_access_token_encrypted,pass_revoked_at,updated_at",
    )
    .eq("organization_id", auth.organizationId)
    .order("year_group")
    .order("current_class")
    .order("last_name");

  if (className) query = query.or(`current_class.eq.${className},class_name.eq.${className}`);
  if (yearGroup) query = query.eq("year_group", yearGroup);

  const { data, error } = await query;
  if (error) {
    if (isMissingPupilTable(error.message)) {
      return apiSuccess({
        pupils: [],
        setupRequired: true,
        message:
          "Pupil data storage is not set up yet. Apply the latest Class Builder/Data Upload database migration before importing pupils.",
      });
    }
    return apiError(error.message, 500);
  }

  const origin = request.nextUrl.origin;
  return apiSuccess({
    pupils: ((data ?? []) as StoredPupilRow[]).map((pupil) => {
      const token = includePassUrls && pupil.pupil_access_token_encrypted && !pupil.pass_revoked_at
        ? decryptPupilAccessToken(pupil.pupil_access_token_encrypted)
        : null;
      return {
        id: pupil.id,
        pupil_id: pupil.pupil_id,
        source_pupil_ref: pupil.pupil_ref,
        first_name: pupil.first_name,
        last_name: pupil.last_name,
        year_group: pupil.year_group,
        current_class: pupil.current_class ?? pupil.class_name,
        gender: pupil.gender,
        date_of_birth: pupil.date_of_birth,
        send_status: pupil.send_status ?? pupil.sen_status,
        ehcp: pupil.ehcp ?? pupil.sen_status === "E",
        primary_need: pupil.primary_need,
        fsm_eligible: pupil.fsm_eligible,
        pupil_premium: pupil.is_pupil_premium,
        eal: pupil.is_eal,
        is_active: pupil.is_active,
        pass_colour: pupil.pass_colour,
        pass_animal: pupil.pass_animal,
        pass_badge: pupil.pass_badge,
        pass_codename: pupil.pass_codename,
        pass_url: token ? `${origin}/pupil/start?t=${encodeURIComponent(token)}` : null,
        updated_at: pupil.updated_at,
      };
    }),
  });
}, { requiredRole: "slt", rateLimit: false });

export const POST = protectedRoute(async (auth, request) => {
  const body = await request.json();
  const now = new Date().toISOString();
  const parsed = parsePupilUploadCsv(String(body.csvText || body.csv || ""));
  if (parsed.errors.length > 0) {
    return apiError("Pupil upload has validation errors", 400, "INVALID_CSV", {
      errors: parsed.errors,
    });
  }

  if (parsed.pupils.length === 0) return apiError("No pupil rows found", 400);

  const supabase = createServiceRoleClient();
  const usedCodenames = new Set<string>();
  const { data: existingRows, error: existingError } = await supabase
    .from("pupils")
    .select("pupil_id,pupil_ref,first_name,last_name,year_group,current_class,class_name,is_active,pupil_access_token_hash,pupil_access_token_encrypted,pass_colour,pass_animal,pass_badge,pass_codename")
    .eq("organization_id", auth.organizationId)
    .or(`is_active.is.true,pupil_record_status.eq.current`);

  if (existingError && !existingError.message.includes("Could not find the table")) {
    return apiError(existingError.message, 500);
  }

  const typedExistingRows = (existingRows ?? []) as ExistingPupilPassRow[];
  const reconciliation = buildPupilImportReconciliation({
    existingPupils: typedExistingRows.map(toReconciliationPupil),
    importedPupils: parsed.pupils.map((pupil) => ({
      pupil_id: pupil.pupil_id,
      source_pupil_ref: pupil.source_pupil_ref,
      first_name: pupil.first_name,
      last_name: pupil.last_name,
      year_group: pupil.year_group,
      current_class: pupil.current_class,
      is_active: pupil.is_active,
    })),
  });

  const { data: dataset, error: datasetError } = await supabase
    .from("pupil_import_datasets")
    .insert({
      organization_id: auth.organizationId,
      import_type: "pupil_roll",
      source_label: body.sourceLabel || "Settings data upload",
      source_filename: body.filename || null,
      academic_year: body.academicYear || inferAcademicYear(),
      is_current: false,
      status: "processing",
      total_rows: parsed.pupils.length,
      imported_rows: 0,
      matched_rows: reconciliation.matched.length,
      changed_rows: reconciliation.changed.length,
      new_rows: reconciliation.newPupils.length,
      archive_candidate_rows: reconciliation.archiveCandidates.length,
      warnings: reconciliation.archiveCandidates.length > 0
        ? [`${reconciliation.archiveCandidates.length} existing pupils were not in the latest import and need archive review.`]
        : [],
      metadata: {
        review: {
          matched: reconciliation.matched.length,
          changed: reconciliation.changed.length,
          newPupils: reconciliation.newPupils.length,
          archiveCandidates: reconciliation.archiveCandidates.length,
        },
      },
      created_by: auth.userId,
      created_at: now,
    })
    .select("id")
    .single();

  if (datasetError) {
    if (isMissingImportDatasetTable(datasetError.message)) {
      return apiError(
        "Pupil import dataset storage is not set up yet. Apply the 20260608 pupil import dataset retention migration before importing pupils.",
        500,
        "PUPIL_IMPORT_DATASET_STORAGE_NOT_READY",
      );
    }
    return apiError(datasetError.message, 500);
  }

  const datasetId = dataset.id as string;
  const existingByPupilId = new Map(typedExistingRows.map((row) => [row.pupil_id, row]));
  for (const existing of typedExistingRows) {
    if (existing.pass_codename) usedCodenames.add(existing.pass_codename);
  }

  const rows = parsed.pupils.map((pupil) => {
    const existing = existingByPupilId.get(pupil.pupil_id);
    const accessToken =
      existing?.pupil_access_token_hash && existing?.pupil_access_token_encrypted
        ? null
        : createPupilAccessToken();
    const hasPreferenceUpdate = Boolean(pupil.pass_colour || pupil.pass_animal || pupil.pass_badge);
    const identity =
      existing?.pass_codename && !hasPreferenceUpdate
        ? {
            colour: existing.pass_colour,
            animal: existing.pass_animal,
            badge: existing.pass_badge,
            codename: existing.pass_codename,
          }
        : buildPassIdentity(pupil, usedCodenames);
    return {
      organization_id: auth.organizationId,
      pupil_id: pupil.pupil_id,
      pupil_ref: pupil.source_pupil_ref,
      first_name: pupil.first_name,
      last_name: pupil.last_name,
      year_group: pupil.year_group,
      class_name: pupil.current_class,
      current_class: pupil.current_class,
      gender: pupil.gender,
      date_of_birth: pupil.date_of_birth,
      send_status: pupil.send_status,
      sen_status: pupil.send_status,
      ehcp: pupil.ehcp,
      primary_need: pupil.primary_need,
      fsm_eligible: pupil.fsm_eligible,
      is_pupil_premium: pupil.pupil_premium,
      is_eal: pupil.eal,
      is_active: pupil.is_active,
      current_import_dataset_id: datasetId,
      first_seen_import_dataset_id: existing?.pupil_id ? undefined : datasetId,
      last_seen_import_dataset_id: datasetId,
      pupil_record_status: "current",
      not_in_latest_import: false,
      archive_candidate: false,
      archive_candidate_at: null,
      pass_colour: identity.colour,
      pass_animal: identity.animal,
      pass_badge: identity.badge,
      pass_codename: identity.codename,
      pupil_access_token_hash: accessToken
        ? hashPupilAccessToken(accessToken)
        : existing?.pupil_access_token_hash,
      pupil_access_token_encrypted: accessToken
        ? encryptPupilAccessToken(accessToken)
        : existing?.pupil_access_token_encrypted,
      pass_revoked_at: null,
      import_source: "settings_data_upload",
      imported_at: now,
      updated_at: now,
    };
  });

  const { data, error } = await supabase
    .from("pupils")
    .upsert(rows, { onConflict: "organization_id,pupil_id" })
    .select("id,year_group,current_class,pass_codename");

  if (error) {
    if (isMissingPupilTable(error.message)) {
      return apiError(
        "Pupil data storage is not set up yet. Apply the latest Class Builder/Data Upload database migration before importing pupils.",
        500,
        "PUPIL_STORAGE_NOT_READY",
      );
    }
    return apiError(error.message, 500);
  }

  if (reconciliation.archiveCandidates.length > 0) {
    const archiveCandidateIds = reconciliation.archiveCandidates.map((pupil) => pupil.pupil_id);
    const { error: archiveFlagError } = await supabase
      .from("pupils")
      .update({
        not_in_latest_import: true,
        archive_candidate: true,
        archive_candidate_at: now,
        pupil_record_status: "archive_candidate",
        updated_at: now,
      })
      .eq("organization_id", auth.organizationId)
      .in("pupil_id", archiveCandidateIds);

    if (archiveFlagError) return apiError(archiveFlagError.message, 500);
  }

  await supabase
    .from("pupil_import_datasets")
    .update({ is_current: false })
    .eq("organization_id", auth.organizationId)
    .eq("import_type", "pupil_roll")
    .neq("id", datasetId);

  const { error: datasetCompleteError } = await supabase
    .from("pupil_import_datasets")
    .update({
      is_current: true,
      status: "completed",
      imported_rows: data?.length ?? rows.length,
      reviewed_at: now,
      reviewed_by: auth.userId,
    })
    .eq("id", datasetId);

  if (datasetCompleteError) return apiError(datasetCompleteError.message, 500);

  return apiSuccess({
    imported: data?.length ?? rows.length,
    datasetId,
    yearGroups: [...new Set(rows.map((row) => row.year_group))],
    classes: [...new Set(rows.map((row) => row.current_class).filter(Boolean))],
    reconciliation: {
      matched: reconciliation.matched.length,
      changed: reconciliation.changed.length,
      newPupils: reconciliation.newPupils.length,
      archiveCandidates: reconciliation.archiveCandidates.length,
      archiveCandidatePupils: reconciliation.archiveCandidates.map((pupil) => ({
        pupil_id: pupil.pupil_id,
        source_pupil_ref: pupil.source_pupil_ref,
        first_name: pupil.first_name,
        last_name: pupil.last_name,
        year_group: pupil.year_group,
        current_class: pupil.current_class ?? pupil.class_name,
        reason: pupil.reason,
      })),
    },
  });
}, { requiredRole: "slt" });

export const PATCH = protectedRoute(async (auth, request) => {
  const body = await request.json().catch(() => ({}));
  const pupilRecordId = String(body.id || body.pupilRecordId || "");
  const classId = String(body.classId || "");
  const classNameInput = String(body.className || body.current_class || "").trim();

  if (!pupilRecordId) return apiError("Pupil record ID is required", 400, "MISSING_PUPIL_ID");
  if (!classId && !classNameInput) return apiError("Class is required", 400, "MISSING_CLASS");

  const supabase = createServiceRoleClient();
  let className = classNameInput;
  let classRecord: { id: string; class_name: string; year_group: string | null } | null = null;

  if (classId) {
    const { data, error } = await supabase
      .from("ls_classes")
      .select("id,class_name,year_group")
      .eq("id", classId)
      .eq("organization_id", auth.organizationId)
      .single();

    if (error || !data) return apiError(error?.message || "Class not found", 404, "CLASS_NOT_FOUND");
    classRecord = data as { id: string; class_name: string; year_group: string | null };
    className = classRecord.class_name;
  } else {
    const { data, error } = await supabase
      .from("ls_classes")
      .select("id,class_name,year_group")
      .eq("organization_id", auth.organizationId)
      .ilike("class_name", className)
      .limit(2);

    if (error) return apiError(error.message, 500);
    if ((data ?? []).length === 0) return apiError("Class not found", 404, "CLASS_NOT_FOUND");
    if ((data ?? []).length > 1) return apiError("More than one class matched this name. Choose the exact class.", 400, "AMBIGUOUS_CLASS");
    classRecord = data![0] as { id: string; class_name: string; year_group: string | null };
    className = classRecord.class_name;
  }

  const { data: pupil, error: pupilError } = await supabase
    .from("pupils")
    .update({
      current_class: className,
      class_name: className,
      updated_at: new Date().toISOString(),
    })
    .eq("id", pupilRecordId)
    .eq("organization_id", auth.organizationId)
    .select("id,pupil_id,pupil_ref,first_name,last_name,year_group,current_class,class_name,gender,send_status,sen_status,ehcp,primary_need,fsm_eligible,is_pupil_premium,is_eal,is_active,pass_colour,pass_animal,pass_badge,pass_codename,updated_at")
    .single();

  if (pupilError || !pupil) return apiError(pupilError?.message || "Pupil not found", 404, "PUPIL_NOT_FOUND");

  return apiSuccess({
    pupil: {
      id: pupil.id,
      pupil_id: pupil.pupil_id,
      source_pupil_ref: pupil.pupil_ref,
      first_name: pupil.first_name,
      last_name: pupil.last_name,
      year_group: pupil.year_group,
      current_class: pupil.current_class ?? pupil.class_name,
      gender: pupil.gender,
      send_status: pupil.send_status ?? pupil.sen_status,
      ehcp: pupil.ehcp ?? pupil.sen_status === "E",
      primary_need: pupil.primary_need,
      fsm_eligible: pupil.fsm_eligible,
      pupil_premium: pupil.is_pupil_premium,
      eal: pupil.is_eal,
      is_active: pupil.is_active,
      pass_colour: pupil.pass_colour,
      pass_animal: pupil.pass_animal,
      pass_badge: pupil.pass_badge,
      pass_codename: pupil.pass_codename,
      pass_url: null,
      updated_at: pupil.updated_at,
      class_id: classRecord?.id ?? null,
    },
  });
}, { requiredRole: "slt", rateLimit: false });

function isMissingPupilTable(message: string) {
  return (
    message.includes("Could not find the table 'public.pupils'") ||
    message.includes("relation \"pupils\" does not exist") ||
    message.includes("schema cache")
  );
}

function isMissingImportDatasetTable(message: string) {
  return (
    message.includes("Could not find the table 'public.pupil_import_datasets'") ||
    message.includes("relation \"pupil_import_datasets\" does not exist") ||
    message.includes("pupil_import_datasets") && message.includes("schema cache")
  );
}

function toReconciliationPupil(row: ExistingPupilPassRow): ReconciliationPupil {
  return {
    pupil_id: row.pupil_id,
    source_pupil_ref: row.pupil_ref,
    first_name: row.first_name,
    last_name: row.last_name,
    year_group: row.year_group,
    current_class: row.current_class ?? row.class_name,
    class_name: row.class_name,
    is_active: row.is_active,
  };
}

function inferAcademicYear() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const startYear = currentMonth >= 9 ? currentYear : currentYear - 1;
  return `${startYear}/${String(startYear + 1).slice(-2)}`;
}
