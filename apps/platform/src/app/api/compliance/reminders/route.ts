import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

/**
 * POST /api/compliance/reminders
 * Generate reminders for an organization:
 * - Overdue/upcoming policy reviews
 * - Expiring/expired training
 * - Pending approvals
 * - Overdue SAR deadlines
 */
export const POST = protectedRoute(
  async (auth, request) => {
    const { organizationId, userId } = auth;
    const supabase = createServiceRoleClient();
    const today = new Date().toISOString().split("T")[0];
    const in14Days = new Date();
    in14Days.setDate(in14Days.getDate() + 14);
    const in14Str = in14Days.toISOString().split("T")[0];

    const notifications: Array<{
      organization_id: string;
      user_id: string;
      type: string;
      title: string;
      message: string;
      link?: string;
      entity_type?: string;
      entity_id?: string;
    }> = [];

    // 1. Overdue policy reviews
    const { data: items } = await supabase
      .from("compliance_items")
      .select("id, title, owner_user_id")
      .eq("organization_id", organizationId)
      .eq("type", "policy")
      .neq("status", "archived");

    if (items && items.length > 0) {
      const { data: schedules } = await supabase
        .from("compliance_review_schedule")
        .select("compliance_item_id, next_review_date")
        .in(
          "compliance_item_id",
          items.map((i) => i.id),
        );

      for (const sched of schedules || []) {
        if (!sched.next_review_date) continue;
        const item = items.find((i) => i.id === sched.compliance_item_id);
        if (!item) continue;

        if (sched.next_review_date < today) {
          notifications.push({
            organization_id: organizationId,
            user_id: item.owner_user_id || "",
            type: "review_overdue",
            title: `Policy review overdue: ${item.title}`,
            message: `Review was due on ${sched.next_review_date}`,
            entity_type: "compliance_item",
            entity_id: item.id,
          });
        } else if (sched.next_review_date <= in14Str) {
          notifications.push({
            organization_id: organizationId,
            user_id: item.owner_user_id || "",
            type: "review_upcoming",
            title: `Policy review due soon: ${item.title}`,
            message: `Review due on ${sched.next_review_date}`,
            entity_type: "compliance_item",
            entity_id: item.id,
          });
        }
      }
    }

    // 2. Expired/expiring training
    const { data: completions } = await supabase
      .from("compliance_training_completions")
      .select("id, user_id, course_id, expires_at")
      .eq("organization_id", organizationId)
      .not("expires_at", "is", null);

    for (const comp of completions || []) {
      if (!comp.expires_at) continue;
      if (comp.expires_at < today) {
        notifications.push({
          organization_id: organizationId,
          user_id: comp.user_id,
          type: "training_expired",
          title: "Training has expired",
          message: `Training expired on ${comp.expires_at}. Please renew.`,
          entity_type: "training_completion",
          entity_id: comp.id,
        });
      } else if (comp.expires_at <= in14Str) {
        notifications.push({
          organization_id: organizationId,
          user_id: comp.user_id,
          type: "training_expiring",
          title: "Training expiring soon",
          message: `Training expires on ${comp.expires_at}`,
          entity_type: "training_completion",
          entity_id: comp.id,
        });
      }
    }

    // 3. Pending approvals
    const { data: pendingApprovals } = await supabase
      .from("compliance_approvals")
      .select("id, compliance_item_id, approver_user_id, stage")
      .eq("decision", "pending");

    // Filter to items in this org
    if (pendingApprovals && pendingApprovals.length > 0 && items) {
      const orgItemIds = new Set(items.map((i) => i.id));
      for (const ap of pendingApprovals) {
        if (orgItemIds.has(ap.compliance_item_id) && ap.approver_user_id) {
          const item = items.find((i) => i.id === ap.compliance_item_id);
          notifications.push({
            organization_id: organizationId,
            user_id: ap.approver_user_id,
            type: "approval_pending",
            title: `Approval required: ${item?.title || "Unknown"}`,
            message: `Your ${ap.stage} approval is pending`,
            entity_type: "compliance_approval",
            entity_id: ap.id,
          });
        }
      }
    }

    // 4. Overdue SAR deadlines
    const { data: sarItems } = await supabase
      .from("compliance_items")
      .select("id, title, owner_user_id")
      .eq("organization_id", organizationId)
      .eq("type", "sar")
      .neq("status", "archived");

    if (sarItems && sarItems.length > 0) {
      const { data: sars } = await supabase
        .from("compliance_sar_records")
        .select("compliance_item_id, deadline_date, response_date")
        .in(
          "compliance_item_id",
          sarItems.map((i) => i.id),
        )
        .is("response_date", null);

      for (const sar of sars || []) {
        if (!sar.deadline_date) continue;
        const item = sarItems.find((i) => i.id === sar.compliance_item_id);
        if (!item) continue;

        if (sar.deadline_date < today) {
          notifications.push({
            organization_id: organizationId,
            user_id: item.owner_user_id || "",
            type: "sar_overdue",
            title: `SAR deadline overdue: ${item.title}`,
            message: `Deadline was ${sar.deadline_date}`,
            entity_type: "compliance_item",
            entity_id: item.id,
          });
        } else if (sar.deadline_date <= in14Str) {
          notifications.push({
            organization_id: organizationId,
            user_id: item.owner_user_id || "",
            type: "sar_deadline_approaching",
            title: `SAR deadline approaching: ${item.title}`,
            message: `Deadline is ${sar.deadline_date}`,
            entity_type: "compliance_item",
            entity_id: item.id,
          });
        }
      }
    }

    // Insert notifications (skip those with empty user_id)
    const validNotifications = notifications
      .filter((n) => n.user_id)
      .map((n) => ({ ...n, read: false }));

    let inserted = 0;
    if (validNotifications.length > 0) {
      const { data: insertedData, error: insertError } = await supabase
        .from("compliance_notifications")
        .insert(validNotifications)
        .select();

      if (insertError) {
        console.error("Error inserting notifications:", insertError);
      }
      inserted = insertedData?.length || 0;
    }

    // Audit log
    await supabase.from("compliance_audit_log").insert({
      organization_id: organizationId,
      entity_type: "reminders",
      entity_id: organizationId,
      action: "reminders_generated",
      actor_user_id: userId,
      metadata: { generated: notifications.length, inserted },
    });

    return apiSuccess({
      generated: notifications.length,
      inserted,
      notifications: validNotifications,
    });
  },
  { requiredRole: "teacher" },
);
