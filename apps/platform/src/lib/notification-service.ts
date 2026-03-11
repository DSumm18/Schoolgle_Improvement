import { supabase } from "./supabase";
import { sendEmail } from "./email-service";

export type NotificationType =
  | "action_assigned"
  | "action_overdue"
  | "scan_complete"
  | "insight_found"
  | "helpdesk_created"
  | "helpdesk_assigned"
  | "helpdesk_updated"
  | "compliance_reminder"
  | "compliance_overdue"
  | "vision_findings"
  | "risk_alert"
  | "training_expiry"
  | "approval_sla_breach"
  | "energy_anomaly"
  | "daily_summary";

export interface NotificationPayload {
  organizationId: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  metadata?: any;
  sendEmail?: boolean;
  emailTo?: string;
  emailHtml?: string;
}

export const NotificationService = {
  async send(payload: NotificationPayload) {
    console.log(
      `[Notification] Sending to ${payload.userId}: ${payload.title}`,
    );

    try {
      const { error } = await supabase.from("notifications").insert({
        organization_id: payload.organizationId,
        user_id: payload.userId,
        type: payload.type,
        title: payload.title,
        message: payload.message,
        link: payload.link,
        metadata: payload.metadata,
      });

      if (error) {
        console.error("Error saving notification:", error);
        return { success: false, error };
      }

      // Send email notification if requested
      if (payload.sendEmail && payload.emailTo && payload.emailHtml) {
        await sendEmail({
          to: payload.emailTo,
          subject: payload.title,
          html: payload.emailHtml,
        });
      }

      return { success: true };
    } catch (err) {
      console.error("Notification Service Exception:", err);
      return { success: false, error: err };
    }
  },

  async markAsRead(id: string) {
    return supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);
  },

  async getUnreadCount(userId: string) {
    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_read", false);

    return error ? 0 : count;
  },
};
