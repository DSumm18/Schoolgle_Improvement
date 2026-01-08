import { supabase } from './supabase';

export type NotificationType = 'action_assigned' | 'action_overdue' | 'scan_complete' | 'insight_found';

export interface NotificationPayload {
    organizationId: string;
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    link?: string;
    metadata?: any;
}

export const NotificationService = {
    async send(payload: NotificationPayload) {
        console.log(`[Notification] Sending to ${payload.userId}: ${payload.title}`);

        try {
            const { error } = await supabase
                .from('notifications')
                .insert({
                    organization_id: payload.organizationId,
                    user_id: payload.userId,
                    type: payload.type,
                    title: payload.title,
                    message: payload.message,
                    link: payload.link,
                    metadata: payload.metadata
                });

            if (error) {
                console.error('Error saving notification:', error);
                return { success: false, error };
            }

            // In a real app, you might trigger an email here via a queue or Edge Function
            // this.triggerEmail(payload);

            return { success: true };
        } catch (err) {
            console.error('Notification Service Exception:', err);
            return { success: false, error: err };
        }
    },

    async markAsRead(id: string) {
        return supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', id);
    },

    async getUnreadCount(userId: string) {
        const { count, error } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('is_read', false);

        return error ? 0 : count;
    }
};
