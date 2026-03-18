import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { NextRequest } from "next/server";
import { getMISDataService } from "@/lib/mis/data-service";
import type { MISTeacherClassHistory, MISPupil } from "@/lib/mis/types";

function yearGroupToKeyStage(yg: number): "EYFS" | "KS1" | "KS2" {
  if (yg === 0) return "EYFS";
  if (yg <= 2) return "KS1";
  return "KS2";
}

function yearGroupLabel(yg: number): string {
  if (yg === 0) return "Reception";
  return `Year ${yg}`;
}

export const GET = protectedRoute(async (auth, req: NextRequest) => {
  const supabase = createServiceRoleClient();
  const orgId = auth.organizationId;
  if (!orgId) return apiError("No organization", 400);

  // Try Supabase ls_classes first
  const { data, error } = await supabase
    .from("ls_classes")
    .select("*")
    .eq("organization_id", orgId)
    .order("year_group");

  if (error) return apiError(error.message, 500);

  // If we have data in ls_classes, use it
  if (data && data.length > 0) {
    return apiSuccess(data);
  }

  // Fallback: build classes from MIS teacher_class_history + pupils
  try {
    const mis = getMISDataService();
    const [historyResult, pupilsResult] = await Promise.all([
      mis.read<MISTeacherClassHistory>(orgId, "teacher_class_history"),
      mis.read<MISPupil>(orgId, "pupils"),
    ]);

    // Count pupils per registration_group (from pupil roll, e.g. "Y4 Pine")
    const pupilCounts = new Map<string, number>();
    const pupilSENDCounts = new Map<string, number>();
    for (const p of pupilsResult.data) {
      if (p.enrolment_status !== "Current") continue;
      const key = p.registration_group;
      pupilCounts.set(key, (pupilCounts.get(key) || 0) + 1);
      if (p.sen_status === "K" || p.sen_status === "E") {
        pupilSENDCounts.set(key, (pupilSENDCounts.get(key) || 0) + 1);
      }
    }

    // Filter to current academic year and deduplicate by registration_group
    const years = historyResult.data.map((h) => h.academic_year_start);
    const currentYear = years.length > 0 ? Math.max(...years) : 2025;
    const currentAY =
      historyResult.data.find((h) => h.academic_year_start === currentYear)
        ?.academic_year ||
      `${currentYear}-${(currentYear + 1).toString().slice(2)}`;

    const currentHistory = historyResult.data.filter(
      (h) => h.academic_year_start === currentYear,
    );

    // Build a map from short class name ("Pine") to full registration group ("Y4 Pine")
    // Pupil roll uses "Y4 Pine", teacher history uses "Pine"
    const shortToFull = new Map<string, string>();
    for (const regGroup of pupilCounts.keys()) {
      // Extract short name: "Y4 Pine" → "Pine", "R Oak" → "Oak"
      const parts = regGroup.split(" ");
      const shortName = parts.length > 1 ? parts.slice(1).join(" ") : regGroup;
      shortToFull.set(shortName, regGroup);
    }

    // Group by class name, pick the primary teacher
    const classMap = new Map<
      string,
      {
        teacher: MISTeacherClassHistory;
        yearGroup: number;
        fullRegGroup: string;
      }
    >();

    for (const h of currentHistory) {
      // Resolve short class name to full registration group
      const fullRegGroup =
        shortToFull.get(h.registration_group) || h.registration_group;
      const existing = classMap.get(fullRegGroup);
      if (
        !existing ||
        (h.role === "Class Teacher" &&
          existing.teacher.role !== "Class Teacher") ||
        h.fte_for_class > existing.teacher.fte_for_class
      ) {
        classMap.set(fullRegGroup, {
          teacher: h,
          yearGroup: h.year_group,
          fullRegGroup,
        });
      }
    }

    // Build LSClass-shaped objects using the full registration group as ID
    const classes = Array.from(classMap.entries())
      .sort((a, b) => a[1].yearGroup - b[1].yearGroup)
      .map(([regGroup, info]) => ({
        id: `mis-${regGroup}`,
        organization_id: orgId,
        year_group: yearGroupLabel(info.yearGroup),
        class_name: regGroup,
        key_stage: yearGroupToKeyStage(info.yearGroup),
        teacher_user_id: null,
        teacher_name: info.teacher.staff_name,
        ta_user_id: null,
        room: null,
        pupil_count: pupilCounts.get(regGroup) || 0,
        send_count: pupilSENDCounts.get(regGroup) || 0,
        academic_year: currentAY,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        _source: "mis",
      }));

    return apiSuccess(classes);
  } catch (misError) {
    // If MIS also fails, return empty array
    console.error("[lesson-studio/classes] MIS fallback error:", misError);
    return apiSuccess([]);
  }
});
