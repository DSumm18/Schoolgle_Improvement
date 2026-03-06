// Compliance Module Types

export type ComplianceItemType =
  | "policy"
  | "incident"
  | "dpia"
  | "sar"
  | "breach"
  | "evidence_pack"
  | "doc";
export type ComplianceStatus =
  | "draft"
  | "in_review"
  | "approved"
  | "published"
  | "archived";
export type ConfidentialityLevel =
  | "public_internal"
  | "restricted"
  | "highly_restricted";
export type ContentFormat = "html" | "markdown" | "docx_render" | "pdf_render";
export type ApprovalStage =
  | "author"
  | "slt_review"
  | "trust_review"
  | "governor_approval";
export type ApprovalDecision = "pending" | "approved" | "rejected";
export type ReviewFrequency = "annual" | "termly" | "quarterly" | "custom_days";
export type EvidenceType =
  | "certificate"
  | "minutes"
  | "signed_ack"
  | "photo"
  | "other";
export type TemplateType =
  | "policy"
  | "incident"
  | "dpia"
  | "sar"
  | "breach"
  | "generic_doc";
export type PolicyCategory =
  | "statutory"
  | "recommended"
  | "trust_required"
  | "school_custom";
export type TrainingSource = "upload" | "manual" | "provider_sync";

export interface ComplianceItem {
  id: string;
  organization_id: string;
  trust_id?: string;
  type: ComplianceItemType;
  title: string;
  status: ComplianceStatus;
  owner_user_id?: string;
  category?: PolicyCategory;
  tags: string[];
  confidentiality_level: ConfidentialityLevel;
  retention_policy_id?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  // Joined fields
  current_version?: ComplianceVersion;
  review_schedule?: ReviewSchedule;
  approval_count?: number;
  pending_approvals?: number;
}

export interface ComplianceVersion {
  id: string;
  compliance_item_id: string;
  version_number: number;
  source_template_id?: string;
  content_format: ContentFormat;
  content_html?: string;
  content_md?: string;
  generated_from_chat_id?: string;
  created_by_user_id?: string;
  created_at: string;
  change_summary?: string;
  content_hash?: string;
}

export interface ComplianceApproval {
  id: string;
  compliance_item_id: string;
  version_id?: string;
  stage: ApprovalStage;
  approver_user_id?: string;
  approver_role?: string;
  decision: ApprovalDecision;
  decision_notes?: string;
  decided_at?: string;
  created_at: string;
}

export interface ReviewSchedule {
  id: string;
  compliance_item_id: string;
  review_frequency: ReviewFrequency;
  custom_days?: number;
  next_review_date?: string;
  last_review_date?: string;
  reminder_days: number[];
}

export interface ComplianceTask {
  id: string;
  organization_id: string;
  compliance_item_id?: string;
  title: string;
  description?: string;
  assigned_to_user_id?: string;
  assigned_to_role?: string;
  due_date?: string;
  status: string;
  evidence_required: boolean;
  created_by_user_id?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  // Joined
  compliance_item?: ComplianceItem;
}

export interface ComplianceEvidenceFile {
  id: string;
  compliance_item_id?: string;
  task_id?: string;
  organization_id: string;
  file_path: string;
  file_name: string;
  mime_type?: string;
  file_size?: number;
  uploaded_by_user_id?: string;
  uploaded_at: string;
  evidence_type: EvidenceType;
}

export interface AuditLogEntry {
  id: string;
  organization_id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  actor_user_id?: string;
  actor_name?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface ComplianceTemplate {
  id: string;
  template_type: TemplateType;
  name: string;
  description?: string;
  school_phase: string;
  jurisdiction: string;
  maintained_by: string;
  version: number;
  content_html?: string;
  json_schema?: {
    required_fields?: string[];
    optional_fields?: string[];
  };
  last_updated_at: string;
  source_reference?: string;
  is_statutory: boolean;
  dfe_reference?: string;
}

export interface Acknowledgement {
  id: string;
  compliance_item_id: string;
  version_id?: string;
  user_id: string;
  user_name?: string;
  acknowledged_at: string;
  method: string;
}

export interface TrainingCourse {
  id: string;
  organization_id?: string;
  provider_name?: string;
  course_code?: string;
  title: string;
  description?: string;
  accreditation?: string;
  validity_days?: number;
  category: string;
  is_global: boolean;
}

export interface TrainingRequirement {
  id: string;
  organization_id: string;
  trust_id?: string;
  role_key: string;
  course_id: string;
  required: boolean;
  renewal_days?: number;
  // Joined
  course?: TrainingCourse;
}

export interface TrainingCompletion {
  id: string;
  organization_id: string;
  user_id: string;
  course_id: string;
  completed_at: string;
  expires_at?: string;
  evidence_file_id?: string;
  source: TrainingSource;
  notes?: string;
  // Joined
  course?: TrainingCourse;
}

export interface DPIARecord {
  id: string;
  compliance_item_id: string;
  processing_description?: string;
  purpose?: string;
  lawful_basis?: string;
  data_categories?: string[];
  special_category_data: boolean;
  recipients?: string;
  transfers_outside_uk: boolean;
  necessity_assessment?: string;
  proportionality_assessment?: string;
  risks?: Array<{ description: string; likelihood: string; severity: string }>;
  mitigations?: Array<{ risk: string; measure: string; status: string }>;
  consultation_required: boolean;
  consultation_notes?: string;
  signoff_user_id?: string;
  signoff_date?: string;
  review_date?: string;
}

export interface SARRecord {
  id: string;
  compliance_item_id: string;
  requester_name: string;
  requester_relationship?: string;
  date_received: string;
  identity_verified: boolean;
  identity_verified_date?: string;
  deadline_date: string;
  extension_applied: boolean;
  extension_reason?: string;
  response_date?: string;
  data_provided?: string;
  exemptions_applied?: string[];
  notes?: string;
}

export interface BreachRecord {
  id: string;
  compliance_item_id: string;
  date_discovered: string;
  date_occurred?: string;
  description: string;
  data_affected?: string;
  individuals_affected?: number;
  severity: string;
  ico_notified: boolean;
  ico_notification_date?: string;
  ico_reference?: string;
  individuals_notified: boolean;
  root_cause?: string;
  actions_taken?: string;
  preventive_measures?: string;
  reported_by_user_id?: string;
}

export interface ComplianceNotification {
  id: string;
  organization_id: string;
  user_id: string;
  type: string;
  title: string;
  message?: string;
  link?: string;
  read: boolean;
  entity_type?: string;
  entity_id?: string;
  created_at: string;
}

export interface ChatSession {
  id: string;
  organization_id: string;
  user_id: string;
  purpose: string;
  template_id?: string;
  transcript: Array<{ role: string; content: string; timestamp: string }>;
  extracted_fields: Record<string, any>;
  compliance_item_id?: string;
  status: string;
}

export interface RiskLink {
  id: string;
  organization_id: string;
  risk_id: string;
  compliance_item_id: string;
  link_notes?: string;
}

// Dashboard summary types
export interface ComplianceDashboardStats {
  total_policies: number;
  published_policies: number;
  overdue_reviews: number;
  upcoming_reviews: number;
  pending_approvals: number;
  training_compliance_rate: number;
  training_overdue: number;
  open_sars: number;
  open_breaches: number;
  dpias_requiring_review: number;
  recent_activity: AuditLogEntry[];
  health_scores: {
    policies: number;
    training: number;
    gdpr: number;
    overall: number;
  };
}

export interface PolicyOverview {
  item: ComplianceItem;
  version: ComplianceVersion;
  schedule: ReviewSchedule;
  acknowledgement_rate?: number;
}

// Status labels for UI
export const STATUS_LABELS: Record<ComplianceStatus, string> = {
  draft: "Draft",
  in_review: "In Review",
  approved: "Approved",
  published: "Published",
  archived: "Archived",
};

export const STATUS_COLORS: Record<ComplianceStatus, string> = {
  draft: "bg-gray-100 text-gray-700",
  in_review: "bg-amber-100 text-amber-700",
  approved: "bg-blue-100 text-blue-700",
  published: "bg-green-100 text-green-700",
  archived: "bg-slate-100 text-slate-500",
};

export const CATEGORY_LABELS: Record<PolicyCategory, string> = {
  statutory: "Statutory",
  recommended: "Recommended",
  trust_required: "Trust Required",
  school_custom: "School Custom",
};

export const CATEGORY_COLORS: Record<PolicyCategory, string> = {
  statutory: "bg-red-100 text-red-700",
  recommended: "bg-blue-100 text-blue-700",
  trust_required: "bg-purple-100 text-purple-700",
  school_custom: "bg-gray-100 text-gray-700",
};

export const ITEM_TYPE_LABELS: Record<ComplianceItemType, string> = {
  policy: "Policy",
  incident: "Incident Report",
  dpia: "DPIA",
  sar: "Subject Access Request",
  breach: "Data Breach",
  evidence_pack: "Evidence Pack",
  doc: "Document",
};

export const CONFIDENTIALITY_LABELS: Record<ConfidentialityLevel, string> = {
  public_internal: "Internal",
  restricted: "Restricted",
  highly_restricted: "Highly Restricted",
};

// SCR Entry
export interface SCREntry {
  id: string;
  organization_id: string;
  staff_name: string;
  role: string;
  start_date?: string;
  dbs_certificate_number?: string;
  dbs_date?: string;
  dbs_type?: string;
  dbs_update_service: boolean;
  dbs_update_checked_date?: string;
  identity_verified: boolean;
  identity_verified_date?: string;
  qualifications_verified: boolean;
  qualifications_date?: string;
  right_to_work_verified: boolean;
  right_to_work_date?: string;
  prohibition_check: boolean;
  prohibition_check_date?: string;
  section_128_check: boolean;
  section_128_date?: string;
  overseas_check: boolean;
  overseas_check_date?: string;
  references_obtained: boolean;
  references_date?: string;
  medical_fitness: boolean;
  medical_fitness_date?: string;
  safer_recruitment_trained: boolean;
  disqualification_declaration: boolean;
  notes?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

// Complaint
export interface Complaint {
  id: string;
  organization_id: string;
  reference_number?: string;
  complainant_name: string;
  complainant_relationship?: string;
  date_received: string;
  nature_of_complaint: string;
  category?: string;
  current_stage: string;
  stage_1_handler?: string;
  stage_1_response_date?: string;
  stage_1_outcome?: string;
  stage_2_handler?: string;
  stage_2_response_date?: string;
  stage_2_outcome?: string;
  stage_3_panel_date?: string;
  stage_3_panel_members?: string[];
  stage_3_outcome?: string;
  resolution_date?: string;
  lessons_learned?: string;
  complainant_satisfied?: boolean;
  escalated_to_ofsted: boolean;
  escalated_to_esfa: boolean;
  notes?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

// Low-Level Concern
export interface LowLevelConcern {
  id: string;
  organization_id: string;
  reported_by_user_id?: string;
  reported_by_name: string;
  date_of_concern: string;
  date_reported: string;
  person_of_concern: string;
  person_role?: string;
  description: string;
  context?: string;
  action_taken?: string;
  outcome?: string;
  pattern_identified: boolean;
  escalated_to_lado: boolean;
  escalation_date?: string;
  reviewed_by_dsl: boolean;
  dsl_review_date?: string;
  dsl_notes?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

// Consent Record
export interface ConsentRecord {
  id: string;
  organization_id: string;
  consent_type: string;
  pupil_id?: string;
  pupil_name: string;
  parent_name?: string;
  parent_email?: string;
  granted: boolean;
  granted_date?: string;
  withdrawn_date?: string;
  scope?: string;
  academic_year?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// FOI Request
export interface FOIRequest {
  id: string;
  organization_id: string;
  requester_name?: string;
  requester_contact?: string;
  date_received: string;
  description: string;
  deadline_date: string;
  status: string;
  exemptions_applied?: string[];
  response_date?: string;
  response_summary?: string;
  fee_charged_pence: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// DPO Service
export interface DPOService {
  id: string;
  organization_id: string;
  service_tier: string;
  dpo_provider: string;
  consultant_name?: string;
  consultant_email?: string;
  consultant_phone?: string;
  contract_start?: string;
  contract_end?: string;
  annual_fee_pence?: number;
  schoolgle_fee_pct: number;
  vrisk_fee_pct: number;
  service_includes: string[];
  sla_response_hours: number;
  ico_registration_number?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

// Complaint stages
export const COMPLAINT_STAGES: Record<string, string> = {
  stage_1: "Stage 1 – Informal",
  stage_2: "Stage 2 – Headteacher",
  stage_3: "Stage 3 – Governor Panel",
  resolved: "Resolved",
  withdrawn: "Withdrawn",
};

export const COMPLAINT_CATEGORIES: Record<string, string> = {
  curriculum: "Curriculum",
  behaviour: "Behaviour",
  bullying: "Bullying",
  staff_conduct: "Staff Conduct",
  facilities: "Facilities",
  communication: "Communication",
  send: "SEND",
  other: "Other",
};

export const CONSENT_TYPES: Record<string, string> = {
  photo: "Photography & Media",
  trip: "School Trips",
  medical: "Medical Treatment",
  biometric: "Biometric Data",
  research: "Research Participation",
  marketing: "Marketing Communications",
};

export const DBS_TYPES: Record<string, string> = {
  enhanced: "Enhanced",
  enhanced_barred: "Enhanced + Barred List",
  standard: "Standard",
};

// Training role defaults
export const DEFAULT_TRAINING_ROLES = [
  { key: "all_staff", label: "All Staff" },
  { key: "teacher", label: "Teacher" },
  { key: "support_staff", label: "Support Staff" },
  { key: "dsl", label: "Designated Safeguarding Lead" },
  { key: "deputy_dsl", label: "Deputy DSL" },
  { key: "governor", label: "Governor" },
  { key: "site_manager", label: "Site Manager / Caretaker" },
  { key: "office_admin", label: "Office / Admin" },
  { key: "headteacher", label: "Headteacher" },
  { key: "eyfs_staff", label: "EYFS Staff" },
  { key: "fire_marshal", label: "Fire Marshal" },
  { key: "first_aider", label: "First Aider" },
];
