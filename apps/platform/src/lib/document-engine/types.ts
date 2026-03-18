export type DocumentModule =
  | "hr"
  | "compliance"
  | "governance"
  | "estates"
  | "teaching_learning"
  | "send"
  | "finance"
  | "general";

export type DocumentType =
  | "letter"
  | "notice"
  | "report"
  | "certificate"
  | "newsletter"
  | "minutes"
  | "memo"
  | "form"
  | "invitation"
  | "policy_extract";

export type DocumentStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "finalised"
  | "sent"
  | "delivered"
  | "acknowledged"
  | "rejected";

export type RecipientType =
  | "staff"
  | "parent"
  | "governor"
  | "contractor"
  | "external"
  | "group";

export type DeliveryMethod = "email" | "print" | "download" | "portal";

export interface PlaceholderDefinition {
  key: string;
  label: string;
  data_source?: string;
  required?: boolean;
  default_value?: string;
  type?: "text" | "date" | "number" | "html";
}

export interface DocumentTemplate {
  id: string;
  organization_id: string;
  module: DocumentModule;
  document_type: DocumentType;
  category: string;
  name: string;
  description?: string;
  subject_template: string;
  body_template: string;
  placeholders: PlaceholderDefinition[];
  data_sources: string[];
  default_delivery: DeliveryMethod;
  requires_approval: boolean;
  approval_role?: string;
  is_system: boolean;
  version: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface GeneratedDocument {
  id: string;
  organization_id: string;
  template_id: string;
  module: DocumentModule;
  document_type: DocumentType;
  category: string;
  status: DocumentStatus;
  subject: string;
  body_html: string;
  placeholder_values: Record<string, string>;
  recipient_type: RecipientType;
  recipient_id?: string;
  recipient_name?: string;
  recipient_email?: string;
  delivery_method: DeliveryMethod;
  related_entity_type?: string;
  related_entity_id?: string;
  approved_by?: string;
  approved_at?: string;
  sent_at?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface DeliveryLogEntry {
  id: string;
  document_id: string;
  delivery_method: DeliveryMethod;
  recipient_email?: string;
  status: "pending" | "sent" | "delivered" | "failed" | "bounced";
  sent_at?: string;
  delivered_at?: string;
  error_message?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface TriggerRule {
  id: string;
  organization_id: string;
  template_id: string;
  name: string;
  description?: string;
  trigger_event: string;
  trigger_conditions: Record<string, any>;
  auto_send: boolean;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export const MODULE_CONFIG: Record<
  DocumentModule,
  {
    label: string;
    icon: string;
    color: string;
    categories: Array<{ value: string; label: string }>;
  }
> = {
  hr: {
    label: "HR & People",
    icon: "Users",
    color: "#ADD8E6",
    categories: [
      { value: "meeting_invitation", label: "Meeting Invitation" },
      { value: "absence_warning", label: "Absence Warning" },
      { value: "return_to_work", label: "Return to Work" },
      { value: "occupational_health", label: "Occupational Health" },
      { value: "probation", label: "Probation" },
      { value: "grievance", label: "Grievance" },
      { value: "flexible_working", label: "Flexible Working" },
      { value: "welcome", label: "Welcome" },
      { value: "reference", label: "Reference" },
      { value: "resignation", label: "Resignation" },
    ],
  },
  compliance: {
    label: "Compliance",
    icon: "Shield",
    color: "#E6C3FF",
    categories: [
      { value: "sar", label: "Subject Access Request" },
      { value: "data_breach", label: "Data Breach" },
      { value: "complaint", label: "Complaint" },
      { value: "training_reminder", label: "Training Reminder" },
      { value: "dpia", label: "DPIA" },
    ],
  },
  governance: {
    label: "Governance",
    icon: "Crown",
    color: "#FFD700",
    categories: [
      { value: "appointment", label: "Appointment" },
      { value: "term_expiry", label: "Term Expiry" },
      { value: "board_meeting", label: "Board Meeting" },
      { value: "committee_meeting", label: "Committee Meeting" },
      { value: "governance_statement", label: "Governance Statement" },
    ],
  },
  estates: {
    label: "Estates",
    icon: "Building2",
    color: "#00D4D4",
    categories: [
      { value: "contractor", label: "Contractor" },
      { value: "maintenance", label: "Maintenance" },
      { value: "fire_safety", label: "Fire Safety" },
      { value: "health_safety", label: "Health & Safety" },
      { value: "incident", label: "Incident" },
      { value: "energy_report", label: "Energy Report" },
    ],
  },
  teaching_learning: {
    label: "Teaching & Learning",
    icon: "GraduationCap",
    color: "#FFB6C1",
    categories: [
      { value: "newsletter", label: "Newsletter" },
      { value: "parent_evening", label: "Parent Evening" },
      { value: "trip_permission", label: "Trip Permission" },
      { value: "progress_report", label: "Progress Report" },
    ],
  },
  send: {
    label: "SEND",
    icon: "Heart",
    color: "#98FF98",
    categories: [
      { value: "ehcp_review", label: "EHCP Review" },
      { value: "ep_referral", label: "EP Referral" },
      { value: "sen_support", label: "SEN Support" },
    ],
  },
  finance: {
    label: "Finance",
    icon: "PoundSterling",
    color: "#FFAA4C",
    categories: [
      { value: "purchase_order", label: "Purchase Order" },
      { value: "budget_report", label: "Budget Report" },
    ],
  },
  general: {
    label: "General",
    icon: "FileText",
    color: "#94a3b8",
    categories: [{ value: "custom", label: "Custom" }],
  },
};
