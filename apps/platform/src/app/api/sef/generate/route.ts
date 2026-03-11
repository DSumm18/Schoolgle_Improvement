import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { aggregateCrossModuleData } from "@/lib/sef-data-aggregator";
import {
  generateFullSEF,
  generateSDPFromSEF,
  LivingSEF,
} from "@/lib/living-sef-engine";

// POST /api/sef/generate - Generate a Living SEF from all cross-module data
export const POST = protectedRoute(
  async (auth, request: NextRequest) => {
    const supabase = createServiceRoleClient();
    const body = await request.json();

    const academicYear = body.academicYear || "2025/26";
    const includesSDP = body.generateSDP !== false; // default true

    // Get organization details
    const { data: org, error: orgErr } = await supabase
      .from("organizations")
      .select("id, name, metadata")
      .eq("id", auth.organizationId)
      .single();

    if (orgErr || !org) {
      return apiError("Organization not found", 404);
    }

    const schoolType =
      (typeof org.metadata === "object" && org.metadata?.schoolType) ||
      "primary";

    // 1. Aggregate cross-module data
    const crossModuleData = await aggregateCrossModuleData(
      supabase,
      auth.organizationId,
      org.name || "Your School",
      schoolType,
      academicYear,
    );

    // 2. Fetch previous SEF version for change detection
    const { data: previousDoc } = await supabase
      .from("sef_documents")
      .select("*")
      .eq("organization_id", auth.organizationId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let previousSEF: LivingSEF | undefined;
    if (previousDoc?.sections && previousDoc?.version) {
      previousSEF = {
        id: previousDoc.id,
        organizationId: previousDoc.organization_id,
        academicYear: previousDoc.academic_year,
        overallGrade: previousDoc.overall_grade,
        overallScore: previousDoc.overall_score || 0,
        safeguardingMet: previousDoc.safeguarding_met,
        sections: previousDoc.sections,
        executiveSummary: previousDoc.executive_summary || "",
        version: previousDoc.version,
        status: previousDoc.status,
        generatedAt: previousDoc.created_at,
        dataSourceTimestamps: previousDoc.data_source_timestamps || {},
      };
    }

    // 3. Generate the Living SEF
    const sef = await generateFullSEF(
      auth.organizationId,
      crossModuleData,
      previousSEF,
    );

    // 4. Store the new SEF version
    const { data: savedSEF, error: saveErr } = await supabase
      .from("sef_documents")
      .insert({
        organization_id: auth.organizationId,
        title: `Living SEF ${academicYear} v${sef.version}`,
        academic_year: academicYear,
        overall_grade: sef.overallGrade,
        overall_score: sef.overallScore,
        safeguarding_met: sef.safeguardingMet,
        sections: sef.sections,
        executive_summary: sef.executiveSummary,
        version: sef.version,
        status: "draft",
        data_source_timestamps: sef.dataSourceTimestamps,
      })
      .select()
      .single();

    if (saveErr) {
      console.error("[SEF Generate] save error:", saveErr);
      // Return the SEF even if save fails
      return apiSuccess({ sef, saved: false, error: saveErr.message });
    }

    // 5. Generate SDP priorities if requested
    let sdpPriorities = null;
    if (includesSDP) {
      sdpPriorities = generateSDPFromSEF(sef, crossModuleData);

      // Store SDP priorities
      if (sdpPriorities.length > 0) {
        const sdpRows = sdpPriorities.map((p) => ({
          organization_id: auth.organizationId,
          sef_document_id: savedSEF.id,
          priority_number: p.number,
          title: p.title,
          rationale: p.rationale,
          ofsted_category_id: p.ofstedCategoryId,
          lead_person: p.leadPerson,
          budget: p.budget,
          funding_source: p.fundingSource,
          success_criteria: p.successCriteria,
          milestones: p.milestones,
          linked_action_ids: p.linkedActions,
          eef_strategies: p.eefStrategies,
          cross_module_impact: p.crossModuleImpact,
          review_date: p.reviewDate,
          progress_percentage: p.progressPercentage,
          academic_year: academicYear,
          status: "active",
        }));

        const { error: sdpErr } = await supabase
          .from("sdp_priorities")
          .insert(sdpRows);

        if (sdpErr) {
          console.error("[SEF Generate] SDP save error:", sdpErr);
        }
      }
    }

    return apiSuccess({
      sef: { ...sef, id: savedSEF.id },
      sdpPriorities,
      saved: true,
      crossModuleStats: {
        assessments: crossModuleData.assessments.length,
        evidence: crossModuleData.evidence.length,
        actions: crossModuleData.actions.length,
        hasDfEData: !!crossModuleData.dfeData.attendance,
        estatesComplianceRate: crossModuleData.estates.complianceRate,
        policiesCurrent: `${crossModuleData.compliance.policiesUpToDate}/${crossModuleData.compliance.policiesTotal}`,
        staffCount: crossModuleData.staff.totalTeachers,
      },
    });
  },
  { requiredRole: "slt" },
);

// GET /api/sef/generate - Get latest SEF for the organization
export const GET = protectedRoute(async (auth) => {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("sef_documents")
    .select("*")
    .eq("organization_id", auth.organizationId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return apiError(error.message, 500);
  }

  if (!data) {
    return apiSuccess({ sef: null, message: "No SEF generated yet" });
  }

  // Also fetch related SDP priorities
  const { data: sdpPriorities } = await supabase
    .from("sdp_priorities")
    .select("*")
    .eq("sef_document_id", data.id)
    .order("priority_number", { ascending: true });

  return apiSuccess({
    sef: data,
    sdpPriorities: sdpPriorities || [],
  });
});
