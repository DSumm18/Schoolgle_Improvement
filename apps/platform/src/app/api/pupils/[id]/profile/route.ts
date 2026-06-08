import { protectedRoute, apiError, apiSuccess } from "@/lib/api-utils";
import {
  buildPupilDataInventory,
  buildPupilProfileCards,
  formatPupilDisplayName,
  type PupilProfileCore,
} from "@/lib/pupil-profile-spine";
import { createServiceRoleClient } from "@/lib/supabase-server";

type SendRegisterRow = {
  id: string;
  pupil_id: string | null;
  source_pupil_ref?: string | null;
  sen_status: string | null;
  primary_need: string | null;
  secondary_need?: string | null;
  has_ehcp?: boolean | null;
  ehcp_start_date?: string | null;
  ehcp_annual_review_due?: string | null;
  date_identified?: string | null;
  class_name?: string | null;
  updated_at?: string | null;
};

export const GET = protectedRoute(async (auth, request) => {
  const pupilRecordId = request.nextUrl.pathname.split("/").at(-2);
  if (!pupilRecordId) return apiError("Pupil record ID is required", 400, "MISSING_PUPIL_ID");

  const supabase = createServiceRoleClient();
  const { data: pupil, error: pupilError } = await supabase
    .from("pupils")
    .select(
      "id,pupil_id,pupil_ref,first_name,last_name,date_of_birth,year_group,current_class,class_name,gender,send_status,sen_status,ehcp,primary_need,fsm_eligible,is_pupil_premium,is_eal,is_active,updated_at,import_source,imported_at,pupil_record_status,archive_candidate",
    )
    .eq("id", pupilRecordId)
    .eq("organization_id", auth.organizationId)
    .single();

  if (pupilError || !pupil) return apiError("Pupil not found", 404, "PUPIL_NOT_FOUND");

  const corePupil: PupilProfileCore = {
    id: pupil.id,
    pupil_id: pupil.pupil_id,
    source_pupil_ref: pupil.pupil_ref,
    first_name: pupil.first_name,
    last_name: pupil.last_name,
    date_of_birth: pupil.date_of_birth,
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
    updated_at: pupil.updated_at,
  };

  const sendRegister = await findSendRegister(supabase, auth.organizationId, pupil.pupil_id, pupil.pupil_ref);
  const [activeProvisions, openSendActions] = await Promise.all([
    countRowsSafely(
      supabase
        .from("send_provision_map")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", auth.organizationId)
        .or(
          sendRegister
            ? `send_register_id.eq.${sendRegister.id},pupil_id.eq.${pupil.pupil_id}`
            : `pupil_id.eq.${pupil.pupil_id}`,
        ),
    ),
    countRowsSafely(
      sendRegister
        ? supabase
            .from("send_pupil_actions")
            .select("id", { count: "exact", head: true })
            .eq("organization_id", auth.organizationId)
            .eq("send_register_id", sendRegister.id)
            .neq("status", "completed")
        : null,
    ),
  ]);

  const cards = buildPupilProfileCards({
    pupil: corePupil,
    modules: {
      send: sendRegister
        ? {
            register: sendRegister,
            activeProvisions,
            openActions: openSendActions,
          }
        : undefined,
      assessmentWork: { evidenceItems: 0 },
    },
  });

  return apiSuccess({
    pupil: {
      ...corePupil,
      display_name: formatPupilDisplayName(corePupil),
      source: {
        import_source: pupil.import_source,
        imported_at: pupil.imported_at,
        pupil_record_status: pupil.pupil_record_status,
        archive_candidate: pupil.archive_candidate,
      },
    },
    cards,
    modules: {
      send: {
        register: sendRegister,
        active_provisions: activeProvisions,
        open_actions: openSendActions,
      },
      assessment_work: {
        evidence_items: 0,
        status: "ready_for_module_links",
      },
    },
    data_inventory: buildPupilDataInventory(),
  });
}, { requiredRole: "slt", rateLimit: false });

async function findSendRegister(
  supabase: ReturnType<typeof createServiceRoleClient>,
  organizationId: string,
  pupilId: string,
  sourcePupilRef: string | null,
) {
  const filters = [`pupil_id.eq.${pupilId}`];
  if (sourcePupilRef) filters.push(`source_pupil_ref.eq.${sourcePupilRef}`);

  const { data, error } = await supabase
    .from("send_register")
    .select(
      "id,pupil_id,source_pupil_ref,sen_status,primary_need,secondary_need,has_ehcp,ehcp_start_date,ehcp_annual_review_due,date_identified,class_name,updated_at",
    )
    .eq("organization_id", organizationId)
    .or(filters.join(","))
    .maybeSingle();

  if (error) return null;
  return data as SendRegisterRow | null;
}

async function countRowsSafely(query: PromiseLike<{ count: number | null; error: { message?: string } | null }> | null) {
  if (!query) return 0;
  const result = await query;
  if (result.error) return 0;
  return result.count ?? 0;
}
