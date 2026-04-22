import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { NextRequest } from "next/server";

interface AssignmentRow {
  id: string;
  ls_class_id: string | null;
  staff_id: string;
  staff_name: string;
  role: string;
  is_primary_teacher: boolean | null;
  term: string | null;
  year_group: number;
  registration_group: string | null;
}

// GET /api/lesson-studio/classes/summary
// Returns every ls_classes row for the org, enriched with pupil count,
// timetable slot count, and staff chips resolved from staff_class_assignments.
export const GET = protectedRoute(async (auth, _req: NextRequest) => {
  const supabase = createServiceRoleClient();
  const orgId = auth.organizationId;
  if (!orgId) return apiError("No organization", 400);

  const [classesRes, pupilsRes, slotsRes, assignmentsRes] = await Promise.all([
    supabase
      .from("ls_classes")
      .select("*")
      .eq("organization_id", orgId)
      .order("year_group")
      .order("class_name"),
    supabase
      .from("ls_pupils")
      .select("class_id")
      .eq("organization_id", orgId),
    supabase
      .from("ls_timetable_slots")
      .select("class_id")
      .eq("organization_id", orgId),
    supabase
      .from("staff_class_assignments")
      .select(
        "id, ls_class_id, staff_id, staff_name, role, is_primary_teacher, term, year_group, registration_group",
      )
      .eq("organization_id", orgId),
  ]);

  if (classesRes.error) return apiError(classesRes.error.message, 500);

  const pupilCounts = new Map<string, number>();
  for (const row of pupilsRes.data || []) {
    if (!row.class_id) continue;
    pupilCounts.set(row.class_id, (pupilCounts.get(row.class_id) || 0) + 1);
  }

  const slotCounts = new Map<string, number>();
  for (const row of slotsRes.data || []) {
    if (!row.class_id) continue;
    slotCounts.set(row.class_id, (slotCounts.get(row.class_id) || 0) + 1);
  }

  const staffByClass = new Map<string, AssignmentRow[]>();
  const unlinkedAssignments: AssignmentRow[] = [];
  for (const row of (assignmentsRes.data || []) as AssignmentRow[]) {
    if (row.ls_class_id) {
      const list = staffByClass.get(row.ls_class_id) || [];
      list.push(row);
      staffByClass.set(row.ls_class_id, list);
    } else {
      unlinkedAssignments.push(row);
    }
  }

  const classes = (classesRes.data || []).map((c) => ({
    ...c,
    pupil_count: pupilCounts.get(c.id) || 0,
    slot_count: slotCounts.get(c.id) || 0,
    staff: staffByClass.get(c.id) || [],
  }));

  return apiSuccess({
    classes,
    unlinked_assignment_count: unlinkedAssignments.length,
    unlinked_assignments: unlinkedAssignments,
  });
});
