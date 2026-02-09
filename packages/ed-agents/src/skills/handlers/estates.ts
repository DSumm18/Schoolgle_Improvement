import { supabase } from '../lib/supabase';
import { CommunicationRouter } from '../communication/communication-router';
import { CommunicationChannel } from '../communication/types';

export class EstatesSkills {
    constructor(private commRouter: CommunicationRouter, private organizationId: string) { }

    /**
     * Skill: estates_contractor_chase
     * Follows up on tickets assigned but not updated in 48h.
     */
    async runContractorChase(): Promise<number> {
        const threshold = new Date();
        threshold.setHours(threshold.getHours() - 48);

        const { data: staleTickets, error } = await supabase
            .from('estates_helpdesk_tickets')
            .select(`
                id, 
                title, 
                contractor_id,
                estates_contractors (
                    name, 
                    contact_email, 
                    contact_phone
                )
            `)
            .eq('organization_id', this.organizationId)
            .eq('status', 'Assigned')
            .lt('updated_at', threshold.toISOString());

        if (error || !staleTickets) return 0;

        let sentCount = 0;
        for (const ticket of staleTickets) {
            const contractor = (ticket as any).estates_contractors;
            if (!contractor) continue;

            const target = contractor.contact_phone || contractor.contact_email;
            if (!target) continue;

            const channel: CommunicationChannel = contractor.contact_phone ? 'sms' : 'email';

            await this.commRouter.sendMessage({
                to: target,
                channel,
                subject: `FOLLOW UP: ${ticket.title}`,
                body: `Hi ${contractor.name}, Ed here from Schoolgle. Just checking in on ticket #${ticket.id.substring(0, 8)} (${ticket.title}). It's been over 48h since the last update. Is everything on track?`
            });
            sentCount++;
        }

        return sentCount;
    }

    /**
     * Skill: estates_dbs_expiry
     * Alerts admins of upcoming DBS expiries.
     */
    async runDBSExpiryCheck(): Promise<number> {
        const soon = new Date();
        soon.setDate(soon.getDate() + 30); // 30 day warning

        const { data: contractors, error } = await supabase
            .from('estates_contractors')
            .select('id, name, dbs_expiry, contact_email')
            .eq('organization_id', this.organizationId)
            .lt('dbs_expiry', soon.toISOString())
            .gt('dbs_expiry', new Date().toISOString());

        if (error || !contractors) return 0;

        let alertCount = 0;
        for (const c of contractors) {
            // Send to school admin (placeholder email for now till we get org settings)
            await this.commRouter.sendMessage({
                to: 'admin@schoolgle.co.uk',
                channel: 'email',
                subject: `COMPLIANCE ALERT: DBS Expiry - ${c.name}`,
                body: `The DBS accreditation for ${c.name} is due to expire on ${new Date(c.dbs_expiry).toLocaleDateString()}. Please request an updated certificate.`
            });
            alertCount++;
        }

        return alertCount;
    }
}
