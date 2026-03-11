/**
 * Behaviour Exclusions API
 *
 * GET /api/behaviour/exclusions - List exclusions with filters
 * POST /api/behaviour/exclusions - Create an exclusion (linked to incident)
 */

import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

// ─── Demo Exclusions ──────────────────────────────────────────────

function generateDemoExclusions() {
  const now = new Date();

  return [
    {
      id: "demo-excl-1",
      organization_id: "demo",
      incident_id: "demo-neg-7",
      pupil_name: "Jake Williams",
      pupil_id: "pupil-3",
      year_group: 10,
      exclusion_type: "fixed_term",
      reason: "Persistent disruptive behaviour over multiple lessons",
      start_date: new Date(now.getTime() - 2 * 86400000)
        .toISOString()
        .split("T")[0],
      end_date: new Date(now.getTime() + 1 * 86400000)
        .toISOString()
        .split("T")[0],
      days: 3,
      is_sen: false,
      is_fsm: true,
      is_lac: false,
      ethnicity: "White British",
      governor_informed: true,
      governor_review_date: new Date(now.getTime() + 7 * 86400000)
        .toISOString()
        .split("T")[0],
      reintegration_meeting: null,
      reintegration_completed: false,
      parent_notified: true,
      parent_notification_date: new Date(
        now.getTime() - 2 * 86400000,
      ).toISOString(),
      la_notified: false,
      alternative_provision: null,
      notes:
        "Parents informed by phone and letter. Work sent home for duration.",
      cumulative_days_this_year: 5,
      status: "active",
      created_at: new Date(now.getTime() - 2 * 86400000).toISOString(),
      updated_at: new Date(now.getTime() - 2 * 86400000).toISOString(),
    },
    {
      id: "demo-excl-2",
      organization_id: "demo",
      incident_id: "demo-neg-8",
      pupil_name: "Mason Clarke",
      pupil_id: "pupil-11",
      year_group: 9,
      exclusion_type: "lunchtime",
      reason: "Physical aggression towards another pupil in the dining hall",
      start_date: new Date(now.getTime() - 1 * 86400000)
        .toISOString()
        .split("T")[0],
      end_date: new Date(now.getTime() + 2 * 86400000)
        .toISOString()
        .split("T")[0],
      days: 3,
      is_sen: true,
      is_fsm: true,
      is_lac: false,
      ethnicity: "White British",
      governor_informed: true,
      governor_review_date: null,
      reintegration_meeting: new Date(now.getTime() + 3 * 86400000)
        .toISOString()
        .split("T")[0],
      reintegration_completed: false,
      parent_notified: true,
      parent_notification_date: new Date(
        now.getTime() - 1 * 86400000,
      ).toISOString(),
      la_notified: false,
      alternative_provision: null,
      notes: "SEN support plan reviewed. Behaviour support plan to be updated.",
      cumulative_days_this_year: 3,
      status: "active",
      created_at: new Date(now.getTime() - 1 * 86400000).toISOString(),
      updated_at: new Date(now.getTime() - 1 * 86400000).toISOString(),
    },
    {
      id: "demo-excl-3",
      organization_id: "demo",
      incident_id: "demo-neg-3",
      pupil_name: "Ethan Patel",
      pupil_id: "pupil-5",
      year_group: 11,
      exclusion_type: "fixed_term",
      reason: "Verbal abuse towards member of staff",
      start_date: new Date(now.getTime() - 10 * 86400000)
        .toISOString()
        .split("T")[0],
      end_date: new Date(now.getTime() - 6 * 86400000)
        .toISOString()
        .split("T")[0],
      days: 5,
      is_sen: false,
      is_fsm: false,
      is_lac: false,
      ethnicity: "Asian British",
      governor_informed: true,
      governor_review_date: new Date(now.getTime() - 3 * 86400000)
        .toISOString()
        .split("T")[0],
      reintegration_meeting: new Date(now.getTime() - 5 * 86400000)
        .toISOString()
        .split("T")[0],
      reintegration_completed: true,
      parent_notified: true,
      parent_notification_date: new Date(
        now.getTime() - 10 * 86400000,
      ).toISOString(),
      la_notified: true,
      alternative_provision: null,
      notes:
        "Reintegration meeting completed. Behaviour contract signed. Mentor assigned.",
      cumulative_days_this_year: 8,
      status: "completed",
      created_at: new Date(now.getTime() - 10 * 86400000).toISOString(),
      updated_at: new Date(now.getTime() - 5 * 86400000).toISOString(),
    },
    {
      id: "demo-excl-4",
      organization_id: "demo",
      incident_id: null,
      pupil_name: "Charlie Hall",
      pupil_id: "pupil-19",
      year_group: 10,
      exclusion_type: "managed_move",
      reason:
        "Persistent behaviour issues - agreed managed move with receiving school",
      start_date: new Date(now.getTime() - 20 * 86400000)
        .toISOString()
        .split("T")[0],
      end_date: null,
      days: 0,
      is_sen: true,
      is_fsm: true,
      is_lac: true,
      ethnicity: "White British",
      governor_informed: true,
      governor_review_date: new Date(now.getTime() - 15 * 86400000)
        .toISOString()
        .split("T")[0],
      reintegration_meeting: null,
      reintegration_completed: false,
      parent_notified: true,
      parent_notification_date: new Date(
        now.getTime() - 21 * 86400000,
      ).toISOString(),
      la_notified: true,
      alternative_provision: "Oakfield Academy - 6 week trial placement",
      notes:
        "Managed move agreed by all parties. 6-week trial at Oakfield Academy. Review meeting scheduled for end of trial.",
      cumulative_days_this_year: 12,
      status: "active",
      created_at: new Date(now.getTime() - 20 * 86400000).toISOString(),
      updated_at: new Date(now.getTime() - 15 * 86400000).toISOString(),
    },
  ];
}

// ─── Routes ──────────────────────────────────────────────────────

export const GET = protectedRoute(async (auth, request) => {
  const { organizationId } = auth;
  const supabase = createServiceRoleClient();
  const params = request.nextUrl.searchParams;

  const exclusion_type = params.get("exclusion_type");
  const status = params.get("status");
  const date_from = params.get("date_from");
  const date_to = params.get("date_to");

  let query = supabase
    .from("behaviour_exclusions")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (exclusion_type) query = query.eq("exclusion_type", exclusion_type);
  if (status) query = query.eq("status", status);
  if (date_from) query = query.gte("start_date", date_from);
  if (date_to) query = query.lte("start_date", date_to);

  const { data, error } = await query;

  if (error) {
    console.error("[behaviour/exclusions] DB error:", error);
  }

  if (!data || data.length === 0) {
    let demoData = generateDemoExclusions();
    if (exclusion_type)
      demoData = demoData.filter((d) => d.exclusion_type === exclusion_type);
    if (status) demoData = demoData.filter((d) => d.status === status);

    return apiSuccess({ exclusions: demoData, demo: true });
  }

  return apiSuccess({ exclusions: data, demo: false });
});

export const POST = protectedRoute(
  async (auth, request) => {
    const { organizationId } = auth;
    const supabase = createServiceRoleClient();
    const body = await request.json();

    const {
      incident_id,
      pupil_name,
      pupil_id,
      year_group,
      exclusion_type,
      reason,
      start_date,
      end_date,
      days,
      is_sen,
      is_fsm,
      is_lac,
      ethnicity,
      alternative_provision,
      notes,
    } = body;

    if (!pupil_name || !exclusion_type || !reason || !start_date) {
      return apiError(
        "pupil_name, exclusion_type, reason, and start_date are required",
        400,
      );
    }

    const validTypes = [
      "fixed_term",
      "permanent",
      "lunchtime",
      "managed_move",
      "alternative_provision",
    ];
    if (!validTypes.includes(exclusion_type)) {
      return apiError(
        `exclusion_type must be one of: ${validTypes.join(", ")}`,
        400,
      );
    }

    const { data, error } = await supabase
      .from("behaviour_exclusions")
      .insert({
        organization_id: organizationId,
        incident_id: incident_id || null,
        pupil_name,
        pupil_id: pupil_id || null,
        year_group: year_group || null,
        exclusion_type,
        reason,
        start_date,
        end_date: end_date || null,
        days: days || 0,
        is_sen: is_sen || false,
        is_fsm: is_fsm || false,
        is_lac: is_lac || false,
        ethnicity: ethnicity || null,
        governor_informed: false,
        parent_notified: false,
        la_notified: false,
        reintegration_completed: false,
        alternative_provision: alternative_provision || null,
        notes: notes || null,
        status: "active",
      })
      .select()
      .single();

    if (error) {
      console.error("[behaviour/exclusions] Insert error:", error);
      return apiError("Failed to create exclusion", 500);
    }

    return apiSuccess(data, 201);
  },
  { requiredRole: "teacher" },
);
