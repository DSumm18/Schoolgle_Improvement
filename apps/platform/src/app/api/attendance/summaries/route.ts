/**
 * Attendance Summaries API
 *
 * GET /api/attendance/summaries?year_group=3&academic_year=2025-26
 * Returns pupil-level attendance summaries with PA/SA flags
 */

import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

// Demo summaries with realistic attendance patterns
function generateDemoSummaries(yearGroup?: string) {
  const allPupils = [
    // Year 1
    {
      id: "s1",
      pupil_id: "p1",
      pupil_name: "Zara Ahmed",
      year_group: 1,
      possible_sessions: 260,
      attended_sessions: 254,
      authorised_absences: 4,
      unauthorised_absences: 2,
      late_marks: 3,
    },
    {
      id: "s2",
      pupil_id: "p2",
      pupil_name: "Freddie Barnes",
      year_group: 1,
      possible_sessions: 260,
      attended_sessions: 250,
      authorised_absences: 8,
      unauthorised_absences: 2,
      late_marks: 1,
    },
    {
      id: "s3",
      pupil_id: "p3",
      pupil_name: "Sienna Clarke",
      year_group: 1,
      possible_sessions: 260,
      attended_sessions: 248,
      authorised_absences: 10,
      unauthorised_absences: 2,
      late_marks: 5,
    },
    {
      id: "s4",
      pupil_id: "p4",
      pupil_name: "Reuben Dawson",
      year_group: 1,
      possible_sessions: 260,
      attended_sessions: 242,
      authorised_absences: 14,
      unauthorised_absences: 4,
      late_marks: 8,
    },
    {
      id: "s5",
      pupil_id: "p5",
      pupil_name: "Esme Fletcher",
      year_group: 1,
      possible_sessions: 260,
      attended_sessions: 226,
      authorised_absences: 20,
      unauthorised_absences: 14,
      late_marks: 12,
    },
    // Year 2
    {
      id: "s6",
      pupil_id: "p6",
      pupil_name: "Toby Grant",
      year_group: 2,
      possible_sessions: 260,
      attended_sessions: 256,
      authorised_absences: 4,
      unauthorised_absences: 0,
      late_marks: 0,
    },
    {
      id: "s7",
      pupil_id: "p7",
      pupil_name: "Maisie Harper",
      year_group: 2,
      possible_sessions: 260,
      attended_sessions: 251,
      authorised_absences: 6,
      unauthorised_absences: 3,
      late_marks: 2,
    },
    {
      id: "s8",
      pupil_id: "p8",
      pupil_name: "Jude Iqbal",
      year_group: 2,
      possible_sessions: 260,
      attended_sessions: 244,
      authorised_absences: 12,
      unauthorised_absences: 4,
      late_marks: 6,
    },
    {
      id: "s9",
      pupil_id: "p9",
      pupil_name: "Thea Jackson",
      year_group: 2,
      possible_sessions: 260,
      attended_sessions: 232,
      authorised_absences: 18,
      unauthorised_absences: 10,
      late_marks: 15,
    },
    {
      id: "s10",
      pupil_id: "p10",
      pupil_name: "Finley Knight",
      year_group: 2,
      possible_sessions: 260,
      attended_sessions: 247,
      authorised_absences: 10,
      unauthorised_absences: 3,
      late_marks: 4,
    },
    // Year 3
    {
      id: "s11",
      pupil_id: "p11",
      pupil_name: "Arabella Lewis",
      year_group: 3,
      possible_sessions: 260,
      attended_sessions: 258,
      authorised_absences: 2,
      unauthorised_absences: 0,
      late_marks: 0,
    },
    {
      id: "s12",
      pupil_id: "p12",
      pupil_name: "Hugo Matthews",
      year_group: 3,
      possible_sessions: 260,
      attended_sessions: 249,
      authorised_absences: 8,
      unauthorised_absences: 3,
      late_marks: 2,
    },
    {
      id: "s13",
      pupil_id: "p13",
      pupil_name: "Iris Nguyen",
      year_group: 3,
      possible_sessions: 260,
      attended_sessions: 240,
      authorised_absences: 14,
      unauthorised_absences: 6,
      late_marks: 9,
    },
    {
      id: "s14",
      pupil_id: "p14",
      pupil_name: "Sebastian O'Brien",
      year_group: 3,
      possible_sessions: 260,
      attended_sessions: 230,
      authorised_absences: 16,
      unauthorised_absences: 14,
      late_marks: 11,
    },
    {
      id: "s15",
      pupil_id: "p15",
      pupil_name: "Willow Parker",
      year_group: 3,
      possible_sessions: 260,
      attended_sessions: 120,
      authorised_absences: 80,
      unauthorised_absences: 60,
      late_marks: 20,
    },
    // Year 4
    {
      id: "s16",
      pupil_id: "p16",
      pupil_name: "Felix Quinn",
      year_group: 4,
      possible_sessions: 260,
      attended_sessions: 253,
      authorised_absences: 5,
      unauthorised_absences: 2,
      late_marks: 1,
    },
    {
      id: "s17",
      pupil_id: "p17",
      pupil_name: "Beatrice Ross",
      year_group: 4,
      possible_sessions: 260,
      attended_sessions: 246,
      authorised_absences: 10,
      unauthorised_absences: 4,
      late_marks: 3,
    },
    {
      id: "s18",
      pupil_id: "p18",
      pupil_name: "Arthur Shaw",
      year_group: 4,
      possible_sessions: 260,
      attended_sessions: 238,
      authorised_absences: 16,
      unauthorised_absences: 6,
      late_marks: 7,
    },
    {
      id: "s19",
      pupil_id: "p19",
      pupil_name: "Penelope Taylor",
      year_group: 4,
      possible_sessions: 260,
      attended_sessions: 229,
      authorised_absences: 18,
      unauthorised_absences: 13,
      late_marks: 10,
    },
    {
      id: "s20",
      pupil_id: "p20",
      pupil_name: "Jasper Upton",
      year_group: 4,
      possible_sessions: 260,
      attended_sessions: 255,
      authorised_absences: 4,
      unauthorised_absences: 1,
      late_marks: 0,
    },
    // Year 5
    {
      id: "s21",
      pupil_id: "p21",
      pupil_name: "Matilda Vickers",
      year_group: 5,
      possible_sessions: 260,
      attended_sessions: 252,
      authorised_absences: 6,
      unauthorised_absences: 2,
      late_marks: 2,
    },
    {
      id: "s22",
      pupil_id: "p22",
      pupil_name: "Theodore Walsh",
      year_group: 5,
      possible_sessions: 260,
      attended_sessions: 245,
      authorised_absences: 11,
      unauthorised_absences: 4,
      late_marks: 5,
    },
    {
      id: "s23",
      pupil_id: "p23",
      pupil_name: "Annabelle Xu",
      year_group: 5,
      possible_sessions: 260,
      attended_sessions: 233,
      authorised_absences: 15,
      unauthorised_absences: 12,
      late_marks: 14,
    },
    {
      id: "s24",
      pupil_id: "p24",
      pupil_name: "Rufus Young",
      year_group: 5,
      possible_sessions: 260,
      attended_sessions: 248,
      authorised_absences: 8,
      unauthorised_absences: 4,
      late_marks: 3,
    },
    {
      id: "s25",
      pupil_id: "p25",
      pupil_name: "Clementine Zhang",
      year_group: 5,
      possible_sessions: 260,
      attended_sessions: 257,
      authorised_absences: 2,
      unauthorised_absences: 1,
      late_marks: 0,
    },
    // Year 6
    {
      id: "s26",
      pupil_id: "p26",
      pupil_name: "Barnaby Adams",
      year_group: 6,
      possible_sessions: 260,
      attended_sessions: 254,
      authorised_absences: 4,
      unauthorised_absences: 2,
      late_marks: 1,
    },
    {
      id: "s27",
      pupil_id: "p27",
      pupil_name: "Cordelia Blake",
      year_group: 6,
      possible_sessions: 260,
      attended_sessions: 239,
      authorised_absences: 14,
      unauthorised_absences: 7,
      late_marks: 6,
    },
    {
      id: "s28",
      pupil_id: "p28",
      pupil_name: "Dominic Chen",
      year_group: 6,
      possible_sessions: 260,
      attended_sessions: 250,
      authorised_absences: 7,
      unauthorised_absences: 3,
      late_marks: 2,
    },
    {
      id: "s29",
      pupil_id: "p29",
      pupil_name: "Eloise Frost",
      year_group: 6,
      possible_sessions: 260,
      attended_sessions: 224,
      authorised_absences: 22,
      unauthorised_absences: 14,
      late_marks: 18,
    },
    {
      id: "s30",
      pupil_id: "p30",
      pupil_name: "Gabriel Hart",
      year_group: 6,
      possible_sessions: 260,
      attended_sessions: 247,
      authorised_absences: 9,
      unauthorised_absences: 4,
      late_marks: 3,
    },
  ];

  let filtered = allPupils;
  if (yearGroup) {
    const yg = parseInt(yearGroup, 10);
    if (!isNaN(yg)) {
      filtered = allPupils.filter((p) => p.year_group === yg);
    }
  }

  return filtered.map((p) => {
    const attendanceRate =
      Math.round((p.attended_sessions / p.possible_sessions) * 1000) / 10;
    return {
      ...p,
      attendance_rate: attendanceRate,
      is_persistent_absence: attendanceRate < 90,
      is_severe_absence: attendanceRate < 50,
      academic_year: "2025-26",
    };
  });
}

export const GET = protectedRoute(async (auth, request) => {
  const { organizationId } = auth;
  const { searchParams } = new URL(request.url);
  const yearGroup = searchParams.get("year_group");
  const academicYear = searchParams.get("academic_year") || "2025-26";

  const supabase = createServiceRoleClient();

  let query = supabase
    .from("attendance_summaries")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("academic_year", academicYear);

  if (yearGroup) {
    query = query.eq("year_group", parseInt(yearGroup, 10));
  }

  const { data, error } = await query.order("attendance_rate", {
    ascending: true,
  });

  if (error) {
    console.error("[Attendance Summaries GET] Error:", error);
  }

  // Return demo data if no real data
  if (!data || data.length === 0) {
    const demoData = generateDemoSummaries(yearGroup || undefined);
    return apiSuccess({
      summaries: demoData,
      is_demo: true,
      total: demoData.length,
      pa_count: demoData.filter((s) => s.is_persistent_absence).length,
      severe_count: demoData.filter((s) => s.is_severe_absence).length,
    });
  }

  // Compute flags
  const enriched = data.map((s: any) => ({
    ...s,
    attendance_rate:
      s.possible_sessions > 0
        ? Math.round((s.attended_sessions / s.possible_sessions) * 1000) / 10
        : 100,
    is_persistent_absence:
      s.possible_sessions > 0
        ? (s.attended_sessions / s.possible_sessions) * 100 < 90
        : false,
    is_severe_absence:
      s.possible_sessions > 0
        ? (s.attended_sessions / s.possible_sessions) * 100 < 50
        : false,
  }));

  return apiSuccess({
    summaries: enriched,
    is_demo: false,
    total: enriched.length,
    pa_count: enriched.filter((s: any) => s.is_persistent_absence).length,
    severe_count: enriched.filter((s: any) => s.is_severe_absence).length,
  });
});
