// Mission Control — Audit Logging Utility

import { createServiceRoleClient } from '@/lib/supabase-server';
import type { AuditEventCategory } from './types';

interface AuditLogParams {
  eventType: string;
  category: AuditEventCategory;
  actor?: string;
  description: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}

/**
 * Write an entry to the mc_audit_log table.
 * Fire-and-forget — does not throw on failure.
 */
export async function logAudit(params: AuditLogParams): Promise<void> {
  try {
    const supabase = createServiceRoleClient();
    await supabase.from('mc_audit_log').insert({
      event_type: params.eventType,
      event_category: params.category,
      actor: params.actor || 'system',
      description: params.description,
      metadata: params.metadata || {},
      ip_address: params.ipAddress || null,
    });
  } catch (error) {
    console.error('[MC Audit] Failed to write audit log:', error);
  }
}

/**
 * Log an admin access event.
 */
export async function logAdminAccess(email: string, path: string, ip?: string): Promise<void> {
  await logAudit({
    eventType: 'admin_access',
    category: 'security',
    actor: email,
    description: `Admin accessed ${path}`,
    metadata: { path },
    ipAddress: ip,
  });
}

/**
 * Log a skill execution event.
 */
export async function logSkillExecution(
  skillName: string,
  status: string,
  actor: string = 'system',
  metadata?: Record<string, unknown>,
): Promise<void> {
  await logAudit({
    eventType: 'skill_execution',
    category: 'skill',
    actor,
    description: `Skill "${skillName}" ${status}`,
    metadata: { skill_name: skillName, status, ...metadata },
  });
}

/**
 * Log an approval decision.
 */
export async function logApprovalDecision(
  itemId: string,
  title: string,
  decision: 'approved' | 'rejected',
  actor: string,
): Promise<void> {
  await logAudit({
    eventType: 'approval_decision',
    category: 'approval',
    actor,
    description: `${decision === 'approved' ? 'Approved' : 'Rejected'}: ${title}`,
    metadata: { item_id: itemId, decision },
  });
}
