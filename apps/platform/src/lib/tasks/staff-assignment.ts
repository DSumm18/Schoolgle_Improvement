export interface StaffTaskAssignee {
  id: string;
  display_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  job_title?: string | null;
  role_category?: string | null;
}

export interface UserTaskAssignee {
  id: string;
  email?: string | null;
  display_name?: string | null;
  full_name?: string | null;
}

export interface ResolvedStaffTaskAssignment {
  assigneeUserId: string | null;
  ownerName: string | null;
  staffId: string | null;
  staffEmail: string | null;
  staffJobTitle: string | null;
  staffRoleCategory: string | null;
  userMatchedByEmail: boolean;
}

function normaliseEmail(email?: string | null) {
  return email?.trim().toLowerCase() || null;
}

function staffDisplayName(staff: StaffTaskAssignee) {
  const explicitName = staff.display_name?.trim();
  if (explicitName) return explicitName;

  const joinedName = [staff.first_name, staff.last_name]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" ");

  return joinedName || staff.email?.trim() || null;
}

function userDisplayName(user: UserTaskAssignee) {
  return (
    user.display_name?.trim() ||
    user.full_name?.trim() ||
    user.email?.trim() ||
    null
  );
}

export function resolveStaffTaskAssignment(input: {
  requestedAssigneeId: string | null | undefined;
  staff: StaffTaskAssignee[];
  users: UserTaskAssignee[];
}): ResolvedStaffTaskAssignment | null {
  const requestedAssigneeId = input.requestedAssigneeId?.trim();
  if (!requestedAssigneeId) return null;

  const selectedStaff = input.staff.find(
    (staffMember) => staffMember.id === requestedAssigneeId,
  );

  if (selectedStaff) {
    const staffEmail = normaliseEmail(selectedStaff.email);
    const matchedUser = staffEmail
      ? input.users.find((user) => normaliseEmail(user.email) === staffEmail)
      : undefined;

    return {
      assigneeUserId: matchedUser?.id || null,
      ownerName: staffDisplayName(selectedStaff),
      staffId: selectedStaff.id,
      staffEmail: selectedStaff.email || null,
      staffJobTitle: selectedStaff.job_title || null,
      staffRoleCategory: selectedStaff.role_category || null,
      userMatchedByEmail: Boolean(matchedUser),
    };
  }

  const selectedUser = input.users.find((user) => user.id === requestedAssigneeId);
  if (!selectedUser) return null;

  return {
    assigneeUserId: selectedUser.id,
    ownerName: userDisplayName(selectedUser),
    staffId: null,
    staffEmail: selectedUser.email || null,
    staffJobTitle: null,
    staffRoleCategory: null,
    userMatchedByEmail: false,
  };
}
