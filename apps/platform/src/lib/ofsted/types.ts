// =====================================================
// Ofsted Framework TypeScript Types
// Based on Ofsted Education Inspection Framework (EIF) 2025
// =====================================================

// =====================================================
// FRAMEWORK TYPES
// =====================================================

export type OfstedCategoryId =
  | "inclusion"
  | "curriculum-teaching"
  | "achievement"
  | "attendance-behaviour"
  | "personal-development"
  | "leadership-governance";

export type OfstedSubCategoryId =
  // Inclusion
  | "inclusion-send"
  | "inclusion-disadvantaged"
  | "inclusion-mental-health"
  // Curriculum and Teaching
  | "curriculum-intent"
  | "curriculum-implementation"
  | "curriculum-reading"
  // Achievement
  | "achievement-outcomes"
  | "achievement-progress"
  | "achievement-destinations"
  // Attendance and Behaviour
  | "attendance-overall"
  | "behaviour-conduct"
  | "behaviour-attitudes"
  // Personal Development and Well-being
  | "pd-character"
  | "pd-citizenship"
  | "pd-enrichment"
  | "pd-rse"
  // Leadership and Governance
  | "leadership-vision"
  | "leadership-governance"
  | "leadership-staff"
  | "leadership-engagement";

export type OfstedRating =
  | "exceptional"
  | "strong_standard"
  | "expected_standard"
  | "needs_attention"
  | "urgent_improvement";

export type OfstedRatingWithNotAssessed = OfstedRating | "not_assessed";

export type ConfidenceLevel = "HIGH" | "MEDIUM" | "LOW";

/**
 * Ofsted key judgement areas
 */
export const OFSTED_JUDGEMENTS: Record<
  OfstedCategoryId,
  { name: string; shortName: string; color: string; order: number }
> = {
  inclusion: {
    name: "Inclusion",
    shortName: "Inclusion",
    color: "teal",
    order: 1,
  },
  "curriculum-teaching": {
    name: "Curriculum and Teaching",
    shortName: "Education",
    color: "rose",
    order: 2,
  },
  achievement: {
    name: "Achievement",
    shortName: "Achievement",
    color: "blue",
    order: 3,
  },
  "attendance-behaviour": {
    name: "Attendance and Behaviour",
    shortName: "Behaviour",
    color: "orange",
    order: 4,
  },
  "personal-development": {
    name: "Personal Development and Well-being",
    shortName: "Personal Dev",
    color: "violet",
    order: 5,
  },
  "leadership-governance": {
    name: "Leadership and Governance",
    shortName: "Leadership",
    color: "slate",
    order: 6,
  },
} as const;

/**
 * All Ofsted subcategory IDs with their descriptions
 */
export const OFSTED_SUBCATEGORIES: Record<
  OfstedSubCategoryId,
  {
    category: OfstedCategoryId;
    name: string;
    description: string;
    order: number;
  }
> = {
  // Inclusion
  "inclusion-send": {
    category: "inclusion",
    name: "SEND Provision",
    description: "Support for pupils with SEND",
    order: 1,
  },
  "inclusion-disadvantaged": {
    category: "inclusion",
    name: "Disadvantaged Pupils",
    description: "Support for disadvantaged pupils",
    order: 2,
  },
  "inclusion-mental-health": {
    category: "inclusion",
    name: "Mental Health Support",
    description: "Support for mental health",
    order: 3,
  },
  // Curriculum and Teaching
  "curriculum-intent": {
    category: "curriculum-teaching",
    name: "Curriculum Design",
    description: "How well is the curriculum designed?",
    order: 1,
  },
  "curriculum-implementation": {
    category: "curriculum-teaching",
    name: "Teaching Quality",
    description: "How effectively is the curriculum taught?",
    order: 2,
  },
  "curriculum-reading": {
    category: "curriculum-teaching",
    name: "Reading and Literacy",
    description: "How well is reading taught?",
    order: 3,
  },
  // Achievement
  "achievement-outcomes": {
    category: "achievement",
    name: "Academic Outcomes",
    description: "What do pupils achieve?",
    order: 1,
  },
  "achievement-progress": {
    category: "achievement",
    name: "Progress",
    description: "How well do pupils progress?",
    order: 2,
  },
  "achievement-destinations": {
    category: "achievement",
    name: "Preparation for Next Stage",
    description: "Preparation for next stage",
    order: 3,
  },
  // Attendance and Behaviour
  "attendance-overall": {
    category: "attendance-behaviour",
    name: "Attendance",
    description: "How high is attendance?",
    order: 1,
  },
  "behaviour-conduct": {
    category: "attendance-behaviour",
    name: "Conduct",
    description: "How is behaviour managed?",
    order: 2,
  },
  "behaviour-attitudes": {
    category: "attendance-behaviour",
    name: "Attitudes to Learning",
    description: "Are pupils engaged?",
    order: 3,
  },
  // Personal Development
  "pd-character": {
    category: "personal-development",
    name: "Character Development",
    description: "How is character developed?",
    order: 1,
  },
  "pd-citizenship": {
    category: "personal-development",
    name: "British Values",
    description: "Are British values promoted?",
    order: 2,
  },
  "pd-enrichment": {
    category: "personal-development",
    name: "Enrichment",
    description: "What wider opportunities exist?",
    order: 3,
  },
  "pd-rse": {
    category: "personal-development",
    name: "RSE",
    description: "Is RSE delivered effectively?",
    order: 4,
  },
  // Leadership and Governance
  "leadership-vision": {
    category: "leadership-governance",
    name: "Vision and Strategy",
    description: "Is there a clear vision?",
    order: 1,
  },
  "leadership-governance": {
    category: "leadership-governance",
    name: "Governance",
    description: "How effective is governance?",
    order: 2,
  },
  "leadership-staff": {
    category: "leadership-governance",
    name: "Staff Development",
    description: "How are staff developed?",
    order: 3,
  },
  "leadership-engagement": {
    category: "leadership-governance",
    name: "Stakeholder Engagement",
    description: "Are parents engaged?",
    order: 4,
  },
} as const;

// =====================================================
// DATABASE ROW TYPES
// =====================================================

/**
 * ofsted_assessments table
 */
export interface OfstedAssessment {
  id: string;
  organization_id: string;

  // Framework Reference
  category_id: OfstedCategoryId;
  subcategory_id: OfstedSubCategoryId;

  // Assessments
  school_rating: OfstedRating | null;
  school_rationale: string | null;
  ai_rating: OfstedRating | null;
  ai_rationale: string | null;

  // Evidence
  evidence_count: number;
  evidence_items: OfstedEvidenceItem[];

  // Meta
  assessed_by: string | null;
  assessed_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Evidence item linked to an assessment
 */
export interface OfstedEvidenceItem {
  documentId: string;
  documentName: string;
  matchedAt: string;
  confidence?: ConfidenceLevel;
}

/**
 * Form for creating/updating an assessment
 */
export interface OfstedAssessmentForm {
  category_id: OfstedCategoryId;
  subcategory_id: OfstedSubCategoryId;
  school_rating?: OfstedRating;
  school_rationale?: string;
}

/**
 * ofsted_evidence_matches table
 */
export interface OfstedEvidenceMatch {
  id: string;
  organization_id: string;

  // Document Reference
  document_id: string;

  // Framework Reference
  category_id: OfstedCategoryId;
  subcategory_id: OfstedSubCategoryId;

  // Match Details
  confidence: ConfidenceLevel;
  matched_keywords: string[];
  relevance_explanation: string;
  key_quotes: string[];

  // Links
  document_link: string;

  // Meta
  created_at: string;
}

/**
 * ofsted_readiness_snapshots table
 */
export interface OfstedReadinessSnapshot {
  id: string;
  organization_id: string;

  // Overall Readiness
  overall_score: number; // 0-100
  overall_rating: OfstedRating;

  // Category Scores
  category_scores: Record<OfstedCategoryId, number>;

  // Evidence Counts
  total_evidence: number;
  evidence_by_category: Record<OfstedCategoryId, number>;

  // Gaps
  critical_gaps: number;
  gap_details: OfstedGapDetail[];

  // Safeguarding (separate assessment)
  safeguarding_met: boolean | null;
  safeguarding_notes: string | null;

  // Snapshot Date
  snapshot_date: string;
  created_at: string;
}

/**
 * Detail of a specific evidence gap
 */
export interface OfstedGapDetail {
  category: OfstedCategoryId;
  subcategory: OfstedSubCategoryId;
  missing_evidence: string[];
  priority: "critical" | "moderate" | "low";
}

// =====================================================
// AGGREGATED TYPES
// =====================================================

/**
 * Ofsted assessment with subcategory info
 */
export interface OfstedAssessmentWithSubcategory extends OfstedAssessment {
  subcategory_name: string;
  subcategory_description: string;
  category_name: string;
  category_short_name: string;
  category_color: string;
  readiness_score: number;
}

/**
 * Ofsted category summary
 */
export interface OfstedCategorySummary {
  category_id: OfstedCategoryId;
  category_name: string;
  category_short_name: string;
  category_color: string;
  total_subcategories: number;
  subcategories_with_evidence: number;
  total_evidence: number;
  average_score: number;
  average_rating: OfstedRatingWithNotAssessed;
  last_updated: string;
}

/**
 * Ofsted gaps analysis
 */
export interface OfstedGapsAnalysis {
  category_id: OfstedCategoryId;
  subcategory_id: OfstedSubCategoryId;
  subcategory_name: string;
  evidence_count: number;
  school_rating: OfstedRatingWithNotAssessed;
  ai_rating: OfstedRatingWithNotAssessed;
  gap_level: "critical" | "moderate" | "none";
  needs_attention: boolean;
  missing_evidence: string[];
}

/**
 * Overall Ofsted readiness
 */
export interface OfstedOverallReadiness {
  overall_score: number;
  overall_rating: OfstedRatingWithNotAssessed;
  category_scores: Record<OfstedCategoryId, number>;
  total_evidence: number;
  critical_gaps: number;
  safeguarding_met: boolean | null;
  categories: OfstedCategorySummary[];
  gaps: OfstedGapsAnalysis[];
}

// =====================================================
// API REQUEST/RESPONSE TYPES
// =====================================================

/**
 * Request to get Ofsted assessments
 */
export interface GetOfstedAssessmentsRequest {
  organization_id: string;
  category_id?: OfstedCategoryId;
  subcategory_id?: OfstedSubCategoryId;
}

/**
 * Response with Ofsted assessments
 */
export interface GetOfstedAssessmentsResponse {
  assessments: OfstedAssessmentWithSubcategory[];
  categories: OfstedCategorySummary[];
  total_evidence: number;
  last_updated: string;
}

/**
 * Request to upsert Ofsted assessment
 */
export interface UpsertOfstedAssessmentRequest {
  organization_id: string;
  assessments: Array<{
    subcategory_id: OfstedSubCategoryId;
    category_id: OfstedCategoryId;
    school_rating?: OfstedRating;
    school_rationale?: string;
  }>;
  user_id?: string;
}

/**
 * Response after upserting assessments
 */
export interface UpsertOfstedAssessmentResponse {
  success: boolean;
  updated: number;
  created: number;
  assessments: OfstedAssessment[];
}

/**
 * Request to get Ofsted evidence
 */
export interface GetOfstedEvidenceRequest {
  organization_id: string;
  category_id?: OfstedCategoryId;
  subcategory_id?: OfstedSubCategoryId;
  document_id?: string;
}

/**
 * Response with Ofsted evidence
 */
export interface GetOfstedEvidenceResponse {
  evidence: OfstedEvidenceMatch[];
  total: number;
  by_category: Record<OfstedCategoryId, number>;
  by_confidence: Record<ConfidenceLevel, number>;
}

/**
 * Request to get Ofsted readiness
 */
export interface GetOfstedReadinessRequest {
  organization_id: string;
  include_gaps?: boolean;
  include_history?: boolean;
  from_date?: string;
  to_date?: string;
}

/**
 * Response with Ofsted readiness
 */
export interface GetOfstedReadinessResponse {
  overall: OfstedOverallReadiness;
  snapshots?: OfstedReadinessSnapshot[];
  trends?: {
    score_change: number;
    category_changes: Record<OfstedCategoryId, number>;
    direction: "improving" | "stable" | "declining";
  };
}

/**
 * Request to match document to Ofsted
 */
export interface MatchOfstedDocumentRequest {
  organization_id: string;
  document_id: string;
  document_text: string;
  document_metadata: {
    filename: string;
    fileId: string;
    mimeType?: string;
    foldername?: string;
    folderPath?: string;
    webViewLink?: string;
  };
}

/**
 * Response from Ofsted document matching
 */
export interface MatchOfstedDocumentResponse {
  matches: OfstedEvidenceMatch[];
  total_matches: number;
  categories_matched: OfstedCategoryId[];
}

// =====================================================
// UI HELPER TYPES
// =====================================================

/**
 * Ofsted category display info for UI
 */
export interface OfstedCategoryDisplay {
  id: OfstedCategoryId;
  name: string;
  shortName: string;
  color: string;
  icon: string;
  subcategoryCount: number;
  completedSubcategories: number;
  readinessScore: number;
  rating: OfstedRatingWithNotAssessed;
}

/**
 * Ofsted subcategory display info for UI
 */
export interface OfstedSubcategoryDisplay {
  id: OfstedSubCategoryId;
  categoryId: OfstedCategoryId;
  name: string;
  description: string;
  evidenceCount: number;
  schoolRating: OfstedRatingWithNotAssessed;
  aiRating: OfstedRatingWithNotAssessed;
  readinessScore: number;
  hasGap: boolean;
}

/**
 * Ofsted filter options
 */
export interface OfstedFilterOptions {
  category_id?: OfstedCategoryId;
  rating?: OfstedRatingWithNotAssessed;
  has_evidence?: boolean;
  has_gaps?: boolean;
}
