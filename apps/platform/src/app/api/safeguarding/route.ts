import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

/**
 * GET /api/safeguarding
 * Fetch safeguarding dashboard data: concerns summary, training status,
 * policy status, recent audits, and referral tracking.
 */
export const GET = protectedRoute(
  async (auth) => {
    const { organizationId } = auth;
    const supabase = createServiceRoleClient();
    const today = new Date().toISOString().split("T")[0];

    // Fetch all concerns (active + closed for stats)
    const [
      { data: activeConcerns, error: concernsError },
      { count: closedThisYear },
      { data: referrals },
    ] = await Promise.all([
      supabase
        .from("safeguarding_concerns")
        .select(
          "id, severity, status, category, created_at, updated_at, follow_up_date, pupil_display_name, pupil_pseudonym_id, reference_number, description, location, date_of_concern, time_of_concern, witnesses, is_anonymous, reported_by, triage_outcome, triage_notes, assigned_to, body_map_data, immediate_actions_taken",
        )
        .eq("organization_id", organizationId)
        .in("status", ["open", "triaged", "referred", "monitoring"])
        .order("created_at", { ascending: false }),
      supabase
        .from("safeguarding_concerns")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .eq("status", "closed")
        .gte("created_at", getAcademicYearStart().toISOString()),
      supabase
        .from("safeguarding_referrals")
        .select(
          "id, concern_id, reference_number, referral_type, referred_to_agency, referred_to_contact, referral_reason, referral_date, referred_by, urgency, outcome_status, outcome_notes, outcome_date",
        )
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false }),
    ]);

    if (concernsError) {
      console.error("Error fetching safeguarding data:", concernsError);
      return apiError("Failed to fetch safeguarding data", 500);
    }

    const allActive = activeConcerns || [];

    // Severity breakdown
    const bySeverity = {
      red: allActive.filter((c) => c.severity === "red").length,
      amber: allActive.filter((c) => c.severity === "amber").length,
      green: allActive.filter((c) => c.severity === "green").length,
    };

    // Status breakdown
    const byStatus = {
      open: allActive.filter((c) => c.status === "open").length,
      triaged: allActive.filter((c) => c.status === "triaged").length,
      referred: allActive.filter((c) => c.status === "referred").length,
      monitoring: allActive.filter((c) => c.status === "monitoring").length,
    };

    // Category breakdown
    const byCategory: Record<string, number> = {};
    allActive.forEach((c) => {
      byCategory[c.category] = (byCategory[c.category] || 0) + 1;
    });

    // Overdue follow-ups
    const overdueConcerns = allActive.filter(
      (c) =>
        c.follow_up_date && c.follow_up_date < today && c.status !== "closed",
    );

    // Recent (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentCount = allActive.filter(
      (c) => new Date(c.created_at) >= sevenDaysAgo,
    ).length;

    // Open untriaged
    const openUntriaged = allActive.filter((c) => c.status === "open").length;

    // Referral outcomes
    const referralOutcomes: Record<string, number> = {};
    (referrals || []).forEach((r) => {
      const status = r.outcome_status || "pending";
      referralOutcomes[status] = (referralOutcomes[status] || 0) + 1;
    });

    return apiSuccess({
      summary: {
        total_active: allActive.length,
        by_severity: bySeverity,
        by_status: byStatus,
        by_category: byCategory,
        overdue_follow_ups: overdueConcerns.length,
        recent_7_days: recentCount,
        closed_this_year: closedThisYear || 0,
        open_untriaged: openUntriaged,
        total_referrals: (referrals || []).length,
        referral_outcomes: referralOutcomes,
      },
      recent_concerns: allActive.slice(0, 20),
      overdue_concerns: overdueConcerns,
      referrals: referrals || [],
    });
  },
  { requiredRole: "teacher" },
);

/**
 * POST /api/safeguarding
 * Create a new safeguarding concern (convenience alias for /api/safeguarding/concerns POST)
 */
export const POST = protectedRoute(
  async (auth, request) => {
    const { organizationId, userId } = auth;
    const body = await request.json();
    const {
      pupil_pseudonym_id,
      pupil_display_name,
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

    // Generate reference number: SG-YYYY-NNN
    const year = new Date().getFullYear();
    const prefix = `SG-${year}-`;
    const { data: lastConcern } = await supabase
      .from("safeguarding_concerns")
      .select("reference_number")
      .eq("organization_id", organizationId)
      .like("reference_number", `${prefix}%`)
      .order("reference_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    let nextNum = 1;
    if (lastConcern?.reference_number) {
      const lastNum = parseInt(lastConcern.reference_number.split("-")[2], 10);
      if (!isNaN(lastNum)) nextNum = lastNum + 1;
    }
    const reference_number = `${prefix}${String(nextNum).padStart(3, "0")}`;

    const { data: concern, error } = await supabase
      .from("safeguarding_concerns")
      .insert({
        organization_id: organizationId,
        reference_number,
        reported_by: is_anonymous ? null : userId,
        pupil_pseudonym_id: pupil_pseudonym_id || null,
        pupil_display_name: pupil_display_name || "Unknown Pupil",
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

function getAcademicYearStart(): Date {
  const now = new Date();
  const year = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
  return new Date(year, 8, 1); // September 1st
}
