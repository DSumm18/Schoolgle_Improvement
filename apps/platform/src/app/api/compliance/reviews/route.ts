/**
 * Compliance Reviews API
 *
 * The authoritative record for recurring compliance review cycles.
 * Works across all compliance domains (COSHH, fire, legionella, etc.)
 *
 * GET  /api/compliance/reviews?organizationId=...&domain=coshh&location_id=rm-caretaker
 * POST /api/compliance/reviews  { action: "start" | "complete" | "sign_off" }
 */

import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

export const GET = protectedRoute(
  async (auth, request) => {
    const supabase = createServiceRoleClient();
    const { organizationId } = auth;
    const params = request.nextUrl.searchParams;

    const domain = params.get("domain");
    const locationId = params.get("location_id");
    const limit = parseInt(params.get("limit") || "20", 10);

    // Note: Using compliance_evidence table temporarily until compliance_reviews table is created
    let query = supabase
      .from("compliance_evidence")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (domain) query = query.eq("domain", domain);
    if (locationId) query = query.eq("location_id", locationId);

    const { data, error } = await query;

    if (error) {
      console.error("[Reviews] List error:", error);
      return apiError("Failed to fetch reviews", 500);
    }

    return apiSuccess({ reviews: data || [], count: (data || []).length });
  },
  { requiredRole: "caretaker" },
);

export const POST = protectedRoute(
  async (auth, request) => {
    const supabase = createServiceRoleClient();
    const { organizationId, userId, email } = auth;
    const body = await request.json();

    // === START a new review ===
    if (body.action === "start") {
      const {
        compliance_domain,
        review_type,
        location_id,
        location_name,
        responsible_person_id,
        responsible_person_name,
      } = body;

      if (!compliance_domain || !review_type) {
        return apiError("compliance_domain and review_type are required", 400);
      }

      // Find previous review for this location+domain
      const { data: prevReviews } = await supabase
        .from("compliance_reviews")
        .select("id, review_date, register_snapshot, findings")
        .eq("organization_id", organizationId)
        .eq("compliance_domain", compliance_domain)
        .eq("location_id", location_id || "")
        .order("review_date", { ascending: false })
        .limit(1);

      const previousReviewId = prevReviews?.[0]?.id || null;

      // Snapshot the current register (for COSHH)
      let registerSnapshot = null;
      if (compliance_domain === "coshh") {
        const { data: register } = await supabase
          .from("coshh_register")
          .select(
            "id, product_name, manufacturer, ghs_hazard_codes, current_quantity, storage_conditions",
          )
          .eq("organization_id", organizationId);
        registerSnapshot = register;
      }

      const { data: review, error } = await supabase
        .from("compliance_reviews")
        .insert({
          organization_id: organizationId,
          compliance_domain,
          review_type,
          location_id: location_id || null,
          location_name: location_name || null,
          review_date: new Date().toISOString().split("T")[0],
          due_date: body.due_date || null,
          previous_review_id: previousReviewId,
          reviewed_by: userId,
          reviewed_by_name: body.reviewed_by_name || email,
          responsible_person_id: responsible_person_id || null,
          responsible_person_name: responsible_person_name || null,
          register_snapshot: registerSnapshot,
          overall_status: "in_progress",
          sign_off_status: "pending",
        })
        .select()
        .single();

      if (error) {
        console.error("[Reviews] Start error:", error);
        return apiError(error.message, 500);
      }

      return apiSuccess(
        {
          review,
          previous_review: prevReviews?.[0] || null,
          message:
            "Review started. Upload evidence and add findings, then sign off when complete.",
        },
        201,
      );
    }

    // === ADD FINDINGS to an in-progress review ===
    if (body.action === "add_findings") {
      const { review_id, findings, evidence_ids, ai_analysis, ai_model } = body;

      if (!review_id) return apiError("review_id required", 400);

      const updateData: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };

      if (findings) updateData.findings = findings;
      if (evidence_ids) updateData.evidence_ids = evidence_ids;
      if (ai_analysis) {
        updateData.ai_analysis = ai_analysis;
        updateData.ai_model = ai_model || null;
      }

      const { data, error } = await supabase
        .from("compliance_reviews")
        .update(updateData)
        .eq("id", review_id)
        .eq("organization_id", organizationId)
        .select()
        .single();

      if (error) return apiError(error.message, 500);
      return apiSuccess({ review: data });
    }

    // === COMPLETE review (ready for sign-off) ===
    if (body.action === "complete") {
      const { review_id, overall_status, actions_raised } = body;

      if (!review_id) return apiError("review_id required", 400);

      const { data, error } = await supabase
        .from("compliance_reviews")
        .update({
          overall_status: overall_status || "compliant",
          actions_raised: actions_raised || [],
          sign_off_status: "pending",
          updated_at: new Date().toISOString(),
        })
        .eq("id", review_id)
        .eq("organization_id", organizationId)
        .select()
        .single();

      if (error) return apiError(error.message, 500);
      return apiSuccess({
        review: data,
        message: "Review complete. Awaiting sign-off.",
      });
    }

    // === SIGN OFF a completed review ===
    if (body.action === "sign_off") {
      const { review_id, sign_off_notes, approved } = body;

      if (!review_id) return apiError("review_id required", 400);

      const { data, error } = await supabase
        .from("compliance_reviews")
        .update({
          sign_off_status: approved !== false ? "signed_off" : "rejected",
          signed_off_by: userId,
          signed_off_by_name: body.signed_off_by_name || email,
          signed_off_at: new Date().toISOString(),
          sign_off_notes: sign_off_notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", review_id)
        .eq("organization_id", organizationId)
        .select()
        .single();

      if (error) return apiError(error.message, 500);

      return apiSuccess({
        review: data,
        message:
          approved !== false
            ? "Review signed off. Compliance record updated."
            : "Review rejected. See notes for required actions.",
      });
    }

    return apiError(
      "Invalid action. Use: start, add_findings, complete, sign_off",
      400,
    );
  },
  { requiredRole: "caretaker" },
);
