export type MeetingStatus =
  | "scheduled"
  | "in_progress"
  | "completed"
  | "cancelled";
export type ChecklistStatus = "red" | "amber" | "green";
export type TemplateCategory =
  | "hr"
  | "governance"
  | "slt_leadership"
  | "department"
  | "safeguarding"
  | "teaching_learning"
  | "send"
  | "parents"
  | "operational"
  | "general"
  | "custom";

export const TEMPLATE_CATEGORIES: {
  value: TemplateCategory;
  label: string;
  icon: string;
  color: string;
}[] = [
  { value: "hr", label: "HR & People", icon: "Users", color: "blue" },
  { value: "governance", label: "Governance", icon: "Shield", color: "purple" },
  {
    value: "slt_leadership",
    label: "SLT & Leadership",
    icon: "Star",
    color: "amber",
  },
  { value: "department", label: "Department", icon: "Building", color: "cyan" },
  {
    value: "safeguarding",
    label: "Safeguarding",
    icon: "ShieldCheck",
    color: "red",
  },
  {
    value: "teaching_learning",
    label: "Teaching & Learning",
    icon: "BookOpen",
    color: "green",
  },
  { value: "send", label: "SEND", icon: "Heart", color: "pink" },
  { value: "parents", label: "Parents", icon: "Users", color: "orange" },
  {
    value: "operational",
    label: "Operational",
    icon: "Settings",
    color: "slate",
  },
  { value: "general", label: "General", icon: "Calendar", color: "gray" },
  { value: "custom", label: "Custom", icon: "Plus", color: "indigo" },
];
export type MinutesStatus = "draft" | "finalised";
export type SignatureMethod = "canvas" | "typed" | "uploaded";

export interface ComplianceItem {
  phrase: string;
  category: string;
  is_critical: boolean;
  order_index: number;
}

export interface PreparationGuide {
  context_prompts: string[];
  documents_needed: string[];
  key_phrases: string[];
  policy_refs: string[];
}

export interface MeetingTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  description: string;
  opening_script: string[];
  closing_script: string[];
  compliance_items: ComplianceItem[];
  preparation_guide: PreparationGuide;
  is_custom: boolean;
  organization_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Meeting {
  id: string;
  template_id: string;
  organization_id: string;
  leader_id: string;
  attendee_name: string;
  attendee_role: string | null;
  purpose: string | null;
  scheduled_at: string;
  location: string | null;
  calendar_event_id: string | null;
  status: MeetingStatus;
  started_at: string | null;
  ended_at: string | null;
  notes: MeetingNote[];
  compliance_score: number | null;
  created_at: string;
  recording_consent: boolean | null;
  recording_consent_at: string | null;
  updated_at: string;
  // Joined fields
  template?: MeetingTemplate;
  checklist_items?: MeetingChecklistItem[];
  minutes?: MeetingMinutes;
  attendees?: MeetingAttendee[];
  meeting_actions?: MeetingAction[];
}

export interface MeetingNote {
  timestamp: string;
  text: string;
}

export interface MeetingChecklistItem {
  id: string;
  meeting_id: string;
  phrase: string;
  category: string;
  is_critical: boolean;
  status: ChecklistStatus;
  manually_ticked: boolean;
  detected_at: string | null;
  ai_confidence: number | null;
  ai_suggestion: string | null;
  order_index: number;
}

export interface MeetingTranscript {
  id: string;
  meeting_id: string;
  chunks: TranscriptChunk[];
  full_text: string | null;
  audio_url: string | null;
}

export interface TranscriptChunk {
  timestamp: string;
  speaker: string;
  text: string;
}

export interface MeetingMinutes {
  id: string;
  meeting_id: string;
  content: MinutesContent;
  html: string | null;
  status: MinutesStatus;
  exported_url: string | null;
  signatures: MeetingSignature[];
  signed_by_leader: boolean;
  signed_by_attendee: boolean;
  created_at: string;
  updated_at: string;
}

export interface MinutesContent {
  title: string;
  date: string;
  location: string | null;
  leader: string;
  attendee: string;
  attendee_role: string | null;
  purpose: string | null;
  opening: string[];
  sections: MinutesSection[];
  notes: string[];
  closing: string[];
  compliance_summary: {
    total: number;
    covered: number;
    score: number;
  };
}

export interface MinutesSection {
  title: string;
  items: {
    phrase: string;
    covered: boolean;
    notes?: string;
  }[];
}

export interface MeetingCreateForm {
  template_id: string;
  attendee_name: string;
  attendee_role?: string;
  purpose?: string;
  scheduled_at: string;
  location?: string;
}

export interface MeetingSignature {
  id: string;
  meeting_id: string;
  signer_name: string;
  signer_role: "leader" | "attendee" | "witness";
  signature_data: string; // base64 canvas data URL
  signature_method: SignatureMethod;
  signed_at: string;
}

export interface MeetingAttendee {
  id: string;
  meeting_id: string;
  staff_id: string | null;
  name: string;
  role: string | null;
  email: string | null;
  attendance_status:
    | "invited"
    | "accepted"
    | "declined"
    | "attended"
    | "absent";
  is_external: boolean;
  created_at: string;
}

export interface MeetingAction {
  id: string;
  meeting_id: string;
  action_id: string | null;
  title: string;
  description: string | null;
  assignee_id: string | null;
  assignee_name: string | null;
  due_date: string | null;
  priority: "low" | "medium" | "high" | "urgent";
  status: "pending" | "in_progress" | "completed" | "overdue";
  created_at: string;
}

export interface SicknessAbsenceRecord {
  id: string;
  organization_id: string;
  staff_id: string;
  start_date: string;
  end_date: string | null;
  reason: string | null;
  category: string | null;
  days_lost: number | null;
  is_ongoing: boolean;
  return_to_work_meeting_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrganizationBranding {
  logo_url: string | null;
  school_name: string;
  school_address: string | null;
  primary_color: string | null;
  footer_text: string | null;
}
