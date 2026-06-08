import type { SupabaseClient } from "@supabase/supabase-js";
import {
  resolveStaffTaskAssignment,
  type ResolvedStaffTaskAssignment,
  type UserTaskAssignee,
} from "./staff-assignment";

type OrganizationMemberRow = {
  user: UserTaskAssignee | UserTaskAssignee[] | null;
};

function normaliseMemberUser(member: OrganizationMemberRow) {
  if (Array.isArray(member.user)) return member.user[0] || null;
  return member.user || null;
}

export async function resolveTaskAssigneeFromDatabase(input: {
  supabase: SupabaseClient;
  organizationId: string;
  requestedAssigneeId: string | null | undefined;
}): Promise<ResolvedStaffTaskAssignment | null> {
  const requestedAssigneeId = input.requestedAssigneeId?.trim();
  if (!requestedAssigneeId) return null;

  const [staffResult, membersResult] = await Promise.all([
    input.supabase
      .from("staff_directory")
      .select(
        "id, display_name, first_name, last_name, email, job_title, role_category",
      )
      .eq("organization_id", input.organizationId)
      .eq("is_active", true),
    input.supabase
      .from("organization_members")
      .select("user:users (id, email, display_name)")
      .eq("organization_id", input.organizationId),
  ]);

  if (staffResult.error) {
    console.warn(
      "[Task Assignment] Could not load staff assignees:",
      staffResult.error.message,
    );
  }

  if (membersResult.error) {
    console.warn(
      "[Task Assignment] Could not load organization users:",
      membersResult.error.message,
    );
  }

  return resolveStaffTaskAssignment({
    requestedAssigneeId,
    staff: staffResult.data || [],
    users: (membersResult.data || [])
      .map(normaliseMemberUser)
      .filter((user): user is UserTaskAssignee => Boolean(user?.id)),
  });
}
