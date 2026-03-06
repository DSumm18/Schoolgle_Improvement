export type MeetingStatus =
  | "scheduled"
  | "in_progress"
  | "completed"
  | "cancelled";
export type ChecklistStatus = "red" | "amber" | "green";
export type TemplateCategory = "hr" | "operational" | "governance";
export type MinutesStatus = "draft" | "finalised";

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
  updated_at: string;
  // Joined fields
  template?: MeetingTemplate;
  checklist_items?: MeetingChecklistItem[];
  minutes?: MeetingMinutes;
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
