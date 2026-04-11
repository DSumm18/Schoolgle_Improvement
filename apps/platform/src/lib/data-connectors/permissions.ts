export type UserRole = 'admin' | 'headteacher' | 'slt' | 'governor' | 'teacher' | 'caretaker' | 'viewer';

const CREATE_CONNECTOR_ROLES: UserRole[] = ['admin', 'headteacher', 'slt'];

export function canCreateConnector(role: string): boolean {
  return CREATE_CONNECTOR_ROLES.includes(role as UserRole);
}

export function canSeeConnector(
  userRole: string,
  userId: string,
  connector: {
    created_by: string;
    visibility: 'private' | 'department' | 'slt' | 'global';
    shared_with_roles: string[];
    shared_with_users: string[];
  },
): boolean {
  if (connector.created_by === userId) return true;
  if (connector.visibility === 'global') return true;
  if (connector.visibility === 'slt' && ['slt', 'headteacher', 'admin'].includes(userRole)) return true;
  if (connector.visibility === 'department' && connector.shared_with_roles.includes(userRole)) return true;
  if (connector.shared_with_users.includes(userId)) return true;
  return false;
}
