import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { NextRequest } from "next/server";
import { getMISDataService } from "@/lib/mis/data-service";
import type {
  MISPupil,
  MISSENRecord,
  MISTermlyAssessment,
} from "@/lib/mis/types";

/**
 * Map accessibility_needs string (comma-separated) to the JSONB array format
 * used by lesson studio types.
 */
function parseAccessibilityNeeds(raw?: string): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Resolve the latest attainment level from tracker data for a pupil/subject.
 * Scans assessment periods in reverse chronological order.
 */
function latestAttainment(
  assessments: MISTermlyAssessment[],
  studentId: string,
  subject: string,
): string | null {
  const matching = assessments.filter(
    (a) => a.student_id === studentId && a.subject === subject,
  );
  if (matching.length === 0) return null;

  // Sort by academic year desc, then period desc
  matching.sort((a, b) => {
    if (b.academic_year_start !== a.academic_year_start)
      return b.academic_year_start - a.academic_year_start;
    const periodOrder = ["Sum2", "Sum1", "Spr2", "Spr1", "Aut2", "Aut1"];
    return (
      periodOrder.indexOf(b.assessment_period) -
      periodOrder.indexOf(a.assessment_period)
    );
  });

  // Return the first non-empty assessment
  for (const a of matching) {
    if (a.teacher_assessment) {
      // Normalise WTS+/WTS-/EXS+ etc to base level for differentiation grouping
      const base = a.teacher_assessment.replace(/[+-]$/, "");
      if (["PKF", "PKE", "WTS", "EXS", "GDS"].includes(base)) return base;
    }
  }
  return null;
}

export const GET = protectedRoute(async (auth, req: NextRequest) => {
  const supabase = createServiceRoleClient();
  const classId = req.nextUrl.searchParams.get("classId");
  if (!classId) return apiError("classId required", 400);

  const orgId = auth.organizationId;
  if (!orgId) return apiError("No organization", 400);

  // If classId starts with "mis-", it came from MIS fallback — read pupils from MIS
  if (classId.startsWith("mis-")) {
    const registrationGroup = classId.replace("mis-", "");
    try {
      const mis = getMISDataService();

      // Load pupils, SEN register, and tracker in parallel
      const [pupilResult, senResult, trackerResult] = await Promise.all([
        mis.read<MISPupil>(orgId, "pupils"),
        mis.read<MISSENRecord>(orgId, "sen_register").catch(() => ({
          data: [] as MISSENRecord[],
        })),
        mis
          .read<MISTermlyAssessment>(orgId, "termly_assessments")
          .catch(() => ({ data: [] as MISTermlyAssessment[] })),
      ]);

      // Index SEN register by student_id for fast lookup
      const senByStudentId = new Map<string, MISSENRecord>();
      for (const s of senResult.data) {
        senByStudentId.set(s.student_id, s);
      }

      const classPupils = pupilResult.data
        .filter(
          (p) =>
            p.registration_group === registrationGroup &&
            p.enrolment_status === "Current",
        )
        .map((p) => {
          const senRecord = senByStudentId.get(p.student_id);

          return {
            id: `mis-pupil-${p.student_id}`,
            organization_id: orgId,
            class_id: classId,
            pupil_ref: p.student_id,
            display_name_encrypted: `${p.first_name} ${p.last_name}`,
            year_group:
              p.year_group === 0 ? "Reception" : `Year ${p.year_group}`,
            gender: p.gender,
            has_ehcp: p.ehcp,
            has_send_support: p.sen_status === "K",
            send_primary_need: p.sen_primary_need || null,
            send_secondary_need:
              p.sen_secondary_need || senRecord?.sen_secondary_need || null,
            is_pupil_premium: p.pupil_premium,
            is_eal: p.eal,
            eal_stage: p.eal_stage || null,
            is_looked_after: p.in_care,
            accessibility_needs: parseAccessibilityNeeds(p.accessibility_needs),

            // Attainment from tracker (latest assessment)
            attainment_reading: latestAttainment(
              trackerResult.data,
              p.student_id,
              "reading",
            ),
            attainment_writing: latestAttainment(
              trackerResult.data,
              p.student_id,
              "writing",
            ),
            attainment_maths: latestAttainment(
              trackerResult.data,
              p.student_id,
              "maths",
            ),
            attainment_science: latestAttainment(
              trackerResult.data,
              p.student_id,
              "science",
            ),

            // Adaptive teaching fields from enriched pupil roll
            standardised_score_reading: p.standardised_score_reading || null,
            standardised_score_maths: p.standardised_score_maths || null,
            reading_age: p.reading_age || null,
            spelling_age: p.spelling_age || null,
            medical_conditions: p.medical_conditions || null,
            communication_method: p.communication_method || null,
            ehcp_provisions: p.ehcp_provisions || null,

            // SEN register enrichment
            key_worker: senRecord?.key_worker || null,
            external_agencies: senRecord?.external_agencies || null,
            provision_description: senRecord?.provision_description || null,
            ehcp_start_date: senRecord?.ehcp_start_date || null,
            next_annual_review: senRecord?.next_annual_review || null,
            funding: senRecord?.funding || null,

            lesson_attainment: {},
            resource_overrides: [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            _source: "mis",
          };
        });

      return apiSuccess(classPupils);
    } catch {
      return apiSuccess([]);
    }
  }

  // Standard path: read from Supabase ls_pupils table
  const { data, error } = await supabase
    .from("ls_pupils")
    .select("*")
    .eq("class_id", classId)
    .order("display_name_encrypted");

  if (error) return apiError(error.message, 500);
  return apiSuccess(data);
});
