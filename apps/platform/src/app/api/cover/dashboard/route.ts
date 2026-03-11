/**
 * Cover Management — Dashboard Stats API
 *
 * GET /api/cover/dashboard — Absence stats, cover costs, Bradford factor alerts, patterns
 */

import { protectedRoute, apiSuccess } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

// ─── Demo Dashboard Data ────────────────────────────────────────────

function getDemoDashboard() {
  const today = new Date().toISOString().split("T")[0];

  return {
    // Today's summary
    today: {
      date: today,
      absences_count: 5,
      periods_needing_cover: 23,
      periods_covered: 15,
      periods_pending: 2,
      periods_uncovered: 6,
      cover_rate: 65,
    },

    // This week
    week: {
      total_absences: 8,
      total_days_lost: 11.5,
      supply_days: 3,
      internal_cover_periods: 18,
      supply_cost: 630,
    },

    // This term
    term: {
      total_absences: 42,
      total_days_lost: 67.5,
      sickness_days: 41,
      other_days: 26.5,
      supply_days: 22,
      supply_cost: 4620,
      average_daily_absence: 1.2,
    },

    // Year to date financials
    ytd: {
      supply_spend: 18450,
      supply_budget: 25000,
      supply_budget_remaining: 6550,
      budget_percentage_used: 73.8,
      average_supply_day_rate: 210,
      icfp_e02_total: 18450, // E02 = supply teaching costs
    },

    // Monthly supply spend (for chart)
    monthly_supply_spend: [
      { month: "Sep", spend: 1260 },
      { month: "Oct", spend: 2100 },
      { month: "Nov", spend: 3150 },
      { month: "Dec", spend: 1680 },
      { month: "Jan", spend: 3780 },
      { month: "Feb", spend: 2940 },
      { month: "Mar", spend: 3540 },
    ],

    // Absence by type (for pie chart)
    absence_by_type: [
      { type: "sickness", count: 28, days: 41, label: "Sickness" },
      { type: "training", count: 5, days: 5, label: "Training/CPD" },
      {
        type: "family_emergency",
        count: 3,
        days: 4,
        label: "Family Emergency",
      },
      { type: "bereavement", count: 1, days: 4, label: "Bereavement" },
      {
        type: "medical_appointment",
        count: 3,
        days: 1.5,
        label: "Medical Appt",
      },
      { type: "jury_service", count: 1, days: 5, label: "Jury Service" },
      { type: "other", count: 1, days: 1, label: "Other" },
    ],

    // Bradford Factor alerts
    bradford_alerts: [
      {
        staff_id: "staff-001",
        staff_name: "Sarah Mitchell",
        staff_role: "Year 4 Teacher",
        spells: 3,
        total_days: 6,
        bradford_score: 54, // 3² × 6 = 54
        trigger_level: "monitor",
        last_absence: today,
      },
      {
        staff_id: "staff-006",
        staff_name: "Tom Wilson",
        staff_role: "Year 5 Teacher",
        spells: 2,
        total_days: 6,
        bradford_score: 24, // 2² × 6 = 24
        trigger_level: "monitor",
        last_absence: new Date(Date.now() - 18 * 86400000)
          .toISOString()
          .split("T")[0],
      },
      {
        staff_id: "staff-002",
        staff_name: "James Anderson",
        staff_role: "Year 6 Teacher",
        spells: 3,
        total_days: 7,
        bradford_score: 63, // 3² × 7 = 63
        trigger_level: "monitor",
        last_absence: today,
      },
      {
        staff_id: "staff-009",
        staff_name: "Angela Foster",
        staff_role: "Year 3 TA",
        spells: 5,
        total_days: 8,
        bradford_score: 200, // 5² × 8 = 200
        trigger_level: "informal_review",
        last_absence: new Date(Date.now() - 5 * 86400000)
          .toISOString()
          .split("T")[0],
      },
      {
        staff_id: "staff-010",
        staff_name: "Paul Chambers",
        staff_role: "Site Manager",
        spells: 7,
        total_days: 14,
        bradford_score: 686, // 7² × 14 = 686
        trigger_level: "formal_meeting",
        last_absence: new Date(Date.now() - 3 * 86400000)
          .toISOString()
          .split("T")[0],
      },
    ],

    // Supply agencies
    supply_agencies: [
      {
        name: "Reed Education",
        daily_rate: 210,
        bookings_ytd: 45,
        spend_ytd: 9450,
        rating: 4.2,
      },
      {
        name: "Hays Education",
        daily_rate: 220,
        bookings_ytd: 28,
        spend_ytd: 6160,
        rating: 3.8,
      },
      {
        name: "Protocol Education",
        daily_rate: 195,
        bookings_ytd: 15,
        spend_ytd: 2925,
        rating: 4.0,
      },
    ],

    // Active supply bookings
    supply_bookings: [
      {
        id: "sup-001",
        supply_name: "Janet Taylor",
        agency: "Reed Education",
        date: today,
        covering_for: "Sarah Mitchell",
        class_name: "4M",
        daily_rate: 210,
        status: "on_site",
      },
      {
        id: "sup-002",
        supply_name: "Maria Santos",
        agency: "Reed Education",
        date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
        covering_for: "James Anderson (if still absent)",
        class_name: "6A",
        daily_rate: 210,
        status: "booked",
      },
      {
        id: "sup-003",
        supply_name: "Chris Blackwell",
        agency: "Hays Education",
        date: new Date(Date.now() + 2 * 86400000).toISOString().split("T")[0],
        covering_for: "Rachel Green (if still absent)",
        class_name: "1G",
        daily_rate: 220,
        status: "booked",
      },
    ],

    // Absence patterns
    patterns: {
      day_of_week: [
        { day: "Monday", count: 14 },
        { day: "Tuesday", count: 7 },
        { day: "Wednesday", count: 6 },
        { day: "Thursday", count: 8 },
        { day: "Friday", count: 12 },
      ],
      return_to_work: {
        completed: 28,
        pending: 6,
        overdue: 3,
        completion_rate: 76,
      },
    },

    demo: true,
  };
}

// ─── GET Dashboard ──────────────────────────────────────────────────

export const GET = protectedRoute(async (auth) => {
  const { organizationId } = auth;
  const supabase = createServiceRoleClient();
  const today = new Date().toISOString().split("T")[0];

  // Check for real data
  const { data: absences, error } = await supabase
    .from("staff_absences")
    .select("id")
    .eq("organization_id", organizationId)
    .limit(1);

  if (error || !absences || absences.length === 0) {
    return apiSuccess(getDemoDashboard());
  }

  // Build real stats from database
  // Today's absences
  const { data: todayAbsences } = await supabase
    .from("staff_absences")
    .select("*")
    .eq("organization_id", organizationId)
    .lte("start_date", today)
    .gte("end_date", today)
    .eq("status", "active");

  // This term absences (assume term started ~12 weeks ago)
  const termStart = new Date();
  termStart.setDate(termStart.getDate() - 84);
  const termStartStr = termStart.toISOString().split("T")[0];

  const { data: termAbsences } = await supabase
    .from("staff_absences")
    .select("*")
    .eq("organization_id", organizationId)
    .gte("start_date", termStartStr);

  // Today's cover arrangements
  const { data: todayCover } = await supabase
    .from("cover_arrangements")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("date", today);

  const periodsTotal = todayCover?.length || 0;
  const periodsCovered =
    todayCover?.filter(
      (c) =>
        c.status === "confirmed" &&
        (c.cover_type === "internal" || c.cover_type === "supply"),
    ).length || 0;
  const periodsPending =
    todayCover?.filter((c) => c.status === "pending").length || 0;
  const periodsUncovered =
    todayCover?.filter((c) => c.status === "uncovered").length || 0;

  // Calculate term supply costs
  const supplyCover =
    todayCover?.filter((c) => c.cover_type === "supply") || [];
  const termSupplyCost =
    termAbsences?.reduce((sum, a) => {
      // Rough estimate based on supply day rate
      return sum;
    }, 0) || 0;

  // Bradford factor calculation from term absences
  const staffAbsenceMap: Record<
    string,
    { spells: number; days: number; name: string; role: string; last: string }
  > = {};
  (termAbsences || []).forEach((a: any) => {
    const key = a.staff_id || a.staff_name;
    if (!staffAbsenceMap[key]) {
      staffAbsenceMap[key] = {
        spells: 0,
        days: 0,
        name: a.staff_name,
        role: a.staff_role,
        last: a.start_date,
      };
    }
    staffAbsenceMap[key].spells++;
    staffAbsenceMap[key].days += a.total_days || 1;
    if (a.start_date > staffAbsenceMap[key].last) {
      staffAbsenceMap[key].last = a.start_date;
    }
  });

  const bradfordAlerts = Object.entries(staffAbsenceMap)
    .map(([staffId, data]) => ({
      staff_id: staffId,
      staff_name: data.name,
      staff_role: data.role,
      spells: data.spells,
      total_days: data.days,
      bradford_score: data.spells * data.spells * data.days,
      trigger_level:
        data.spells * data.spells * data.days >= 1000
          ? "final_warning"
          : data.spells * data.spells * data.days >= 500
            ? "formal_meeting"
            : data.spells * data.spells * data.days >= 100
              ? "informal_review"
              : "monitor",
      last_absence: data.last,
    }))
    .sort((a, b) => b.bradford_score - a.bradford_score);

  return apiSuccess({
    today: {
      date: today,
      absences_count: todayAbsences?.length || 0,
      periods_needing_cover: periodsTotal,
      periods_covered: periodsCovered,
      periods_pending: periodsPending,
      periods_uncovered: periodsUncovered,
      cover_rate:
        periodsTotal > 0
          ? Math.round((periodsCovered / periodsTotal) * 100)
          : 100,
    },
    term: {
      total_absences: termAbsences?.length || 0,
      total_days_lost:
        termAbsences?.reduce(
          (s: number, a: any) => s + (a.total_days || 1),
          0,
        ) || 0,
    },
    bradford_alerts: bradfordAlerts,
    demo: false,
  });
});
