import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

/**
 * GET /api/safeguarding/chronology
 * Get chronology entries for a concern
 */
export const GET = protectedRoute(
  async (auth, request) => {
    const { organizationId } = auth;
    const { searchParams } = new URL(request.url);
    const concernId = searchParams.get("concern_id");

    if (!concernId) {
      return apiError("Missing required parameter: concern_id", 400);
    }

    const supabase = createServiceRoleClient();

    // Verify the concern belongs to this org
    const { data: concern } = await supabase
      .from("safeguarding_concerns")
      .select("id")
      .eq("id", concernId)
      .eq("organization_id", organizationId)
      .single();

    if (!concern) {
      return apiError("Concern not found", 404);
    }

    const { data, error } = await supabase
      .from("safeguarding_chronology")
      .select("*")
      .eq("concern_id", concernId)
      .eq("organization_id", organizationId)
      .order("entry_date", { ascending: true });

    if (error) {
      console.error("Error fetching chronology:", error);
      return apiError("Failed to fetch chronology", 500);
    }

    return apiSuccess({ chronology: data || [] });
  },
  { requiredRole: "teacher" },
);

/**
 * POST /api/safeguarding/chronology
 * Add a chronology entry to a concern
 */
export const POST = protectedRoute(
  async (auth, request) => {
    const { organizationId, userId } = auth;
    const body = await request.json();
    const { concern_id, entry_type, description, entry_date, metadata } = body;

    if (!concern_id || !entry_type || !description) {
      return apiError(
        "Missing required fields: concern_id, entry_type, description",
        400,
      );
    }

    const supabase = createServiceRoleClient();

    // Verify the concern belongs to this org
    const { data: concern } = await supabase
      .from("safeguarding_concerns")
      .select("id")
      .eq("id", concern_id)
      .eq("organization_id", organizationId)
      .single();

    if (!concern) {
      return apiError("Concern not found", 404);
    }

    const validEntryTypes = [
      "concern_raised",
      "status_change",
      "severity_change",
      "triage",
      "note",
      "phone_call",
      "meeting",
      "parent_contact",
      "agency_contact",
      "disclosure",
      "observation",
      "referral_made",
      "referral_outcome",
      "follow_up",
      "review",
      "escalation",
      "closure",
      "reopened",
    ];

    if (!validEntryTypes.includes(entry_type)) {
      return apiError(
        `Invalid entry_type. Must be one of: ${validEntryTypes.join(", ")}`,
        400,
      );
    }

    const { data: entry, error } = await supabase
      .from("safeguarding_chronology")
      .insert({
        concern_id,
        organization_id: organizationId,
        entry_type,
        description,
        recorded_by: userId,
        entry_date: entry_date || new Date().toISOString(),
        metadata: metadata || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating chronology entry:", error);
      return apiError("Failed to create chronology entry", 500);
    }

    // Update concern's updated_at timestamp
    await supabase
      .from("safeguarding_concerns")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", concern_id);

    return apiSuccess({ entry }, 201);
  },
  { requiredRole: "teacher" },
);
