/* eslint-disable @typescript-eslint/no-explicit-any */

type StandardDocumentTemplate = {
  name: string;
  slug: string;
  description: string;
  module: string;
  category: string;
  document_type: string;
  subject_template: string;
  body_template: string;
  available_placeholders: string[];
  data_sources: string[];
  tags: string[];
};

export const STANDARD_DOCUMENT_TEMPLATES: StandardDocumentTemplate[] = [
  {
    name: "Pupil Accident / First Aid Report",
    slug: "pupil-accident-first-aid-report",
    description:
      "Structured incident report for pupil accidents, first aid treatment, parent notification and follow-up actions.",
    module: "incidents",
    category: "pupil_accident",
    document_type: "form",
    subject_template: "Pupil accident / first aid report - {{incident_reference}}",
    body_template: `
<p>{{date}}</p>
<h2>Pupil Accident / First Aid Report</h2>
<p><strong>Incident reference:</strong> {{incident_reference}}</p>
<p><strong>School:</strong> {{school_name}}</p>
<p><strong>Date/time of incident:</strong> {{incident_date_time}}</p>
<p><strong>Location:</strong> {{incident_location}}</p>
<p><strong>Pupil:</strong> {{pupil_name}}</p>
<p><strong>What happened:</strong></p>
<p>{{incident_summary}}</p>
<p><strong>Injury / symptoms observed:</strong></p>
<p>{{injury_details}}</p>
<p><strong>First aid given:</strong></p>
<p>{{first_aid_given}}</p>
<p><strong>Parent/carer informed:</strong> {{parent_carer_informed}}</p>
<p><strong>Witnesses:</strong> {{witnesses}}</p>
<p><strong>Contributing factors / site issues:</strong></p>
<p>{{contributing_factors}}</p>
<p><strong>Follow-up actions:</strong></p>
<p>{{follow_up_actions}}</p>
<p><strong>Completed by:</strong> {{completed_by}}</p>`.trim(),
    available_placeholders: [
      "date",
      "incident_reference",
      "school_name",
      "incident_date_time",
      "incident_location",
      "pupil_name",
      "incident_summary",
      "injury_details",
      "first_aid_given",
      "parent_carer_informed",
      "witnesses",
      "contributing_factors",
      "follow_up_actions",
      "completed_by",
    ],
    data_sources: ["organization", "incident", "sender", "ai_narrative"],
    tags: ["incidents", "first-aid", "accident", "pupil", "health-and-safety"],
  },
  {
    name: "Absence Warning Letter",
    slug: "absence-warning",
    description:
      "Formal follow-up letter after an absence or sickness review meeting.",
    module: "hr",
    category: "absence_warning",
    document_type: "letter",
    subject_template: "Absence review outcome - {{recipient_name}}",
    body_template: `
<p>{{date}}</p>
<p>Dear {{recipient_salutation}}</p>
<p>Thank you for attending the {{meeting_type}} on {{meeting_date}}.</p>
<p>This letter confirms the points discussed during the meeting and the agreed next steps.</p>
<p><strong>Meeting purpose:</strong> {{meeting_purpose}}</p>
<p><strong>Outcome / agreed actions:</strong></p>
<p>{{meeting_summary}}</p>
<p>Please ensure that any agreed actions are completed by the dates discussed. If you have any questions about this letter, please contact {{sender_name}}.</p>
<p>Yours sincerely,</p>
<p>{{sender_name}}<br />{{sender_job_title}}</p>`.trim(),
    available_placeholders: [
      "date",
      "recipient_name",
      "recipient_salutation",
      "meeting_type",
      "meeting_date",
      "meeting_purpose",
      "meeting_summary",
      "sender_name",
      "sender_job_title",
    ],
    data_sources: ["organization", "meeting", "staff", "sender", "ai_narrative"],
    tags: ["hr", "absence", "meeting", "follow-up"],
  },
  {
    name: "Return to Work Meeting Outcome",
    slug: "return-to-work-outcome",
    description:
      "Confirms support, adjustments and actions after a return to work meeting.",
    module: "hr",
    category: "return_to_work",
    document_type: "letter",
    subject_template: "Return to work meeting outcome - {{recipient_name}}",
    body_template: `
<p>{{date}}</p>
<p>Dear {{recipient_salutation}}</p>
<p>Thank you for meeting with us on {{meeting_date}} to discuss your return to work.</p>
<p>The following support, adjustments and actions were discussed:</p>
<p>{{meeting_summary}}</p>
<p>We will review these arrangements as agreed and keep them under consideration if your circumstances change.</p>
<p>Yours sincerely,</p>
<p>{{sender_name}}<br />{{sender_job_title}}</p>`.trim(),
    available_placeholders: [
      "date",
      "recipient_name",
      "recipient_salutation",
      "meeting_date",
      "meeting_summary",
      "sender_name",
      "sender_job_title",
    ],
    data_sources: ["organization", "meeting", "staff", "sender", "ai_narrative"],
    tags: ["hr", "absence", "return-to-work", "support"],
  },
  {
    name: "Disciplinary Meeting Invitation",
    slug: "disciplinary-meeting-invitation",
    description:
      "Invitation letter for a formal disciplinary meeting, including accompaniment rights.",
    module: "hr",
    category: "meeting_invitation",
    document_type: "letter",
    subject_template: "Invitation to disciplinary meeting - {{recipient_name}}",
    body_template: `
<p>{{date}}</p>
<p>Dear {{recipient_salutation}}</p>
<p>You are invited to attend a disciplinary meeting on {{meeting_date}} at {{meeting_time}} in {{meeting_location}}.</p>
<p>The purpose of the meeting is: {{meeting_purpose}}</p>
<p>You have the right to be accompanied by a trade union representative or workplace colleague. Please tell us in advance who will accompany you.</p>
<p>Yours sincerely,</p>
<p>{{sender_name}}<br />{{sender_job_title}}</p>`.trim(),
    available_placeholders: [
      "date",
      "recipient_name",
      "recipient_salutation",
      "meeting_date",
      "meeting_time",
      "meeting_location",
      "meeting_purpose",
      "sender_name",
      "sender_job_title",
    ],
    data_sources: ["organization", "meeting", "staff", "sender"],
    tags: ["hr", "disciplinary", "meeting", "invitation"],
  },
  {
    name: "Grievance Meeting Outcome",
    slug: "grievance-meeting-outcome",
    description:
      "Outcome letter following a grievance meeting, with decision and next steps.",
    module: "hr",
    category: "grievance",
    document_type: "letter",
    subject_template: "Grievance meeting outcome - {{recipient_name}}",
    body_template: `
<p>{{date}}</p>
<p>Dear {{recipient_salutation}}</p>
<p>Thank you for attending the grievance meeting on {{meeting_date}}.</p>
<p>We considered the points raised and discussed the following:</p>
<p>{{meeting_summary}}</p>
<p>This letter confirms the outcome and any agreed next steps. You will be advised separately of any right of appeal where applicable.</p>
<p>Yours sincerely,</p>
<p>{{sender_name}}<br />{{sender_job_title}}</p>`.trim(),
    available_placeholders: [
      "date",
      "recipient_name",
      "recipient_salutation",
      "meeting_date",
      "meeting_summary",
      "sender_name",
      "sender_job_title",
    ],
    data_sources: ["organization", "meeting", "staff", "sender", "ai_narrative"],
    tags: ["hr", "grievance", "outcome"],
  },
  {
    name: "Contractor Pre-Start Confirmation",
    slug: "contractor-pre-start-confirmation",
    description:
      "Estates confirmation letter for contractor pre-start meetings and agreed controls.",
    module: "estates",
    category: "contractor",
    document_type: "letter",
    subject_template: "Pre-start meeting confirmation - {{contractor_company}}",
    body_template: `
<p>{{date}}</p>
<p>Dear {{contractor_contact}}</p>
<p>Thank you for attending the pre-start meeting on {{meeting_date}}.</p>
<p>The following arrangements, controls and evidence requirements were discussed and agreed:</p>
<p>{{meeting_summary}}</p>
<p>Please ensure all agreed evidence is provided before works commence and that any changes are confirmed with the school before proceeding.</p>
<p>Yours sincerely,</p>
<p>{{sender_name}}<br />{{sender_job_title}}</p>`.trim(),
    available_placeholders: [
      "date",
      "contractor_company",
      "contractor_contact",
      "meeting_date",
      "meeting_summary",
      "sender_name",
      "sender_job_title",
    ],
    data_sources: ["organization", "meeting", "contractor", "sender", "ai_narrative"],
    tags: ["estates", "contractor", "pre-start", "compliance"],
  },
  {
    name: "Subject Access Request Acknowledgement",
    slug: "sar-acknowledgement-letter",
    description:
      "Acknowledges receipt of a subject access request and confirms next steps.",
    module: "compliance",
    category: "sar",
    document_type: "letter",
    subject_template: "Subject Access Request acknowledgement",
    body_template: `
<p>{{date}}</p>
<p>Dear {{recipient_name}}</p>
<p>We acknowledge receipt of your Subject Access Request.</p>
<p>We will process your request in line with data protection requirements and may contact you if we need further information to verify your identity or clarify the scope of your request.</p>
<p>Yours sincerely,</p>
<p>{{sender_name}}<br />{{sender_job_title}}</p>`.trim(),
    available_placeholders: [
      "date",
      "recipient_name",
      "sender_name",
      "sender_job_title",
    ],
    data_sources: ["organization", "sender"],
    tags: ["compliance", "gdpr", "sar"],
  },
];

export async function ensureStandardDocumentTemplates(supabase: any) {
  for (const template of STANDARD_DOCUMENT_TEMPLATES) {
    const { data: existing, error: existingError } = await supabase
      .from("document_templates")
      .select("id")
      .is("organization_id", null)
      .eq("slug", template.slug)
      .maybeSingle();

    if (existingError || existing?.id) continue;

    await supabase.from("document_templates").insert({
      ...template,
      organization_id: null,
      is_system: true,
      is_active: true,
      use_org_branding: true,
    });
  }
}
