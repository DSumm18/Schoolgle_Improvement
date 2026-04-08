import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

/**
 * POST /api/documents/generate
 * Generate a document from a template
 *
 * Body: {
 *   templateId, organizationId, recipientType, recipientId?,
 *   recipientName, recipientEmail?, contextType?, contextId?,
 *   placeholderValues: Record<string, string>, autoResolve?: boolean
 * }
 */
export const POST = protectedRoute(async (auth, request) => {
  const supabase = createServiceRoleClient();
  const body = await request.json();

  const {
    templateId,
    organizationId,
    recipientType,
    recipientId,
    recipientName,
    recipientEmail,
    contextType,
    contextId,
    placeholderValues,
    autoResolve,
  } = body;

  if (!templateId || !recipientName || !recipientType) {
    return apiError(
      "Missing required fields: templateId, recipientName, recipientType",
      400,
      "MISSING_FIELDS",
    );
  }

  const resolvedOrgId = organizationId || auth.organizationId;

  // Fetch the template
  const { data: template, error: templateError } = await supabase
    .from("document_templates")
    .select("*")
    .eq("id", templateId)
    .single();

  if (templateError || !template) {
    return apiError("Template not found", 404, "NOT_FOUND");
  }

  // Ensure the template is accessible
  if (template.organization_id && template.organization_id !== resolvedOrgId) {
    return apiError("Access denied to this template", 403, "FORBIDDEN");
  }

  // Build placeholder values, optionally auto-resolving from context
  let resolvedValues: Record<string, string> = {
    ...(placeholderValues || {}),
  };

  if (autoResolve) {
    // Auto-resolve common placeholders from context
    const autoResolved = await resolveContextPlaceholders(supabase, {
      organizationId: resolvedOrgId,
      recipientType,
      recipientId,
      recipientName,
      recipientEmail,
      contextType,
      contextId,
      senderId: auth.userId,
    });
    // User-provided values take precedence over auto-resolved
    resolvedValues = { ...autoResolved, ...resolvedValues };
  }

  // Replace placeholders in subject and body
  const replacePlaceholders = (
    text: string,
    vals: Record<string, string>,
  ): string => {
    if (!text) return "";
    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return vals[key] !== undefined ? vals[key] : match;
    });
  };

  const subject = replacePlaceholders(
    template.subject_template || "",
    resolvedValues,
  );
  const bodyHtml = replacePlaceholders(
    template.body_template || "",
    resolvedValues,
  );

  // Sanitise placeholder_values: strip PII fields before persisting
  const PII_PLACEHOLDER_KEYS = [
    "recipient_name", "recipient_first_name", "recipient_last_name",
    "sender_first_name", "sender_last_name", "sender_name",
    "recipient_email", "sender_email", "recipient_salutation",
  ];
  const sanitisedPlaceholders: Record<string, string> = {};
  for (const [k, v] of Object.entries(resolvedValues)) {
    if (!PII_PLACEHOLDER_KEYS.includes(k)) {
      sanitisedPlaceholders[k] = v;
    }
  }

  // Insert the generated document — NEVER persist recipient_name or raw PII
  const { data: document, error: insertError } = await supabase
    .from("generated_documents")
    .insert({
      organization_id: resolvedOrgId,
      template_id: templateId,
      module: template.module,
      document_type: template.document_type || "letter",
      created_by: auth.userId,
      recipient_type: recipientType,
      recipient_id: recipientId || null,
      // PII field removed — resolve name live from recipient_id at display time
      recipient_email: recipientEmail || null,
      context_type: contextType || null,
      context_id: contextId || null,
      subject,
      body_html: bodyHtml,
      placeholder_values: sanitisedPlaceholders,
      status: "draft",
    })
    .select()
    .single();

  if (insertError) {
    console.error("Error generating document:", insertError);
    return apiError(insertError.message, 500);
  }

  return apiSuccess(document, 201);
});

/**
 * Resolve placeholders from context data (organization, staff, sender, etc.)
 */
async function resolveContextPlaceholders(
  supabase: any,
  context: {
    organizationId: string;
    recipientType: string;
    recipientId?: string;
    recipientName: string;
    recipientEmail?: string;
    contextType?: string;
    contextId?: string;
    senderId?: string;
  },
): Promise<Record<string, string>> {
  const values: Record<string, string> = {};

  // Recipient basics
  values.recipient_name = context.recipientName;
  if (context.recipientEmail) {
    values.recipient_email = context.recipientEmail;
  }
  values.date = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  values.date_short = new Date().toLocaleDateString("en-GB");

  // Organization details
  try {
    const { data: org } = await supabase
      .from("organizations")
      .select("name, settings")
      .eq("id", context.organizationId)
      .single();

    if (org) {
      values.school_name = org.name || "";
      values.organization_name = org.name || "";
      if (org.settings?.address) values.school_address = org.settings.address;
      if (org.settings?.phone) values.school_phone = org.settings.phone;
      if (org.settings?.email) values.school_email = org.settings.email;
      if (org.settings?.website) values.school_website = org.settings.website;
      if (org.settings?.headteacher)
        values.headteacher_name = org.settings.headteacher;
    }
  } catch {
    // Non-critical, continue with empty values
  }

  // Sender details
  if (context.senderId) {
    try {
      const { data: sender } = await supabase
        .from("staff_directory")
        .select("first_name, last_name, display_name, job_title, email")
        .eq("user_id", context.senderId)
        .single();

      if (sender) {
        values.sender_name =
          sender.display_name ||
          `${sender.first_name} ${sender.last_name}`.trim();
        values.sender_first_name = sender.first_name || "";
        values.sender_last_name = sender.last_name || "";
        values.sender_job_title = sender.job_title || "";
        values.sender_email = sender.email || "";
      }
    } catch {
      // Non-critical
    }
  }

  // Staff recipient details
  if (context.recipientType === "staff" && context.recipientId) {
    try {
      const { data: staff } = await supabase
        .from("staff_directory")
        .select(
          "first_name, last_name, display_name, job_title, email, salutation",
        )
        .eq("id", context.recipientId)
        .single();

      if (staff) {
        values.recipient_first_name = staff.first_name || "";
        values.recipient_last_name = staff.last_name || "";
        values.recipient_job_title = staff.job_title || "";
        values.recipient_email = staff.email || values.recipient_email || "";
        values.recipient_salutation = staff.salutation || "";
      }
    } catch {
      // Non-critical
    }
  }

  // Contractor recipient details
  if (context.recipientType === "contractor" && context.recipientId) {
    try {
      const { data: contractor } = await supabase
        .from("estates_contractors")
        .select("company_name, contact_name, email, phone")
        .eq("id", context.recipientId)
        .single();

      if (contractor) {
        values.contractor_company = contractor.company_name || "";
        values.contractor_contact = contractor.contact_name || "";
        values.recipient_email =
          contractor.email || values.recipient_email || "";
        values.contractor_phone = contractor.phone || "";
      }
    } catch {
      // Non-critical
    }
  }

  return values;
}
