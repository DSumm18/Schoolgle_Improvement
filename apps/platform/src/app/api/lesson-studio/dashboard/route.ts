import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { NextRequest } from "next/server";
import type { AttainmentLevel } from "@/types/lesson-studio";

/* ── Attainment helpers ──────────────────────────────────────────── */

const ATTAINMENT_ORDER: Record<string, number> = {
  PKF: 0,
  PKE: 1,
  WTS: 2,
  EXS: 3,
  GDS: 4,
};

function isBelow(grade: string | null): boolean {
  if (!grade) return false;
  return grade === "WTS" || grade === "PKE" || grade === "PKF";
}

function bandDistance(a: string | null, b: string | null): number {
  if (!a || !b) return 0;
  const aIdx = ATTAINMENT_ORDER[a];
  const bIdx = ATTAINMENT_ORDER[b];
  if (aIdx == null || bIdx == null) return 0;
  return Math.abs(aIdx - bIdx);
}

/* ── Types ───────────────────────────────────────────────────────── */

interface DashboardAlert {
  id: string;
  type: "gap" | "inconsistency" | "progress";
  severity: "high" | "medium" | "low";
  pupilId: string;
  pupilName: string;
  title: string;
  description: string;
  subject?: string;
}

/* ── GET: Dashboard aggregation ──────────────────────────────────── */

export const GET = protectedRoute(async (auth, req: NextRequest) => {
  const supabase = createServiceRoleClient();
  const orgId = auth.organizationId;
  if (!orgId) return apiError("No organization", 400);

  const classId = req.nextUrl.searchParams.get("classId");
  if (!classId) return apiError("classId required", 400);

  // 1. Load all pupils for the class
  const { data: pupils, error: pupilsError } = await supabase
    .from("ls_pupils")
    .select("*")
    .eq("class_id", classId)
    .eq("organization_id", orgId)
    .order("display_name_encrypted");

  if (pupilsError) return apiError(pupilsError.message, 500);
  if (!pupils || pupils.length === 0) {
    return apiSuccess({
      stats: {
        total: 0,
        atExpectedPlus: 0,
        greaterDepth: 0,
        belowExpected: 0,
        prerequisiteGaps: 0,
      },
      alerts: [],
      pupils: [],
    });
  }

  const pupilIds = pupils.map((p) => p.id);

  // 2. Load all assessments for those pupils (most recent per subject)
  const { data: assessments, error: assessError } = await supabase
    .from("ls_assessments")
    .select("*")
    .in("pupil_id", pupilIds)
    .eq("organization_id", orgId)
    .order("assessment_date", { ascending: false });

  if (assessError) return apiError(assessError.message, 500);

  // Build latest assessment per pupil per subject
  const latestByPupilSubject = new Map<string, (typeof assessments)[0]>();
  for (const a of assessments ?? []) {
    const key = `${a.pupil_id}::${a.subject}`;
    if (!latestByPupilSubject.has(key)) {
      latestByPupilSubject.set(key, a);
    }
  }

  // 3. Compute class-level stats using attainment fields as primary,
  //    falling back to latest assessment
  function effectiveGrade(
    pupil: (typeof pupils)[0],
    subject: string,
  ): string | null {
    // Use attainment fields first (from census/import)
    const fieldMap: Record<string, string> = {
      reading: "attainment_reading",
      writing: "attainment_writing",
      maths: "attainment_maths",
      science: "attainment_science",
    };
    const field = fieldMap[subject.toLowerCase()];
    if (field && pupil[field]) return pupil[field] as string;

    // Fall back to latest assessment
    const key = `${pupil.id}::${subject}`;
    const latest = latestByPupilSubject.get(key);
    const grade = latest?.teacher_grade ?? latest?.ai_suggested_grade;
    return grade ?? null;
  }

  // Use maths as the primary subject for stats (common proxy)
  const CORE_SUBJECTS = ["reading", "writing", "maths", "science"];

  let atExpectedPlus = 0;
  let greaterDepth = 0;
  let belowExpected = 0;

  for (const pupil of pupils) {
    // Average across core subjects - use maths as primary
    const mathsGrade = effectiveGrade(pupil, "maths");
    if (mathsGrade === "EXS" || mathsGrade === "GDS") atExpectedPlus++;
    if (mathsGrade === "GDS") greaterDepth++;
    if (isBelow(mathsGrade)) belowExpected++;
  }

  // 4. Generate smart alerts
  const alerts: DashboardAlert[] = [];
  let alertIdx = 0;
  let prerequisiteGapCount = 0;

  for (const pupil of pupils) {
    const name = pupil.display_name_encrypted ?? `Pupil ${pupil.pupil_ref?.slice(0, 6) ?? "?"}`;

    // Gap alerts: below expected in a core subject suggests foundation gap
    for (const subject of CORE_SUBJECTS) {
      const grade = effectiveGrade(pupil, subject);
      if (isBelow(grade)) {
        // Check if this is a persistent gap (attainment field + assessment both below)
        const key = `${pupil.id}::${subject}`;
        const latestAssessment = latestByPupilSubject.get(key);
        const assessGrade =
          latestAssessment?.teacher_grade ??
          latestAssessment?.ai_suggested_grade;

        if (isBelow(grade) && (!assessGrade || isBelow(assessGrade))) {
          prerequisiteGapCount++;
          alerts.push({
            id: `gap-${alertIdx++}`,
            type: "gap",
            severity: grade === "PKF" || grade === "PKE" ? "high" : "medium",
            pupilId: pupil.id,
            pupilName: name,
            title: `Foundation gap in ${subject}`,
            description: `${name} is at ${grade} in ${subject}. This suggests prerequisite skills from earlier year groups may not be secure. Consider diagnostic assessment to identify specific gaps.`,
            subject,
          });
        }
      }
    }

    // Inconsistency alerts: attainment field differs from latest assessment by 2+ bands
    for (const subject of CORE_SUBJECTS) {
      const fieldMap: Record<string, string> = {
        reading: "attainment_reading",
        writing: "attainment_writing",
        maths: "attainment_maths",
        science: "attainment_science",
      };
      const field = fieldMap[subject];
      const censusGrade = field ? (pupil[field] as string | null) : null;
      const key = `${pupil.id}::${subject}`;
      const latestAssessment = latestByPupilSubject.get(key);
      const assessGrade =
        latestAssessment?.teacher_grade ?? latestAssessment?.ai_suggested_grade;

      if (censusGrade && assessGrade && bandDistance(censusGrade, assessGrade) >= 2) {
        alerts.push({
          id: `inconsistency-${alertIdx++}`,
          type: "inconsistency",
          severity: "medium",
          pupilId: pupil.id,
          pupilName: name,
          title: `Assessment inconsistency in ${subject}`,
          description: `${name}'s census/import data shows ${censusGrade} but latest assessment is ${assessGrade}. This ${ATTAINMENT_ORDER[assessGrade] > ATTAINMENT_ORDER[censusGrade] ? "may indicate good progress" : "needs investigation"}.`,
          subject,
        });
      }
    }

    // Progress alerts: check for 3+ assessments trending up in any subject
    for (const subject of CORE_SUBJECTS) {
      const pupilAssessments = (assessments ?? [])
        .filter(
          (a) => a.pupil_id === pupil.id && a.subject.toLowerCase() === subject,
        )
        .sort(
          (a, b) =>
            new Date(a.assessment_date).getTime() -
            new Date(b.assessment_date).getTime(),
        );

      if (pupilAssessments.length >= 3) {
        const grades = pupilAssessments
          .slice(-3)
          .map((a) => a.teacher_grade ?? a.ai_suggested_grade)
          .filter(Boolean) as string[];

        if (grades.length >= 3) {
          let trending = true;
          for (let i = 1; i < grades.length; i++) {
            if (
              (ATTAINMENT_ORDER[grades[i]] ?? 0) <=
              (ATTAINMENT_ORDER[grades[i - 1]] ?? 0)
            ) {
              trending = false;
              break;
            }
          }
          if (trending) {
            alerts.push({
              id: `progress-${alertIdx++}`,
              type: "progress",
              severity: "low",
              pupilId: pupil.id,
              pupilName: name,
              title: `Positive progress in ${subject}`,
              description: `${name} has shown consistent improvement over their last 3 assessments in ${subject} (${grades.join(" -> ")}). Great progress to celebrate.`,
              subject,
            });
          }
        }
      }
    }
  }

  // Sort alerts: high severity first
  const severityOrder = { high: 0, medium: 1, low: 2 };
  alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  // 5. Join pupils with their latest assessments
  const pupilsWithAssessments = pupils.map((pupil) => {
    const latestAssessments: Record<string, (typeof assessments)[0]> = {};
    for (const subject of CORE_SUBJECTS) {
      const key = `${pupil.id}::${subject}`;
      const latest = latestByPupilSubject.get(key);
      if (latest) latestAssessments[subject] = latest;
    }
    return {
      ...pupil,
      latestAssessments,
    };
  });

  return apiSuccess({
    stats: {
      total: pupils.length,
      atExpectedPlus,
      greaterDepth,
      belowExpected,
      prerequisiteGaps: prerequisiteGapCount,
    },
    alerts,
    pupils: pupilsWithAssessments,
  });
});
