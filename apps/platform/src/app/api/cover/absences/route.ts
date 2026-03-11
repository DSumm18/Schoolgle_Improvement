/**
 * Cover Management — Absences API
 *
 * GET  /api/cover/absences — List absences with filters
 * POST /api/cover/absences — Record a new absence
 */

import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

// ─── Absence Types ──────────────────────────────────────────────────

export type AbsenceType =
  | "sickness"
  | "family_emergency"
  | "bereavement"
  | "medical_appointment"
  | "training"
  | "jury_service"
  | "maternity"
  | "paternity"
  | "adoption"
  | "authorised_unpaid"
  | "unauthorised"
  | "suspension"
  | "other";

// ─── Demo Data ──────────────────────────────────────────────────────

function getDemoAbsences() {
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  const lastWeek = new Date(Date.now() - 7 * 86400000)
    .toISOString()
    .split("T")[0];
  const twoWeeksAgo = new Date(Date.now() - 14 * 86400000)
    .toISOString()
    .split("T")[0];
  const threeWeeksAgo = new Date(Date.now() - 21 * 86400000)
    .toISOString()
    .split("T")[0];
  const monthAgo = new Date(Date.now() - 30 * 86400000)
    .toISOString()
    .split("T")[0];

  return [
    {
      id: "abs-001",
      staff_id: "staff-001",
      staff_name: "Sarah Mitchell",
      staff_role: "Year 4 Teacher",
      absence_type: "sickness" as AbsenceType,
      start_date: today,
      end_date: today,
      half_day: false,
      half_day_period: null,
      total_days: 1,
      reason: "Flu symptoms",
      sick_note_received: false,
      return_to_work_completed: false,
      cover_required: true,
      status: "active",
      created_at: today,
    },
    {
      id: "abs-002",
      staff_id: "staff-002",
      staff_name: "James Anderson",
      staff_role: "Year 6 Teacher",
      absence_type: "sickness" as AbsenceType,
      start_date: yesterday,
      end_date: today,
      half_day: false,
      half_day_period: null,
      total_days: 2,
      reason: "Back pain",
      sick_note_received: false,
      return_to_work_completed: false,
      cover_required: true,
      status: "active",
      created_at: yesterday,
    },
    {
      id: "abs-003",
      staff_id: "staff-003",
      staff_name: "Emily Roberts",
      staff_role: "Year 2 Teacher",
      absence_type: "medical_appointment" as AbsenceType,
      start_date: today,
      end_date: today,
      half_day: true,
      half_day_period: "am",
      total_days: 0.5,
      reason: "Hospital appointment",
      sick_note_received: false,
      return_to_work_completed: false,
      cover_required: true,
      status: "active",
      created_at: today,
    },
    {
      id: "abs-004",
      staff_id: "staff-004",
      staff_name: "David Thompson",
      staff_role: "PE Teacher",
      absence_type: "training" as AbsenceType,
      start_date: today,
      end_date: today,
      half_day: false,
      half_day_period: null,
      total_days: 1,
      reason: "Safeguarding Level 3 training",
      sick_note_received: false,
      return_to_work_completed: false,
      cover_required: true,
      status: "active",
      created_at: lastWeek,
    },
    {
      id: "abs-005",
      staff_id: "staff-005",
      staff_name: "Rachel Green",
      staff_role: "Year 1 Teacher",
      absence_type: "family_emergency" as AbsenceType,
      start_date: today,
      end_date: today,
      half_day: false,
      half_day_period: null,
      total_days: 1,
      reason: "Child unwell — no childcare",
      sick_note_received: false,
      return_to_work_completed: false,
      cover_required: true,
      status: "active",
      created_at: today,
    },
    // Historical absences
    {
      id: "abs-006",
      staff_id: "staff-001",
      staff_name: "Sarah Mitchell",
      staff_role: "Year 4 Teacher",
      absence_type: "sickness" as AbsenceType,
      start_date: twoWeeksAgo,
      end_date: new Date(Date.now() - 12 * 86400000)
        .toISOString()
        .split("T")[0],
      half_day: false,
      half_day_period: null,
      total_days: 3,
      reason: "Stomach bug",
      sick_note_received: false,
      return_to_work_completed: true,
      cover_required: true,
      status: "completed",
      created_at: twoWeeksAgo,
    },
    {
      id: "abs-007",
      staff_id: "staff-006",
      staff_name: "Tom Wilson",
      staff_role: "Year 5 Teacher",
      absence_type: "sickness" as AbsenceType,
      start_date: threeWeeksAgo,
      end_date: new Date(Date.now() - 18 * 86400000)
        .toISOString()
        .split("T")[0],
      half_day: false,
      half_day_period: null,
      total_days: 4,
      reason: "COVID",
      sick_note_received: true,
      return_to_work_completed: true,
      cover_required: true,
      status: "completed",
      created_at: threeWeeksAgo,
    },
    {
      id: "abs-008",
      staff_id: "staff-002",
      staff_name: "James Anderson",
      staff_role: "Year 6 Teacher",
      absence_type: "sickness" as AbsenceType,
      start_date: monthAgo,
      end_date: new Date(Date.now() - 28 * 86400000)
        .toISOString()
        .split("T")[0],
      half_day: false,
      half_day_period: null,
      total_days: 3,
      reason: "Migraine",
      sick_note_received: false,
      return_to_work_completed: true,
      cover_required: true,
      status: "completed",
      created_at: monthAgo,
    },
    {
      id: "abs-009",
      staff_id: "staff-007",
      staff_name: "Laura Chen",
      staff_role: "Year 3 Teacher",
      absence_type: "bereavement" as AbsenceType,
      start_date: new Date(Date.now() - 25 * 86400000)
        .toISOString()
        .split("T")[0],
      end_date: new Date(Date.now() - 22 * 86400000)
        .toISOString()
        .split("T")[0],
      half_day: false,
      half_day_period: null,
      total_days: 4,
      reason: "Family bereavement",
      sick_note_received: false,
      return_to_work_completed: true,
      cover_required: true,
      status: "completed",
      created_at: new Date(Date.now() - 25 * 86400000)
        .toISOString()
        .split("T")[0],
    },
    {
      id: "abs-010",
      staff_id: "staff-006",
      staff_name: "Tom Wilson",
      staff_role: "Year 5 Teacher",
      absence_type: "sickness" as AbsenceType,
      start_date: new Date(Date.now() - 45 * 86400000)
        .toISOString()
        .split("T")[0],
      end_date: new Date(Date.now() - 44 * 86400000)
        .toISOString()
        .split("T")[0],
      half_day: false,
      half_day_period: null,
      total_days: 2,
      reason: "Cold",
      sick_note_received: false,
      return_to_work_completed: true,
      cover_required: true,
      status: "completed",
      created_at: new Date(Date.now() - 45 * 86400000)
        .toISOString()
        .split("T")[0],
    },
    {
      id: "abs-011",
      staff_id: "staff-001",
      staff_name: "Sarah Mitchell",
      staff_role: "Year 4 Teacher",
      absence_type: "sickness" as AbsenceType,
      start_date: new Date(Date.now() - 60 * 86400000)
        .toISOString()
        .split("T")[0],
      end_date: new Date(Date.now() - 59 * 86400000)
        .toISOString()
        .split("T")[0],
      half_day: false,
      half_day_period: null,
      total_days: 2,
      reason: "Food poisoning",
      sick_note_received: false,
      return_to_work_completed: true,
      cover_required: true,
      status: "completed",
      created_at: new Date(Date.now() - 60 * 86400000)
        .toISOString()
        .split("T")[0],
    },
    {
      id: "abs-012",
      staff_id: "staff-008",
      staff_name: "Karen Patel",
      staff_role: "Reception Teacher",
      absence_type: "jury_service" as AbsenceType,
      start_date: new Date(Date.now() - 35 * 86400000)
        .toISOString()
        .split("T")[0],
      end_date: new Date(Date.now() - 31 * 86400000)
        .toISOString()
        .split("T")[0],
      half_day: false,
      half_day_period: null,
      total_days: 5,
      reason: "Jury service",
      sick_note_received: false,
      return_to_work_completed: false,
      cover_required: true,
      status: "completed",
      created_at: new Date(Date.now() - 35 * 86400000)
        .toISOString()
        .split("T")[0],
    },
    {
      id: "abs-013",
      staff_id: "staff-003",
      staff_name: "Emily Roberts",
      staff_role: "Year 2 Teacher",
      absence_type: "sickness" as AbsenceType,
      start_date: new Date(Date.now() - 50 * 86400000)
        .toISOString()
        .split("T")[0],
      end_date: new Date(Date.now() - 50 * 86400000)
        .toISOString()
        .split("T")[0],
      half_day: false,
      half_day_period: null,
      total_days: 1,
      reason: "Migraine",
      sick_note_received: false,
      return_to_work_completed: true,
      cover_required: true,
      status: "completed",
      created_at: new Date(Date.now() - 50 * 86400000)
        .toISOString()
        .split("T")[0],
    },
    {
      id: "abs-014",
      staff_id: "staff-004",
      staff_name: "David Thompson",
      staff_role: "PE Teacher",
      absence_type: "training" as AbsenceType,
      start_date: new Date(Date.now() - 40 * 86400000)
        .toISOString()
        .split("T")[0],
      end_date: new Date(Date.now() - 40 * 86400000)
        .toISOString()
        .split("T")[0],
      half_day: false,
      half_day_period: null,
      total_days: 1,
      reason: "First Aid at Work refresher",
      sick_note_received: false,
      return_to_work_completed: false,
      cover_required: true,
      status: "completed",
      created_at: new Date(Date.now() - 40 * 86400000)
        .toISOString()
        .split("T")[0],
    },
    {
      id: "abs-015",
      staff_id: "staff-002",
      staff_name: "James Anderson",
      staff_role: "Year 6 Teacher",
      absence_type: "sickness" as AbsenceType,
      start_date: new Date(Date.now() - 70 * 86400000)
        .toISOString()
        .split("T")[0],
      end_date: new Date(Date.now() - 69 * 86400000)
        .toISOString()
        .split("T")[0],
      half_day: false,
      half_day_period: null,
      total_days: 2,
      reason: "Flu",
      sick_note_received: false,
      return_to_work_completed: true,
      cover_required: true,
      status: "completed",
      created_at: new Date(Date.now() - 70 * 86400000)
        .toISOString()
        .split("T")[0],
    },
  ];
}

// ─── GET Absences ───────────────────────────────────────────────────

export const GET = protectedRoute(async (auth, request) => {
  const { organizationId } = auth;
  const supabase = createServiceRoleClient();
  const searchParams = request.nextUrl.searchParams;

  const startDate = searchParams.get("start_date");
  const endDate = searchParams.get("end_date");
  const staffId = searchParams.get("staff_id");
  const absenceType = searchParams.get("type");
  const status = searchParams.get("status");

  // Try real data first
  let query = supabase
    .from("staff_absences")
    .select("*")
    .eq("organization_id", organizationId)
    .order("start_date", { ascending: false });

  if (startDate) query = query.gte("start_date", startDate);
  if (endDate) query = query.lte("end_date", endDate);
  if (staffId) query = query.eq("staff_id", staffId);
  if (absenceType) query = query.eq("absence_type", absenceType);
  if (status) query = query.eq("status", status);

  const { data, error } = await query;

  if (error || !data || data.length === 0) {
    // Return demo data
    let demo = getDemoAbsences();
    if (startDate) demo = demo.filter((a) => a.start_date >= startDate);
    if (endDate) demo = demo.filter((a) => a.end_date <= endDate);
    if (staffId) demo = demo.filter((a) => a.staff_id === staffId);
    if (absenceType) demo = demo.filter((a) => a.absence_type === absenceType);
    if (status) demo = demo.filter((a) => a.status === status);

    return apiSuccess({ absences: demo, demo: true });
  }

  return apiSuccess({ absences: data, demo: false });
});

// ─── POST Absence ───────────────────────────────────────────────────

export const POST = protectedRoute(async (auth, request) => {
  const { organizationId, userId } = auth;
  const supabase = createServiceRoleClient();
  const body = await request.json();

  const {
    staff_id,
    staff_name,
    staff_role,
    absence_type,
    start_date,
    end_date,
    half_day,
    half_day_period,
    reason,
    cover_required,
  } = body;

  if (!staff_id || !absence_type || !start_date || !end_date) {
    return apiError(
      "Missing required fields: staff_id, absence_type, start_date, end_date",
      400,
    );
  }

  // Calculate total days
  const start = new Date(start_date);
  const end = new Date(end_date);
  let totalDays = 0;
  const current = new Date(start);
  while (current <= end) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) totalDays++;
    current.setDate(current.getDate() + 1);
  }
  if (half_day) totalDays = Math.max(totalDays - 0.5, 0.5);

  const { data, error } = await supabase
    .from("staff_absences")
    .insert({
      organization_id: organizationId,
      staff_id,
      staff_name,
      staff_role,
      absence_type,
      start_date,
      end_date,
      half_day: half_day || false,
      half_day_period: half_day_period || null,
      total_days: totalDays,
      reason,
      cover_required: cover_required !== false,
      status: "active",
      recorded_by: userId,
    })
    .select()
    .single();

  if (error) {
    console.error("[Cover] Failed to create absence:", error);
    return apiError("Failed to record absence", 500);
  }

  return apiSuccess({ absence: data }, 201);
});
