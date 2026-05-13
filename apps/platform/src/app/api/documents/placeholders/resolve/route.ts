import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { ensureStandardDocumentTemplates } from "@/lib/document-engine/standard-templates";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * POST /api/documents/placeholders/resolve
 * Resolve placeholders for a template given context IDs
 *
 * Body: {
 *   templateId, organizationId, staffId?, meetingId?,
 *   senderId?, contractorId?, customValues?
 * }
 * Returns: { placeholders: Record<string, string> }
 */
export const POST = protectedRoute(async (auth, request) => {
  const supabase = createServiceRoleClient();
  const body = await request.json();

  const {
    templateId,
    staffId,
    meetingId,
    senderId,
    contractorId,
    customValues,
  } = body;

  if (!templateId) {
    return apiError("templateId is required", 400, "MISSING_FIELDS");
  }

  // orgId MUST come from authenticated session — never from caller
  const resolvedOrgId = auth.organizationId;
  await ensureStandardDocumentTemplates(supabase);

  // Fetch the template to know which placeholders are needed
  let templateQuery = supabase
    .from("document_templates")
    .select("available_placeholders")
    .or(`organization_id.is.null,organization_id.eq.${resolvedOrgId}`);

  templateQuery = UUID_PATTERN.test(templateId)
    ? templateQuery.eq("id", templateId)
    : templateQuery.eq("slug", templateId);

  const { data: template, error: templateError } = await templateQuery.single();

  if (templateError || !template) {
    return apiError("Template not found", 404, "NOT_FOUND");
  }

  const placeholders: Record<string, string> = {};

  // Date placeholders (always available)
  placeholders.date = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  placeholders.date_short = new Date().toLocaleDateString("en-GB");
  placeholders.year = new Date().getFullYear().toString();

  // Organization data
  try {
    const { data: org } = await supabase
      .from("organizations")
      .select("name, settings")
      .eq("id", resolvedOrgId)
      .single();

    if (org) {
      placeholders.school_name = org.name || "";
      placeholders.organization_name = org.name || "";
      if (org.settings?.address)
        placeholders.school_address = org.settings.address;
      if (org.settings?.phone) placeholders.school_phone = org.settings.phone;
      if (org.settings?.email) placeholders.school_email = org.settings.email;
      if (org.settings?.website)
        placeholders.school_website = org.settings.website;
      if (org.settings?.headteacher)
        placeholders.headteacher_name = org.settings.headteacher;
    }
  } catch {
    // Non-critical
  }

  // Staff recipient data
  if (staffId) {
    try {
      const { data: staff } = await supabase
        .from("staff_directory")
        .select(
          "first_name, last_name, display_name, job_title, email, salutation, employee_id",
        )
        .eq("id", staffId)
        .single();

      if (staff) {
        placeholders.recipient_name =
          staff.display_name || `${staff.first_name} ${staff.last_name}`.trim();
        placeholders.recipient_first_name = staff.first_name || "";
        placeholders.recipient_last_name = staff.last_name || "";
        placeholders.recipient_job_title = staff.job_title || "";
        placeholders.recipient_email = staff.email || "";
        placeholders.recipient_salutation = staff.salutation || "";
        placeholders.recipient_employee_id = staff.employee_id || "";
      }
    } catch {
      // Non-critical
    }
  }

  // Sender data
  const resolvedSenderId = senderId || auth.userId;
  if (resolvedSenderId) {
    try {
      const { data: sender } = await supabase
        .from("staff_directory")
        .select("first_name, last_name, display_name, job_title, email")
        .eq("user_id", resolvedSenderId)
        .single();

      if (sender) {
        placeholders.sender_name =
          sender.display_name ||
          `${sender.first_name} ${sender.last_name}`.trim();
        placeholders.sender_first_name = sender.first_name || "";
        placeholders.sender_last_name = sender.last_name || "";
        placeholders.sender_job_title = sender.job_title || "";
        placeholders.sender_email = sender.email || "";
      }
    } catch {
      // Non-critical
    }
  }

  // Contractor data
  if (contractorId) {
    try {
      const { data: contractor } = await supabase
        .from("estates_contractors")
        .select("company_name, contact_name, email, phone")
        .eq("id", contractorId)
        .single();

      if (contractor) {
        placeholders.contractor_company = contractor.company_name || "";
        placeholders.contractor_contact = contractor.contact_name || "";
        placeholders.contractor_email = contractor.email || "";
        placeholders.contractor_phone = contractor.phone || "";
      }
    } catch {
      // Non-critical
    }
  }

  // Meeting data
  if (meetingId) {
    try {
      const { data: meeting } = await supabase
        .from("meetings")
        .select("*, meeting_templates(name)")
        .eq("id", meetingId)
        .single();

      if (meeting) {
        placeholders.meeting_date = meeting.scheduled_at
          ? new Date(meeting.scheduled_at).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })
          : "";
        placeholders.meeting_time = meeting.scheduled_at
          ? new Date(meeting.scheduled_at).toLocaleTimeString("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "";
        placeholders.meeting_location = meeting.location || "";
        placeholders.meeting_purpose = meeting.purpose || "";
        placeholders.meeting_type = meeting.meeting_templates?.name || "";
        placeholders.attendee_name = meeting.attendee_name || "";
      }

      const { data: minutes } = await supabase
        .from("meeting_minutes")
        .select("content")
        .eq("meeting_id", meetingId)
        .maybeSingle();

      const minutesContent = minutes?.content;
      if (minutesContent && typeof minutesContent === "object") {
        const notes = Array.isArray(minutesContent.notes)
          ? minutesContent.notes
          : [];
        const closing = Array.isArray(minutesContent.closing)
          ? minutesContent.closing
          : [];
        placeholders.meeting_summary = [...notes, ...closing]
          .filter(Boolean)
          .join("\n\n");
      }
    } catch {
      // Non-critical
    }
  }

  // Merge custom values (override auto-resolved)
  if (customValues && typeof customValues === "object") {
    Object.assign(placeholders, customValues);
  }

  return apiSuccess({ placeholders });
});
