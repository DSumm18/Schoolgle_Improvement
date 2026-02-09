import { supabase } from '@/lib/supabase';

export type ApprovalTier = 'AUTO' | 'SHADOW' | 'REVIEW' | 'BLOCKED';

export interface SkillConfig {
    skill_id: string;
    is_enabled: boolean;
    approval_tier: ApprovalTier;
}

/**
 * Get the approval tier for a skill
 */
export async function getSkillTier(organizationId: string, skillId: string): Promise<ApprovalTier> {
    const { data, error } = await supabase
        .from('school_skills_config')
        .select('approval_tier')
        .eq('organization_id', organizationId)
        .eq('skill_id', skillId)
        .maybeSingle();

    if (error || !data) {
        return 'AUTO'; // Default to AUTO if not configured
    }

    return data.approval_tier;
}

/**
 * Allowed roles for high-stakes skills
 */
const SKILL_PERMISSIONS: Record<string, string[]> = {
    'safety_emergency_lockdown': ['admin', 'slt'],
    'safety_gate_access': ['admin', 'slt', 'site_manager'],
    'hr_staff_absence': ['admin', 'slt', 'teacher'],
};

/**
 * Check if a role has permission to execute a specific skill
 */
export function canRoleExecuteSkill(role: string, skillId: string): boolean {
    const allowedRoles = SKILL_PERMISSIONS[skillId];
    if (!allowedRoles) return true; // Default to allow if not explicitly restricted
    return allowedRoles.includes(role);
}

/**
 * Get user role in organization
 */
export async function getUserRole(organizationId: string, userId: string): Promise<string | null> {
    const { data, error } = await supabase
        .from('organization_members')
        .select('role')
        .eq('organization_id', organizationId)
        .eq('user_id', userId)
        .single();

    if (error || !data) return null;
    return data.role;
}

/**
 * Queue a skill action for human approval
 */
export async function queueForApproval(organizationId: string, skillId: string, parameters: any, userId?: string) {
    // Generate a friendly payload for the Approver
    const payload = {
        skill: skillId,
        parameters: parameters,
        summary: `Action requested: ${skillId.replace(/_/g, ' ')}`,
        action_type: skillId.includes('create') ? 'create' : 'update',
        requested_by: userId
    };

    const { data, error } = await supabase
        .from('ed_approval_queue')
        .insert({
            organization_id: organizationId,
            skill_id: skillId,
            payload: payload,
            context: parameters,
            status: 'pending',
            requested_by: userId
        })
        .select()
        .single();

    if (error) {
        console.error('[Approvals] Error queueing action:', error);
        throw error;
    }

    return data;
}
