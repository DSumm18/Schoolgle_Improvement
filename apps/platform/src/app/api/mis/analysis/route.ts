/**
 * MIS Analysis API
 *
 * GET /api/mis/analysis?type=teacher_performance|assessment_inflation|declining_pupils|pupil_strength|cohort_anomaly|pp_gap|gender_gap|sen_progress|attendance_correlation|bradford_factor|staff_absence_impact|ofsted_readiness|governor_report
 *
 * Runs a specific analysis type against the school's MIS data and returns insights.
 */

import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";

const VALID_ANALYSIS_TYPES = [
  "teacher_performance",
  "assessment_inflation",
  "declining_pupils",
  "pupil_strength",
  "cohort_anomaly",
  "pp_gap",
  "gender_gap",
  "sen_progress",
  "attendance_correlation",
  "bradford_factor",
  "staff_absence_impact",
  "ofsted_readiness",
  "governor_report",
] as const;

type AnalysisType = (typeof VALID_ANALYSIS_TYPES)[number];

export const GET = protectedRoute(async (auth, request: NextRequest) => {
  const { searchParams } = request.nextUrl;
  const type = searchParams.get("type");

  if (!type) {
    return apiError(
      "Missing required query parameter: type",
      400,
      "MISSING_PARAMETER",
      { validTypes: VALID_ANALYSIS_TYPES },
    );
  }

  if (!VALID_ANALYSIS_TYPES.includes(type as AnalysisType)) {
    return apiError(
      `Invalid analysis type: "${type}". Must be one of: ${VALID_ANALYSIS_TYPES.join(", ")}`,
      400,
      "INVALID_ANALYSIS_TYPE",
      { validTypes: VALID_ANALYSIS_TYPES },
    );
  }

  try {
    const { MISAnalysisEngine } = await import("@/lib/mis/analysis-engine");
    const engine = new MISAnalysisEngine(auth.organizationId);

    let result: unknown;

    switch (type as AnalysisType) {
      case "teacher_performance":
        result = await engine.detectTeacherPerformancePatterns();
        break;
      case "assessment_inflation":
        result = await engine.detectTeacherAssessmentInflation();
        break;
      case "declining_pupils":
        result = await engine.detectDecliningPupils();
        break;
      case "pupil_strength":
        result = await engine.detectPupilStrengthChange();
        break;
      case "cohort_anomaly":
        result = await engine.detectCohortAnomaly();
        break;
      case "pp_gap":
        result = await engine.detectPPGapTrend();
        break;
      case "gender_gap":
        result = await engine.detectGenderGap();
        break;
      case "sen_progress":
        result = await engine.detectSENProgress();
        break;
      case "attendance_correlation":
        result = await engine.correlateAttendanceAttainment();
        break;
      case "bradford_factor":
        result = await engine.detectBradfordFactorAlerts();
        break;
      case "staff_absence_impact":
        result = await engine.detectStaffAbsenceImpact();
        break;
      case "ofsted_readiness":
        result = await engine.runOfstedReadinessScan();
        break;
      case "governor_report":
        result = await engine.generateGovernorReportData();
        break;
    }

    return apiSuccess({
      success: true,
      analysisType: type,
      data: result,
    });
  } catch (error: any) {
    console.error(`[MIS Analysis] Error running ${type}:`, error.message);
    return apiError(
      error.message || `Failed to run analysis: ${type}`,
      500,
      "MIS_ANALYSIS_ERROR",
    );
  }
});
