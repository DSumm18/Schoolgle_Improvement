/**
 * Morning Brief Types
 *
 * Shared types for the morning brief system.
 * Section structure matches Task 033 spec.
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
  summary: string;
}

export interface BriefSections {
  safeguarding: BriefSection;
  estates: BriefSection;
  staffing: BriefSection;
  governance: BriefSection;
  finance: BriefSection;
  teaching: BriefSection;
  ofsted: BriefSection;
}

export interface MorningBriefData {
  organizationId: string;
  generatedAt: string;
  headline: string;
  sections: BriefSections;
  script: string;
}

export interface StoredBrief {
  id: string;
  organization_id: string;
  generated_at: string;
  headline: string;
  sections: BriefSections;
  script_text: string | null;
  audio_url: string | null;
  delivered_to: string[];
  delivery_channels: string[];
  created_at: string;
}

/** Empty section stub for modules not yet built */
export function emptySection(summary?: string): BriefSection {
  return {
    rag: "green",
    count: 0,
    items: [],
    summary: summary ?? "No data available yet for this section.",
  };
}
