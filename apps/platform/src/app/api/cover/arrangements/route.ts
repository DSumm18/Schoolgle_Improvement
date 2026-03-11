/**
 * Cover Management — Arrangements API
 *
 * GET  /api/cover/arrangements — Get cover arrangements for a date/week
 * POST /api/cover/arrangements — Create a cover arrangement
 */

import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

// ─── Demo Data ──────────────────────────────────────────────────────

function getDemoArrangements() {
  const today = new Date().toISOString().split("T")[0];

  return [
    // Sarah Mitchell (Year 4) — sickness
    {
      id: "cov-001",
      absence_id: "abs-001",
      staff_name: "Sarah Mitchell",
      staff_role: "Year 4 Teacher",
      date: today,
      period: "Reg",
      class_name: "4M",
      cover_type: "internal",
      cover_staff_name: "Helen Barnes",
      cover_staff_role: "HLTA",
      subject: "Registration",
      notes: "Morning registration and assembly",
      status: "confirmed",
      cost: 0,
    },
    {
      id: "cov-002",
      absence_id: "abs-001",
      staff_name: "Sarah Mitchell",
      staff_role: "Year 4 Teacher",
      date: today,
      period: "P1",
      class_name: "4M",
      cover_type: "internal",
      cover_staff_name: "Helen Barnes",
      cover_staff_role: "HLTA",
      subject: "English",
      notes: "Literacy — comprehension worksheets printed",
      status: "confirmed",
      cost: 0,
    },
    {
      id: "cov-003",
      absence_id: "abs-001",
      staff_name: "Sarah Mitchell",
      staff_role: "Year 4 Teacher",
      date: today,
      period: "P2",
      class_name: "4M",
      cover_type: "supply",
      cover_staff_name: "Janet Taylor",
      cover_staff_role: "Supply (Reed Education)",
      subject: "Maths",
      notes: "Multiplication unit — page 34-35",
      status: "confirmed",
      cost: 35,
    },
    {
      id: "cov-004",
      absence_id: "abs-001",
      staff_name: "Sarah Mitchell",
      staff_role: "Year 4 Teacher",
      date: today,
      period: "P3",
      class_name: "4M",
      cover_type: "supply",
      cover_staff_name: "Janet Taylor",
      cover_staff_role: "Supply (Reed Education)",
      subject: "Science",
      notes: "States of matter — experiment prep on bench",
      status: "confirmed",
      cost: 35,
    },
    {
      id: "cov-005",
      absence_id: "abs-001",
      staff_name: "Sarah Mitchell",
      staff_role: "Year 4 Teacher",
      date: today,
      period: "P4",
      class_name: "4M",
      cover_type: "supply",
      cover_staff_name: "Janet Taylor",
      cover_staff_role: "Supply (Reed Education)",
      subject: "Topic",
      notes: "Ancient Egypt project work",
      status: "confirmed",
      cost: 35,
    },
    {
      id: "cov-006",
      absence_id: "abs-001",
      staff_name: "Sarah Mitchell",
      staff_role: "Year 4 Teacher",
      date: today,
      period: "P5",
      class_name: "4M",
      cover_type: "supply",
      cover_staff_name: "Janet Taylor",
      cover_staff_role: "Supply (Reed Education)",
      subject: "Art",
      notes: "Egyptian masks — clay work",
      status: "confirmed",
      cost: 35,
    },
    // James Anderson (Year 6) — sickness
    {
      id: "cov-007",
      absence_id: "abs-002",
      staff_name: "James Anderson",
      staff_role: "Year 6 Teacher",
      date: today,
      period: "Reg",
      class_name: "6A",
      cover_type: "internal",
      cover_staff_name: "Mark Stevens",
      cover_staff_role: "Deputy Head",
      subject: "Registration",
      notes: "Morning registration",
      status: "confirmed",
      cost: 0,
    },
    {
      id: "cov-008",
      absence_id: "abs-002",
      staff_name: "James Anderson",
      staff_role: "Year 6 Teacher",
      date: today,
      period: "P1",
      class_name: "6A",
      cover_type: "internal",
      cover_staff_name: "Mark Stevens",
      cover_staff_role: "Deputy Head",
      subject: "English",
      notes: "SATs revision — reading paper practice",
      status: "confirmed",
      cost: 0,
    },
    {
      id: "cov-009",
      absence_id: "abs-002",
      staff_name: "James Anderson",
      staff_role: "Year 6 Teacher",
      date: today,
      period: "P2",
      class_name: "6A",
      cover_type: "internal",
      cover_staff_name: "Mark Stevens",
      cover_staff_role: "Deputy Head",
      subject: "Maths",
      notes: "SATs revision — arithmetic paper",
      status: "confirmed",
      cost: 0,
    },
    {
      id: "cov-010",
      absence_id: "abs-002",
      staff_name: "James Anderson",
      staff_role: "Year 6 Teacher",
      date: today,
      period: "P3",
      class_name: "6A",
      cover_type: "pending",
      cover_staff_name: "",
      cover_staff_role: "",
      subject: "Science",
      notes: "Needs cover — evolution unit",
      status: "pending",
      cost: 0,
    },
    {
      id: "cov-011",
      absence_id: "abs-002",
      staff_name: "James Anderson",
      staff_role: "Year 6 Teacher",
      date: today,
      period: "P4",
      class_name: "6A",
      cover_type: "uncovered",
      cover_staff_name: "",
      cover_staff_role: "",
      subject: "PE",
      notes: "UNCOVERED — needs arrangement",
      status: "uncovered",
      cost: 0,
    },
    {
      id: "cov-012",
      absence_id: "abs-002",
      staff_name: "James Anderson",
      staff_role: "Year 6 Teacher",
      date: today,
      period: "P5",
      class_name: "6A",
      cover_type: "internal",
      cover_staff_name: "Susan Clarke",
      cover_staff_role: "SENCO (non-teaching afternoon)",
      subject: "PSHE",
      notes: "Transition topic — secondary school prep",
      status: "confirmed",
      cost: 0,
    },
    // Emily Roberts (Year 2) — half day AM
    {
      id: "cov-013",
      absence_id: "abs-003",
      staff_name: "Emily Roberts",
      staff_role: "Year 2 Teacher",
      date: today,
      period: "Reg",
      class_name: "2R",
      cover_type: "internal",
      cover_staff_name: "Lisa Morgan",
      cover_staff_role: "TA3 (Year 2)",
      subject: "Registration",
      notes: "Emily returning PM — TA covering AM",
      status: "confirmed",
      cost: 0,
    },
    {
      id: "cov-014",
      absence_id: "abs-003",
      staff_name: "Emily Roberts",
      staff_role: "Year 2 Teacher",
      date: today,
      period: "P1",
      class_name: "2R",
      cover_type: "internal",
      cover_staff_name: "Lisa Morgan",
      cover_staff_role: "TA3 (Year 2)",
      subject: "Phonics",
      notes: "Phase 5 — split digraphs group work",
      status: "confirmed",
      cost: 0,
    },
    {
      id: "cov-015",
      absence_id: "abs-003",
      staff_name: "Emily Roberts",
      staff_role: "Year 2 Teacher",
      date: today,
      period: "P2",
      class_name: "2R",
      cover_type: "internal",
      cover_staff_name: "Lisa Morgan",
      cover_staff_role: "TA3 (Year 2)",
      subject: "Maths",
      notes: "Addition and subtraction — concrete resources",
      status: "confirmed",
      cost: 0,
    },
    // David Thompson (PE) — training
    {
      id: "cov-016",
      absence_id: "abs-004",
      staff_name: "David Thompson",
      staff_role: "PE Teacher",
      date: today,
      period: "P2",
      class_name: "3C (PE)",
      cover_type: "internal",
      cover_staff_name: "Tom Wilson",
      cover_staff_role: "Year 5 Teacher (free period)",
      subject: "PE",
      notes: "Gymnastics — hall booked",
      status: "confirmed",
      cost: 0,
    },
    {
      id: "cov-017",
      absence_id: "abs-004",
      staff_name: "David Thompson",
      staff_role: "PE Teacher",
      date: today,
      period: "P4",
      class_name: "5W (PE)",
      cover_type: "pending",
      cover_staff_name: "",
      cover_staff_role: "",
      subject: "PE",
      notes: "Athletics — pending cover arrangement",
      status: "pending",
      cost: 0,
    },
    // Rachel Green (Year 1) — family emergency
    {
      id: "cov-018",
      absence_id: "abs-005",
      staff_name: "Rachel Green",
      staff_role: "Year 1 Teacher",
      date: today,
      period: "Reg",
      class_name: "1G",
      cover_type: "uncovered",
      cover_staff_name: "",
      cover_staff_role: "",
      subject: "Registration",
      notes: "UNCOVERED — called in at 7:30am",
      status: "uncovered",
      cost: 0,
    },
    {
      id: "cov-019",
      absence_id: "abs-005",
      staff_name: "Rachel Green",
      staff_role: "Year 1 Teacher",
      date: today,
      period: "P1",
      class_name: "1G",
      cover_type: "uncovered",
      cover_staff_name: "",
      cover_staff_role: "",
      subject: "English",
      notes: "UNCOVERED — trying supply agencies",
      status: "uncovered",
      cost: 0,
    },
    {
      id: "cov-020",
      absence_id: "abs-005",
      staff_name: "Rachel Green",
      staff_role: "Year 1 Teacher",
      date: today,
      period: "P2",
      class_name: "1G",
      cover_type: "uncovered",
      cover_staff_name: "",
      cover_staff_role: "",
      subject: "Maths",
      notes: "UNCOVERED",
      status: "uncovered",
      cost: 0,
    },
    {
      id: "cov-021",
      absence_id: "abs-005",
      staff_name: "Rachel Green",
      staff_role: "Year 1 Teacher",
      date: today,
      period: "P3",
      class_name: "1G",
      cover_type: "uncovered",
      cover_staff_name: "",
      cover_staff_role: "",
      subject: "Science",
      notes: "UNCOVERED",
      status: "uncovered",
      cost: 0,
    },
    {
      id: "cov-022",
      absence_id: "abs-005",
      staff_name: "Rachel Green",
      staff_role: "Year 1 Teacher",
      date: today,
      period: "P4",
      class_name: "1G",
      cover_type: "uncovered",
      cover_staff_name: "",
      cover_staff_role: "",
      subject: "Topic",
      notes: "UNCOVERED",
      status: "uncovered",
      cost: 0,
    },
    {
      id: "cov-023",
      absence_id: "abs-005",
      staff_name: "Rachel Green",
      staff_role: "Year 1 Teacher",
      date: today,
      period: "P5",
      class_name: "1G",
      cover_type: "uncovered",
      cover_staff_name: "",
      cover_staff_role: "",
      subject: "Music",
      notes: "UNCOVERED",
      status: "uncovered",
      cost: 0,
    },
  ];
}

// ─── GET Arrangements ───────────────────────────────────────────────

export const GET = protectedRoute(async (auth, request) => {
  const { organizationId } = auth;
  const supabase = createServiceRoleClient();
  const searchParams = request.nextUrl.searchParams;

  const date = searchParams.get("date");
  const weekStart = searchParams.get("week_start");
  const absenceId = searchParams.get("absence_id");

  // Try real data
  let query = supabase
    .from("cover_arrangements")
    .select("*")
    .eq("organization_id", organizationId)
    .order("date", { ascending: true })
    .order("period", { ascending: true });

  if (date) query = query.eq("date", date);
  if (weekStart) {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 4); // Mon-Fri
    query = query
      .gte("date", weekStart)
      .lte("date", weekEnd.toISOString().split("T")[0]);
  }
  if (absenceId) query = query.eq("absence_id", absenceId);

  const { data, error } = await query;

  if (error || !data || data.length === 0) {
    let demo = getDemoArrangements();
    if (date) demo = demo.filter((a) => a.date === date);
    if (absenceId) demo = demo.filter((a) => a.absence_id === absenceId);

    return apiSuccess({ arrangements: demo, demo: true });
  }

  return apiSuccess({ arrangements: data, demo: false });
});

// ─── POST Arrangement ───────────────────────────────────────────────

export const POST = protectedRoute(async (auth, request) => {
  const { organizationId, userId } = auth;
  const supabase = createServiceRoleClient();
  const body = await request.json();

  const {
    absence_id,
    date,
    period,
    class_name,
    cover_type,
    cover_staff_id,
    cover_staff_name,
    cover_staff_role,
    subject,
    notes,
    cost,
    agency_name,
  } = body;

  if (!absence_id || !date || !period || !class_name) {
    return apiError(
      "Missing required fields: absence_id, date, period, class_name",
      400,
    );
  }

  const { data, error } = await supabase
    .from("cover_arrangements")
    .insert({
      organization_id: organizationId,
      absence_id,
      date,
      period,
      class_name,
      cover_type: cover_type || "pending",
      cover_staff_id,
      cover_staff_name,
      cover_staff_role,
      subject,
      notes,
      cost: cost || 0,
      agency_name,
      status: cover_staff_name ? "confirmed" : "pending",
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    console.error("[Cover] Failed to create arrangement:", error);
    return apiError("Failed to create cover arrangement", 500);
  }

  return apiSuccess({ arrangement: data }, 201);
});
