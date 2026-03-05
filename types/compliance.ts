/**
 * Comprehensive Compliance Centre Type Definitions
 *
 * Aligned with:
 * - DfE School Estate Management Standards 2025
 * - GEMS (Good Estate Management for Schools)
 * - UK H&S Legislation (COSHH, RIDDOR, HSE)
 */

export type ComplianceCategory =
  | 'fire_safety'
  | 'legionella'
  | 'asbestos'
  | 'electrical'
  | 'gas_safety'
  | 'pat_testing'
  | 'emergency_lighting'
  | 'fire_alarm'
  | 'fire_extinguisher'
  | 'coshh'
  | 'dsear'
  | 'loler'
  | 'working_at_height'
  | 'manual_handling'
  | 'first_aid'
  | 'water_hygiene'
  | 'lift_inspection'
  | 'playground_inspection'
  | 'security_systems'
  | 'lightning_protection'
  | 'pressure_systems'
  | 'radon_testing'
  | 'other';

export type RecurrencePattern =
  | 'daily'
  | 'weekly'
  | 'fortnightly'
  | 'monthly'
  | 'quarterly'
  | 'biannual'
  | 'annual'
  | 'biennial'
  | 'triennial'
  | 'five_yearly'
  | 'one_time';

export type ComplianceStatus =
  | 'compliant'        // Green - completed on time with evidence
  | 'pending'          // Amber - due within warning period
  | 'overdue'          // Red - past due date
  | 'in_progress'      // Blue - work started
  | 'failed'           // Red - check failed, requires action
  | 'not_applicable'   // Grey - not required for this site
  | 'exempt';          // Grey - formally exempted

export type EvidenceType =
  | 'certificate'
  | 'photo'
  | 'test_report'
  | 'inspection_report'
  | 'log_entry'
  | 'signed_document'
  | 'video'
  | 'sensor_reading'
  | 'third_party_verification';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type EscalationLevel =
  | 'none'
  | 'site_team'
  | 'head_teacher'
  | 'sbm'
  | 'trust_estates'
  | 'trustees'
  | 'hse_reportable';

// Core entity: A compliance requirement/template
export interface ComplianceTemplate {
  id: string;
  name: string;
  description: string;
  category: ComplianceCategory;
  legislation_reference: string[];  // e.g., ["COSHH 2002", "HSE L8"]
  default_frequency: RecurrencePattern;
  warning_days: number;             // Days before due to flag as pending
  critical_days_overdue: number;    // Days overdue before critical escalation
  risk_if_missed: RiskLevel;

  // Required evidence
  required_evidence_types: EvidenceType[];
  evidence_retention_years: number;

  // Responsible roles
  default_responsible_role: string; // e.g., "Site Manager", "Estates Lead"
  escalation_path: EscalationLevel[];

  // Links & guidance
  guidance_url?: string;
  internal_sop_url?: string;

  // Fields for the check
  custom_fields?: ComplianceCustomField[];

  // Applicability
  applies_to_asset_types?: string[];  // If linked to specific assets
  applies_to_room_types?: string[];   // If linked to specific rooms

  // Trust/MAT controls
  trust_level_template: boolean;      // Can be cloned across schools
  locked_by_trust: boolean;           // School cannot modify

  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface ComplianceCustomField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'boolean' | 'date' | 'select' | 'multiselect';
  required: boolean;
  options?: string[];  // For select/multiselect
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

// Scheduled instance of a compliance check
export interface ComplianceSchedule {
  id: string;
  template_id: string;
  school_id: string;
  site_id?: string;
  building_id?: string;
  room_id?: string;
  asset_id?: string;

  // Scheduling
  start_date: string;
  recurrence: RecurrencePattern;
  next_due_date: string;
  last_completed_date?: string;

  // Ownership
  responsible_person_id: string;
  responsible_person_name: string;
  backup_person_id?: string;

  // Status tracking
  status: ComplianceStatus;
  consecutive_missed: number;  // Track pattern of non-compliance

  // Notifications
  notify_days_before: number[];  // e.g., [14, 7, 1]
  notify_emails: string[];

  // Suspension
  suspended: boolean;
  suspension_reason?: string;
  suspended_until?: string;

  created_at: string;
  updated_at: string;
}

// A completed (or failed) compliance check
export interface ComplianceRecord {
  id: string;
  schedule_id: string;
  template_id: string;
  school_id: string;

  // When & who
  completed_date: string;
  completed_by_id: string;
  completed_by_name: string;
  due_date: string;
  days_overdue: number;  // Negative if early

  // Result
  status: 'passed' | 'failed' | 'partial';
  outcome_notes: string;

  // Evidence
  evidence: ComplianceEvidence[];

  // Custom field responses
  field_responses?: Record<string, any>;

  // Risk & actions
  issues_identified?: ComplianceIssue[];
  follow_up_ticket_ids?: string[];  // Link to maintenance tickets

  // Verification
  verified_by_id?: string;
  verified_by_name?: string;
  verified_date?: string;

  // Contractor details (if third-party)
  contractor_id?: string;
  contractor_name?: string;
  contractor_certificate_number?: string;

  created_at: string;
  updated_at: string;
}

export interface ComplianceEvidence {
  id: string;
  type: EvidenceType;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  thumbnail_url?: string;

  // Metadata
  title: string;
  description?: string;
  captured_date: string;
  captured_by_id: string;

  // Verification
  verified: boolean;
  verified_by_id?: string;
  verified_date?: string;

  // Certificate-specific
  certificate_number?: string;
  certificate_expiry?: string;
  issuing_body?: string;

  // Sensor readings
  readings?: {
    parameter: string;
    value: number;
    unit: string;
    within_tolerance: boolean;
  }[];

  created_at: string;
}

export interface ComplianceIssue {
  id: string;
  severity: RiskLevel;
  description: string;
  location: string;
  photo_urls?: string[];

  // Immediate actions taken
  immediate_action?: string;

  // Follow-up required
  requires_ticket: boolean;
  ticket_id?: string;

  // Risk assessment
  likelihood: 1 | 2 | 3 | 4 | 5;
  impact: 1 | 2 | 3 | 4 | 5;
  risk_score: number;  // likelihood × impact

  identified_by_id: string;
  identified_date: string;
  resolved: boolean;
  resolved_date?: string;
}

// Dashboard & reporting aggregations
export interface ComplianceDashboardStats {
  school_id: string;
  period: string;  // e.g., "2025-Q1"

  total_checks: number;
  completed_on_time: number;
  completed_late: number;
  overdue: number;
  pending: number;

  compliance_rate: number;  // % on time
  average_days_overdue: number;

  by_category: Record<ComplianceCategory, {
    total: number;
    compliant: number;
    overdue: number;
    compliance_rate: number;
  }>;

  by_risk_level: Record<RiskLevel, {
    total: number;
    overdue: number;
  }>;

  critical_overdues: ComplianceSchedule[];  // Top 10 by risk × days overdue

  evidence_gaps: {
    schedule_id: string;
    template_name: string;
    missing_evidence_types: EvidenceType[];
  }[];

  top_performers: {
    person_id: string;
    person_name: string;
    checks_completed: number;
    on_time_rate: number;
  }[];

  generated_at: string;
}

// Trust/MAT level aggregation
export interface TrustComplianceOverview {
  trust_id: string;
  schools: {
    school_id: string;
    school_name: string;
    stats: ComplianceDashboardStats;
    rag_status: 'green' | 'amber' | 'red';
    critical_issues: number;
  }[];

  trust_wide_stats: ComplianceDashboardStats;

  // Benchmarking
  best_performing_school: string;
  areas_for_improvement: {
    category: ComplianceCategory;
    avg_compliance_rate: number;
    schools_below_target: string[];
  }[];

  generated_at: string;
}

// Notification & escalation
export interface ComplianceAlert {
  id: string;
  schedule_id: string;
  template_name: string;
  school_id: string;

  alert_type: 'upcoming_due' | 'overdue' | 'critical_overdue' | 'failed_check' | 'evidence_missing';
  severity: RiskLevel;

  message: string;
  triggered_date: string;
  escalation_level: EscalationLevel;

  recipients: {
    user_id: string;
    email: string;
    role: string;
  }[];

  acknowledged: boolean;
  acknowledged_by_id?: string;
  acknowledged_date?: string;

  resolved: boolean;
  resolved_date?: string;
}

// Action plan from compliance issues
export interface ComplianceActionPlan {
  id: string;
  school_id: string;
  title: string;
  description: string;

  // Source
  triggered_by_record_ids: string[];

  // Actions
  actions: {
    id: string;
    description: string;
    owner_id: string;
    owner_name: string;
    due_date: string;
    status: 'pending' | 'in_progress' | 'completed' | 'blocked';
    ticket_id?: string;
    completion_notes?: string;
    completed_date?: string;
  }[];

  // Tracking
  overall_status: 'open' | 'in_progress' | 'completed' | 'overdue';
  priority: RiskLevel;

  created_by_id: string;
  created_date: string;
  target_completion_date: string;
  actual_completion_date?: string;
}

// Audit trail
export interface ComplianceAuditLog {
  id: string;
  entity_type: 'template' | 'schedule' | 'record' | 'evidence' | 'issue';
  entity_id: string;

  action: 'created' | 'updated' | 'deleted' | 'verified' | 'escalated' | 'suspended' | 'resumed';

  user_id: string;
  user_name: string;

  changes?: {
    field: string;
    old_value: any;
    new_value: any;
  }[];

  reason?: string;
  ip_address?: string;

  timestamp: string;
}

// Integration types
export interface ComplianceCalendarEvent {
  id: string;
  schedule_id: string;
  title: string;
  description: string;
  due_date: string;
  category: ComplianceCategory;
  responsible_person_email: string;

  // Google Calendar
  google_event_id?: string;

  // Outlook
  outlook_event_id?: string;

  synced_at?: string;
}

export interface ComplianceExportOptions {
  school_id: string;
  start_date: string;
  end_date: string;
  categories?: ComplianceCategory[];
  status?: ComplianceStatus[];
  include_evidence: boolean;
  format: 'pdf' | 'excel' | 'csv' | 'google_sheets';
  template: 'trustee_pack' | 'governors_report' | 'audit_trail' | 'evidence_log' | 'custom';
}
