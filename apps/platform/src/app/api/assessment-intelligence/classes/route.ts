import { NextRequest } from "next/server";
import { apiError, apiSuccess, protectedRoute } from "@/lib/api-utils";
import { buildAssessmentClassSources } from "@/lib/assessment-intelligence/class-pupil-source";
import { createServiceRoleClient } from "@/lib/supabase-server";

export const GET = protectedRoute(async (auth, _req: NextRequest) => {
  const orgId = auth.organizationId;
  if (!orgId) return apiError("No organization", 400);

  const supabase = createServiceRoleClient();
  const [orgRes, classesRes, lessonPupilsRes, masterPupilsRes] = await Promise.all([
    supabase
      .from("organizations")
      .select("id,name,urn")
      .eq("id", orgId)
      .maybeSingle(),
    supabase
      .from("ls_classes")
      .select("id,class_name,year_group,academic_year,pupil_count")
      .eq("organization_id", orgId)
      .order("year_group")
      .order("class_name"),
    supabase
      .from("ls_pupils")
      .select(
        "id,class_id,pupil_ref,display_name_encrypted,year_group,has_send_support,has_ehcp,is_pupil_premium,is_eal,send_primary_need,attainment_reading,attainment_writing,attainment_maths,attainment_science",
      )
      .eq("organization_id", orgId),
    supabase
      .from("pupils")
      .select(
        "id,pupil_id,pupil_ref,first_name,last_name,year_group,current_class,class_name,is_pupil_premium,is_eal,fsm_eligible,send_status,sen_status,ehcp,primary_need,is_active",
      )
      .eq("organization_id", orgId),
  ]);

  if (classesRes.error) return apiError(classesRes.error.message, 500);
  if (lessonPupilsRes.error && !isMissingTable(lessonPupilsRes.error.message)) {
    return apiError(lessonPupilsRes.error.message, 500);
  }
  if (masterPupilsRes.error && !isMissingTable(masterPupilsRes.error.message)) {
    return apiError(masterPupilsRes.error.message, 500);
  }

  const org = orgRes.data as { name?: string | null; urn?: string | number | null } | null;
  const schoolUrn = org?.urn ? Number(org.urn) : null;
  const classes = buildAssessmentClassSources({
    organizationId: orgId,
    schoolUrn: Number.isFinite(schoolUrn) ? schoolUrn : null,
    schoolName: org?.name || null,
    classes: classesRes.data || [],
    lessonStudioPupils: lessonPupilsRes.error ? [] : lessonPupilsRes.data || [],
    masterPupils: masterPupilsRes.error ? [] : masterPupilsRes.data || [],
  });

  return apiSuccess({
    organizationId: orgId,
    schoolUrn: Number.isFinite(schoolUrn) ? schoolUrn : null,
    schoolName: org?.name || null,
    classes,
    sourceSummary: {
      classSource: "ls_classes",
      lessonStudioPupilSource: lessonPupilsRes.error ? "missing" : "ls_pupils",
      settingsImportPupilSource: masterPupilsRes.error ? "missing" : "pupils",
    },
  });
}, { requiredRole: "teacher", rateLimit: false });

function isMissingTable(message: string) {
  return message.includes("does not exist") || message.includes("Could not find the table") || message.includes("schema cache");
}
