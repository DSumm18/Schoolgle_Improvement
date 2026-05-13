/**
 * Represents a single assessment or activity within a KPI category.
 */
export interface Assessment {
  name: string;
  score: number;
  status?: "in_place" | "partial" | "missing";
  evidenceCount?: number;
  evidence?: Array<{
    key: string;
    label: string;
    table: string;
    count: number;
    available: boolean;
    error?: string;
  }>;
}

/**
 * Represents a category of Key Performance Indicators (KPIs) for a school,
 * containing multiple assessments.
 */
export interface KpiCategory {
  categoryName: string;
  average: number;
  assessments: Assessment[];
}

/**
 * Represents all the performance data for a single school.
 */
export interface SchoolData {
  id: string;
  name: string;
  urn?: string | null;
  organizationType?: string | null;
  overallScore: number;
  categories: KpiCategory[];
  logoUrl: string | null;
  gaps?: string[];
}

export interface GemsAuditSummary {
  schoolCount: number;
  averageScore: number;
  gaps: number;
  domainCount: number;
}

export interface GemsAuditOrganization {
  id: string;
  name: string;
  organizationType?: string | null;
}

export interface GemsAuditResponse {
  source: "live" | "demo";
  organization?: GemsAuditOrganization;
  schools: SchoolData[];
  summary: GemsAuditSummary;
}
