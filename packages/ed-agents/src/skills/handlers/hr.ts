import { supabase } from '../lib/supabase';
import { CommunicationRouter } from '../communication/communication-router';
import { CommunicationChannel } from '../communication/types';

export class HRSkills {
    constructor(private commRouter: CommunicationRouter, private organizationId: string) { }

    /**
     * Skill: hr_staff_absence
     * Interactive flow for processing staff absence reports.
     */
    async runStaffAbsence(channel: CommunicationChannel, context: any): Promise<boolean> {
        const { phone, message, conversation_state } = context;

        // 1. Identify staff member by phone number
        const { data: staff, error: staffError } = await supabase
            .from('staff_directory')
            .select('id, first_name, last_name')
            .eq('organization_id', this.organizationId)
            .eq('phone', phone)
            .single();

        if (staffError || !staff) {
            console.error('[HR Skills] Could not identify staff by phone:', phone);
            await this.commRouter.sendMessage({
                to: phone,
                subject: 'Absence Reporting',
                body: "Ed here. I don't recognize this number for absence reporting. Please contact your school admin to update your contact details.",
                channel: 'sms'
            });
            return false;
        }

        // 2. State machine for conversation
        // If no state, this is the first message
        if (!conversation_state || conversation_state.step === 'INITIAL') {
            await this.commRouter.sendMessage({
                to: phone,
                subject: 'Absence Reporting',
                body: `Hello ${staff.first_name}. I've started an absence report for you. Is this for today? (Reply with 'Yes' or provide the start date).`,
                channel: 'sms',
                metadata: {
                    skill_id: 'hr_staff_absence',
                    conversation_step: 'AWAITING_DATE',
                    staff_id: staff.id
                }
            });
            return true;
        }

        // 3. Process second message (AWAITING_DATE)
        if (conversation_state.step === 'AWAITING_DATE') {
            const startDate = message.toLowerCase() === 'yes' ? new Date().toISOString() : message;

            await this.commRouter.sendMessage({
                to: phone,
                subject: 'Absence Reporting',
                body: "Got it. Please provide the reason (e.g., Sickness, Emergency) and any additional notes.",
                channel: 'sms',
                metadata: {
                    ...conversation_state,
                    step: 'AWAITING_REASON',
                    start_date: startDate
                }
            });
            return true;
        }

        // 4. Final step: Store absence and confirm
        if (conversation_state.step === 'AWAITING_REASON') {
            const reason = message;

            const { error: insertError } = await supabase
                .from('staff_absences')
                .insert({
                    organization_id: this.organizationId,
                    staff_id: staff.id,
                    absence_type: 'sickness', // Simplified for now, could parse from reason
                    start_date: conversation_state.start_date,
                    reason: reason,
                    status: 'reported'
                });

            if (insertError) {
                console.error('[HR Skills] Error storing absence:', insertError);
                return false;
            }

            await this.commRouter.sendMessage({
                to: phone,
                subject: 'Absence Confirmed',
                body: `Thank you, ${staff.first_name}. Your absence has been logged and SLT have been notified. Get well soon!`,
                channel: 'sms'
            });
            return true;
        }

        return false;
    }

    /**
     * Skill: hr_arrival_verify
     */
    async runArrivalVerify(channel: CommunicationChannel, context: any): Promise<boolean> {
        const { phone } = context;

        // Identify staff
        const { data: staff, error: staffError } = await supabase
            .from('staff_directory')
            .select('id, first_name, last_name')
            .eq('organization_id', this.organizationId)
            .eq('phone', phone)
            .single();

        if (staffError || !staff) return false;

        // Log arrival to activity
        await supabase.from('activity_log').insert({
            organization_id: this.organizationId,
            action_type: 'create',
            entity_type: 'attendance',
            description: `Staff arrival verified: ${staff.first_name} ${staff.last_name} arrived on site.`,
            user_id: staff.id // Assuming staff metadata has a user mapping or just use ID
        });

        await this.commRouter.sendMessage({
            to: phone,
            subject: 'Arrival Verified',
            body: `Welcome back, ${staff.first_name}. You've been signed in for the day. Have a great shift!`,
            channel: 'sms'
        });

        return true;
    }
}
