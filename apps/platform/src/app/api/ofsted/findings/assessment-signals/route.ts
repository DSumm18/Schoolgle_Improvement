import { NextRequest } from "next/server";
import { apiError, apiSuccess, protectedRoute } from "@/lib/api-utils";
import { buildAssessmentIntelligenceReportingSummary } from "@/lib/assessment-intelligence/reporting";
import type { AssessmentSourceKind } from "@/lib/assessment-intelligence/types";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { buildAssessmentSnapshotFindingDrafts } from "@/lib/ofsted-readiness/assessment-signals";

export const POST = protectedRoute(
  async (auth, request: NextRequest) => {
    if (!auth.organizationId) return apiError("Missing organizationId", 400);

    const body = await request.json().catch(() => ({}));
    const dryRun = body.dryRun === true;
    const supabase = createServiceRoleClient();
    const assessmentEvidence = await buildAssessmentIntelligenceReportingSummary(supabase, {
      organizationId: auth.organizationId,
      includeChildOrganizations: true,
    });

    const findings = buildAssessmentSnapshotFindingDrafts({
      organizationId: auth.organizationId,
      snapshots: assessmentEvidence.snapshots.map((snapshot) => ({
        batchId: snapshot.batchId,
        sourceKind: snapshot.sourceKind as AssessmentSourceKind,
        sourceLabel: snapshot.sourceLabel,
        assessmentPeriod: snapshot.assessmentPeriod,
        academicYearStart: snapshot.academicYearStart,
        subject: snapshot.subject,
        eventCount: snapshot.eventCount,
        atExpectedPct: snapshot.atExpectedPct,
        needsModerationCount: snapshot.needsModerationCount,
        isDemo: snapshot.isDemo,
      })),
    });

    if (dryRun) {
      return apiSuccess({
        findings,
        total: findings.length,
        dryRun: true,
        source: assessmentEvidence.source,
      });
    }

    if (findings.length === 0) {
      return apiSuccess({
        findings: [],
        total: 0,
        message: "No assessment intelligence signals currently require Ofsted findings.",
      });
    }

    const now = new Date().toISOString();
    const rows = findings.map((finding) => ({
      organization_id: auth.organizationId,
      source_key: finding.source_key,
      source_type: finding.source_type,
      source_scan_id: null,
      source_record_id: String(finding.metadata.assessmentBatchId ?? ""),
      source_url: finding.evidence_url,
      framework_type: finding.framework_type,
      category_id: finding.category_id,
      subcategory_id: finding.subcategory_id,
      rule_key: finding.rule_key,
      rule_version: finding.rule_version,
      rule_source: finding.rule_source,
      title: finding.title,
      summary: finding.summary,
      finding_type: finding.finding_type,
      severity: finding.severity,
      action_level: finding.action_level,
      status: finding.status,
      score: finding.score,
      confidence: finding.confidence,
      evidence_url: finding.evidence_url,
      evidence_quotes: finding.evidence_quotes,
      gaps: finding.gaps,
      recommendations: finding.recommendations,
      red_flags: finding.red_flags,
      checklist: finding.checklist,
      recommended_task_title: finding.recommended_task_title,
      recommended_task_description: finding.recommended_task_description,
      metadata: finding.metadata,
      updated_at: now,
    }));

    const { data, error } = await supabase
      .from("ofsted_findings")
      .upsert(rows, { onConflict: "organization_id,source_key" })
      .select();

    if (error) {
      console.error("[Ofsted Findings] Assessment signal upsert failed:", error);
      return apiError("Failed to save assessment signal findings", 500);
    }

    if (data && data.length > 0) {
      await supabase.from("ofsted_finding_events").insert(
        data.map((finding: any) => ({
          organization_id: auth.organizationId,
          finding_id: finding.id,
          event_type: "assessment_signal_upserted",
          actor_user_id: auth.userId,
          new_status: finding.status,
          metadata: {
            source_type: finding.source_type,
            source_key: finding.source_key,
            source_record_id: finding.source_record_id,
          },
        })),
      );
    }

    return apiSuccess({ findings: data || [], total: data?.length || 0 }, 201);
  },
  { requiredRole: "teacher" },
);
