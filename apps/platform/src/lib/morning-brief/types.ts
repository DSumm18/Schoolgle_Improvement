/**
 * Morning Brief Types
 *
 * Shared types for the morning brief system.
 */

export type RAGStatus = "green" | "amber" | "red";

export interface BriefItem {
  title: string;
  priority: "critical" | "high" | "medium" | "low";
  dueDate?: string;
  link?: string;
}

export interface BriefSection {
  rag: RAGStatus;
  count: number;
  items: BriefItem[];
}

export interface BriefSections {
  compliance: BriefSection;
  tasks: BriefSection;
  risks: BriefSection;
  staffing: BriefSection;
  calendar: BriefSection;
}

export interface MorningBriefData {
  organizationId: string;
  generatedAt: string;
  headline: string;
  sections: BriefSections;
}

export interface StoredBrief {
  id: string;
  organization_id: string;
  generated_at: string;
  headline: string;
  sections: BriefSections;
  audio_url: string | null;
  script_text: string | null;
  delivered_to: string[];
  delivery_channels: string[];
  created_at: string;
}
