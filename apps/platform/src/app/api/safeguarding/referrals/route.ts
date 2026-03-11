import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

/**
 * GET /api/safeguarding/referrals
 * Get referrals for a concern or all referrals for an org
 */
export const GET = protectedRoute(
  async (auth, request) => {
    const { organizationId } = auth;
    const { searchParams } = new URL(request.url);
    const concernId = searchParams.get("concern_id");
    const status = searchParams.get("status");

    const supabase = createServiceRoleClient();

    let query = supabase
      .from("safeguarding_referrals")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });

    if (concernId) {
      query = query.eq("concern_id", concernId);
    }
    if (status) {
      query = query.eq("outcome_status", status);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching referrals:", error);
      return apiError("Failed to fetch referrals", 500);
    }

    return apiSuccess({ referrals: data || [] });
  },
  { requiredRole: "teacher" },
);

/**
 * POST /api/safeguarding/referrals
 * Create a new referral for a concern
 */
export const POST = protectedRoute(
  async (auth, request) => {
    const { organizationId, userId } = auth;
    const body = await request.json();
    const {
      concern_id,
      referral_type,
      referred_to_agency,
      referred_to_contact,
      referral_reason,
      referral_date,
      urgency,
      supporting_documents,
    } = body;

    if (!concern_id || !referral_type || !referred_to_agency) {
      return apiError(
        "Missing required fields: concern_id, referral_type, referred_to_agency",
        400,
      );
    }

    const validTypes = [
      "cscs",
      "police",
      "lado",
      "mash",
      "early_help",
      "camhs",
      "school_nurse",
      "educational_psychologist",
      "social_worker",
      "other",
    ];

    if (!validTypes.includes(referral_type)) {
      return apiError(
        `Invalid referral_type. Must be one of: ${validTypes.join(", ")}`,
        400,
      );
    }

    const supabase = createServiceRoleClient();

    // Verify the concern belongs to this org
    const { data: concern } = await supabase
      .from("safeguarding_concerns")
      .select("id, reference_number")
      .eq("id", concern_id)
      .eq("organization_id", organizationId)
      .single();

    if (!concern) {
      return apiError("Concern not found", 404);
    }

    // Generate referral reference: REF-YYYY-NNN
    const year = new Date().getFullYear();
    const refPrefix = `REF-${year}-`;
    const { data: lastRef } = await supabase
      .from("safeguarding_referrals")
      .select("reference_number")
      .eq("organization_id", organizationId)
      .like("reference_number", `${refPrefix}%`)
      .order("reference_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    let nextNum = 1;
    if (lastRef?.reference_number) {
      const lastNum = parseInt(lastRef.reference_number.split("-")[2], 10);
      if (!isNaN(lastNum)) nextNum = lastNum + 1;
    }
    const reference_number = `${refPrefix}${String(nextNum).padStart(3, "0")}`;

    const { data: referral, error } = await supabase
      .from("safeguarding_referrals")
      .insert({
        concern_id,
        organization_id: organizationId,
        reference_number,
        referral_type,
        referred_to_agency,
        referred_to_contact: referred_to_contact || null,
        referral_reason: referral_reason || null,
        referral_date: referral_date || new Date().toISOString().split("T")[0],
        referred_by: userId,
        urgency: urgency || "standard",
        outcome_status: "pending",
        supporting_documents: supporting_documents || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating referral:", error);
      return apiError("Failed to create referral", 500);
    }

    // Update concern status to "referred"
    await supabase
      .from("safeguarding_concerns")
      .update({ status: "referred", updated_at: new Date().toISOString() })
      .eq("id", concern_id);

    // Add chronology entry
    await supabase.from("safeguarding_chronology").insert({
      concern_id,
      organization_id: organizationId,
      entry_type: "referral_made",
      description: `Referral made to ${referred_to_agency} (${referral_type.toUpperCase()}) - Ref: ${reference_number}`,
      recorded_by: userId,
      entry_date: new Date().toISOString(),
      metadata: {
        referral_id: referral.id,
        referral_type,
        referred_to_agency,
        urgency,
      },
    });

    return apiSuccess({ referral }, 201);
  },
  { requiredRole: "slt" },
);

/**
 * PUT /api/safeguarding/referrals
 * Update a referral outcome
 */
export const PUT = protectedRoute(
  async (auth, request) => {
    const { organizationId, userId } = auth;
    const body = await request.json();
    const { referral_id, outcome_status, outcome_notes, outcome_date } = body;

    if (!referral_id || !outcome_status) {
      return apiError(
        "Missing required fields: referral_id, outcome_status",
        400,
      );
    }

    const validStatuses = [
      "pending",
      "accepted",
      "declined",
      "assessment_in_progress",
      "completed",
      "withdrawn",
    ];

    if (!validStatuses.includes(outcome_status)) {
      return apiError(
        `Invalid outcome_status. Must be one of: ${validStatuses.join(", ")}`,
        400,
      );
    }

    const supabase = createServiceRoleClient();

    const { data: referral, error } = await supabase
      .from("safeguarding_referrals")
      .update({
        outcome_status,
        outcome_notes: outcome_notes || null,
        outcome_date: outcome_date || new Date().toISOString().split("T")[0],
        updated_at: new Date().toISOString(),
      })
      .eq("id", referral_id)
      .eq("organization_id", organizationId)
      .select()
      .single();

    if (error) {
      console.error("Error updating referral:", error);
      return apiError("Failed to update referral", 500);
    }

    // Add chronology entry
    if (referral.concern_id) {
      await supabase.from("safeguarding_chronology").insert({
        concern_id: referral.concern_id,
        organization_id: organizationId,
        entry_type: "referral_outcome",
        description: `Referral ${referral.reference_number} outcome: ${outcome_status.replace(/_/g, " ")}${outcome_notes ? ` - ${outcome_notes}` : ""}`,
        recorded_by: userId,
        entry_date: new Date().toISOString(),
        metadata: { referral_id, outcome_status, outcome_notes },
      });
    }

    return apiSuccess({ referral });
  },
  { requiredRole: "slt" },
);
