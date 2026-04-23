import { CommunicationRouter } from '../../communication/communication-router';
import { CommunicationPayload } from '../../communication/types';
import { supabase } from '../../lib/supabase';

export class EmergencySkills {
    constructor(
        private commRouter: CommunicationRouter,
        private organizationId: string
    ) { }

    /**
     * safety_emergency_lockdown
     * Triggers a school-wide lockdown alert.
     * This is an asynchronous high-priority broadcast.
     */
    async runEmergencyLockdown(channel: any, context: any): Promise<boolean> {
        console.log(`[EmergencySkills] TRIGGERING LOCKDOWN for ${this.organizationId}`);

        // 1. Log to activity_log (critical event)
        await supabase.from('activity_log').insert({
            organization_id: this.organizationId,
            module: 'safety',
            action: 'lockdown_triggered',
            description: context.reason || 'Emergency Lockdown Triggered via Ed',
            severity: 'critical'
        });

        // 2. Fetch all staff with 'emergency' notify preference or all staff for critical
        const { data: staff } = await supabase
            .from('staff_directory')
            .select('phone, email')
            .eq('organization_id', this.organizationId)
            .eq('is_active', true);

        if (!staff || staff.length === 0) return false;

        // 3. Dispatch parallel alerts
        const alerts = staff.map(member => {
            const payload: CommunicationPayload = {
                to: member.phone || member.email,
                subject: '🚨 LOCKDOWN ALERT 🚨',
                body: context.message || 'LOCKDOWN! LOCKDOWN! Move to the nearest secure location immediately. This is not a drill.',
                channel: channel || 'voice', // Default to voice for max impact
                priority: 'urgent'
            };
            return this.commRouter.send(payload);
        });

        await Promise.all(alerts);
        return true;
    }

    /**
     * safety_critical_incident
     * Logs a detailed incident report to the database.
     */
    async runCriticalIncident(channel: any, context: any): Promise<boolean> {
        console.log(`[EmergencySkills] Logging Critical Incident for ${this.organizationId}`);

        const { error } = await supabase
            .from('incident_logs')
            .insert({
                organization_id: this.organizationId,
                type: context.type || 'safety',
                description: context.description || 'No description provided',
                severity: context.severity || 'high',
                reporter_id: context.reporter_id,
                metadata: {
                    location: context.location,
                    witnesses: context.witnesses,
                    immediate_actions: context.immediate_actions
                }
            });

        if (error) {
            console.error('[EmergencySkills] Error logging incident:', error);
            return false;
        }

        // Notify Leadership via Email
        const payload: CommunicationPayload = {
            to: 'leadership-team@schoolgle.co.uk', // Placeholder - in real app would fetch SLT emails
            subject: `Critical Incident Reported: ${context.type || 'Safety'}`,
            body: `A critical incident has been reported.\n\nType: ${context.type}\nSeverity: ${context.severity}\nDescription: ${context.description}\n\nPlease review in the dashboard immediately.`,
            channel: 'email',
            priority: 'high'
        };

        await this.commRouter.send(payload);
        return true;
    }
}
