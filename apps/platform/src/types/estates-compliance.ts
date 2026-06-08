/**
 * Estates Compliance Module - TypeScript Types
 *
 * Generated from database schema defined in:
 * supabase/migrations/20260123_estates_compliance_phase1.sql
 */

// ============================================================================
// ASSETS
// ============================================================================

export type AssetType =
  | "building"
  | "room"
  | "outlet"
  | "equipment"
  | "fire_extinguisher"
  | "emergency_light"
  | "lift"
  | "playground_equipment"
  | "accessibility_equipment"
  | "vehicle"
  | "furniture"
  | "it_equipment"
  | "kitchen_equipment"
  | "av_equipment"
  | "musical_instrument"
  | "sports_equipment"
  | "grounds_equipment"
  | "teaching_resource"
  | "signage"
  | "security_equipment";

export type AssetStatus =
  | "active"
  | "inactive"
  | "disposed"
  | "under_repair"
  | "under_maintenance"
  | "requires_inspection"
  | "retired";

export type ConditionGrade = "A" | "B" | "C" | "D";

export interface MaintenanceHistoryEntry {
  date: string;
  action: string;
  performed_by: string;
  contractor_id?: string | null;
  cost?: number | null;
  notes?: string | null;
  evidence_ids?: string[];
}

export interface Asset {
  // Identity
  id: string;
  organization_id: string;
  asset_type: AssetType;
  category?: string | null;
  subcategory?: string | null;
  name: string;
  code?: string | null;
  qr_code?: string | null;
  barcode?: string | null;

  // Location
  building?: string | null;
  floor?: string | null;
  room?: string | null;
  location?: string | null;
  location_details?: Record<string, unknown> | null;
  location_id?: string | null;
  parent_asset_id?: string | null;

  // Technical
  installation_date?: string | null;
  manufacturer?: string | null;
  model?: string | null;
  serial_number?: string | null;
  specifications?: Record<string, unknown> | null;

  // Purchase
  purchase_date?: string | null;
  purchase_price?: number | null;
  purchase_currency?: string;
  purchase_order_number?: string | null;
  invoice_number?: string | null;
  purchased_from_contractor_id?: string | null;
  purchase_document_evidence_id?: string | null;
  maintained_by_contractor_id?: string | null;

  // Warranty
  warranty_start_date?: string | null;
  warranty_expiry?: string | null;
  warranty_provider?: string | null;
  warranty_terms?: string | null;

  // Lifecycle + condition
  expected_life_years?: number | null;
  condition_grade?: ConditionGrade | null;
  replacement_cost_estimate?: number | null;
  insurance_value?: number | null;

  // Maintenance
  last_inspection_date?: string | null;
  next_inspection_due?: string | null;
  maintenance_history?: MaintenanceHistoryEntry[] | null;
  linked_compliance_checks?: string[];

  // Status + metadata
  status: AssetStatus;
  compliance_domains: string[];
  image_url?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Asset with derived warranty status and supplier contact.
 * Returned by getWarrantyStatus / get_asset_details skills.
 */
export type WarrantyStatus = "active" | "expiring_soon" | "expired" | "none";

export interface AssetWithWarrantyStatus extends Asset {
  warranty_status: WarrantyStatus;
  warranty_days_remaining: number | null;
  supplier_contact?: {
    contractor_id: string;
    company_name: string;
    contact_name?: string | null;
    email?: string | null;
    phone?: string | null;
    mobile?: string | null;
  } | null;
  maintenance_contact?: {
    contractor_id: string;
    company_name: string;
    contact_name?: string | null;
    email?: string | null;
    phone?: string | null;
    mobile?: string | null;
  } | null;
}

export interface AssetInput {
  asset_type: AssetType;
  name: string;
  category?: string;
  subcategory?: string;
  code?: string;
  qr_code?: string;
  building?: string;
  floor?: string;
  room?: string;
  location_id?: string;
  location_details?: Record<string, unknown>;
  parent_asset_id?: string;
  installation_date?: string;
  manufacturer?: string;
  model?: string;
  serial_number?: string;
  specifications?: Record<string, unknown>;
  status?: AssetStatus;
  compliance_domains?: string[];
  notes?: string;
  image_url?: string;

  // Purchase
  purchase_date?: string;
  purchase_price?: number;
  purchase_currency?: string;
  purchase_order_number?: string;
  invoice_number?: string;
  purchased_from_contractor_id?: string;
  purchase_document_evidence_id?: string;
  maintained_by_contractor_id?: string;

  // Warranty
  warranty_start_date?: string;
  warranty_expiry?: string;
  warranty_provider?: string;
  warranty_terms?: string;

  // Lifecycle
  expected_life_years?: number;
  condition_grade?: ConditionGrade;
  replacement_cost_estimate?: number;
  insurance_value?: number;

  // Maintenance
  last_inspection_date?: string;
  next_inspection_due?: string;
  maintenance_history?: MaintenanceHistoryEntry[];
  linked_compliance_checks?: string[];
}

// ============================================================================
// CONTRACTORS
// ============================================================================

export interface Contractor {
  id: string;
  organization_id: string;
  company_name: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  website?: string;
  address?: Record<string, unknown>;
  services: ContractorService[];
  accreditations: Accreditation[];
  insurance_certificates: InsuranceCertificate[];
  safeguarding_docs: SafeguardingDocument[];
  notes?: string;
  status: "active" | "inactive" | "restricted";
  preferred: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContractorService {
  service_type: string;
  description?: string;
}

export interface Accreditation {
  type: string;
  number?: string;
  expiry_date?: string;
  issuing_body?: string;
  certificate_url?: string;
}

export interface InsuranceCertificate {
  type: string;
  expiry_date: string;
  document_url?: string;
  coverage_amount?: number;
}

export interface SafeguardingDocument {
  type: "dbs_check" | "safeguarding_policy" | "insurance" | "other";
  expiry_date?: string;
  document_url?: string;
}

export type ContractorInput = Omit<
  Contractor,
  "id" | "organization_id" | "created_at" | "updated_at"
>;

// ============================================================================
// CONTRACTS
// ============================================================================

export interface Contract {
  id: string;
  organization_id: string;
  contractor_id: string;
  title: string;
  description?: string;
  contract_type:
    | "maintenance"
    | "service"
    | "inspection"
    | "consultancy"
    | "installation";
  start_date: string; // ISO date
  end_date?: string;
  renewal_date?: string;
  notice_period_days: number;
  sla?: {
    response_time_hours?: number;
    attendance_window?: string[];
    required_certifications?: string[];
  };
  annual_cost?: number;
  billing_frequency?: "monthly" | "quarterly" | "annually" | "one_off";
  asset_ids: string[];
  compliance_domains: string[];
  contract_document_url?: string;
  notes?: string;
  status: "active" | "expiring" | "expired" | "terminated" | "pending_renewal";
  created_at: string;
  updated_at: string;
}

export type ContractInput = Omit<
  Contract,
  "id" | "organization_id" | "created_at" | "updated_at"
>;

// ============================================================================
// USER QUALIFICATIONS
// ============================================================================

export interface UserQualification {
  id: string;
  organization_id: string;
  user_id: string;
  qualification_type: string;
  qualification_name: string;
  certificate_number?: string;
  issuing_body?: string;
  issued_date?: string;
  expiry_date?: string;
  verified: boolean;
  verified_by?: string;
  verified_at?: string;
  evidence_id?: string;
  scope?: Record<string, unknown>;
  status: "active" | "expired" | "revoked" | "pending_verification";
  notes?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// DELEGATIONS
// ============================================================================

export interface Delegation {
  id: string;
  organization_id: string;
  delegator_id: string;
  delegate_id: string;
  compliance_domain?: string; // null for all domains
  task_types: string[];
  valid_from: string; // ISO date
  valid_until?: string;
  conditions?: string;
  status: "active" | "expired" | "revoked";
  notes?: string;
  created_at: string;
}

// ============================================================================
// COMPLIANCE TASKS
// ============================================================================

export type TaskSource = "internal" | "external";
export type TaskPriority = "critical" | "high" | "medium" | "low";
export type TaskStatus =
  | "pending"
  | "in_progress"
  | "awaiting_contractor"
  | "contractor_scheduled"
  | "completed"
  | "overdue"
  | "skipped"
  | "cancelled";
export type TaskFrequency =
  | "daily"
  | "weekly"
  | "monthly"
  | "quarterly"
  | "termly"
  | "annual"
  | "ad_hoc";
export type RecurrencePattern =
  | "daily"
  | "weekly"
  | "monthly"
  | "quarterly"
  | "annually";
export type ComplianceStatus =
  | "compliant"
  | "non_compliant"
  | "action_required"
  | "not_assessed";
export type ComplianceDomain =
  | "legionella"
  | "fire"
  | "asbestos"
  | "electrical"
  | "gas"
  | "water"
  | "mechanical"
  | "lifts"
  | "playground"
  | "accessibility"
  | "security"
  | "manual_handling"
  | "working_at_height"
  | "safeguarding"
  | "coshh"
  | "food_safety"
  | "transport"
  | "seasonal";
export type ContractorStatus =
  | "active"
  | "inactive"
  | "restricted"
  | "under_review";
export type TicketCategory = string;

export interface ComplianceTask {
  id: string;
  organization_id: string;
  task_type: string;
  compliance_domain: string;
  task_name: string;
  title?: string; // Alias for task_name, used by some UI components
  description?: string;
  priority?: TaskPriority;
  scheduled_for: string; // ISO date
  due_by: string; // ISO date
  due_date?: string; // Alias for due_by, used by some UI components
  frequency: TaskFrequency;
  is_recurring: boolean;
  recurrence_pattern?: Record<string, unknown>;
  task_source: TaskSource;
  assigned_to?: string;
  assigned_contractor_id?: string;
  asset_id?: string;
  statutory_check_id?: string;
  custom_check_id?: string;
  location_details?: Record<string, unknown>;
  checklist: Array<Record<string, unknown>>;
  status: TaskStatus;
  delegator_id?: string;
  qualification_required?: string;
  // External task appointment
  appointment_scheduled_for?: string;
  appointment_window_start?: string;
  appointment_window_end?: string;
  appointment_notes?: string;
  upload_token?: string;
  // Completion
  completed_at?: string;
  completed_by?: string;
  completion_notes?: string;
  // Evidence
  evidence_ids: string[];
  photo_urls: string[];
  // Findings
  findings: Finding[];
  overall_compliance_status?: ComplianceStatus;
  // AI processing
  ai_processed: boolean;
  ai_insights?: Record<string, unknown>;
  // Links
  linked_task_id?: string;
  parent_recurring_task_id?: string;
  // Reminders
  reminder_sent: boolean;
  reminder_sent_at?: string;
  overdue_reminder_sent: boolean;
  created_at: string;
  updated_at: string;
}

export interface Finding {
  severity: "critical" | "high" | "medium" | "low";
  description: string;
  action_required: string;
  classification?: "statutory" | "good_practice" | "contractor_suggestion";
  source?: string;
  source_url?: string;
  estimated_cost?: number;
  suggested_action?: string;
}

// ============================================================================
// HELPDESK TICKETS
// ============================================================================

export type TicketModule =
  | "estates"
  | "hr"
  | "finance"
  | "teaching_learning"
  | "safeguarding"
  | "compliance"
  | "it";
export type TicketPriority = "critical" | "high" | "medium" | "low";
export type TicketStatus =
  | "open"
  | "assigned"
  | "in_progress"
  | "awaiting_parts"
  | "awaiting_contractor"
  | "resolved"
  | "closed"
  | "reopened"
  | "on_hold";

export interface HelpdeskTicket {
  id: string;
  organization_id: string;
  ticket_number: string;
  ticket_sequence: number;
  module: TicketModule;
  category: string;
  subcategory?: string;
  priority: TicketPriority;
  title: string;
  description: string;
  asset_id?: string;
  task_id?: string;
  contractor_id?: string;
  contract_id?: string;
  compliance_domain?: string;
  statutory_check_id?: string;
  custom_check_id?: string;
  raised_by: string;
  raised_by_name?: string;
  assigned_to?: string;
  assigned_to_name?: string;
  assigned_contractor_id?: string;
  assigned_contractor_name?: string;
  status: TicketStatus;
  sla_target?: string;
  sla_met?: boolean;
  sla_breach_reason?: string;
  // Email integration
  email_from?: string;
  email_subject?: string;
  email_body?: string;
  email_message_id?: string;
  // Resolution
  resolution?: string;
  resolution_summary?: string;
  resolved_at?: string;
  resolved_by?: string;
  // Time tracking
  first_response_at?: string;
  time_to_resolution_minutes?: number;
  // Satisfaction
  satisfaction_rating?: number;
  satisfaction_feedback?: string;
  // Attachments
  attachment_urls: string[];
  created_at: string;
  updated_at: string;
}

export interface HelpdeskComment {
  id: string;
  ticket_id: string;
  comment: string;
  is_internal: boolean;
  author_id: string;
  attachment_urls: string[];
  created_at: string;
}

export interface HelpdeskActivity {
  id: string;
  ticket_id: string;
  activity_type:
    | "created"
    | "assigned"
    | "status_changed"
    | "priority_changed"
    | "comment_added"
    | "resolved"
    | "closed"
    | "reopened"
    | "sla_breached";
  from_value?: string;
  to_value?: string;
  description?: string;
  actor_id?: string;
  actor_name?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

// ============================================================================
// BUDGET ITEMS
// ============================================================================

export type BudgetItemCategory =
  | "replacement"
  | "upgrade"
  | "new_installation"
  | "repair"
  | "inspection"
  | "testing"
  | "maintenance";
export type BudgetItemClassification =
  | "statutory"
  | "good_practice"
  | "contractor_suggestion"
  | "planned_maintenance"
  | "emergency";
export type BudgetItemStatus =
  | "planned"
  | "proposed"
  | "approved"
  | "in_progress"
  | "completed"
  | "deferred"
  | "cancelled"
  | "on_hold";

export interface BudgetItem {
  id: string;
  organization_id: string;
  title: string;
  description?: string;
  category: BudgetItemCategory;
  classification: BudgetItemClassification;
  source_finding_id?: string;
  source_type?:
    | "contractor_report"
    | "inspection"
    | "monitoring"
    | "condition_survey"
    | "manual_entry";
  source?: string;
  source_url?: string;
  asset_id?: string;
  asset_name?: string;
  estimated_cost?: number;
  actual_cost?: number;
  cost_estimates: Array<{ source: string; amount: number; date: string }>;
  target_fiscal_year: string; // '2026/27'
  target_quarter?: "Q1" | "Q2" | "Q3" | "Q4";
  target_month?: number;
  actual_completion_date?: string;
  priority: "critical" | "high" | "medium" | "low";
  status: BudgetItemStatus;
  deferred_from?: string;
  deferment_reason?: string;
  assigned_contractor_id?: string;
  scheduled_start_date?: string;
  scheduled_end_date?: string;
  approved_by?: string;
  approved_at?: string;
  approval_notes?: string;
  completed_by?: string;
  completed_at?: string;
  completion_notes?: string;
  completion_photos: string[];
  created_at: string;
  updated_at: string;
}

// ============================================================================
// RAG STATUS
// ============================================================================

export type RagStatus = "red" | "amber" | "green";

export interface ComplianceRagStatus {
  organization_id: string;
  overall_status: RagStatus;
  domain_status: Record<string, RagStatus>;
  last_review: string;
  next_review: string;
}

// ============================================================================
// FILTERS & QUERIES
// ============================================================================

export interface AssetFilters {
  asset_type?: AssetType;
  category?: string;
  building?: string;
  floor?: string;
  room?: string;
  status?: AssetStatus;
  compliance_domain?: string;
  linked_compliance_check?: string;
  search?: string;
}

export interface TaskFilters {
  compliance_domain?: string;
  status?: TaskStatus;
  task_source?: TaskSource;
  assigned_to?: string;
  assigned_contractor_id?: string;
  date_from?: string;
  date_to?: string;
  overdue_only?: boolean;
}

export interface TicketFilters {
  module?: TicketModule;
  status?: TicketStatus;
  priority?: TicketPriority;
  assigned_to?: string;
  date_from?: string;
  date_to?: string;
}

export interface BudgetItemFilters {
  target_fiscal_year?: string;
  classification?: BudgetItemClassification;
  status?: BudgetItemStatus;
  priority?: string;
}

// ============================================================================
// EVIDENCE
// ============================================================================

export type EvidenceType =
  | "certificate"
  | "report"
  | "photo"
  | "log"
  | "document"
  | "video"
  | "other";
export type EvidenceStatus =
  | "pending"
  | "verified"
  | "rejected"
  | "expired"
  | "archived";
export type EvidenceSource =
  | "upload"
  | "google_drive"
  | "onedrive"
  | "link"
  | "existing";

export interface EstatesEvidence {
  id: string;
  organization_id: string;
  title: string;
  description?: string;
  evidence_type: EvidenceType;
  status: EvidenceStatus;
  file_url?: string;
  file_name?: string;
  file_type?: string;
  file_size_bytes?: number;
  cloud_provider?: "google" | "onedrive" | null;
  cloud_file_id?: string;
  source_type: EvidenceSource;
  // Links to other entities
  compliance_domain?: string;
  asset_id?: string;
  task_id?: string;
  contractor_id?: string;
  contract_id?: string;
  user_qualification_id?: string;
  // Certificate/Document specific
  document_number?: string;
  issuing_body?: string;
  issued_date?: string;
  expiry_date?: string;
  version?: number;
  parent_evidence_id?: string;
  // AI verification
  ai_verified: boolean;
  ai_confidence_score?: number;
  verification_notes?: string;
  verified_by?: string;
  verified_at?: string;
  // Metadata
  uploaded_by: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface EstatesEvidenceInput {
  title: string;
  description?: string;
  evidence_type: EvidenceType;
  file_url?: string;
  file_name?: string;
  file_type?: string;
  file_size_bytes?: number;
  cloud_provider?: "google" | "onedrive" | null;
  cloud_file_id?: string;
  source_type: EvidenceSource;
  existing_evidence_id?: string;
  compliance_domain?: string;
  asset_id?: string;
  task_id?: string;
  ticket_id?: string;
  contractor_id?: string;
  contract_id?: string;
  user_qualification_id?: string;
  document_number?: string;
  issuing_body?: string;
  issued_date?: string;
  expiry_date?: string;
  tags?: string[];
}

export interface EvidenceFilters {
  evidence_type?: EvidenceType;
  status?: EvidenceStatus;
  compliance_domain?: string;
  asset_id?: string;
  task_id?: string;
  contractor_id?: string;
  date_from?: string;
  date_to?: string;
  expiry_from?: string;
  expiry_to?: string;
  search?: string;
  tags?: string[];
}

// ============================================================================
// API RESPONSES
// ============================================================================

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

// ============================================================================
// DAILY DIARY
// ============================================================================

export type DiaryMood = "positive" | "neutral" | "negative";
export type DiaryVisibility = "private" | "team" | "organization";

export interface DiaryWeather {
  temperature?: number;
  conditions?: string;
}

export interface DiaryEntryUser {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
}

export interface DiaryEntry {
  id: string;
  organization_id: string;
  user_id: string;
  entry: string;
  photos: string[];
  tags: string[];
  location?: string;
  weather?: DiaryWeather;
  mood?: DiaryMood;
  visibility: DiaryVisibility;
  attachments: string[];
  created_at: string;
  updated_at: string;
  user?: DiaryEntryUser;
}

export interface DiaryEntryInput {
  entry: string;
  photos?: string[];
  tags?: string[];
  location?: string;
  weather?: DiaryWeather;
  mood?: DiaryMood;
  visibility?: DiaryVisibility;
  attachments?: string[];
}
