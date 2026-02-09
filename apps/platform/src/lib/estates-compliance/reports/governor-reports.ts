/**
 * Governor Reports Types and Interfaces
 *
 * Types for generating compliance reports specifically designed for school governors
 * and trust boards. Focuses on clear "are we compliant?" answers, statutory vs optional
 * items, budget visibility, and Ofsted readiness.
 */

import type { ComplianceDomain, RagStatus } from '@/types/estates-compliance';

// ============================================================================
// REPORT TYPES
// ============================================================================

export type GovernorReportType =
  | 'annual_compliance'
  | 'pre_ofsted_assurance'
  | 'budget_planning'
  | 'termly_summary'
  | 'domain_deep_dive';

export type ReportFormat = 'pdf' | 'excel' | 'json';

export type ReportStatus = 'generating' | 'ready' | 'failed';

// ============================================================================
// DOMAIN SUMMARY FOR REPORTS
// ============================================================================

export interface DomainSummary {
  domain: ComplianceDomain;
  domainName: string;
  ragStatus: RagStatus;
  completionRate: number; // 0-100
  statutoryChecksCompleted: number;
  statutoryChecksTotal: number;
  goodPracticeChecksCompleted: number;
  goodPracticeChecksTotal: number;
  overdueChecks: number;
  nextReviewDate?: string;
  keyIssues: string[];
}

// ============================================================================
// BUDGET SUMMARY FOR REPORTS
// ============================================================================

export interface BudgetSummary {
  statutory: {
    required: number; // count
    estimatedCost: number; // pounds
    items: BudgetItemSummary[];
  };
  goodPractice: {
    recommended: number;
    estimatedCost: number;
    items: BudgetItemSummary[];
  };
  optional: {
    suggested: number;
    estimatedCost: number;
    items: BudgetItemSummary[];
  };
  totalEstimatedCost: number;
}

export interface BudgetItemSummary {
  id: string;
  title: string;
  category: string;
  classification: 'statutory' | 'good_practice' | 'optional';
  estimatedCost: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  domain: ComplianceDomain;
  targetFiscalYear: string;
  status: string;
  source?: string;
}

// ============================================================================
// ACTION REQUIRED SUMMARY
// ============================================================================

export interface ActionRequired {
  id: string;
  title: string;
  description: string;
  domain: ComplianceDomain;
  classification: 'statutory' | 'good_practice' | 'optional';
  severity: 'critical' | 'high' | 'medium' | 'low';
  targetDate: string;
  estimatedCost?: number;
  assignedTo?: string;
  source: string;
  statutoryReference?: string;
}

// ============================================================================
// GOVERNOR REPORT STRUCTURE
// ============================================================================

export interface GovernorReport {
  id: string;
  organizationId: string;
  reportType: GovernorReportType;
  format: ReportFormat;
  status: ReportStatus;
  generatedAt: string;
  generatedBy: string;

  // Report metadata
  title: string;
  reportingPeriod: {
    startDate: string;
    endDate: string;
  };
  preparedFor: string; // e.g., "Governing Board" or "Trust Board"

  // Executive summary
  executiveSummary: {
    overallComplianceStatus: RagStatus;
    overallComplianceScore: number; // 0-100
    headlineStatement: string;
    keyAchievements: string[];
    criticalIssues: string[];
    immediateActionsRequired: number;
    statutoryComplianceRate: number; // percentage of statutory checks complete
    readyForOfsted: boolean;
    ofstedReadinessDetails: string[];
  };

  // Domain breakdown
  domains: DomainSummary[];

  // Actions required
  actionsRequired: {
    critical: ActionRequired[];
    high: ActionRequired[];
    medium: ActionRequired[];
  };

  // Budget requirements
  budgetRequirements: BudgetSummary;

  // Evidence of compliance
  evidenceSummary: {
    totalEvidenceItems: number;
    evidenceByDomain: Record<ComplianceDomain, number>;
    recentUploads: number;
    evidenceGaps: string[];
  };

  // Recommendations
  recommendations: {
    forGovernors: string[];
    forSeniorLeadership: string[];
    forBusinessManager: string[];
  };

  // Next steps
  nextReviewDate: string;
  nextReportDueDate: string;
}

// ============================================================================
// REPORT GENERATION REQUEST
// ============================================================================

export interface GenerateReportRequest {
  reportType: GovernorReportType;
  format: ReportFormat;
  reportingPeriod?: {
    startDate?: string; // ISO date
    endDate?: string; // ISO date
  };
  includeDomains?: ComplianceDomain[]; // specific domains to include
  classification?: 'all' | 'statutory_only' | 'statutory_and_good_practice';
  preparedFor?: string;
}

export interface GenerateReportResponse {
  reportId: string;
  status: ReportStatus;
  downloadUrl?: string;
  estimatedCompletionTime?: number; // seconds
  message?: string;
}

// ============================================================================
// PRE-DEFINED REPORT TEMPLATES
// ============================================================================

export const REPORT_TEMPLATES: Record<GovernorReportType, {
  name: string;
  description: string;
  frequency: string;
  audience: string[];
  sections: string[];
}> = {
  annual_compliance: {
    name: 'Annual Compliance Report',
    description: 'Comprehensive annual overview of all statutory compliance status',
    frequency: 'Annually',
    audience: ['Governing Board', 'Trust Board', 'Executive Leadership'],
    sections: [
      'Executive Summary',
      'Overall RAG Status',
      'Domain-by-Domain Breakdown',
      'Statutory Compliance Checklist',
      'Budget Requirements (Statutory)',
      'Budget Requirements (Recommended)',
      'Critical Actions Required',
      'Ofsted Readiness Assessment',
      'Evidence Summary',
      'Recommendations',
      'Next Steps'
    ]
  },
  pre_ofsted_assurance: {
    name: 'Pre-Ofsted Assurance Report',
    description: 'Targeted report demonstrating compliance readiness for inspection',
    frequency: 'On demand',
    audience: ['Governing Board', 'Headteacher', 'SBM'],
    sections: [
      'Ofsted Readiness Badge',
      'Statutory Compliance Status',
      'Critical Areas Overview',
      'Evidence Available for Inspection',
      'Outstanding Actions',
      'Potential Lines of Enquiry',
      'Supporting Documentation Index'
    ]
  },
  budget_planning: {
    name: 'Budget Planning Report',
    description: 'Detailed breakdown of statutory vs optional compliance costs',
    frequency: 'Termly / Annually',
    audience: ['Governing Board (Finance)', 'Trust Board (Finance)', 'Business Manager'],
    sections: [
      'Budget Overview',
      'Statutory Requirements (Must Have)',
      'Good Practice Recommendations (Should Have)',
      'Optional Enhancements (Nice to Have)',
      'Multi-Year Budget Projection',
      'Risk-Based Prioritization',
      'Funding Sources & Recommendations'
    ]
  },
  termly_summary: {
    name: 'Termly Compliance Summary',
    description: 'Brief update on compliance status for termly governing board meetings',
    frequency: 'Termly',
    audience: ['Governing Board', 'Executive Leadership'],
    sections: [
      'RAG Status Summary',
      'This Term\'s Achievements',
      'Actions Completed This Term',
      'Actions in Progress',
      'Items Requiring Governor Attention',
      'Budget Spend vs Allocated',
      'Next Term Priorities'
    ]
  },
  domain_deep_dive: {
    name: 'Domain Deep Dive Report',
    description: 'Detailed analysis of a specific compliance domain',
    frequency: 'On demand',
    audience: ['Governing Board Committees', 'Trust Board Committees'],
    sections: [
      'Domain Overview',
      'Statutory Requirements',
      'Current Compliance Status',
      'Completed Actions & Evidence',
      'Outstanding Actions',
      'Budget Analysis',
      'Recommendations',
      'Timeline for Completion'
    ]
  }
};

// ============================================================================
// OFSTED READINESS CRITERIA
// ============================================================================

export interface OfstedReadinessCriteria {
  domain: ComplianceDomain;
  criteria: string[];
  status: 'met' | 'partial' | 'not_met';
  evidence: string[];
  gaps: string[];
}

export const OFSTED_READINESS_CHECKLIST: OfstedReadinessCriteria[] = [
  {
    domain: 'fire',
    criteria: [
      'Fire risk assessment current and reviewed',
      'Fire alarm system tested weekly',
      'Fire extinguishers serviced annually',
      'Emergency lighting tested monthly',
      'Staff fire drills recorded termly',
      'Escape routes clear and documented'
    ],
    status: 'met',
    evidence: [],
    gaps: []
  },
  {
    domain: 'legionella',
    criteria: [
      'Legionella risk assessment current',
      'Monthly temperature monitoring records',
      'Weekly flushing of infrequently used outlets',
      'Annual review of water systems',
      'Competent person appointed for water management'
    ],
    status: 'met',
    evidence: [],
    gaps: []
  },
  {
    domain: 'asbestos',
    criteria: [
      'Asbestos register maintained and accessible',
      'Annual visual inspection of ACMs',
      'Asbestos management plan in place',
      'Staff awareness training current',
      'Re-inspection survey within 3-year cycle'
    ],
    status: 'met',
    evidence: [],
    gaps: []
  },
  {
    domain: 'electrical',
    criteria: [
      'Fixed wire testing (EICR) within 5-year cycle',
      'PAT testing records current',
      'RCD tested quarterly',
      'Emergency lighting duration tested annually',
      'Visual inspections of distribution boards quarterly'
    ],
    status: 'met',
    evidence: [],
    gaps: []
  },
  {
    domain: 'gas',
    criteria: [
      'Gas safety certificate (CP12) current',
      'Gas Safe registered engineer for all work',
      'Annual gas safety check completed',
      'Monthly visual checks of appliances'
    ],
    status: 'met',
    evidence: [],
    gaps: []
  }
];
