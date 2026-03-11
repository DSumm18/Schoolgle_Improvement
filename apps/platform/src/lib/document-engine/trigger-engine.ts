/**
 * Document Trigger Engine
 *
 * Evaluates trigger rules when events occur across the platform.
 * Auto-generates documents (and optionally sends them) based on configured rules.
 *
 * Supported trigger events:
 * - sickness.bradford_threshold    → Bradford Factor breaches a level
 * - sickness.absence_recorded      → New sickness absence recorded
 * - sickness.return_to_work        → Staff member returns (end_date set)
 * - meeting.completed              → Meeting status → completed
 * - estates.contractor_cert_expiry → Contractor certificate approaching expiry
 * - estates.task_overdue           → Estates task past due date
 * - compliance.training_due        → Training requirement approaching due date
 * - compliance.policy_review_due   → Policy review date approaching
 * - governance.term_expiry         → Governor term nearing expiry
 * - staff.probation_review         → Staff member's probation review date approaching
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { renderDocument, OrgBranding } from "./template-renderer";
import { resolvePlaceholders, ResolverContext } from "./placeholder-resolver";
import type { DocumentTemplate } from "./types";

export interface TriggerEvent {
  event: string;
  organizationId: string;
  payload: Record<string, any>;
}

export interface TriggerResult {
  ruleId: string;
  templateId: string;
  documentId?: string;
  sent: boolean;
  error?: string;
}

/**
 * Evaluate all active trigger rules for a given event.
 * Returns generated documents (if any matched).
 */
export async function evaluateTriggers(
  supabase: SupabaseClient,
  event: TriggerEvent,
): Promise<TriggerResult[]> {
  // Fetch active trigger rules for this event and organization
  const { data: rules, error } = await supabase
    .from("document_trigger_rules")
    .select("*, document_templates(*)")
    .eq("organization_id", event.organizationId)
    .eq("trigger_event", event.event)
    .eq("is_active", true);

  if (error || !rules || rules.length === 0) {
    return [];
  }

  const results: TriggerResult[] = [];

  for (const rule of rules) {
    try {
      // Check if conditions match
      if (!matchesConditions(rule.trigger_conditions, event.payload)) {
        continue;
      }

      const template = rule.document_templates as DocumentTemplate | null;
      if (!template) continue;

      // Build resolver context from event payload
      const resolverContext: ResolverContext = {
        organizationId: event.organizationId,
        staffId: event.payload.staffId || event.payload.staff_id,
        meetingId: event.payload.meetingId || event.payload.meeting_id,
        contractorId: event.payload.contractorId || event.payload.contractor_id,
        customValues: event.payload.customValues || {},
      };

      // Resolve placeholders
      const values = await resolvePlaceholders(
        template,
        resolverContext,
        supabase,
      );

      // Merge any extra values from payload
      if (event.payload.extraValues) {
        Object.assign(values, event.payload.extraValues);
      }

      // Get org branding
      const branding = await getOrgBranding(supabase, event.organizationId);

      // Render the document
      const { subject, body } = renderDocument(
        template,
        values,
        branding || undefined,
      );

      // Determine recipient
      const recipientName =
        values.staff_name ||
        values.attendee_name ||
        values.contractor_name ||
        "Recipient";
      const recipientEmail =
        values.staff_email ||
        values.contractor_email ||
        event.payload.recipientEmail ||
        null;
      const recipientType = event.payload.recipientType || "staff";

      // Insert the generated document
      const { data: doc, error: docError } = await supabase
        .from("generated_documents")
        .insert({
          organization_id: event.organizationId,
          template_id: template.id,
          module: template.module,
          document_type: template.document_type || "letter",
          created_by: event.payload.triggeredBy || "system",
          recipient_type: recipientType,
          recipient_id:
            resolverContext.staffId || resolverContext.contractorId || null,
          recipient_name: recipientName,
          recipient_email: recipientEmail,
          context_type: event.payload.contextType || event.event.split(".")[0],
          context_id: event.payload.contextId || null,
          subject,
          body_html: body,
          placeholder_values: values,
          status: rule.auto_send ? "sent" : "draft",
        })
        .select()
        .single();

      if (docError) {
        results.push({
          ruleId: rule.id,
          templateId: template.id,
          error: docError.message,
          sent: false,
        });
        continue;
      }

      // Update last_triggered_at
      await supabase
        .from("document_trigger_rules")
        .update({ last_triggered_at: new Date().toISOString() })
        .eq("id", rule.id);

      let sent = false;

      // Auto-send if configured and recipient has email
      if (rule.auto_send && recipientEmail) {
        try {
          const { sendEmail } = await import("@/lib/email-service");
          const result = await sendEmail({
            to: recipientEmail,
            subject,
            html: body,
            tags: [
              { name: "module", value: template.module },
              { name: "trigger", value: event.event },
            ],
          });

          if (result.success) {
            sent = true;
            // Log delivery
            await supabase.from("document_delivery_log").insert({
              document_id: doc.id,
              method: "email",
              recipient_email: recipientEmail,
              status: "sent",
              attempted_at: new Date().toISOString(),
              provider_id: result.id || null,
            });
          }
        } catch {
          // Email sending is non-critical
        }
      }

      // Notify configured users
      if (rule.notify_users && rule.notify_users.length > 0) {
        // Fire-and-forget notification
        notifyUsers(supabase, rule.notify_users, {
          event: event.event,
          documentId: doc.id,
          subject,
          recipientName,
        }).catch(() => {});
      }

      results.push({
        ruleId: rule.id,
        templateId: template.id,
        documentId: doc.id,
        sent,
      });
    } catch (err: any) {
      results.push({
        ruleId: rule.id,
        templateId: rule.template_id,
        error: err.message,
        sent: false,
      });
    }
  }

  return results;
}

/**
 * Check if event payload matches trigger conditions.
 * Supports: equals, gte, lte, in, not_equals, exists
 */
function matchesConditions(
  conditions: Record<string, any>,
  payload: Record<string, any>,
): boolean {
  if (!conditions || Object.keys(conditions).length === 0) return true;

  for (const [key, condition] of Object.entries(conditions)) {
    const payloadValue = payload[key];

    if (
      typeof condition === "object" &&
      condition !== null &&
      !Array.isArray(condition)
    ) {
      // Complex condition
      if (condition.equals !== undefined && payloadValue !== condition.equals)
        return false;
      if (
        condition.not_equals !== undefined &&
        payloadValue === condition.not_equals
      )
        return false;
      if (
        condition.gte !== undefined &&
        (payloadValue === undefined || payloadValue < condition.gte)
      )
        return false;
      if (
        condition.lte !== undefined &&
        (payloadValue === undefined || payloadValue > condition.lte)
      )
        return false;
      if (condition.in !== undefined && !condition.in.includes(payloadValue))
        return false;
      if (condition.exists === true && payloadValue === undefined) return false;
      if (condition.exists === false && payloadValue !== undefined)
        return false;
    } else {
      // Simple equality
      if (payloadValue !== condition) return false;
    }
  }

  return true;
}

async function getOrgBranding(
  supabase: SupabaseClient,
  orgId: string,
): Promise<OrgBranding | null> {
  const { data } = await supabase
    .from("organizations")
    .select("name, settings")
    .eq("id", orgId)
    .single();

  if (!data) return null;

  const settings = data.settings || {};
  return {
    school_name: data.name || "",
    logo_url: settings.logo_url,
    address: settings.address,
    phone: settings.phone,
    email: settings.email,
    primary_color: settings.primary_color,
    footer_text: settings.footer_text,
  };
}

async function notifyUsers(
  supabase: SupabaseClient,
  userIds: string[],
  context: {
    event: string;
    documentId: string;
    subject: string;
    recipientName: string;
  },
): Promise<void> {
  // Get user emails
  const { data: users } = await supabase
    .from("users")
    .select("email, display_name")
    .in("id", userIds);

  if (!users || users.length === 0) return;

  const { sendEmail } = await import("@/lib/email-service");

  const eventLabel = context.event.replace(/\./g, " ").replace(/_/g, " ");

  for (const user of users) {
    if (!user.email) continue;
    await sendEmail({
      to: user.email,
      subject: `[Schoolgle] Auto-document generated: ${context.subject}`,
      html: `<p>Hi ${user.display_name || "there"},</p>
<p>A document has been automatically generated by the <strong>${eventLabel}</strong> trigger:</p>
<p><strong>Subject:</strong> ${context.subject}<br/>
<strong>Recipient:</strong> ${context.recipientName}</p>
<p><a href="${process.env.NEXT_PUBLIC_APP_URL || "https://schoolgle.co.uk"}/dashboard/documents/${context.documentId}">View Document</a></p>
<p style="color:#94a3b8;font-size:12px;">You're receiving this because you're subscribed to document trigger notifications.</p>`,
    }).catch(() => {});
  }
}

/**
 * Convenience: fire a trigger event from anywhere in the app.
 * Import this in API routes that handle events (sickness, meetings, etc.)
 */
export async function fireTrigger(
  supabase: SupabaseClient,
  event: string,
  organizationId: string,
  payload: Record<string, any>,
): Promise<TriggerResult[]> {
  return evaluateTriggers(supabase, { event, organizationId, payload });
}

/**
 * Pre-defined trigger event constants for type safety
 */
export const TRIGGER_EVENTS = {
  // Sickness
  SICKNESS_BRADFORD_THRESHOLD: "sickness.bradford_threshold",
  SICKNESS_ABSENCE_RECORDED: "sickness.absence_recorded",
  SICKNESS_RETURN_TO_WORK: "sickness.return_to_work",
  // Meetings
  MEETING_COMPLETED: "meeting.completed",
  // Estates
  ESTATES_CONTRACTOR_CERT_EXPIRY: "estates.contractor_cert_expiry",
  ESTATES_TASK_OVERDUE: "estates.task_overdue",
  // Compliance
  COMPLIANCE_TRAINING_DUE: "compliance.training_due",
  COMPLIANCE_POLICY_REVIEW_DUE: "compliance.policy_review_due",
  // Governance
  GOVERNANCE_TERM_EXPIRY: "governance.term_expiry",
  // Staff
  STAFF_PROBATION_REVIEW: "staff.probation_review",
} as const;

export type TriggerEventType =
  (typeof TRIGGER_EVENTS)[keyof typeof TRIGGER_EVENTS];
