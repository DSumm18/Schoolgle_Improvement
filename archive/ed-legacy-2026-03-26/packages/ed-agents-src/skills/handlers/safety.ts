import { supabase } from '../lib/supabase';
import { CommunicationRouter } from '../communication/communication-router';
import { CommunicationChannel } from '../communication/types';

export class SafetySkills {
    constructor(private commRouter: CommunicationRouter, private organizationId: string) { }

    /**
     * Skill: safety_gate_access
     * Remotely control school gates via Ed.
     */
    async runGateAccess(channel: CommunicationChannel, context: any): Promise<boolean> {
        const { phone, message, conversation_state } = context;

        // 1. Identification & Security Check
        // In a real scenario, we'd check if the user has 'admin' or 'slt' role.
        const { data: member, error: memberError } = await supabase
            .from('organization_members')
            .select('role, user_id, users(display_name)')
            .eq('organization_id', this.organizationId)
            .eq('user_id', (await supabase.from('users').select('id').eq('email', context.email).single()).data?.id) // Simplified identification
            .single();

        // Fallback to phone identification for SMS-based gate control
        const { data: staff, error: staffError } = await supabase
            .from('staff_directory')
            .select('id, first_name, last_name, role_category')
            .eq('organization_id', this.organizationId)
            .eq('phone', phone)
            .single();

        if (!staff || !['headteacher', 'business_manager', 'site_manager'].includes(staff.role_category)) {
            await this.commRouter.sendMessage({
                to: phone,
                subject: 'Security Alert',
                body: "Ed here. Access Denied. You do not have permission to control school gates remotely.",
                channel: 'sms'
            });
            return false;
        }

        // 2. Conversation Flow
        if (!conversation_state || conversation_state.step === 'INITIAL') {
            await this.commRouter.sendMessage({
                to: phone,
                subject: 'Gate Control',
                body: `Authenticated: ${staff.first_name}. Which gate would you like to operate? (Reply with 'Main', 'Staff', or 'Pedestrian').`,
                channel: 'sms',
                metadata: {
                    skill_id: 'safety_gate_access',
                    step: 'AWAITING_GATE_ID'
                }
            });
            return true;
        }

        if (conversation_state.step === 'AWAITING_GATE_ID') {
            const gate = message;
            await this.commRouter.sendMessage({
                to: phone,
                subject: 'Gate Control',
                body: `Confirming: Open ${gate} gate now? (Reply 'YES' to confirm).`,
                channel: 'sms',
                metadata: {
                    ...conversation_state,
                    step: 'AWAITING_CONFIRMATION',
                    gate_id: gate
                }
            });
            return true;
        }

        if (conversation_state.step === 'AWAITING_CONFIRMATION' && message.toUpperCase() === 'YES') {
            // 3. Trigger Physical Gate Action (Mocked)
            console.log(`[Safety Skills] TRIGGERING GATE OPEN: ${conversation_state.gate_id} at Org ${this.organizationId}`);

            // Log to activity log
            await supabase.from('activity_log').insert({
                organization_id: this.organizationId,
                action_type: 'update',
                entity_type: 'gate',
                description: `Remote gate access: ${conversation_state.gate_id} opened by ${staff.first_name} ${staff.last_name} via Ed SMS.`
            });

            await this.commRouter.sendMessage({
                to: phone,
                subject: 'Gate Control',
                body: `Action Complete: ${conversation_state.gate_id} gate is opening. It will auto-close in 30 seconds.`,
                channel: 'sms'
            });
            return true;
        }

        return false;
    }
}
