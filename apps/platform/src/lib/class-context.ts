/**
 * Class Context
 *
 * Resolves what year groups / classes a user can see based on their
 * role and class assignments.
 *
 * - SLT (admin, headteacher, slt) → whole school
 * - Teachers → only their assigned year groups / classes
 * - Governors, viewers → whole school (read-only)
 */

import { createServiceRoleClient } from "@/lib/supabase-server";

export interface ClassContext {
  /** User has full school visibility */
  isWholeSchool: boolean;
  /** If filtered, which year groups can they see */
  yearGroups: number[];
  /** If filtered, which registration groups (class names) */
  registrationGroups: string[];
  /** The user's primary teaching role (if any) */
  primaryRole?: string;
  /** All their assignments for reference */
  assignments: {
    yearGroup: number;
    registrationGroup: string | null;
    role: string;
    isPrimary: boolean;
  }[];
}

const WHOLE_SCHOOL_ROLES = [
  "admin",
  "headteacher",
  "slt",
  "governor",
  "viewer",
];

export async function getClassContext(
  userId: string,
  organizationId: string,
  role: string | undefined,
): Promise<ClassContext> {
  // SLT and governors always see everything
  if (role && WHOLE_SCHOOL_ROLES.includes(role)) {
    return {
      isWholeSchool: true,
      yearGroups: [],
      registrationGroups: [],
      assignments: [],
    };
  }

  const supabase = createServiceRoleClient();

  const { data: assignments } = await supabase
    .from("staff_class_assignments")
    .select("year_group, registration_group, role, is_primary_teacher")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .eq("academic_year", "2025-26");

  if (!assignments || assignments.length === 0) {
    // No assignments — give whole school read access (teacher without assignment)
    // This prevents lockout while assignments are being set up
    return {
      isWholeSchool: true,
      yearGroups: [],
      registrationGroups: [],
      assignments: [],
    };
  }

  const yearGroups = [...new Set(assignments.map((a) => a.year_group))];
  const regGroups = assignments
    .map((a) => a.registration_group)
    .filter(Boolean) as string[];
  const primary = assignments.find((a) => a.is_primary_teacher);

  return {
    isWholeSchool: false,
    yearGroups,
    registrationGroups: [...new Set(regGroups)],
    primaryRole: primary?.role,
    assignments: assignments.map((a) => ({
      yearGroup: a.year_group,
      registrationGroup: a.registration_group,
      role: a.role,
      isPrimary: a.is_primary_teacher,
    })),
  };
}

/**
 * Client-side hook helper — fetches class context via API
 */
export async function fetchClassContext(
  orgId: string,
  headers: Record<string, string>,
): Promise<ClassContext> {
  const res = await fetch(
    `/api/class-assignments/my-classes?organizationId=${orgId}`,
    { headers },
  );
  if (!res.ok) {
    return {
      isWholeSchool: true,
      yearGroups: [],
      registrationGroups: [],
      assignments: [],
    };
  }
  return res.json();
}
