import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

/**
 * Generate a concern reference number: SG-YYYY-NNN
 */
async function generateReferenceNumber(
  supabase: ReturnType<typeof createServiceRoleClient>,
  organizationId: string,
): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `SG-${year}-`;

  const { data } = await supabase
    .from("safeguarding_concerns")
    .select("reference_number")
    .eq("organization_id", organizationId)
    .like("reference_number", `${prefix}%`)
    .order("reference_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  let nextNum = 1;
  if (data?.reference_number) {
    const lastNum = parseInt(data.reference_number.split("-")[2], 10);
    if (!isNaN(lastNum)) {
      nextNum = lastNum + 1;
    }
  }

  return `${prefix}${String(nextNum).padStart(3, "0")}`;
}

/**
 * GET /api/safeguarding/concerns
 * List concerns for an organization with optional filters
 */
export const GET = protectedRoute(
  async (auth, request) => {
    const { organizationId } = auth;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const severity = searchParams.get("severity");
    const category = searchParams.get("category");
    const pupilId = searchParams.get("pupil_id");
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const supabase = createServiceRoleClient();

    let query = supabase
      .from("safeguarding_concerns")
      .select("*", { count: "exact" })
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq("status", status);
    }
    if (severity) {
      query = query.eq("severity", severity);
    }
    if (category) {
      query = query.eq("category", category);
    }
    if (pupilId) {
      query = query.eq("pupil_pseudonym_id", pupilId);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching safeguarding concerns:", error);
      return apiError("Failed to fetch concerns", 500);
    }

    return apiSuccess({ concerns: data || [], total: count || 0 });
  },
  { requiredRole: "teacher" },
);

/**
 * POST /api/safeguarding/concerns
 * Create a new safeguarding concern
 */
export const POST = protectedRoute(
  async (auth, request) => {
    const { organizationId, userId } = auth;
    const body = await request.json();
    const {
      pupil_pseudonym_id,
      pupil_pseudonym_label,
      category,
      severity,
      description,
      location,
      date_of_concern,
      time_of_concern,
      witnesses,
      is_anonymous,
      body_map_data,
      immediate_actions_taken,
    } = body;

    if (!category || !severity || !description) {
      return apiError(
        "Missing required fields: category, severity, description",
        400,
      );
    }

    if (!["red", "amber", "green"].includes(severity)) {
      return apiError("Invalid severity: must be red, amber, or green", 400);
    }

    const supabase = createServiceRoleClient();
    const reference_number = await generateReferenceNumber(
      supabase,
      organizationId,
    );

    const { data: concern, error } = await supabase
      .from("safeguarding_concerns")
      .insert({
        organization_id: organizationId,
        reference_number,
        reported_by: is_anonymous ? null : userId,
        pupil_pseudonym_id: pupil_pseudonym_id || null,
        pupil_pseudonym_label: pupil_pseudonym_label || "Unknown Pupil",
        category,
        severity,
        status: "open",
        description,
        location: location || null,
        date_of_concern:
          date_of_concern || new Date().toISOString().split("T")[0],
        time_of_concern: time_of_concern || null,
        witnesses: witnesses || null,
        is_anonymous: is_anonymous || false,
        body_map_data: body_map_data || null,
        immediate_actions_taken: immediate_actions_taken || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating safeguarding concern:", error);
      return apiError("Failed to create concern", 500);
    }

    // Auto-create initial chronology entry
    await supabase.from("safeguarding_chronology").insert({
      concern_id: concern.id,
      organization_id: organizationId,
      entry_type: "concern_raised",
      description: `Concern raised: ${category.replace(/_/g, " ")} (${severity.toUpperCase()})`,
      recorded_by: is_anonymous ? null : userId,
      entry_date: new Date().toISOString(),
      metadata: {
        reference_number,
        category,
        severity,
        is_anonymous,
      },
    });

    return apiSuccess({ concern }, 201);
  },
  { requiredRole: "teacher" },
);
