/**
 * MIS Full Analysis API (Ofsted Readiness Scan)
 *
 * GET /api/mis/analysis/full - Runs ALL analysis types and returns a comprehensive intelligence report
 *
 * This is the "big scan" endpoint that produces a complete school intelligence picture.
 * It runs all 13 analysis types in parallel and aggregates the results.
 */

import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";

const ALL_ANALYSIS_TYPES = [
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

export const GET = protectedRoute(async (auth) => {
  const startTime = Date.now();

  try {
    const { MISAnalysisEngine } = await import("@/lib/mis/analysis-engine");
    const engine = new MISAnalysisEngine(auth.organizationId);

    // Run all analyses in parallel for speed
    const results = await Promise.allSettled([
      engine.detectTeacherPerformancePatterns(),
      engine.detectTeacherAssessmentInflation(),
      engine.detectDecliningPupils(),
      engine.detectPupilStrengthChange(),
      engine.detectCohortAnomaly(),
      engine.detectPPGapTrend(),
      engine.detectGenderGap(),
      engine.detectSENProgress(),
      engine.correlateAttendanceAttainment(),
      engine.detectBradfordFactorAlerts(),
      engine.detectStaffAbsenceImpact(),
      engine.runOfstedReadinessScan(),
      engine.generateGovernorReportData(),
    ]);

    // Build structured report from settled promises
    const report: Record<string, any> = {};
    const errors: string[] = [];

    ALL_ANALYSIS_TYPES.forEach((type, index) => {
      const result = results[index];
      if (result.status === "fulfilled") {
        report[type] = result.value;
      } else {
        report[type] = null;
        errors.push(`${type}: ${result.reason?.message || "Unknown error"}`);
      }
    });

    const durationMs = Date.now() - startTime;

    return apiSuccess({
      success: true,
      data: report,
      meta: {
        organizationId: auth.organizationId,
        analysisCount: ALL_ANALYSIS_TYPES.length,
        successCount: ALL_ANALYSIS_TYPES.length - errors.length,
        failedCount: errors.length,
        errors: errors.length > 0 ? errors : undefined,
        durationMs,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("[MIS Full Analysis] Error:", error.message);
    return apiError(
      error.message || "Failed to run full analysis",
      500,
      "MIS_FULL_ANALYSIS_ERROR",
    );
  }
});
