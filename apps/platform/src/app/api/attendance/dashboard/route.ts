/**
 * Attendance Dashboard API
 *
 * GET /api/attendance/dashboard — whole-school attendance stats
 * Returns: overall %, PA count, severe absence count, year group breakdown, weekly trend
 */

import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

interface YearGroupStat {
  year_group: number;
  pupil_count: number;
  attendance_rate: number;
  pa_count: number;
  severe_count: number;
}

interface WeeklyTrend {
  week_commencing: string;
  attendance_rate: number;
  pa_rate: number;
}

interface DayOfWeekPattern {
  day: string;
  attendance_rate: number;
}

function generateDemoDashboard() {
  const yearGroups: YearGroupStat[] = [
    {
      year_group: 1,
      pupil_count: 30,
      attendance_rate: 95.2,
      pa_count: 1,
      severe_count: 0,
    },
    {
      year_group: 2,
      pupil_count: 28,
      attendance_rate: 94.8,
      pa_count: 1,
      severe_count: 0,
    },
    {
      year_group: 3,
      pupil_count: 31,
      attendance_rate: 91.3,
      pa_count: 2,
      severe_count: 1,
    },
    {
      year_group: 4,
      pupil_count: 29,
      attendance_rate: 95.6,
      pa_count: 1,
      severe_count: 0,
    },
    {
      year_group: 5,
      pupil_count: 30,
      attendance_rate: 94.1,
      pa_count: 1,
      severe_count: 0,
    },
    {
      year_group: 6,
      pupil_count: 32,
      attendance_rate: 93.7,
      pa_count: 2,
      severe_count: 0,
    },
  ];

  const totalPupils = yearGroups.reduce((sum, yg) => sum + yg.pupil_count, 0);
  const weightedAttendance =
    yearGroups.reduce(
      (sum, yg) => sum + yg.attendance_rate * yg.pupil_count,
      0,
    ) / totalPupils;
  const totalPA = yearGroups.reduce((sum, yg) => sum + yg.pa_count, 0);
  const totalSevere = yearGroups.reduce((sum, yg) => sum + yg.severe_count, 0);

  // Generate 12 weeks of trend data
  const weeklyTrend: WeeklyTrend[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const weekStart = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
    // Monday of that week
    const day = weekStart.getDay();
    const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
    weekStart.setDate(diff);

    // Realistic fluctuations
    const baseRate = 94.2;
    const variation = Math.sin(i * 0.8) * 1.5 + (Math.random() - 0.5) * 0.8;
    const rate = Math.round((baseRate + variation) * 10) / 10;
    const paRate = Math.round((100 - rate) * 0.6 * 10) / 10;

    weeklyTrend.push({
      week_commencing: weekStart.toISOString().split("T")[0],
      attendance_rate: Math.min(97, Math.max(90, rate)),
      pa_rate: Math.min(15, Math.max(3, paRate)),
    });
  }

  const dayOfWeekPattern: DayOfWeekPattern[] = [
    { day: "Monday", attendance_rate: 94.8 },
    { day: "Tuesday", attendance_rate: 95.6 },
    { day: "Wednesday", attendance_rate: 95.3 },
    { day: "Thursday", attendance_rate: 95.1 },
    { day: "Friday", attendance_rate: 93.2 },
  ];

  return {
    overview: {
      overall_attendance: Math.round(weightedAttendance * 10) / 10,
      national_average: 94.2,
      trend: weightedAttendance > 94.2 ? "up" : "down",
      trend_change: 0.3,
      total_pupils: totalPupils,
      pa_count: totalPA,
      pa_rate: Math.round((totalPA / totalPupils) * 1000) / 10,
      severe_absence_count: totalSevere,
      late_today: 4,
      cme_count: 0,
    },
    year_groups: yearGroups,
    weekly_trend: weeklyTrend,
    day_of_week_pattern: dayOfWeekPattern,
    is_demo: true,
  };
}

export const GET = protectedRoute(async (auth, request) => {
  const { organizationId } = auth;
  const { searchParams } = new URL(request.url);
  const academicYear = searchParams.get("academic_year") || "2025-26";

  const supabase = createServiceRoleClient();

  // Try to get real summaries
  const { data: summaries, error } = await supabase
    .from("attendance_summaries")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("academic_year", academicYear);

  if (error) {
    console.error("[Attendance Dashboard GET] Error:", error);
  }

  // If no Supabase data, try MIS resolver (reads from local test harness / Google Drive)
  if (!summaries || summaries.length === 0) {
    try {
      const { getMISDataServiceForOrg } =
        await import("@/lib/mis/data-service");
      const mis = await getMISDataServiceForOrg(organizationId);
      const attendanceResult = await mis.read(organizationId, "attendance");
      const pupilResult = await mis.read(organizationId, "pupils");

      if (attendanceResult.data.length > 0 && pupilResult.data.length > 0) {
        const pupils = pupilResult.data as any[];
        const records = attendanceResult.data as any[];

        // Group pupils by year group (MIS returns numeric: 0=Reception, 1-6=Year 1-6)
        const ygPupilMap = new Map<number, any[]>();
        for (const p of pupils) {
          const yg = typeof p.year_group === "number" ? p.year_group : 0;
          if (!ygPupilMap.has(yg)) ygPupilMap.set(yg, []);
          ygPupilMap.get(yg)!.push(p);
        }

        // Calculate attendance per pupil from records
        const pupilAttendance = new Map<
          string,
          { possible: number; attended: number; year_group: string }
        >();
        for (const r of records) {
          const id = r.student_id || r.pupil_id;
          if (!id) continue;
          if (!pupilAttendance.has(id)) {
            pupilAttendance.set(id, {
              possible: 0,
              attended: 0,
              year_group: r.year_group || "",
            });
          }
          const pa = pupilAttendance.get(id)!;
          pa.possible += r.possible_sessions || r.sessions_possible || 0;
          pa.attended += r.attended_sessions || r.sessions_attended || 0;
          if (r.year_group) pa.year_group = r.year_group;
        }

        const totalPupils = pupils.length;
        let totalPossible = 0,
          totalAttended = 0,
          paCount = 0,
          severeCount = 0;

        for (const [, pa] of pupilAttendance) {
          totalPossible += pa.possible;
          totalAttended += pa.attended;
          const rate =
            pa.possible > 0 ? (pa.attended / pa.possible) * 100 : 100;
          if (rate < 90) paCount++;
          if (rate < 50) severeCount++;
        }

        const overallRate =
          totalPossible > 0
            ? Math.round((totalAttended / totalPossible) * 1000) / 10
            : 0;

        // Year group stats (0=Reception, 1-6=Year 1-6)
        const ygNums = [0, 1, 2, 3, 4, 5, 6];
        const yearGroupStats: YearGroupStat[] = ygNums.map((idx) => {
          const ygPupils = ygPupilMap.get(idx) || [];
          let ygPoss = 0,
            ygAtt = 0,
            ygPA = 0,
            ygSevere = 0;
          for (const p of ygPupils) {
            const pa = pupilAttendance.get(p.student_id || p.pupil_id);
            if (pa) {
              ygPoss += pa.possible;
              ygAtt += pa.attended;
              const rate =
                pa.possible > 0 ? (pa.attended / pa.possible) * 100 : 100;
              if (rate < 90) ygPA++;
              if (rate < 50) ygSevere++;
            }
          }
          return {
            year_group: idx,
            pupil_count: ygPupils.length,
            attendance_rate:
              ygPoss > 0 ? Math.round((ygAtt / ygPoss) * 1000) / 10 : 0,
            pa_count: ygPA,
            severe_count: ygSevere,
          };
        });

        return apiSuccess({
          overview: {
            overall_attendance: overallRate,
            national_average: 94.2,
            trend: overallRate >= 94.2 ? "up" : "down",
            trend_change: overallRate - 94.2,
            total_pupils: totalPupils,
            pa_count: paCount,
            pa_rate:
              totalPupils > 0
                ? Math.round((paCount / totalPupils) * 1000) / 10
                : 0,
            severe_absence_count: severeCount,
            late_today: 0,
            cme_count: 0,
          },
          year_groups: yearGroupStats,
          weekly_trend: [],
          day_of_week_pattern: [],
          is_demo: false,
          data_source: "mis",
        });
      }
    } catch (misErr) {
      console.warn("[Attendance Dashboard] MIS read failed:", misErr);
    }

    // Last resort: demo data
    return apiSuccess(generateDemoDashboard());
  }

  // Calculate real stats
  const totalPupils = summaries.length;
  const totalSessions = summaries.reduce(
    (s: number, r: any) => s + (r.possible_sessions || 0),
    0,
  );
  const attendedSessions = summaries.reduce(
    (s: number, r: any) => s + (r.attended_sessions || 0),
    0,
  );
  const overallAttendance =
    totalSessions > 0
      ? Math.round((attendedSessions / totalSessions) * 1000) / 10
      : 0;

  // PA and severe
  const paThreshold = 90;
  const severeThreshold = 50;
  const paPupils = summaries.filter((s: any) => {
    const rate =
      s.possible_sessions > 0
        ? (s.attended_sessions / s.possible_sessions) * 100
        : 100;
    return rate < paThreshold;
  });
  const severePupils = summaries.filter((s: any) => {
    const rate =
      s.possible_sessions > 0
        ? (s.attended_sessions / s.possible_sessions) * 100
        : 100;
    return rate < severeThreshold;
  });

  // Year group breakdown
  const ygMap = new Map<number, any[]>();
  for (const s of summaries) {
    const yg = (s as any).year_group || 0;
    if (!ygMap.has(yg)) ygMap.set(yg, []);
    ygMap.get(yg)!.push(s);
  }

  const yearGroups: YearGroupStat[] = Array.from(ygMap.entries())
    .map(([yg, pupils]) => {
      const totalSess = pupils.reduce(
        (sum: number, p: any) => sum + (p.possible_sessions || 0),
        0,
      );
      const attendSess = pupils.reduce(
        (sum: number, p: any) => sum + (p.attended_sessions || 0),
        0,
      );
      const rate =
        totalSess > 0 ? Math.round((attendSess / totalSess) * 1000) / 10 : 0;
      const pa = pupils.filter((p: any) => {
        const r =
          p.possible_sessions > 0
            ? (p.attended_sessions / p.possible_sessions) * 100
            : 100;
        return r < 90;
      }).length;
      const severe = pupils.filter((p: any) => {
        const r =
          p.possible_sessions > 0
            ? (p.attended_sessions / p.possible_sessions) * 100
            : 100;
        return r < 50;
      }).length;
      return {
        year_group: yg,
        pupil_count: pupils.length,
        attendance_rate: rate,
        pa_count: pa,
        severe_count: severe,
      };
    })
    .sort((a, b) => a.year_group - b.year_group);

  // Late today (from registers)
  const today = new Date().toISOString().split("T")[0];
  const { count: lateToday } = await supabase
    .from("attendance_registers")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("date", today)
    .eq("code", "L");

  return apiSuccess({
    overview: {
      overall_attendance: overallAttendance,
      national_average: 94.2,
      trend: overallAttendance >= 94.2 ? "up" : "down",
      trend_change: 0,
      total_pupils: totalPupils,
      pa_count: paPupils.length,
      pa_rate: Math.round((paPupils.length / totalPupils) * 1000) / 10,
      severe_absence_count: severePupils.length,
      late_today: lateToday || 0,
      cme_count: 0,
    },
    year_groups: yearGroups,
    weekly_trend: [],
    day_of_week_pattern: [],
    is_demo: false,
  });
});
