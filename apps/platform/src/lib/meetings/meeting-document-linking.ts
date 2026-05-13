import type { MeetingTemplate, TemplateCategory } from "./types";

export type DocumentModule =
  | "hr"
  | "compliance"
  | "governance"
  | "estates"
  | "teaching_learning"
  | "send"
  | "finance"
  | "general";

export interface MeetingDocumentRecipient {
  recipient_type: "staff" | "external";
  recipient_id: string | null;
  recipient_name: string;
  recipient_email: string | null;
}

export function mapMeetingTemplateToDocumentModule(
  template: Pick<MeetingTemplate, "category" | "name">,
): DocumentModule {
  const name = template.name.toLowerCase();
  const categoryMap: Record<TemplateCategory, DocumentModule> = {
    hr: "hr",
    governance: "governance",
    slt_leadership: "general",
    department: "teaching_learning",
    safeguarding: "compliance",
    teaching_learning: "teaching_learning",
    send: "send",
    parents: "general",
    operational: "estates",
    general: "general",
    custom: "general",
  };

  if (name.includes("budget") || name.includes("finance")) return "finance";
  if (
    name.includes("contractor") ||
    name.includes("fire") ||
    name.includes("water") ||
    name.includes("handover") ||
    name.includes("asbestos")
  ) {
    return "estates";
  }

  return categoryMap[template.category] || "general";
}

export function getMeetingDocumentRecipient(input: {
  meeting: { attendee_name: string; attendee_role: string | null };
  attendees: Array<{
    staff_id: string | null;
    attendee_name?: string;
    name?: string;
    attendee_email?: string | null;
    email?: string | null;
    is_primary?: boolean;
  }>;
}): MeetingDocumentRecipient {
  const primary =
    input.attendees.find((attendee) => attendee.is_primary) ||
    input.attendees[0];

  if (primary?.staff_id) {
    return {
      recipient_type: "staff",
      recipient_id: primary.staff_id,
      recipient_name:
        primary.attendee_name || primary.name || input.meeting.attendee_name,
      recipient_email: primary.attendee_email || primary.email || null,
    };
  }

  return {
    recipient_type: "external",
    recipient_id: null,
    recipient_name:
      primary?.attendee_name || primary?.name || input.meeting.attendee_name,
    recipient_email: primary?.attendee_email || primary?.email || null,
  };
}
