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
import { createServiceRoleClient } from "@/lib/supabase-server";

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
      "id,pupil_id,pupil_ref,first_name,last_name,year_group,current_class,class_name,gender,send_status,sen_status,ehcp,primary_need,fsm_eligible,is_pupil_premium,is_eal,is_active,pass_colour,pass_animal,pass_badge,pass_codename,pupil_access_token_encrypted,pass_revoked_at,updated_at",
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
    pupils: (data ?? []).map((pupil: any) => {
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
  const parsed = parsePupilUploadCsv(String(body.csvText || body.csv || ""));
  if (parsed.errors.length > 0) {
    return apiError("Pupil upload has validation errors", 400, "INVALID_CSV", {
      errors: parsed.errors,
    });
  }

  if (parsed.pupils.length === 0) return apiError("No pupil rows found", 400);

  const supabase = createServiceRoleClient();
  const usedCodenames = new Set<string>();
  const pupilIds = parsed.pupils.map((pupil) => pupil.pupil_id);
  const { data: existingRows, error: existingError } = await supabase
    .from("pupils")
    .select("pupil_id,pupil_access_token_hash,pupil_access_token_encrypted,pass_colour,pass_animal,pass_badge,pass_codename")
    .eq("organization_id", auth.organizationId)
    .in("pupil_id", pupilIds);

  if (existingError && !existingError.message.includes("Could not find the table")) {
    return apiError(existingError.message, 500);
  }

  const existingByPupilId = new Map((existingRows ?? []).map((row: any) => [row.pupil_id, row]));
  for (const existing of existingRows ?? []) {
    if ((existing as any).pass_codename) usedCodenames.add((existing as any).pass_codename);
  }

  const rows = parsed.pupils.map((pupil) => {
    const existing = existingByPupilId.get(pupil.pupil_id) as any;
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
      send_status: pupil.send_status,
      sen_status: pupil.send_status,
      ehcp: pupil.ehcp,
      primary_need: pupil.primary_need,
      fsm_eligible: pupil.fsm_eligible,
      is_pupil_premium: pupil.pupil_premium,
      is_eal: pupil.eal,
      is_active: pupil.is_active,
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
      imported_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
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

  return apiSuccess({
    imported: data?.length ?? rows.length,
    yearGroups: [...new Set(rows.map((row) => row.year_group))],
    classes: [...new Set(rows.map((row) => row.current_class).filter(Boolean))],
  });
}, { requiredRole: "slt" });

function isMissingPupilTable(message: string) {
  return (
    message.includes("Could not find the table 'public.pupils'") ||
    message.includes("relation \"pupils\" does not exist") ||
    message.includes("schema cache")
  );
}
