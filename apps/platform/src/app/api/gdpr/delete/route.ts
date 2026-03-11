import { NextRequest } from "next/server";
import { createHash } from "crypto";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { gdprDeleteSchema, validateRequest } from "@/lib/validations";

/** SHA-256 hash for audit log (irreversible, unlike base64) */
function hashEmail(email: string): string {
  return createHash("sha256").update(email.toLowerCase().trim()).digest("hex");
}

/**
 * GDPR Data Deletion Endpoint
 * Deletes all personal data for a user
 * Satisfies Article 17 (Right to Erasure / Right to be Forgotten)
 */
export const POST = protectedRoute(
  async (auth, request) => {
    const supabase = createServiceRoleClient();

    // Parse and validate request body
    const body = await request.json();
    const validation = validateRequest(gdprDeleteSchema, body);

    if (!validation.success) {
      return apiError(validation.error || "Invalid request", 400);
    }

    const { userId, confirmDeletion } = validation.data;

    // Verify user exists
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, email")
      .eq("id", userId)
      .single();

    if (userError || !userData) {
      return apiError("User not found", 404);
    }

    const deletionLog: string[] = [];

    // 1. Delete user's lesson observations
    const { error: obsError, count: obsCount } = await supabase
      .from("lesson_observations")
      .delete()
      .eq("observer_id", userId);

    if (!obsError)
      deletionLog.push(`Deleted ${obsCount || 0} lesson observations`);

    // 2. Update actions - remove user as assignee (don't delete org data)
    const { error: actError } = await supabase
      .from("actions")
      .update({ assigned_to: null })
      .eq("assigned_to", userId);

    if (!actError) deletionLog.push("Removed user from action assignments");

    // 3. Update assessments - anonymise assessor
    const { error: assessError } = await supabase
      .from("ofsted_assessments")
      .update({ assessed_by: null })
      .eq("assessed_by", userId);

    if (!assessError) deletionLog.push("Anonymised assessment records");

    // 4. Delete invitations sent by user
    const { error: invError, count: invCount } = await supabase
      .from("invitations")
      .delete()
      .eq("invited_by", userId);

    if (!invError) deletionLog.push(`Deleted ${invCount || 0} invitations`);

    // 5. Remove user from organisation memberships
    const { error: memError, count: memCount } = await supabase
      .from("organization_members")
      .delete()
      .eq("user_id", userId);

    if (!memError)
      deletionLog.push(`Removed from ${memCount || 0} organisations`);

    // 6. Log the deletion before deleting user (for audit)
    await supabase.from("activity_log").insert({
      event_type: "gdpr_user_deleted",
      event_data: {
        deleted_user_email_hash: hashEmail(userData.email),
        deletion_date: new Date().toISOString(),
        deletion_log: deletionLog,
      },
    });

    // 7. Delete the user record
    const { error: deleteError } = await supabase
      .from("users")
      .delete()
      .eq("id", userId);

    if (deleteError) {
      return apiError("Failed to delete user: " + deleteError.message, 500);
    }

    deletionLog.push("User account deleted");

    return apiSuccess({
      success: true,
      message: "All personal data has been deleted",
      deletion_reference: `DEL-${Date.now()}`,
      deletion_date: new Date().toISOString(),
      actions_taken: deletionLog,
      backup_purge_note:
        "Data in backups will be automatically purged within 90 days",
    });
  },
  { requiredRole: "admin" },
);

/**
 * GDPR Organisation Deletion Endpoint
 * Deletes entire organisation and all associated data
 */
export const DELETE = protectedRoute(
  async (auth, request) => {
    const supabase = createServiceRoleClient();

    // Parse and validate request body
    const body = await request.json();
    const validation = validateRequest(gdprDeleteSchema, body);

    if (!validation.success) {
      return apiError(validation.error || "Invalid request", 400);
    }

    const { organizationId, confirmDeletion } = body;
    const orgId = organizationId || auth.organizationId;

    const deletionLog: string[] = [];

    // Delete in order (respecting foreign keys)
    // Includes all compliance, governance, estates, staff, and survey tables
    const tables = [
      // Compliance module
      "compliance_consent_records",
      "compliance_scr_entries",
      "compliance_low_level_concerns",
      "compliance_complaints",
      "compliance_foi_requests",
      "compliance_sar_records",
      "compliance_dpia_records",
      "compliance_breach_records",
      "compliance_training_completions",
      "compliance_review_schedule",
      "compliance_policies",
      "compliance_tasks",
      // Governance module
      "governance_visits",
      "governance_training",
      "governance_meeting_attendees",
      "governance_meetings",
      "governance_governors",
      "governance_board",
      // Estates module
      "estates_daily_check_completions",
      "estates_routine_items",
      "estates_routines",
      "estates_helpdesk_tickets",
      "estates_tasks",
      "estates_contractors",
      "estates_assets",
      // Staff / HR
      "staff_directory",
      "staff_absences",
      // Survey responses
      "survey_responses",
      "survey_questions",
      "surveys",
      // Core tables
      "lesson_observations",
      "evidence_matches",
      "documents",
      "siams_assessments",
      "ofsted_assessments",
      "safeguarding_assessments",
      "actions",
      "sdp_milestones",
      "sdp_priorities",
      "sports_premium_spending",
      "sports_premium_data",
      "pp_spending",
      "pupil_premium_data",
      "statutory_documents",
      "notes",
      "activity_log",
      "meetings",
      "cpd_records",
      "policies",
      "risk_register",
      "reminders",
      "monitoring_visits",
      "external_visits",
      "invitations",
      "organization_members",
      "organization_modules",
      "subscriptions",
      "usage_logs",
      "usage_events",
      "usage_daily_summary",
    ];

    for (const table of tables) {
      const { count } = await supabase
        .from(table)
        .delete()
        .eq("organization_id", orgId);

      if (count) deletionLog.push(`Deleted ${count} records from ${table}`);
    }

    // Finally delete the organisation
    const { error: orgError } = await supabase
      .from("organizations")
      .delete()
      .eq("id", orgId);

    if (orgError) {
      return apiError("Failed to delete organisation", 500, undefined, {
        partial_deletion: deletionLog,
      });
    }

    deletionLog.push("Organisation deleted");

    return apiSuccess({
      success: true,
      message: "Organisation and all associated data has been deleted",
      deletion_reference: `ORG-DEL-${Date.now()}`,
      deletion_date: new Date().toISOString(),
      actions_taken: deletionLog,
      backup_purge_note:
        "Data in backups will be automatically purged within 90 days",
    });
  },
  { requiredRole: "admin" },
);
