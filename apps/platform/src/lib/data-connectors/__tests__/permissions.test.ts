import { describe, it, expect } from 'vitest';
import { canCreateConnector, canSeeConnector } from '../permissions';

describe('connector permissions', () => {
  it('allows admin, headteacher, slt to create', () => {
    expect(canCreateConnector('admin')).toBe(true);
    expect(canCreateConnector('headteacher')).toBe(true);
    expect(canCreateConnector('slt')).toBe(true);
  });

  it('denies teacher, governor, caretaker from creating', () => {
    expect(canCreateConnector('teacher')).toBe(false);
    expect(canCreateConnector('governor')).toBe(false);
    expect(canCreateConnector('caretaker')).toBe(false);
  });

  it('creator can always see their own connector', () => {
    expect(canSeeConnector('teacher', 'user-1', {
      created_by: 'user-1',
      visibility: 'private',
      shared_with_roles: [],
      shared_with_users: [],
    })).toBe(true);
  });

  it('global connectors visible to everyone', () => {
    expect(canSeeConnector('teacher', 'user-2', {
      created_by: 'user-1',
      visibility: 'global',
      shared_with_roles: [],
      shared_with_users: [],
    })).toBe(true);
  });

  it('slt-scoped connectors visible only to slt and above', () => {
    const conn = {
      created_by: 'user-1',
      visibility: 'slt' as const,
      shared_with_roles: [],
      shared_with_users: [],
    };
    expect(canSeeConnector('slt', 'user-2', conn)).toBe(true);
    expect(canSeeConnector('headteacher', 'user-2', conn)).toBe(true);
    expect(canSeeConnector('teacher', 'user-2', conn)).toBe(false);
  });

  it('department-scoped respects shared_with_roles', () => {
    const conn = {
      created_by: 'user-1',
      visibility: 'department' as const,
      shared_with_roles: ['teacher', 'caretaker'],
      shared_with_users: [],
    };
    expect(canSeeConnector('teacher', 'user-2', conn)).toBe(true);
    expect(canSeeConnector('caretaker', 'user-2', conn)).toBe(true);
    expect(canSeeConnector('governor', 'user-2', conn)).toBe(false);
  });

  it('shared_with_users overrides visibility', () => {
    const conn = {
      created_by: 'user-1',
      visibility: 'private' as const,
      shared_with_roles: [],
      shared_with_users: ['user-99'],
    };
    expect(canSeeConnector('teacher', 'user-99', conn)).toBe(true);
    expect(canSeeConnector('teacher', 'user-100', conn)).toBe(false);
  });
});
