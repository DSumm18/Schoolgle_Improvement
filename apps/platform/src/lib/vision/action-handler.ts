/**
 * Vision AI -- Action Handler
 *
 * Takes dispatched findings from the vision system and creates
 * real helpdesk tickets, notifications, and compliance actions.
 */

import type { ModuleDispatch, VisionResult } from "./types";
import { createServiceRoleClient } from "@/lib/supabase-server";

export interface ActionHandlerContext {
  organizationId: string;
  userId: string;
  roomName?: string;
  assetId?: string;
}

export interface ActionResult {
  ticketsCreated: number;
  notificationsSent: number;
  actions: Array<{
    module: string;
    action: string;
    recordId?: string;
  }>;
}

/**
 * Process vision dispatches and create real records
 */
export async function handleVisionActions(
  result: VisionResult,
  dispatches: ModuleDispatch[],
  context: ActionHandlerContext,
): Promise<ActionResult> {
  const supabase = createServiceRoleClient();
  const actions: ActionResult["actions"] = [];
  let ticketsCreated = 0;
  let notificationsSent = 0;

  for (const dispatch of dispatches) {
    if (dispatch.action === "no_issues" || dispatch.action === "updated")
      continue;

    // Create helpdesk ticket for actionable findings
    if (
      dispatch.module === "helpdesk" ||
      dispatch.action === "ticket_created"
    ) {
      try {
        const priority = dispatch.detail.toLowerCase().includes("critical")
          ? "urgent"
          : dispatch.detail.toLowerCase().includes("high")
            ? "high"
            : "medium";

        const { data: ticket, error } = await supabase
          .from("estates_helpdesk_tickets")
          .insert({
            organization_id: context.organizationId,
            title: `[Vision AI] ${context.roomName || "Room"}: ${dispatch.module.replace("_", " ")} issue`,
            description: dispatch.detail,
            category:
              dispatch.module === "helpdesk" ? "maintenance" : dispatch.module,
            priority,
            status: "open",
            reported_by: context.userId,
            asset_id: context.assetId || null,
            location: context.roomName || null,
            source: "vision_ai",
            metadata: {
              visionDispatch: dispatch,
              complianceScore: result.compliance.score,
              itemCount: result.items.length,
            },
          })
          .select("id")
          .single();

        if (!error && ticket) {
          ticketsCreated++;
          actions.push({
            module: dispatch.module,
            action: "ticket_created",
            recordId: ticket.id,
          });
        }
      } catch (err) {
        console.error("[Vision Actions] Failed to create ticket:", err);
      }
    }

    // Create notification for all flagged issues
    if (
      dispatch.action === "flag_raised" ||
      dispatch.action === "ticket_created"
    ) {
      try {
        const { error } = await supabase.from("notifications").insert({
          organization_id: context.organizationId,
          user_id: context.userId,
          type: "vision_findings",
          title: `Vision AI: ${dispatch.module.replace("_", " ")} finding`,
          message: dispatch.detail,
          link: "/estates-compliance/helpdesk",
          metadata: { dispatch, roomName: context.roomName },
        });

        if (!error) notificationsSent++;
      } catch (err) {
        console.error("[Vision Actions] Failed to send notification:", err);
      }
    }
  }

  return { ticketsCreated, notificationsSent, actions };
}
