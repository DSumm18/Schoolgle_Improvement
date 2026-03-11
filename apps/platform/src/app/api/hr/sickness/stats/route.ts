import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

/**
 * GET /api/hr/sickness/stats
 * Sickness dashboard statistics for an organization.
 */
export const GET = protectedRoute(async (auth, request: NextRequest) => {
  const supabase = createServiceRoleClient();
  const orgId = auth.organizationId;

  // Academic year start (Sep 1). If before Sep, use previous year.
  const now = new Date();
  const academicYearStart =
    now.getMonth() >= 8 // September = month 8 (0-indexed)
      ? new Date(now.getFullYear(), 8, 1).toISOString().split("T")[0]
      : new Date(now.getFullYear() - 1, 8, 1).toISOString().split("T")[0];

  // 1. Total absences this academic year
  const { count: totalAbsencesYtd } = await supabase
    .from("sickness_absence_records")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", orgId)
    .gte("start_date", academicYearStart);

  // 2. Currently absent (no end_date)
  const { count: currentlyAbsent } = await supabase
    .from("sickness_absence_records")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", orgId)
    .is("end_date", null);

  // 3. All records this academic year for calculating averages and breakdowns
  const { data: ytdRecords } = await supabase
    .from("sickness_absence_records")
    .select(
      "staff_id, working_days_lost, start_date, end_date, reason_category",
    )
    .eq("organization_id", orgId)
    .gte("start_date", academicYearStart);

  const records = ytdRecords || [];

  // Calculate total days lost (estimate weekdays if working_days_lost not set)
  let totalDaysLost = 0;
  for (const r of records) {
    if (r.working_days_lost != null) {
      totalDaysLost += Number(r.working_days_lost);
    } else {
      const start = new Date(r.start_date);
      const end = r.end_date ? new Date(r.end_date) : new Date();
      let days = 0;
      const d = new Date(start);
      while (d <= end) {
        const dow = d.getDay();
        if (dow !== 0 && dow !== 6) days++;
        d.setDate(d.getDate() + 1);
      }
      totalDaysLost += days;
    }
  }

  // Unique staff count (from staff_directory for this org)
  const { count: totalStaff } = await supabase
    .from("staff_directory")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", orgId)
    .eq("is_active", true);

  const avgDaysLostPerStaff =
    totalStaff && totalStaff > 0
      ? Math.round((totalDaysLost / totalStaff) * 10) / 10
      : 0;

  // 4. Top reasons
  const reasonCounts: Record<string, number> = {};
  for (const r of records) {
    const cat = r.reason_category || "other";
    reasonCounts[cat] = (reasonCounts[cat] || 0) + 1;
  }
  const topReasons = Object.entries(reasonCounts)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);

  // 5. Staff above trigger — get all staff with absences and check Bradford
  const uniqueStaffIds = [...new Set(records.map((r) => r.staff_id))];
  const staffAboveTrigger: any[] = [];

  // Get staff names
  const { data: staffList } = await supabase
    .from("staff_directory")
    .select("id, display_name, job_title, role_category")
    .eq("organization_id", orgId)
    .in("id", uniqueStaffIds.length > 0 ? uniqueStaffIds : ["__none__"]);

  const staffMap: Record<string, any> = {};
  for (const s of staffList || []) {
    staffMap[s.id] = s;
  }

  for (const sid of uniqueStaffIds) {
    const { data: bf } = await supabase.rpc("calculate_bradford_factor", {
      staff_id_param: sid,
      org_id_param: orgId,
      period_months: 12,
    });

    if (bf && bf.length > 0 && bf[0].trigger_level !== "none") {
      const staff = staffMap[sid];
      const staffRecords = records.filter((r) => r.staff_id === sid);
      const isCurrentlyAbsent = staffRecords.some((r) => !r.end_date);
      const lastAbsence = staffRecords.sort(
        (a, b) =>
          new Date(b.start_date).getTime() - new Date(a.start_date).getTime(),
      )[0];

      staffAboveTrigger.push({
        staff_id: sid,
        staff_name: staff?.display_name || "Unknown",
        staff_role: staff?.job_title || null,
        staff_department: staff?.role_category || null,
        total_absences: bf[0].occasions,
        total_days: Number(bf[0].total_days),
        bradford_factor: Number(bf[0].bradford_score),
        is_currently_absent: isCurrentlyAbsent,
        last_absence_date: lastAbsence?.start_date || null,
        trigger_level: bf[0].trigger_level,
        triggers_breached: [bf[0].trigger_level],
      });
    }
  }

  // Sort by Bradford Factor descending
  staffAboveTrigger.sort((a, b) => b.bradford_factor - a.bradford_factor);

  // 6. Monthly trend (last 12 months)
  const monthlyTrend: Array<{ month: string; count: number }> = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const year = d.getFullYear();
    const month = d.getMonth();
    const monthStart = new Date(year, month, 1).toISOString().split("T")[0];
    const monthEnd = new Date(year, month + 1, 0).toISOString().split("T")[0];

    const monthLabel = d.toLocaleDateString("en-GB", {
      month: "short",
      year: "2-digit",
    });

    // Count absences that started in this month
    const count = records.filter((r) => {
      return r.start_date >= monthStart && r.start_date <= monthEnd;
    }).length;

    monthlyTrend.push({ month: monthLabel, count });
  }

  return apiSuccess({
    total_absences_ytd: totalAbsencesYtd || 0,
    currently_absent: currentlyAbsent || 0,
    average_days_lost_per_staff: avgDaysLostPerStaff,
    total_days_lost: totalDaysLost,
    total_staff: totalStaff || 0,
    top_reasons: topReasons,
    staff_above_trigger: staffAboveTrigger,
    monthly_trend: monthlyTrend,
  });
});
