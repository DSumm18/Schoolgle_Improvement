import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { aggregateCrossModuleData } from "@/lib/sef-data-aggregator";
import { generateSDPFromSEF, LivingSEF } from "@/lib/living-sef-engine";

// POST /api/sdp/generate - Regenerate SDP priorities from an existing SEF
export const POST = protectedRoute(
  async (auth, request: NextRequest) => {
    const supabase = createServiceRoleClient();
    const body = await request.json();

    const sefId = body.sefId;

    if (!sefId) {
      return apiError("sefId is required", 400);
    }

    // Fetch the SEF document
    const { data: sefDoc, error: sefErr } = await supabase
      .from("sef_documents")
      .select("*")
      .eq("id", sefId)
      .eq("organization_id", auth.organizationId)
      .single();

    if (sefErr || !sefDoc) {
      return apiError("SEF document not found", 404);
    }

    // Get org details for aggregation
    const { data: org } = await supabase
      .from("organizations")
      .select("id, name, metadata")
      .eq("id", auth.organizationId)
      .single();

    const schoolType =
      (typeof org?.metadata === "object" && org?.metadata?.schoolType) ||
      "primary";

    // Build cross-module data for SDP generation
    const crossModuleData = await aggregateCrossModuleData(
      supabase,
      auth.organizationId,
      org?.name || "Your School",
      schoolType,
      sefDoc.academic_year || "2025/26",
    );

    // Build LivingSEF from stored doc
    const sef: LivingSEF = {
      id: sefDoc.id,
      organizationId: sefDoc.organization_id,
      academicYear: sefDoc.academic_year,
      overallGrade: sefDoc.overall_grade,
      overallScore: sefDoc.overall_score || 0,
      safeguardingMet: sefDoc.safeguarding_met,
      sections: sefDoc.sections || [],
      executiveSummary: sefDoc.executive_summary || "",
      version: sefDoc.version || 1,
      status: sefDoc.status || "draft",
      generatedAt: sefDoc.created_at,
      dataSourceTimestamps: sefDoc.data_source_timestamps || {},
    };

    // Generate SDP priorities
    const sdpPriorities = generateSDPFromSEF(sef, crossModuleData);

    // Clear existing SDP priorities for this SEF
    await supabase
      .from("sdp_priorities")
      .delete()
      .eq("sef_document_id", sefId)
      .eq("organization_id", auth.organizationId);

    // Store new priorities
    if (sdpPriorities.length > 0) {
      const sdpRows = sdpPriorities.map((p) => ({
        organization_id: auth.organizationId,
        sef_document_id: sefId,
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
        academic_year: sef.academicYear,
        status: "active",
      }));

      const { error: insertErr } = await supabase
        .from("sdp_priorities")
        .insert(sdpRows);

      if (insertErr) {
        console.error("[SDP Generate] insert error:", insertErr);
        return apiSuccess({
          sdpPriorities,
          saved: false,
          error: insertErr.message,
        });
      }
    }

    return apiSuccess({ sdpPriorities, saved: true });
  },
  { requiredRole: "slt" },
);

// GET /api/sdp/generate - List SDP priorities for latest SEF
export const GET = protectedRoute(async (auth) => {
  const supabase = createServiceRoleClient();

  const { data: priorities, error } = await supabase
    .from("sdp_priorities")
    .select("*, sef_documents!sef_document_id(title, academic_year, status)")
    .eq("organization_id", auth.organizationId)
    .eq("status", "active")
    .order("priority_number", { ascending: true });

  if (error) {
    return apiError(error.message, 500);
  }

  return apiSuccess(priorities || []);
});
