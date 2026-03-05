import { supabase } from '../lib/supabase'; // Assuming there's a shared client or similar
import { ALL_SKILLS, SkillDefinition } from './registry';
import { CommunicationRouter } from '../communication/communication-router';
import { CommunicationPayload } from '../communication/types';
import { EstatesSkills } from './handlers/estates';
import { HRSkills } from './handlers/hr';
import { SafetySkills } from './handlers/safety';
import { EmergencySkills } from './handlers/emergency';

export interface SkillConfig {
    skill_id: string;
    is_enabled: boolean;
    preferred_channel: string | null;
    recipients_config: any;
    approval_tier: 'AUTO' | 'SHADOW' | 'REVIEW' | 'BLOCKED';
}

export interface ExecutionResult {
    success: boolean;
    status: 'sent' | 'queued' | 'failed' | 'blocked';
    error?: string;
}

export class SkillRunner {
    constructor(
        private commRouter: CommunicationRouter,
        private organizationId: string
    ) { }

    /**
     * Fetches the specific configuration for a skill for the current organization.
     */
    private async getSkillConfig(skillId: string): Promise<SkillConfig | null> {
        const { data, error } = await supabase
            .from('school_skills_config')
            .select('*')
            .eq('organization_id', this.organizationId)
            .eq('skill_id', skillId)
            .maybeSingle();

        if (error) {
            console.error(`[SkillRunner] Error fetching config for ${skillId}:`, error);
            return null;
        }

        return data;
    }

    /**
     * Executes a skill if it is enabled.
     */
    async runSkill(skillId: string, context: any): Promise<ExecutionResult> {
        const skill = ALL_SKILLS.find(s => s.id === skillId);
        if (!skill) {
            return { success: false, status: 'failed', error: `Skill ${skillId} not found` };
        }

        const config = await this.getSkillConfig(skillId);
        if (config && !config.is_enabled) {
            return { success: false, status: 'blocked', error: 'Skill is disabled' };
        }

        // Determine target channel
        const channel = config?.preferred_channel || skill.defaultChannel;
        const tier = config?.approval_tier || 'AUTO';

        console.log(`[SkillRunner] Running skill: ${skill.name} via ${channel} (Tier: ${tier})`);

        if (tier === 'BLOCKED') {
            return { success: false, status: 'blocked', error: 'Skill is BLOCKED' };
        }

        // Logic for execution or queueing
        return this.handleTieredExecution(skill, channel as any, context, config);
    }

    private async handleTieredExecution(
        skill: SkillDefinition,
        channel: any,
        context: any,
        config: SkillConfig | null
    ): Promise<ExecutionResult> {
        const tier = config?.approval_tier || 'AUTO';

        if (tier === 'REVIEW') {
            const queued = await this.queueForApproval(skill, channel, context);
            return { success: queued, status: queued ? 'queued' : 'failed' };
        }

        if (tier === 'SHADOW') {
            // Send normally but also log for review (async)
            this.queueForApproval(skill, channel, context, 'shadow');
        }

        // Standard execution (AUTO or SHADOW)
        const ok = await this.executeSkillHandler(skill, channel, context, config);
        return { success: ok, status: ok ? 'sent' : 'failed' };
    }

    private async queueForApproval(
        skill: SkillDefinition,
        channel: any,
        context: any,
        shadow?: 'shadow'
    ): Promise<boolean> {
        console.log(`[SkillRunner] Queueing ${skill.id} for ${shadow ? 'SHADOW' : 'HUMAN'} review.`);

        // In a real implementation, we would construct the full payload here
        // and insert into 'ed_approval_queue'.
        const { error } = await supabase
            .from('ed_approval_queue')
            .insert({
                organization_id: this.organizationId,
                skill_id: skill.id,
                context: context,
                payload: {
                    to: context.to || 'Unknown',
                    subject: context.subject || `${skill.name} Draft`,
                    body: context.body || `Draft message for ${skill.name}`,
                    channel: channel
                },
                status: 'pending'
            });

        if (error) {
            console.error(`[SkillRunner] Error queueing approval:`, error);
            return false;
        }

        return true;
    }

    private async executeSkillHandler(
        skill: SkillDefinition,
        channel: any,
        context: any,
        config: SkillConfig | null
    ): Promise<boolean> {
        const estates = new EstatesSkills(this.commRouter, this.organizationId);

        switch (skill.id) {
            case 'estates_contractor_chase':
                await estates.runContractorChase();
                return true;
            case 'estates_dbs_expiry':
                await estates.runDBSExpiryCheck();
                return true;
            case 'estates_compliance_reminder':
            case 'estates_maintenance_reminder':
                // Handled via the consolidated reminder service 
                // but triggered here if needed for ad-hoc re-runs
                const payload: CommunicationPayload = {
                    to: context.to || config?.recipients_config?.to,
                    subject: context.subject || `${skill.name} Alert`,
                    body: context.body || `Ed Notification: ${skill.description}`,
                    channel: channel
                };
                const result = await this.commRouter.sendMessage(payload);
                return result.success;

            case 'hr_staff_absence':
                const hr = new HRSkills(this.commRouter, this.organizationId);
                return await hr.runStaffAbsence(channel, context);

            case 'hr_arrival_verify':
                const hrArrival = new HRSkills(this.commRouter, this.organizationId);
                return await hrArrival.runArrivalVerify(channel, context);

            case 'safety_gate_access':
                const safety = new SafetySkills(this.commRouter, this.organizationId);
                return await safety.runGateAccess(channel, context);

            case 'safety_emergency_lockdown':
                const emergency = new EmergencySkills(this.commRouter, this.organizationId);
                return await emergency.runEmergencyLockdown(channel, context);

            case 'safety_critical_incident':
                const incident = new EmergencySkills(this.commRouter, this.organizationId);
                return await incident.runCriticalIncident(channel, context);

            default:
                console.warn(`[SkillRunner] No handler implemented for ${skill.id}`);
                return false;
        }
    }
}
