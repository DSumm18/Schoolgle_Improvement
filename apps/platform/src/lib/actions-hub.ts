// Enhanced Actions Types
// Extends the existing actions table with new fields for dual status, costs, EEF tracking

export type FrameworkType = 'ofsted' | 'siams';
export type ActionPriority = 'critical' | 'high' | 'medium' | 'low';
export type ActionStatus = 'draft' | 'approved' | 'in_progress' | 'completed' | 'cancelled';

// User Status (staff side)
export type UserStatus = 'draft' | 'assigned' | 'in_progress' | 'pending_review' | 'complete' | 'cancelled';

// AI Status (scanner/review side)
export type AIStatus = 'not_met' | 'partially_met' | 'met' | 'not_assessed';

export type ActionSource = 'manual' | 'ed_recommendation' | 'scan_gap' | 'observation';

export type EvidenceType =
    | 'lesson_observation'
    | 'work_scrutiny'
    | 'pupil_voice'
    | 'planning_review'
    | 'monitoring_visit'
    | 'document'
    | 'photo'
    | 'other';

export type InterventionEventType =
    | 'started'
    | 'paused'
    | 'resumed'
    | 'modified'
    | 'completed'
    | 'reviewed'
    | 'finding_identified';

export type MarkerColor = 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'gray';

// Enhanced Action interface
export interface Action {
    id: string;
    organization_id: string;

    // Framework linkage
    framework_type: FrameworkType;
    category_id?: string;
    subcategory_id?: string;

    // Action details
    title: string;
    description?: string;
    success_criteria?: string;

    // EEF Research backing
    eef_strategy?: string; // EEF strategy ID from eef-toolkit.ts
    eef_impact_months?: number; // Expected months to see impact

    // Dual Status
    status: ActionStatus; // Legacy (deprecated, use user_status)
    user_status: UserStatus;
    ai_status: AIStatus;
    ai_rationale?: string; // AI explanation of status

    // Assignment
    owner_id?: string;
    owner_name?: string;
    assigned_date?: Date;

    // Dates
    due_date?: Date;
    completed_date?: Date;
    implementation_date?: Date; // When EEF strategy was implemented

    // Priority
    priority: ActionPriority;

    // Costs
    estimated_cost?: number;
    actual_cost?: number;
    funding_source?: string;
    financial_year?: string; // Format: "2024-25"

    // Evidence
    evidence_count: number;

    // Notes history
    notes: ActionNote[];

    // Chasing
    last_chased?: Date;
    chase_count: number;

    // Approval workflow
    approved_by?: string;
    approved_at?: Date;

    // Source
    source: ActionSource;

    // Created by
    created_by?: string;
    auth_id?: string;
    created_at: string;
    updated_at: string;
}

export interface ActionNote {
    timestamp: string;
    author: string;
    author_name?: string;
    content: string;
}

// Evidence linked to action
export interface ActionEvidence {
    id: string;
    action_id: string;
    organization_id: string;

    evidence_type: EvidenceType;
    title: string;
    description?: string;

    document_id?: number;
    file_url?: string;
    file_name?: string;

    created_by: string;
    created_at: string;

    approved_by?: string;
    approved_at?: string;
}

// Intervention events for Gantt timeline
export interface InterventionEvent {
    id: string;
    organization_id: string;
    action_id?: string;

    event_type: InterventionEventType;
    title: string;
    description?: string;
    impact_note?: string;

    // For issues found during review
    issue_category?: string;
    resolution_action_id?: string;

    created_by: string;
    created_at: string;

    // Display on Gantt
    display_date: Date;
    marker_color: MarkerColor;
}

// Action status matrix
export interface ActionStatusMatrix {
    user_status: UserStatus;
    ai_status: AIStatus;
    display: string;
    color: string;
    icon: string;
}

// Gantt chart bar
export interface GanttBar {
    id: string; // action_id
    title: string;
    category: string;
    owner: string;
    start_date?: Date;
    end_date?: Date;
    progress: number; // 0-100
    status: UserStatus;
    priority: ActionPriority;
    estimated_cost?: number;
    actual_cost?: number;

    // Events on timeline
    events: InterventionEvent[];

    // Color for display
    color: string;
}

// Cost tracking
export interface ActionCosts {
    estimated_total: number;
    actual_total: number;
    by_category: Record<string, { estimated: number; actual: number }>;
    by_year: Record<string, { estimated: number; actual: number }>;
    by_funding_source: Record<string, { estimated: number; actual: number }>;
}

// Status combinations
export const STATUS_MATRIX: ActionStatusMatrix[] = [
    { user_status: 'draft', ai_status: 'not_met', display: 'Draft - Gap Identified', color: 'rose', icon: '🔴' },
    { user_status: 'assigned', ai_status: 'not_met', display: 'Assigned - Gap', color: 'rose', icon: '🔴' },
    { user_status: 'in_progress', ai_status: 'not_met', display: 'In Progress - Gap', color: 'amber', icon: '🟡' },
    { user_status: 'in_progress', ai_status: 'partially_met', display: 'In Progress - Working', color: 'blue', icon: '🔵' },
    { user_status: 'in_progress', ai_status: 'met', display: 'In Progress - Nearly There', color: 'green', icon: '🟢' },
    { user_status: 'pending_review', ai_status: 'met', display: 'Ready to Confirm', color: 'emerald', icon: '✅' },
    { user_status: 'complete', ai_status: 'met', display: 'Confirmed - Complete', color: 'emerald', icon: '✅' },
    { user_status: 'complete', ai_status: 'partially_met', display: 'Complete - Review Needed', color: 'amber', icon: '⚠️' },
    { user_status: 'complete', ai_status: 'not_met', display: 'Complete - Dispute', color: 'rose', icon: '⚠️' },
];

export function getStatusMatrix(user_status: UserStatus, ai_status: AIStatus): ActionStatusMatrix | undefined {
    return STATUS_MATRIX.find(
        m => m.user_status === user_status && m.ai_status === ai_status
    );
}

// Funding sources
export const FUNDING_SOURCES = [
    { value: 'school_budget', label: 'School Budget', color: 'blue' },
    { value: 'pupil_premium', label: 'Pupil Premium', color: 'purple' },
    { value: 'pe_premium', label: 'PE & Sport Premium', color: 'green' },
    { value: 'catch_up', label: 'Catch Up Premium', color: 'amber' },
    { value: 'sen_budget', label: 'SEN Budget', color: 'pink' },
    { value: 'grant', label: 'Grant', color: 'teal' },
    { value: 'tbd', label: 'TBD', color: 'gray' },
];

// Financial years
export function getFinancialYears(): string[] {
    const currentYear = new Date().getFullYear();
    const years: string[] = [];
    for (let i = -2; i <= 3; i++) {
        const year = currentYear + i;
        years.push(`${year}-${(year + 1).toString().slice(-2)}`);
    }
    return years;
}
