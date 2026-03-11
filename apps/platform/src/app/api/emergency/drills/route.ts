/**
 * Emergency Drills API
 *
 * GET  /api/emergency/drills - List drill history for organization
 * POST /api/emergency/drills - Log a new drill
 */

import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

export const GET = protectedRoute(async (auth, request) => {
  const { organizationId } = auth;
  const supabase = createServiceRoleClient();

  const url = new URL(request.url);
  const type = url.searchParams.get("type");
  const limit = parseInt(url.searchParams.get("limit") || "50");

  let query = supabase
    .from("emergency_drills")
    .select("*")
    .eq("organization_id", organizationId)
    .order("drill_date", { ascending: false })
    .limit(limit);

  if (type) {
    query = query.eq("drill_type", type);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[Emergency Drills] GET error:", error);
    return apiError("Failed to fetch drills", 500);
  }

  if (!data || data.length === 0) {
    return apiSuccess({ drills: getDemoDrills(), isDemo: true });
  }

  return apiSuccess({ drills: data, isDemo: false });
});

export const POST = protectedRoute(async (auth, request) => {
  const { organizationId, userId } = auth;
  const supabase = createServiceRoleClient();
  const body = await request.json();

  const {
    drill_type,
    drill_date,
    evacuation_time_seconds,
    all_accounted_for,
    total_persons,
    persons_accounted,
    issues_found,
    notes,
    weather_conditions,
    time_of_day,
    announced,
    conducted_by,
  } = body;

  if (!drill_type || !drill_date) {
    return apiError("drill_type and drill_date are required", 400);
  }

  const validTypes = [
    "fire_evacuation",
    "lockdown",
    "shelter_in_place",
    "bomb_threat",
    "intruder",
    "flood",
    "gas_leak",
    "pandemic",
  ];

  if (!validTypes.includes(drill_type)) {
    return apiError(
      `Invalid drill_type. Must be one of: ${validTypes.join(", ")}`,
      400,
    );
  }

  const { data, error } = await supabase
    .from("emergency_drills")
    .insert({
      organization_id: organizationId,
      drill_type,
      drill_date,
      evacuation_time_seconds: evacuation_time_seconds || null,
      all_accounted_for: all_accounted_for ?? true,
      total_persons: total_persons || null,
      persons_accounted: persons_accounted || null,
      issues_found: issues_found || [],
      notes: notes || "",
      weather_conditions: weather_conditions || null,
      time_of_day: time_of_day || null,
      announced: announced ?? true,
      conducted_by: conducted_by || userId,
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    console.error("[Emergency Drills] POST error:", error);
    return apiError("Failed to log drill", 500);
  }

  return apiSuccess(data, 201);
});

// ─── Demo Data ──────────────────────────────────────────────────────

function getDemoDrills() {
  const now = new Date();

  function daysAgo(d: number) {
    const date = new Date(now);
    date.setDate(date.getDate() - d);
    return date.toISOString().split("T")[0];
  }

  return [
    {
      id: "demo-drill-1",
      drill_type: "fire_evacuation",
      drill_date: daysAgo(14),
      evacuation_time_seconds: 195,
      all_accounted_for: true,
      total_persons: 287,
      persons_accounted: 287,
      issues_found: [],
      notes:
        "Smooth evacuation. Year 3 class slightly delayed due to PE lesson in hall. All accounted for within target time.",
      weather_conditions: "dry",
      time_of_day: "morning",
      announced: false,
      conducted_by: "Mrs Carter",
      created_at: daysAgo(14),
    },
    {
      id: "demo-drill-2",
      drill_type: "fire_evacuation",
      drill_date: daysAgo(98),
      evacuation_time_seconds: 210,
      all_accounted_for: true,
      total_persons: 291,
      persons_accounted: 291,
      issues_found: ["Year 5 exit door was stiff - maintenance requested"],
      notes:
        "Autumn term drill. One minor issue with exit door. Reported to site manager for repair.",
      weather_conditions: "wet",
      time_of_day: "afternoon",
      announced: false,
      conducted_by: "Mr Brown",
      created_at: daysAgo(98),
    },
    {
      id: "demo-drill-3",
      drill_type: "fire_evacuation",
      drill_date: daysAgo(210),
      evacuation_time_seconds: 240,
      all_accounted_for: false,
      total_persons: 285,
      persons_accounted: 283,
      issues_found: [
        "2 pupils unaccounted for initially - found in toilets",
        "Toilet check procedure needs reinforcing",
      ],
      notes:
        "Summer term drill. Two pupils missed in initial count as they were in toilets. Toilet sweep procedure to be reinforced with all staff.",
      weather_conditions: "dry",
      time_of_day: "morning",
      announced: true,
      conducted_by: "Mrs Carter",
      created_at: daysAgo(210),
    },
    {
      id: "demo-drill-4",
      drill_type: "lockdown",
      drill_date: daysAgo(45),
      evacuation_time_seconds: 120,
      all_accounted_for: true,
      total_persons: 289,
      persons_accounted: 289,
      issues_found: [],
      notes:
        "Annual lockdown drill. All classrooms locked within 2 minutes. Tannoy system worked well. Staff used walkie-talkies to confirm secure.",
      weather_conditions: "dry",
      time_of_day: "morning",
      announced: false,
      conducted_by: "Mrs Carter",
      created_at: daysAgo(45),
    },
    {
      id: "demo-drill-5",
      drill_type: "fire_evacuation",
      drill_date: daysAgo(320),
      evacuation_time_seconds: 225,
      all_accounted_for: true,
      total_persons: 282,
      persons_accounted: 282,
      issues_found: ["Assembly point markers faded - need repainting"],
      notes:
        "Spring term drill previous year. Noted assembly point markings need refreshing.",
      weather_conditions: "cold",
      time_of_day: "morning",
      announced: false,
      conducted_by: "Mr Brown",
      created_at: daysAgo(320),
    },
    {
      id: "demo-drill-6",
      drill_type: "shelter_in_place",
      drill_date: daysAgo(180),
      evacuation_time_seconds: 300,
      all_accounted_for: true,
      total_persons: 290,
      persons_accounted: 290,
      issues_found: [
        "HVAC shutdown took longer than expected - site manager training needed",
      ],
      notes:
        "First shelter-in-place drill. All brought inside within 3 minutes. HVAC shutdown procedure needs practice.",
      weather_conditions: "dry",
      time_of_day: "afternoon",
      announced: true,
      conducted_by: "Mrs Carter",
      created_at: daysAgo(180),
    },
    {
      id: "demo-drill-7",
      drill_type: "fire_evacuation",
      drill_date: daysAgo(420),
      evacuation_time_seconds: 260,
      all_accounted_for: true,
      total_persons: 278,
      persons_accounted: 278,
      issues_found: [
        "New staff unfamiliar with assembly points",
        "Need to include drill in September induction",
      ],
      notes:
        "Autumn term drill. New staff required guidance. Added to induction checklist.",
      weather_conditions: "wet",
      time_of_day: "morning",
      announced: false,
      conducted_by: "Mr Thompson",
      created_at: daysAgo(420),
    },
    {
      id: "demo-drill-8",
      drill_type: "lockdown",
      drill_date: daysAgo(410),
      evacuation_time_seconds: 150,
      all_accounted_for: true,
      total_persons: 280,
      persons_accounted: 280,
      issues_found: ["One classroom door lock faulty - replaced same day"],
      notes:
        "Annual lockdown drill. One faulty lock identified and replaced. Good response overall.",
      weather_conditions: "dry",
      time_of_day: "afternoon",
      announced: false,
      conducted_by: "Mrs Carter",
      created_at: daysAgo(410),
    },
  ];
}
