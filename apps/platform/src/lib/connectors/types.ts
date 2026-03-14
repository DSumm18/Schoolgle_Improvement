// ─── Staff Connectors — Type Definitions ─────────────────────────────────

export type ConnectorCategory =
  | 'safeguarding'
  | 'send'
  | 'health_safety'
  | 'data_governance'
  | 'curriculum'
  | 'estates'
  | 'custom';

export type ConnectorScopeType =
  | 'whole_school'
  | 'key_stage'
  | 'year_group'
  | 'building'
  | 'department'
  | 'custom';

export type ConnectorStatus = 'active' | 'pending_training' | 'expired_training' | 'ended';

export type TaskFrequency = 'daily' | 'weekly' | 'monthly' | 'termly' | 'yearly' | 'once';

export type TaskStatus = 'pending' | 'due' | 'overdue' | 'completed' | 'skipped';

export type ComplianceStatus = 'compliant' | 'at_risk' | 'expiring_soon' | 'non_compliant';

export type ChangeType =
  | 'assigned'
  | 'unassigned'
  | 'transferred'
  | 'training_updated'
  | 'training_expired'
  | 'scope_changed'
  | 'status_changed';

// ─── Auto-Task Template ──────────────────────────────────────────────────

export interface AutoTaskTemplate {
  name: string;
  description?: string;
  frequency: TaskFrequency;
  day?: string;       // e.g. 'friday' for weekly
  month?: number;     // e.g. 9 for September (yearly)
  module?: string;
}

// ─── Connector Type Definition ───────────────────────────────────────────

export interface ConnectorType {
  id: string;
  organization_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  category: ConnectorCategory;
  is_statutory: boolean;
  statutory_basis: string | null;
  statutory_reference: string | null;
  min_count: number;
  max_count: number | null;
  ratio_numerator: number | null;
  ratio_denominator: number | null;
  ratio_against: 'pupils' | 'staff' | 'floors' | 'eyfs_pupils' | null;
  must_be_available: boolean;
  requires_training: boolean;
  training_name: string | null;
  training_renewal_months: number | null;
  training_provider: string | null;
  modules: string[];
  responsibilities: string[];
  sop_document_id: string | null;
  auto_tasks: AutoTaskTemplate[];
  icon: string | null;
  color: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// ─── Staff Connector Assignment ──────────────────────────────────────────

export interface StaffConnector {
  id: string;
  organization_id: string;
  staff_id: string;
  connector_type_id: string;
  is_primary: boolean;
  scope: string;
  scope_type: ConnectorScopeType;
  training_completed: boolean;
  training_completed_date: string | null;
  training_expiry_date: string | null;
  training_certificate_url: string | null;
  training_provider: string | null;
  assigned_date: string;
  end_date: string | null;
  assigned_by: string | null;
  status: ConnectorStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  connector_type?: ConnectorType;
  staff?: {
    id: string;
    first_name: string;
    last_name: string;
    display_name: string;
    job_title: string;
    avatar_url: string | null;
  };
}

// ─── Connector Task ──────────────────────────────────────────────────────

export interface ConnectorTask {
  id: string;
  organization_id: string;
  staff_connector_id: string;
  connector_type_id: string;
  title: string;
  description: string | null;
  frequency: TaskFrequency;
  next_due_date: string | null;
  last_completed_date: string | null;
  recurrence_config: Record<string, unknown>;
  compliance_task_id: string | null;
  module: string | null;
  status: TaskStatus;
  completed_by: string | null;
  completed_at: string | null;
  completion_notes: string | null;
  completion_evidence_url: string | null;
  calendar_event_id: string | null;
  reminder_sent: boolean;
  created_at: string;
  updated_at: string;
  // Joined fields
  staff_connector?: StaffConnector;
  connector_type?: ConnectorType;
}

// ─── Change Log Entry ────────────────────────────────────────────────────

export interface ConnectorChangeLog {
  id: string;
  organization_id: string;
  staff_connector_id: string | null;
  connector_type_id: string;
  change_type: ChangeType;
  from_staff_id: string | null;
  to_staff_id: string | null;
  changed_by: string | null;
  details: Record<string, unknown>;
  reason: string | null;
  created_at: string;
}

// ─── Contract Link ───────────────────────────────────────────────────────

export interface ContractConnectorLink {
  id: string;
  organization_id: string;
  staff_connector_id: string;
  contract_name: string;
  contractor_name: string | null;
  contractor_contact_name: string | null;
  contractor_contact_email: string | null;
  contractor_contact_phone: string | null;
  review_frequency: 'monthly' | 'quarterly' | 'biannual' | 'annual' | null;
  next_review_date: string | null;
  contract_end_date: string | null;
  auto_renewal: boolean;
  notice_period_days: number | null;
  annual_value: number | null;
  budget_code: string | null;
  created_at: string;
  updated_at: string;
}

// ─── View Types ──────────────────────────────────────────────────────────

export interface ConnectorComplianceRow {
  connector_type_id: string;
  name: string;
  slug: string;
  category: ConnectorCategory;
  is_statutory: boolean;
  min_count: number;
  ratio_numerator: number | null;
  ratio_denominator: number | null;
  ratio_against: string | null;
  requires_training: boolean;
  training_renewal_months: number | null;
  organization_id: string;
  active_count: number;
  expired_training_count: number;
  expiring_soon_count: number;
  compliance_status: ComplianceStatus;
}

export interface StaffConnectorSummary {
  staff_id: string;
  organization_id: string;
  total_connectors: number;
  statutory_connectors: number;
  expired_training: number;
  connectors: Array<{
    connector_id: string;
    type_id: string;
    name: string;
    slug: string;
    category: ConnectorCategory;
    scope: string;
    is_primary: boolean;
    is_statutory: boolean;
    training_expiry: string | null;
    status: ConnectorStatus;
    icon: string | null;
    color: string | null;
  }>;
}

// ─── Leaving Staff Impact ────────────────────────────────────────────────

export interface LeavingImpact {
  staff_id: string;
  staff_name: string;
  leaving_date: string | null;
  connectors: Array<{
    connector: StaffConnector & { connector_type: ConnectorType };
    severity: 'critical' | 'important' | 'low';
    reason: string;
    affected_tasks: number;
    suggested_replacement: {
      staff_id: string;
      name: string;
      reason: string;
    } | null;
  }>;
  total_affected_tasks: number;
}

// ─── UI Category Metadata ────────────────────────────────────────────────

export const CONNECTOR_CATEGORIES = [
  { value: 'safeguarding' as const, label: 'Safeguarding & Child Protection', icon: 'Shield', color: '#dc2626' },
  { value: 'send' as const, label: 'SEND', icon: 'Brain', color: '#2563eb' },
  { value: 'health_safety' as const, label: 'Health & Safety', icon: 'HardHat', color: '#f59e0b' },
  { value: 'data_governance' as const, label: 'Data & Governance', icon: 'Lock', color: '#7c3aed' },
  { value: 'curriculum' as const, label: 'Curriculum & Standards', icon: 'GraduationCap', color: '#16a34a' },
  { value: 'estates' as const, label: 'Estates & Facilities', icon: 'Building', color: '#0891b2' },
  { value: 'custom' as const, label: 'Custom', icon: 'Settings', color: '#6b7280' },
] as const;

export const SCOPE_TYPES = [
  { value: 'whole_school' as const, label: 'Whole School' },
  { value: 'key_stage' as const, label: 'Key Stage' },
  { value: 'year_group' as const, label: 'Year Group' },
  { value: 'building' as const, label: 'Building / Zone' },
  { value: 'department' as const, label: 'Department' },
  { value: 'custom' as const, label: 'Custom' },
] as const;
