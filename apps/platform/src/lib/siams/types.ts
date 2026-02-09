// =====================================================
// SIAMS Framework TypeScript Types
// Phase 1.2: SIAMS Full Integration
// =====================================================

// =====================================================
// FRAMEWORK TYPES
// =====================================================

export type SiamsStrandId =
    | 'vision'
    | 'wisdom'
    | 'character'
    | 'community'
    | 'dignity'
    | 'worship'
    | 're';

export type SiamsRating = 'excellent' | 'good' | 'requires_improvement' | 'ineffective';

export type SiamsRatingWithNotAssessed = SiamsRating | 'not_assessed';

export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';

/**
 * SIAMS strand definitions
 */
export const SIAMS_STRANDS: Record<SiamsStrandId, { name: string; shortName: string; color: string; order: number }> = {
    vision: { name: 'Vision and Leadership', shortName: 'Vision', color: 'purple', order: 1 },
    wisdom: { name: 'Wisdom, Knowledge and Skills', shortName: 'Curriculum', color: 'blue', order: 2 },
    character: { name: 'Character Development', shortName: 'Character', color: 'orange', order: 3 },
    community: { name: 'Community and Living Well Together', shortName: 'Community', color: 'teal', order: 4 },
    dignity: { name: 'Dignity and Respect', shortName: 'Dignity', color: 'rose', order: 5 },
    worship: { name: 'Impact of Collective Worship', shortName: 'Worship', color: 'violet', order: 6 },
    re: { name: 'Effectiveness of Religious Education', shortName: 'RE', color: 'emerald', order: 7 },
} as const;

/**
 * SIAMS inspection question IDs for each strand
 */
export type SiamsQuestionId =
    // Vision
    | 'vision-1' | 'vision-2' | 'vision-3' | 'vision-4'
    // Wisdom
    | 'wisdom-1' | 'wisdom-2' | 'wisdom-3' | 'wisdom-4'
    // Character
    | 'character-1' | 'character-2' | 'character-3' | 'character-4'
    // Community
    | 'community-1' | 'community-2' | 'community-3' | 'community-4'
    // Dignity
    | 'dignity-1' | 'dignity-2' | 'dignity-3' | 'dignity-4'
    // Worship
    | 'worship-1' | 'worship-2' | 'worship-3' | 'worship-4' | 'worship-5'
    // RE
    | 're-1' | 're-2' | 're-3' | 're-4' | 're-5';

/**
 * All SIAMS question IDs with their text
 */
export const SIAMS_QUESTIONS: Record<SiamsQuestionId, { strand: SiamsStrandId; text: string; order: number }> = {
    // Vision
    'vision-1': { strand: 'vision', text: 'How clearly is the school\'s Christian vision articulated and understood by all?', order: 1 },
    'vision-2': { strand: 'vision', text: 'How effectively does the vision shape the strategic direction of the school?', order: 2 },
    'vision-3': { strand: 'vision', text: 'How well do leaders at all levels model and promote the vision?', order: 3 },
    'vision-4': { strand: 'vision', text: 'How effectively does governance support and challenge the school\'s Christian foundation?', order: 4 },
    // Wisdom
    'wisdom-1': { strand: 'wisdom', text: 'How does the curriculum reflect the school\'s Christian vision?', order: 1 },
    'wisdom-2': { strand: 'wisdom', text: 'How well does the curriculum enable pupils to develop spiritually?', order: 2 },
    'wisdom-3': { strand: 'wisdom', text: 'How effectively does the curriculum prepare pupils for life in modern Britain?', order: 3 },
    'wisdom-4': { strand: 'wisdom', text: 'How well do all pupils achieve academically, especially the vulnerable?', order: 4 },
    // Character
    'character-1': { strand: 'character', text: 'How well does the school develop pupils\' character?', order: 1 },
    'character-2': { strand: 'character', text: 'How effectively does the school instil hope and aspiration in all pupils?', order: 2 },
    'character-3': { strand: 'character', text: 'How well do pupils engage in social action and courageous advocacy?', order: 3 },
    'character-4': { strand: 'character', text: 'How well do pupils understand ethical concepts and make ethical choices?', order: 4 },
    // Community
    'community-1': { strand: 'community', text: 'How well do relationships across the school community reflect the Christian vision?', order: 1 },
    'community-2': { strand: 'community', text: 'How effectively does the school support mental health and wellbeing?', order: 2 },
    'community-3': { strand: 'community', text: 'How strong are partnerships with parents, church, and community?', order: 3 },
    'community-4': { strand: 'community', text: 'How inclusive is the school community?', order: 4 },
    // Dignity
    'dignity-1': { strand: 'dignity', text: 'How well does the school ensure all are treated with dignity?', order: 1 },
    'dignity-2': { strand: 'dignity', text: 'How effectively does the school tackle prejudice and discrimination?', order: 2 },
    'dignity-3': { strand: 'dignity', text: 'How well do pupils understand and respect difference and diversity?', order: 3 },
    'dignity-4': { strand: 'dignity', text: 'How well are protected characteristics respected and understood?', order: 4 },
    // Worship
    'worship-1': { strand: 'worship', text: 'How central is collective worship to the life of the school?', order: 1 },
    'worship-2': { strand: 'worship', text: 'How well does worship reflect the school\'s Christian vision and Anglican/Methodist tradition?', order: 2 },
    'worship-3': { strand: 'worship', text: 'How inclusive and invitational is collective worship?', order: 3 },
    'worship-4': { strand: 'worship', text: 'How well do pupils engage with and respond to worship?', order: 4 },
    'worship-5': { strand: 'worship', text: 'How effectively does worship contribute to spiritual development?', order: 5 },
    // RE
    're-1': { strand: 're', text: 'How well does RE reflect the Church of England Statement of Entitlement?', order: 1 },
    're-2': { strand: 're', text: 'How high quality is RE teaching?', order: 2 },
    're-3': { strand: 're', text: 'How well do pupils achieve in RE?', order: 3 },
    're-4': { strand: 're', text: 'How well does RE prepare pupils to live in diverse society?', order: 4 },
    're-5': { strand: 're', text: 'How effectively does RE enable pupils to engage with big questions?', order: 5 },
} as const;

// =====================================================
// DATABASE ROW TYPES
// =====================================================

/**
 * siams_assessments table
 */
export interface SiamsAssessment {
    id: string;
    organization_id: string;

    // Framework Reference
    strand_id: SiamsStrandId;
    question_id: SiamsQuestionId;

    // Assessments
    school_rating: SiamsRating | null;
    school_rationale: string | null;
    ai_rating: SiamsRating | null;
    ai_rationale: string | null;

    // Evidence
    evidence_count: number;
    evidence_items: SiamsEvidenceItem[];

    // Meta
    assessed_by: string | null;
    assessed_at: string | null;
    created_at: string;
    updated_at: string;
}

/**
 * Evidence item linked to an assessment
 */
export interface SiamsEvidenceItem {
    documentId: string;
    documentName: string;
    matchedAt: string;
    confidence?: ConfidenceLevel;
}

/**
 * Form for creating/updating an assessment
 */
export interface SiamsAssessmentForm {
    strand_id: SiamsStrandId;
    question_id: SiamsQuestionId;
    school_rating?: SiamsRating;
    school_rationale?: string;
}

/**
 * siams_evidence_matches table
 */
export interface SiamsEvidenceMatch {
    id: string;
    organization_id: string;

    // Document Reference
    document_id: string;

    // Framework Reference
    strand_id: SiamsStrandId;
    question_id: SiamsQuestionId;

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
 * school_church_status table
 */
export interface SchoolChurchStatus {
    id: string;
    organization_id: string;

    // School Details
    urn: string | null;
    school_name: string | null;
    la_code: string | null;
    establishment_number: string | null;

    // Church Status
    is_church_school: boolean;
    church_denomination: ChurchDenomination | null;
    diocese: string | null;
    parish: string | null;

    // SIAMS Details
    last_siams_date: string | null;
    last_siams_rating: SiamsRating | null;
    next_siams_date: string | null;

    // DFE Data
    dfe_data: Record<string, any>;

    updated_at: string;
}

/**
 * Church denomination types
 */
export type ChurchDenomination =
    | 'church_of_england'
    | 'roman_catholic'
    | 'methodist'
    | 'other_christian'
    | 'other';

/**
 * Form for updating church school status
 */
export interface SchoolChurchStatusForm {
    urn?: string;
    is_church_school: boolean;
    church_denomination?: ChurchDenomination;
    diocese?: string;
    parish?: string;
    last_siams_date?: string;
    last_siams_rating?: SiamsRating;
    next_siams_date?: string;
}

/**
 * siams_readiness_snapshots table
 */
export interface SiamsReadinessSnapshot {
    id: string;
    organization_id: string;

    // Overall Readiness
    overall_score: number; // 0-100
    overall_rating: SiamsRating;

    // Strand Scores
    strand_scores: Record<SiamsStrandId, number>;

    // Evidence Counts
    total_evidence: number;
    evidence_by_strand: Record<SiamsStrandId, number>;

    // Gaps
    critical_gaps: number;
    gap_details: SiamsGapDetail[];

    // Snapshot Date
    snapshot_date: string;
    created_at: string;
}

/**
 * Detail of a specific evidence gap
 */
export interface SiamsGapDetail {
    strand: SiamsStrandId;
    question: SiamsQuestionId;
    missing_evidence: string[];
    priority: 'critical' | 'moderate' | 'low';
}

// =====================================================
// AGGREGATED TYPES
// =====================================================

/**
 * SIAMS assessment with question text
 */
export interface SiamsAssessmentWithQuestion extends SiamsAssessment {
    question_text: string;
    strand_name: string;
    strand_short_name: string;
    strand_color: string;
    readiness_score: number;
}

/**
 * SIAMS strand summary
 */
export interface SiamsStrandSummary {
    strand_id: SiamsStrandId;
    strand_name: string;
    strand_short_name: string;
    strand_color: string;
    total_questions: number;
    questions_with_evidence: number;
    total_evidence: number;
    average_score: number;
    average_rating: SiamsRatingWithNotAssessed;
    last_updated: string;
}

/**
 * SIAMS gaps analysis
 */
export interface SiamsGapsAnalysis {
    strand_id: SiamsStrandId;
    question_id: SiamsQuestionId;
    question_text: string;
    evidence_count: number;
    school_rating: SiamsRatingWithNotAssessed;
    ai_rating: SiamsRatingWithNotAssessed;
    gap_level: 'critical' | 'moderate' | 'none';
    needs_attention: boolean;
    missing_evidence: string[];
}

/**
 * Overall SIAMS readiness
 */
export interface SiamsOverallReadiness {
    overall_score: number;
    overall_rating: SiamsRatingWithNotAssessed;
    strand_scores: Record<SiamsStrandId, number>;
    total_evidence: number;
    critical_gaps: number;
    strands: SiamsStrandSummary[];
    gaps: SiamsGapsAnalysis[];
}

// =====================================================
// API REQUEST/RESPONSE TYPES
// =====================================================

/**
 * Request to get SIAMS assessments
 */
export interface GetSiamsAssessmentsRequest {
    organization_id: string;
    strand_id?: SiamsStrandId;
    question_id?: SiamsQuestionId;
}

/**
 * Response with SIAMS assessments
 */
export interface GetSiamsAssessmentsResponse {
    assessments: SiamsAssessmentWithQuestion[];
    strands: SiamsStrandSummary[];
    total_evidence: number;
    last_updated: string;
}

/**
 * Request to upsert SIAMS assessment
 */
export interface UpsertSiamsAssessmentRequest {
    organization_id: string;
    assessments: Array<{
        question_id: SiamsQuestionId;
        strand_id: SiamsStrandId;
        school_rating?: SiamsRating;
        school_rationale?: string;
    }>;
    user_id?: string;
}

/**
 * Response after upserting assessments
 */
export interface UpsertSiamsAssessmentResponse {
    success: boolean;
    updated: number;
    created: number;
    assessments: SiamsAssessment[];
}

/**
 * Request to get SIAMS evidence
 */
export interface GetSiamsEvidenceRequest {
    organization_id: string;
    strand_id?: SiamsStrandId;
    question_id?: SiamsQuestionId;
    document_id?: string;
}

/**
 * Response with SIAMS evidence
 */
export interface GetSiamsEvidenceResponse {
    evidence: SiamsEvidenceMatch[];
    total: number;
    by_strand: Record<SiamsStrandId, number>;
    by_confidence: Record<ConfidenceLevel, number>;
}

/**
 * Request to get SIAMS readiness
 */
export interface GetSiamsReadinessRequest {
    organization_id: string;
    include_gaps?: boolean;
    include_history?: boolean;
    from_date?: string;
    to_date?: string;
}

/**
 * Response with SIAMS readiness
 */
export interface GetSiamsReadinessResponse {
    overall: SiamsOverallReadiness;
    snapshots?: SiamsReadinessSnapshot[];
    trends?: {
        score_change: number;
        strand_changes: Record<SiamsStrandId, number>;
        direction: 'improving' | 'stable' | 'declining';
    };
}

/**
 * Request to match document to SIAMS
 */
export interface MatchSiamsDocumentRequest {
    organization_id: string;
    document_id: string;
    document_text: string;
    document_metadata: {
        filename: string;
        fileId: string;
        foldername?: string;
    };
}

/**
 * Response from SIAMS document matching
 */
export interface MatchSiamsDocumentResponse {
    matches: SiamsEvidenceMatch[];
    total_matches: number;
    strands_matched: SiamsStrandId[];
}

/**
 * Request to get/update church school status
 */
export interface SchoolChurchStatusRequest {
    organization_id: string;
}

/**
 * Response with church school status
 */
export interface SchoolChurchStatusResponse extends SchoolChurchStatus {
    display_name: string;
    icon_name: string;
    is_enabled: boolean;
}

/**
 * Request to lookup school in DFE database
 */
export interface DfeSchoolLookupRequest {
    urn?: string;
    school_name?: string;
    la_code?: string;
}

/**
 * Response from DFE school lookup
 */
export interface DfeSchoolLookupResponse {
    found: boolean;
    urn: string | null;
    school_name: string | null;
    is_church_school: boolean;
    church_denomination: ChurchDenomination | null;
    diocese: string | null;
    dfe_data: Record<string, any> | null;
}

/**
 * DFE school data structure
 */
export interface DfeSchoolData {
    urn: string;
    name: string;
    laCode: string;
    establishmentNumber: string;
    isChurchSchool: boolean;
    churchDenomination?: ChurchDenomination;
    diocese?: string;
    lastSIAMSDate?: Date;
    nextSIAMSDate?: Date;
}

// =====================================================
// SIAMS REPORT TYPES
// =====================================================

/**
 * SIAMS SEF (Self-Evaluation Form) data
 */
export interface SiamsSEF {
    organization_id: string;
    school_name: string;
    urn: string;
    generated_at: string;

    // Overall Judgment
    overall_evaluation: {
        rating: SiamsRating;
        rationale: string;
        strengths: string[];
        areas_for_improvement: string[];
    };

    // Strand Evaluations
    strands: Array<{
        strand_id: SiamsStrandId;
        strand_name: string;
        rating: SiamsRating;
        rationale: string;
        evidence_summary: string[];
    }>;

    // Action Plan
    action_plan: Array<{
        priority: 'high' | 'medium' | 'low';
        action: string;
        timescale: string;
        lead_person: string;
    }>;
}

/**
 * SIAMS inspection report template
 */
export interface SiamsReportTemplate {
    title: string;
    sections: Array<{
        title: string;
        content: string;
        include_evidence: boolean;
        include_ratings: boolean;
    }>;
}

// =====================================================
// UI HELPER TYPES
// =====================================================

/**
 * SIAMS strand display info for UI
 */
export interface SiamsStrandDisplay {
    id: SiamsStrandId;
    name: string;
    shortName: string;
    color: string;
    icon: string;
    questionCount: number;
    completedQuestions: number;
    readinessScore: number;
    rating: SiamsRatingWithNotAssessed;
}

/**
 * SIAMS question display info for UI
 */
export interface SiamsQuestionDisplay {
    id: SiamsQuestionId;
    strandId: SiamsStrandId;
    text: string;
    evidenceCount: number;
    schoolRating: SiamsRatingWithNotAssessed;
    aiRating: SiamsRatingWithNotAssessed;
    readinessScore: number;
    hasGap: boolean;
}

/**
 * SIAMS filter options
 */
export interface SiamsFilterOptions {
    strand_id?: SiamsStrandId;
    rating?: SiamsRatingWithNotAssessed;
    has_evidence?: boolean;
    has_gaps?: boolean;
}

/**
 * SIAMS dashboard card data
 */
export interface SiamsDashboardCard {
    id: SiamsStrandId;
    name: string;
    shortName: string;
    color: string;
    progress: number;
    evidenceCount: number;
    rating: SiamsRatingWithNotAssessed;
    questions: SiamsQuestionDisplay[];
}
