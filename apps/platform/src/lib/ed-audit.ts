/**
 * Ed Skill Audit Logger
 * Logs WHAT Ed did (action type + record ID) but NEVER the content
 * GDPR-safe: no personal data stored
 */

import { SupabaseClient } from "@supabase/supabase-js";

export async function logEdAction(
  supabase: SupabaseClient,
  params: {
    organizationId: string;
    userId: string;
    skillName: string;
    actionSummary: string; // e.g. "Created helpdesk ticket" NOT "Created ticket about broken boiler in Room 3"
    success: boolean;
    recordId?: string;
    durationMs?: number;
  },
) {
  try {
    await supabase.from("ed_skill_audit_log").insert({
      organization_id: params.organizationId,
      user_id: params.userId,
      skill_name: params.skillName,
      action_summary: params.actionSummary,
      success: params.success,
      record_id: params.recordId,
      duration_ms: params.durationMs,
    });
  } catch (error) {
    // Never fail the main operation due to audit logging
    console.error("[Ed Audit] Failed to log action:", error);
  }
}
