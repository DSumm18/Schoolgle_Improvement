// =====================================================
// Governance Portal TypeScript Types
// Phase 1.1: Governance Portal Implementation
// =====================================================

// =====================================================
// COMMON TYPES
// =====================================================

export type GovernorStatus = 'active' | 'resigned' | 'terminated' | 'inactive';

export type GovernorType =
    | 'parent'
    | 'staff'
    | 'local_authority'
    | 'co_opted'
    | 'foundation'
    | 'partnership'
    | 'associate';

export type GovernorRole = 'chair' | 'vice_chair' | 'committee_chair' | null;

export type CommitteeType =
    | 'full_governing_body'
    | 'committee'
    | 'sub_committee';

export type CommitteeName =
    | 'finance'
    | 'staffing'
    | 'curriculum'
    | 'premises'
    | 'safeguarding'
    | 'ethics'
    | 'admissions';

export type MeetingStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export type TrainingType =
    | 'induction'
    | 'safeguarding'
    | 'finance'
    | 'data_protection'
    | 'SEND'
    | 'health_and_safety'
    | 'safer_recruitment'
    | 'complaints'
    | 'other';

export type PolicyCategory = 'statutory' | 'recommended' | 'custom';

export type PolicyReviewStatus = 'current' | 'under_review' | 'outdated' | 'required';

export type VisitType =
    | 'monitoring'
    | 'subject_link'
    | 'safeguarding'
    | 'SEND'
    | 'health_and_safety'
    | 'other';

export type VisitRating = 'outstanding' | 'good' | 'requires_improvement' | 'inadequate';

export type VisitStatus = 'scheduled' | 'completed' | 'cancelled' | 'postponed';

export type BoardType = 'maintained' | 'academy' | 'church';

// =====================================================
// DATABASE ROW TYPES
// =====================================================

/**
 * governance_boards table
 */
export interface GovernanceBoard {
    id: string;
    organization_id: string;
    name: string;
    type: BoardType;
    created_at: string;
    updated_at: string;
}

/**
 * governors table
 */
export interface Governor {
    id: string;
    organization_id: string;
    board_id: string | null;
    user_id: string | null;

    // Profile
    full_name: string;
    email: string | null;
    phone: string | null;
    photo_url: string | null;

    // Governor Details
    governor_type: GovernorType;
    role: GovernorRole;
    committee_assignment: CommitteeName[];

    // Term
    start_date: string | null;
    end_date: string | null;
    appointment_date: string | null;
    appointing_body: string | null;

    // Status
    status: GovernorStatus;

    // Skills & Interests
    skills: string[] | null;
    declarations_of_interest: Record<string, any>;

    // Attendance Tracking
    meetings_attended: number;
    meetings_total: number;
    last_attendance_update: string | null;

    created_at: string;
    updated_at: string;
}

/**
 * Form for creating/updating a governor
 */
export interface GovernorForm {
    full_name: string;
    email?: string;
    phone?: string;
    governor_type: GovernorType;
    role?: GovernorRole;
    committee_assignment?: CommitteeName[];
    start_date?: string;
    end_date?: string;
    appointment_date?: string;
    appointing_body?: string;
    skills?: string[];
    declarations_of_interest?: Record<string, any>;
    user_id?: string;
}

/**
 * governor_meetings table
 */
export interface GovernorMeeting {
    id: string;
    organization_id: string;
    board_id: string | null;

    // Meeting Details
    title: string;
    meeting_type: CommitteeType;
    committee: string | null;

    // Scheduling
    scheduled_date: string;
    scheduled_time: string | null;
    duration_minutes: number;
    location: string | null;
    meeting_link: string | null;

    // Attendance
    invited_governors: string[];
    attended_governors: string[];
    apologies_governors: string[];

    // Documents
    agenda_items: MeetingAgendaItem[];
    minutes_document_id: string | null;
    minutes_link: string | null;

    // Status
    status: MeetingStatus;

    // Outcomes
    decisions_made: MeetingDecision[];
    action_items: string[];

    created_at: string;
    updated_at: string;
}

/**
 * Meeting agenda item
 */
export interface MeetingAgendaItem {
    id: string;
    title: string;
    description: string;
    owner: string;
    duration: number;
    attachments: string[];
}

/**
 * Meeting decision record
 */
export interface MeetingDecision {
    id: string;
    title: string;
    decision: string;
    votes_for: number;
    votes_against: number;
    votes_abstained: number;
}

/**
 * Form for creating/updating a meeting
 */
export interface GovernorMeetingForm {
    title: string;
    meeting_type: CommitteeType;
    committee?: string;
    scheduled_date: string;
    scheduled_time?: string;
    duration_minutes?: number;
    location?: string;
    meeting_link?: string;
    invited_governors?: string[];
    agenda_items?: MeetingAgendaItem[];
}

/**
 * governor_training table
 */
export interface GovernorTraining {
    id: string;
    organization_id: string;
    governor_id: string;

    // Training Details
    title: string;
    provider: string | null;
    training_type: TrainingType;

    // Scheduling
    completed_date: string | null;
    expiry_date: string | null;
    duration_hours: number | null;

    // Evidence
    certificate_url: string | null;
    notes: string | null;

    created_at: string;
    updated_at: string;
}

/**
 * Form for creating/updating training
 */
export interface GovernorTrainingForm {
    title: string;
    provider?: string;
    training_type: TrainingType;
    completed_date?: string;
    expiry_date?: string;
    duration_hours?: number;
    certificate_url?: string;
    notes?: string;
}

/**
 * governance_policy_reviews table
 */
export interface GovernancePolicyReview {
    id: string;
    organization_id: string;

    // Policy Details
    policy_name: string;
    policy_category: PolicyCategory;
    document_id: string | null;

    // Review Cycle
    last_review_date: string | null;
    next_review_date: string;
    review_frequency_months: number;

    // Responsibility
    policy_owner_id: string | null;
    review_committee: string | null;

    // Status
    review_status: PolicyReviewStatus;

    // Compliance
    is_statutory: boolean;
    statutory_reference: string | null;

    created_at: string;
    updated_at: string;
}

/**
 * Form for creating/updating a policy review
 */
export interface GovernancePolicyReviewForm {
    policy_name: string;
    policy_category: PolicyCategory;
    document_id?: string;
    last_review_date?: string;
    next_review_date: string;
    review_frequency_months?: number;
    policy_owner_id?: string;
    review_committee?: string;
    is_statutory?: boolean;
    statutory_reference?: string;
}

/**
 * governance_policy_reviews with governor name joined
 */
export interface GovernancePolicyReviewWithOwner extends GovernancePolicyReview {
    policy_owner_name: string | null;
    days_until_review: number;
    days_overdue: number;
}

/**
 * governor_visits table
 */
export interface GovernorVisit {
    id: string;
    organization_id: string;
    governor_id: string;

    // Visit Details
    visit_type: VisitType;
    title: string;
    description: string | null;

    // Scheduling
    scheduled_date: string;
    start_time: string | null;
    end_time: string | null;
    location: string | null;

    // Focus Area
    subject: string | null;
    year_groups: string[];
    key_focus: string[];

    // Outcomes
    findings: string | null;
    recommendations: string[];
    rating: VisitRating | null;

    // Report
    report_document_id: string | null;

    // Status
    status: VisitStatus;

    created_at: string;
    updated_at: string;
}

/**
 * Form for creating/updating a visit
 */
export interface GovernorVisitForm {
    visit_type: VisitType;
    title: string;
    description?: string;
    scheduled_date: string;
    start_time?: string;
    end_time?: string;
    location?: string;
    subject?: string;
    year_groups?: string[];
    key_focus?: string[];
}

/**
 * governor_visits with governor name joined
 */
export interface GovernorVisitWithGovernor extends GovernorVisit {
    governor_name: string;
    governor_email: string | null;
}

/**
 * governance_kpi_snapshots table
 */
export interface GovernanceKpiSnapshot {
    id: string;
    organization_id: string;

    // KPIs
    total_governors: number;
    active_governors: number;
    vacancies: number;
    attendance_percentage: number;
    skills_coverage: Record<string, boolean>;
    training_completion_rate: number;
    policies_current: number;
    policies_outstanding_review: number;
    visits_completed: number;

    snapshot_date: string;
    created_at: string;
}

/**
 * Aggregated governance statistics
 */
export interface GovernanceStatistics {
    // Governor stats
    total_governors: number;
    active_governors: number;
    vacant_positions: number;
    governor_types: Record<GovernorType, number>;

    // Meeting stats
    upcoming_meetings: number;
    past_meetings_this_year: number;
    average_attendance_rate: number;

    // Training stats
    training_completion_rate: number;
    expired_training_count: number;

    // Policy stats
    statutory_policies: number;
    policies_current: number;
    policies_need_review: number;
    policies_overdue: number;

    // Visit stats
    visits_this_term: number;
    visits_completed: number;
    visits_scheduled: number;
}

/**
 * Skills coverage matrix
 */
export interface SkillsCoverage {
    skill: string;
    required: boolean;
    covered: boolean;
    governors: string[];
}

/**
 * Governor attendance record
 */
export interface GovernorAttendanceRecord {
    meeting_id: string;
    meeting_title: string;
    meeting_date: string;
    attended: boolean;
    apology: boolean;
}

// =====================================================
// API REQUEST/RESPONSE TYPES
// =====================================================

/**
 * Request to get board details
 */
export interface GetBoardRequest {
    organization_id: string;
}

/**
 * Response with board details and statistics
 */
export interface GetBoardResponse {
    board: GovernanceBoard | null;
    statistics: GovernanceStatistics;
    recent_meetings: GovernorMeeting[];
    upcoming_meetings: GovernorMeeting[];
}

/**
 * Request to get governors list
 */
export interface GetGovernorsRequest {
    organization_id: string;
    status?: GovernorStatus;
    governor_type?: GovernorType;
}

/**
 * Response with governors list
 */
export interface GetGovernorsResponse {
    governors: Governor[];
    total: number;
    active: number;
    vacancies: number;
}

/**
 * Request to create/update a governor
 */
export interface UpsertGovernorRequest extends GovernorForm {
    id?: string;
    organization_id: string;
}

/**
 * Request to get meetings
 */
export interface GetMeetingsRequest {
    organization_id: string;
    status?: MeetingStatus;
    meeting_type?: CommitteeType;
    from_date?: string;
    to_date?: string;
}

/**
 * Response with meetings list
 */
export interface GetMeetingsResponse {
    meetings: GovernorMeeting[];
    total: number;
    upcoming: number;
    past: number;
}

/**
 * Request to update meeting attendance
 */
export interface UpdateMeetingAttendanceRequest {
    meeting_id: string;
    attended_governors: string[];
    apologies_governors: string[];
}

/**
 * Request to get training records
 */
export interface GetTrainingRequest {
    organization_id: string;
    governor_id?: string;
    training_type?: TrainingType;
    include_expired?: boolean;
}

/**
 * Response with training records
 */
export interface GetTrainingResponse {
    training: GovernorTraining[];
    total: number;
    expired: number;
    completion_rate: number;
}

/**
 * Request to get policy reviews
 */
export interface GetPolicyReviewsRequest {
    organization_id: string;
    review_status?: PolicyReviewStatus;
    policy_category?: PolicyCategory;
    include_overdue?: boolean;
}

/**
 * Response with policy reviews
 */
export interface GetPolicyReviewsResponse {
    policies: GovernancePolicyReviewWithOwner[];
    total: number;
    current: number;
    need_review: number;
    overdue: number;
}

/**
 * Request to get visits
 */
export interface GetVisitsRequest {
    organization_id: string;
    governor_id?: string;
    visit_type?: VisitType;
    status?: VisitStatus;
    from_date?: string;
    to_date?: string;
}

/**
 * Response with visits list
 */
export interface GetVisitsResponse {
    visits: GovernorVisitWithGovernor[];
    total: number;
    scheduled: number;
    completed: number;
}

/**
 * Request to get KPIs
 */
export interface GetGovernanceKpiRequest {
    organization_id: string;
    from_date?: string;
    to_date?: string;
}

/**
 * Response with KPIs
 */
export interface GetGovernanceKpiResponse {
    current: GovernanceStatistics;
    historical: GovernanceKpiSnapshot[];
    skills_coverage: SkillsCoverage[];
    trends: {
        attendance_trend: 'improving' | 'stable' | 'declining';
        training_trend: 'improving' | 'stable' | 'declining';
        policy_compliance_trend: 'improving' | 'stable' | 'declining';
    };
}
